
// public/service-worker.js

// Import the JSONPath library
importScripts('https://cdn.jsdelivr.net/npm/jsonpath-plus@7.2.0/dist/jsonpath-plus.min.js');

let rules = {
  mappings: [],
  incomingRoutes: [],
  outgoingRoutes: [],
};

// Function to send logs back to the client
const logToClient = async (logEntry) => {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'LOG', payload: logEntry });
  });
};

const pathStringToRegex = (path) => {
    const regex = new RegExp('^' + path.replace(/:[^\s/]+/g, '([^/]+)') + '$');
    return regex;
};

const checkCondition = (requestData, condition) => {
    const { path, operator, value } = condition;
    try {
        const extractedValue = self.JSONPath({ path, json: requestData });
        const targetValue = extractedValue.length > 0 ? extractedValue[0] : null;

        switch(operator) {
            case 'eq': return String(targetValue) === value;
            case 'neq': return String(targetValue) !== value;
            case 'contains': return String(targetValue).includes(value);
            case 'gt': return Number(targetValue) > Number(value);
            case 'lt': return Number(targetValue) < Number(value);
            case 'exists': return targetValue !== null && targetValue !== undefined;
            default: return false;
        }
    } catch (e) {
        console.error('JSONPath Error:', e);
        return false;
    }
};

const checkConditionGroup = (requestData, group) => {
    if (!group || !group.conditions) return true; // No conditions means it passes
    const { type, conditions } = group;
    if (type === 'AND') {
        return conditions.every(cond => 'conditions' in cond ? checkConditionGroup(requestData, cond) : checkCondition(requestData, cond));
    } else { // OR
        return conditions.some(cond => 'conditions' in cond ? checkConditionGroup(requestData, cond) : checkCondition(requestData, cond));
    }
};

const handleIncomingAuthentication = (requestData, auth) => {
    if (!auth || auth.type === 'none') {
        return true;
    }
    if (auth.type === 'api-key') {
        let key = null;
        if (auth.location === 'header') {
            key = requestData.headers[auth.paramName.toLowerCase()];
        } else { // query
            key = requestData.query[auth.paramName];
        }
        return key && auth.allowedKeys.includes(key);
    }
    if (auth.type === 'bearer') {
        const authHeader = requestData.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }
        const token = authHeader.substring(7);
        return token && auth.allowedTokens.includes(token);
    }
    return false;
};

const applyOutgoingAuthentication = (request, route) => {
    const auth = route.authentication;
    if (!auth || auth.type === 'none') {
        return request;
    }
    
    const newHeaders = new Headers(request.headers);
    let newUrl = new URL(request.url);

    if (auth.type === 'api-key') {
        if (auth.location === 'header') {
            newHeaders.set(auth.paramName, auth.apiKey);
        } else { // query
            newUrl.searchParams.set(auth.paramName, auth.apiKey);
        }
    } else if (auth.type === 'bearer') {
        newHeaders.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth.type === 'basic') {
        const credentials = btoa(`${auth.username}:${auth.password || ''}`);
        newHeaders.set('Authorization', `Basic ${credentials}`);
    }

    return new Request(newUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        mode: 'cors',
        redirect: 'follow',
    });
};


const applyMapping = (data, mapping) => {
    if (!mapping) return data;
    let transformedData = {};
    mapping.datamap.forEach(entry => {
        try {
            const value = self.JSONPath({ path: `$.${entry.sourceField}`, json: data })[0];
            if (value !== undefined) {
                // This is a simplified transformation. A real implementation might handle nested paths.
                self.JSONPath({ path: `$.${entry.targetField}`, json: transformedData, value, autovivify: true });
            }
        } catch (e) {
            console.error(`Error applying mapping for source field ${entry.sourceField}:`, e);
        }
    });
    return transformedData;
};

const applyEgressTransforms = (data, transforms) => {
    if (!transforms || transforms.length === 0) return data;
    let transformedData = JSON.parse(JSON.stringify(data)); // Deep copy
    transforms.forEach(transform => {
        try {
            const { path, action, value } = transform;
            if (action === 'set') {
                self.JSONPath({ path, json: transformedData, value, autovivify: true });
            } else if (action === 'remove') {
                self.JSONPath({ path: path, json: transformedData, resultType: 'parent' }).forEach(parent => {
                    const key = path.split('.').pop();
                    if(parent && typeof parent === 'object' && key) {
                        delete parent[key];
                    }
                });
            }
        } catch (e) {
            console.error(`Error applying egress transform for path ${transform.path}:`, e);
        }
    });
    return transformedData;
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_RULES') {
    rules = event.data.payload;
    console.log('Service Worker rules updated.');
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept requests for the app's own resources or external CDNs
  if (url.origin !== self.location.origin || url.pathname.startsWith('/@fs/') || url.pathname.startsWith('/node_modules/')) {
    return;
  }
  
  event.respondWith((async () => {
    let log = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        request: {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
        },
        response: {},
    };

    const requestBody = request.method !== 'GET' ? await request.clone().json().catch(() => ({})) : {};
    log.request.body = requestBody;

    const requestDataForConditions = {
        body: requestBody,
        headers: log.request.headers,
        query: Object.fromEntries(url.searchParams.entries()),
    };

    let matchedIncomingRoute = null;
    for (const route of rules.incomingRoutes) {
        const routeRegex = pathStringToRegex(route.path);
        if ((route.method === request.method || route.method === 'ANY') && routeRegex.test(url.pathname)) {
            const isAuthenticated = handleIncomingAuthentication(requestDataForConditions, route.authentication);
            const conditionsMet = checkConditionGroup(requestDataForConditions, route.conditions);
            
            if (isAuthenticated && conditionsMet) {
                matchedIncomingRoute = route;
                break;
            } else if (!isAuthenticated) {
                log.error = 'Incoming authentication failed.';
            }
        }
    }

    if (!matchedIncomingRoute) {
      log.response = { status: log.error ? 401 : 404, body: { error: log.error || 'No matching incoming route found.' } };
      log.error = log.error || 'No route match';
      logToClient(log);
      return new Response(JSON.stringify(log.response.body), { status: log.response.status, headers: { 'Content-Type': 'application/json' } });
    }

    log.incomingRoute = matchedIncomingRoute;

    if (matchedIncomingRoute.responseMode === 'mock') {
        const { mockResponseStatusCode = 200, mockResponseHeaders = [], mockResponseBody = '' } = matchedIncomingRoute;
        
        const headers = new Headers();
        mockResponseHeaders.forEach(h => {
            if (h.key) headers.set(h.key, h.value);
        });
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        headers.set('Access-Control-Allow-Origin', '*'); 

        const mockResponse = new Response(mockResponseBody, {
            status: mockResponseStatusCode,
            headers: headers,
        });
        
        log.response = {
            status: mockResponseStatusCode,
            statusText: 'Mocked Response',
            headers: Object.fromEntries(headers.entries()),
            body: mockResponseBody,
        };
        try {
            log.response.body = JSON.parse(mockResponseBody);
        } catch (e) {
            // It's not JSON, so keep as string
        }
        logToClient(log);
        return mockResponse;
    }
    
    const outgoingRoute = rules.outgoingRoutes.find(r => r.id === matchedIncomingRoute.outgoingRouteId);
    if (!outgoingRoute) {
        log.response = { status: 500, body: { error: 'Internal configuration error: Outgoing route not found.' } };
        log.error = `Outgoing route with ID ${matchedIncomingRoute.outgoingRouteId} not found.`;
        logToClient(log);
        return new Response(JSON.stringify(log.response.body), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    log.outgoingRoute = outgoingRoute;

    let processedBody = requestBody;
    
    // 1. Apply Mapping
    const mappingToApply = rules.mappings.find(m => m.id === outgoingRoute.mappingId);
    if (mappingToApply) {
        processedBody = applyMapping(processedBody, mappingToApply);
        log.mappingApplied = mappingToApply;
    }

    // 2. Apply Egress Transforms
    processedBody = applyEgressTransforms(processedBody, outgoingRoute.egressTransforms);
    log.bodyAfterTransforms = processedBody;
    
    // Simple parameter substitution in targetUrl
    const finalTargetUrl = outgoingRoute.targetUrl.replace(/:(\w+)/g, (_, key) => requestDataForConditions.query[key] || '');

    try {
        const newHeaders = new Headers(request.headers);
        newHeaders.delete('host');

        let finalRequest = new Request(finalTargetUrl, {
            method: request.method,
            headers: newHeaders,
            body: Object.keys(processedBody).length > 0 ? JSON.stringify(processedBody) : null,
            mode: 'cors',
            redirect: 'follow',
        });
        
        finalRequest = applyOutgoingAuthentication(finalRequest, outgoingRoute);

        const finalResponse = await fetch(finalRequest);
        const responseBodyText = await finalResponse.text();
        let responseBody;
        try {
            responseBody = JSON.parse(responseBodyText);
        } catch(e) {
            responseBody = responseBodyText;
        }
        
        log.response = {
            status: finalResponse.status,
            statusText: finalResponse.statusText,
            headers: Object.fromEntries(finalResponse.headers.entries()),
            body: responseBody
        };
        
        logToClient(log);
        const responseHeaders = new Headers(finalResponse.headers);
        // Ensure CORS headers are set for the client
        responseHeaders.set('Access-Control-Allow-Origin', '*'); 
        return new Response(JSON.stringify(responseBody), { status: finalResponse.status, statusText: finalResponse.statusText, headers: responseHeaders });

    } catch (e) {
        log.response = { status: 502, body: { error: 'Failed to fetch target URL.' }};
        log.error = e.message;
        logToClient(log);
        return new Response(JSON.stringify(log.response.body), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
  })());
});
