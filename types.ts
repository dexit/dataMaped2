
export enum View {
  INCOMING_ROUTES,
  OUTGOING_ROUTES,
  MANAGE_MAPPINGS,
  MANAGE_CATEGORIES,
  VIEW_JSON,
  API_CLIENTS,
  LOGS,
}

export interface DatamapEntry {
  id: string;
  sourceField: string;
  sourceType: string;
  targetField: string;
  targetType: string;
}

export interface Mapping {
  id: string;
  name: string;
  category: string;
  datamap: DatamapEntry[];
  createdOn: string;
  lastModified: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ApiClientHeader { // Renamed from ApiTestHeader
  id: string;
  key: string;
  value: string;
}

export interface ApiClient { // Renamed from ApiTest
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authType: 'NoAuth' | 'Basic' | 'Bearer' | 'Custom';
  headers: ApiClientHeader[];
  body: string;
  cache: boolean;
  timeout: number;
  retry: number;
  mappingId: string | null;
  status?: number;
  responseBody?: string;
  lastRun?: string;
}

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// New Types for Routing and Logging

export type ConditionOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'exists';

export interface Condition {
  id: string;
  path: string; // JSONPath
  operator: ConditionOperator;
  value: string;
}

export interface ConditionGroup {
  id: string;
  type: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

// --- New Incoming Authentication Types ---
export interface NoAuth {
  type: 'none';
}

export interface ApiKeyIncomingAuth {
  type: 'api-key';
  location: 'header' | 'query';
  paramName: string;
  allowedKeys: string[];
}

export interface BearerIncomingAuth {
  type: 'bearer';
  allowedTokens: string[];
}

export type IncomingAuthentication = NoAuth | ApiKeyIncomingAuth | BearerIncomingAuth;


export interface IncomingRoute {
  id: string;
  name: string;
  path: string; // e.g., /users/:id
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY';
  conditions: ConditionGroup;
  outgoingRouteId: string | null;
  authentication: IncomingAuthentication;
}

export interface EgressTransform {
  id: string;
  path: string; // JSONPath
  action: 'set' | 'remove';
  value?: string;
}

// --- New Outgoing Authentication Types ---
export interface ApiKeyOutgoingAuth {
  type: 'api-key';
  location: 'header' | 'query';
  paramName: string;
  apiKey: string;
}

export interface BearerOutgoingAuth {
    type: 'bearer';
    token: string;
}

export interface BasicOutgoingAuth {
    type: 'basic';
    username: string;
    password?: string;
}

export type OutgoingAuthentication = NoAuth | ApiKeyOutgoingAuth | BearerOutgoingAuth | BasicOutgoingAuth;

export interface OutgoingRoute {
  id: string;
  name: string;
  targetUrl: string; // The real URL to proxy to
  mappingId: string | null;
  egressTransforms: EgressTransform[];
  authentication: OutgoingAuthentication;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  };
  response: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
  };
  incomingRoute?: IncomingRoute;
  outgoingRoute?: OutgoingRoute;
  mappingApplied?: Mapping;
  bodyAfterTransforms?: any;
  error?: string;
}