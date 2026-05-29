import React, { useState } from 'react';
import type { Mapping, IncomingRoute, OutgoingRoute } from '../types';
import { IconJson, DEFAULT_INPUT_CLASSES, PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from '../constants';
import EmptyState from './common/EmptyState';

interface JsonViewerProps {
  mappings: Mapping[];
  incomingRoutes?: IncomingRoute[];
  outgoingRoutes?: OutgoingRoute[];
  showToast: (message: string, type: 'success' | 'error') => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  mappings,
  incomingRoutes = [],
  outgoingRoutes = [],
  showToast,
}) => {
  const [activeExporterTab, setActiveExporterTab] = useState<'json' | 'sql' | 'php'>('json');
  
  // Tab 1 (JSON) States
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');
  
  // Tab 2 (SQL) States
  const [dialect, setDialect] = useState<'sqlite' | 'mysql' | 'postgres'>('mysql');
  const [sqlObjectSource, setSqlObjectSource] = useState<'mapping' | 'route'>('mapping');
  const [selectedSqlMappingId, setSelectedSqlMappingId] = useState<string>('');
  const [selectedSqlRouteId, setSelectedSqlRouteId] = useState<string>('');
  const [customTableName, setCustomTableName] = useState<string>('');
  const [sqlStructureType, setSqlStructureType] = useState<'source' | 'target' | 'both'>('both');

  // Tab 3 (PHP) States
  const [selectedPhpFile, setSelectedPhpFile] = useState<string>('composer.json');

  // Select first items as default if loaded
  React.useEffect(() => {
    if (mappings.length > 0) {
      setSelectedMappingId(mappings[0].id);
      setSelectedSqlMappingId(mappings[0].id);
    }
    if (incomingRoutes.length > 0) {
      setSelectedSqlRouteId(incomingRoutes[0].id);
    }
  }, [mappings, incomingRoutes]);

  // SQL Schema Generator Logics
  const generateSqlDDL = (): string => {
    let fieldsList: Array<{ name: string; type: string }> = [];
    let tableNameRaw = 'device_stream';

    if (sqlObjectSource === 'mapping') {
      const activeMap = mappings.find(m => m.id === selectedSqlMappingId);
      if (!activeMap) return '-- Select an active Mapping Configuration on the controls sidebar --';
      tableNameRaw = activeMap.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      if (sqlStructureType === 'source') {
        fieldsList = activeMap.datamap.map(e => ({ name: e.sourceField, type: e.sourceType }));
      } else if (sqlStructureType === 'target') {
        fieldsList = activeMap.datamap.map(e => ({ name: e.targetField, type: e.targetType }));
      } else {
        // Both: output both or merged
        const sourceFields = activeMap.datamap.map(e => ({ name: e.sourceField, type: e.sourceType }));
        const targetFields = activeMap.datamap.map(e => ({ name: e.targetField, type: e.targetType }));
        return `-- MySQL/PostgreSQL / SQLite Database Exports for Mapping: ${activeMap.name} --\n\n` + 
          `-- Source Payload Storage table --\n` + 
          getCreateScript(dialect, `${customTableName || tableNameRaw}_source`, sourceFields) + "\n\n" +
          `-- Target Payload Storage table --\n` + 
          getCreateScript(dialect, `${customTableName || tableNameRaw}_target`, targetFields);
      }
    } else {
      // Dynamic route body extract
      const activeRoute = incomingRoutes.find(r => r.id === selectedSqlRouteId);
      if (!activeRoute) return '-- Select an active Incoming Route on the controls sidebar --';
      tableNameRaw = activeRoute.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      const payloadStr = activeRoute.samplePayload;
      if (!payloadStr || !payloadStr.trim()) {
        return `-- Incoming Route "${activeRoute.name}" has no Sample Request Body stored.\n-- Please add a sample payload inside Incoming Routes edit modal to generate database dynamic schemas.`;
      }
      try {
        const parsed = JSON.parse(payloadStr);
        // Fallback flat object keys extract
        fieldsList = Object.keys(parsed).map(k => {
          const val = parsed[k];
          let detectedType = 'string';
          if (typeof val === 'number') detectedType = 'number';
          else if (typeof val === 'boolean') detectedType = 'boolean';
          else if (Array.isArray(val)) detectedType = 'json';
          else if (val && typeof val === 'object') detectedType = 'json';
          return { name: `body_${k}`, type: detectedType };
        });
      } catch (e: any) {
        return `-- Error parsing Sample Request Body JSON: ${e.message}`;
      }
    }

    const resolvedName = customTableName || tableNameRaw;
    return getCreateScript(dialect, resolvedName, fieldsList);
  };

  const getCreateScript = (
    dbDialect: 'sqlite' | 'mysql' | 'postgres',
    tName: string,
    fields: Array<{ name: string; type: string }>
  ): string => {
    if (fields.length === 0) {
      return `-- No relational properties found to generate custom table columns in ${dbDialect.toUpperCase()}`;
    }

    const columns: string[] = [];
    
    // Auto increment primary id definition
    if (dbDialect === 'mysql') {
      columns.push("  `id` INT AUTO_INCREMENT PRIMARY KEY");
    } else if (dbDialect === 'postgres') {
      columns.push("  id SERIAL PRIMARY KEY");
    } else {
      columns.push("  id INTEGER PRIMARY KEY AUTOINCREMENT");
    }

    fields.forEach(f => {
      if (!f.name || !f.name.trim()) return;
      const cleanName = f.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
      if (!cleanName) return;

      let colType = 'VARCHAR(255)';
      if (dbDialect === 'mysql') {
        const wrap = (n: string) => `\`${n}\``;
        switch (f.type) {
          case 'integer': colType = 'INT'; break;
          case 'long': colType = 'BIGINT'; break;
          case 'boolean': colType = 'TINYINT(1) DEFAULT 0'; break;
          case 'number': colType = 'DECIMAL(12, 4)'; break;
          case 'date': colType = 'DATE'; break;
          case 'datetime': colType = 'DATETIME'; break;
          case 'json':
          case 'arrayOfStrings':
          case 'arrayOfObjects':
          case 'object':
            colType = 'JSON'; break;
          case 'longtext': colType = 'LONGTEXT'; break;
          default: colType = 'VARCHAR(255)'; break;
        }
        columns.push(`  ${wrap(cleanName)} ${colType}`);
      } else if (dbDialect === 'postgres') {
        switch (f.type) {
          case 'integer': colType = 'INTEGER'; break;
          case 'long': colType = 'BIGINT'; break;
          case 'boolean': colType = 'BOOLEAN DEFAULT FALSE'; break;
          case 'number': colType = 'NUMERIC(12, 4)'; break;
          case 'date': colType = 'DATE'; break;
          case 'datetime': colType = 'TIMESTAMP WITH TIME ZONE'; break;
          case 'json':
          case 'arrayOfStrings':
          case 'arrayOfObjects':
          case 'object':
            colType = 'JSONB'; break;
          case 'longtext': colType = 'TEXT'; break;
          default: colType = 'VARCHAR(255)'; break;
        }
        columns.push(`  ${cleanName} ${colType}`);
      } else { // sqlite
        switch (f.type) {
          case 'integer':
          case 'long':
          case 'boolean':
            colType = 'INTEGER'; break;
          case 'number':
            colType = 'REAL'; break;
          default:
            colType = 'TEXT'; break;
        }
        if (f.type === 'boolean') {
          columns.push(`  ${cleanName} ${colType} DEFAULT 0`);
        } else {
          columns.push(`  ${cleanName} ${colType}`);
        }
      }
    });

    const outputTableName = dbDialect === 'mysql' ? `\`${tName}\`` : tName;
    return `CREATE TABLE IF NOT EXISTS ${outputTableName} (\n${columns.join(',\n')}\n);`;
  };

  // Tab 3 (PSR PHP Compliance Codes) File definitions list
  const getPSRPHPFiles = (): Record<string, string> => {
    // Escape variables and output beautiful contextually updated PSR code project representation
    const routesArrayText = JSON.stringify(incomingRoutes, null, 4);
    const mappingsArrayText = JSON.stringify(mappings, null, 4);
    const outgoingArrayText = JSON.stringify(outgoingRoutes, null, 4);

    return {
      "composer.json": `{
    "name": "datamapper/enterprise-gateway",
    "description": "Enterprise API Gateway and payload transformer utilizing standardized PSR implementations.",
    "type": "project",
    "require": {
        "php": ">=8.1",
        "psr/log": "^3.0",
        "psr/cache": "^3.0",
        "psr/http-message": "^2.0",
        "psr/http-client": "^1.0",
        "psr/http-factory": "^1.0",
        "psr/event-dispatcher": "^1.0"
    },
    "autoload": {
        "psr-4": {
            "Gateway\\\\": "src/"
        }
    }
}`,

      "src/Contracts/Events.php": `<?php
namespace Gateway\\Contracts;

/**
 * PSR-14 EVENT DISPATCHER STANDARD IMPLEMENTATION
 * Allows third party dependencies or logging processors to attach hook handlers
 */
interface EventInterface {}

class RequestReceivedEvent implements EventInterface {
    public function __construct(
        public readonly array $requestData,
        public readonly string $path,
        public readonly string $method
    ) {}
}

class IncomingRouteMatchedEvent implements EventInterface {
    public function __construct(
        public readonly array $route,
        public readonly array $requestData
    ) {}
}

class OutgoingPayloadMappedEvent implements EventInterface {
    public function __construct(
        public readonly array $sourcePayload,
        public array $targetPayload,
        public readonly string $mappingName
    ) {}
}

class ProxyCompletedEvent implements EventInterface {
    public function __construct(
        public readonly int $statusCode,
        public readonly array $responseBody,
        public readonly float $latencyMs
    ) {}
}
`,

      "src/Contracts/DummyLogger.php": `<?php
namespace Gateway\\Contracts;

use Psr\\Log\\LoggerInterface;
use Psr\\Log\\AbstractLogger;

/**
 * PSR-3 LOGGER STANDARD IMPLEMENTATION
 * Pipes microservice metrics and transformations directly into standard standard output/files.
 */
class DummyLogger extends AbstractLogger implements LoggerInterface {
    private array $logs = [];

    public function log($level, $message, array $context = []): void {
        $timestamp = date(\'Y-m-d H:i:s\');
        $formatted = sprintf("[%s] [%s]: %s %s\\n", $timestamp, strtoupper($level), $message, json_encode($context));
        $this->logs[] = $formatted;
        // Output trace transparently for evaluation
        error_log($formatted);
    }

    public function getLogs(): array {
        return $this->logs;
    }
}
`,

      "src/Contracts/DummyCache.php": `<?php
namespace Gateway\\Contracts;

use Psr\\Cache\\CacheItemPoolInterface;
use Psr\\Cache\\CacheItemInterface;

/**
 * PSR-6 SPECIFICATION COMPLIANT CACHE POOL
 * High-speed local request caching structure.
 */
class DummyCacheItem implements CacheItemInterface {
    private bool $isHit = false;

    public function __construct(
        private string $key,
        private mixed $value = null,
        private ?int $ttl = null
    ) {}

    public function getKey(): string { return $this->key; }
    public function get(): mixed { return $this->value; }
    public function isHit(): bool { return $this->isHit; }
    public function set(mixed $value): static { $this->value = $value; return $this; }
    public function expiresAt(?\\DateTimeInterface $expiration): static { return $this; }
    public function expiresAfter(int|\\DateInterval|null $time): static { return $this; }
    public function setIsHit(bool $hit): void { $this->isHit = $hit; }
}

class DummyCache implements CacheItemPoolInterface {
    private array $items = [];

    public function getItem(string $key): CacheItemInterface {
        if (!isset($this->items[$key])) {
            return new DummyCacheItem($key);
        }
        $item = new DummyCacheItem($key, $this->items[$key]);
        $item->setIsHit(true);
        return $item;
    }

    public function getItems(array $keys = []): array {
        return array_map(fn($k) => $this->getItem($k), $keys);
    }

    public function hasItem(string $key): bool { return isset($this->items[$key]); }
    public function clear(): bool { $this->items = []; return true; }
    public function deleteItem(string $key): bool { unset($this->items[$key]); return true; }
    public function deleteItems(array $keys): bool { foreach($keys as $k) $this->deleteItem($k); return true;}
    public function save(CacheItemInterface $item): bool {
        $this->items[$item->getKey()] = $item->get();
        return true;
    }
    public function saveDeferred(CacheItemInterface $item): bool { return $this->save($item); }
    public function commit(): bool { return true; }
}
`,

      "src/Gateway/MapperEngine.php": `<?php
namespace Gateway\\Gateway;

use Psr\\Log\\LoggerInterface;
use Psr\\Cache\\CacheItemPoolInterface;
use Gateway\\Contracts\\RequestReceivedEvent;
use Gateway\\Contracts\\IncomingRouteMatchedEvent;
use Gateway\\Contracts\\OutgoingPayloadMappedEvent;

/**
 * PSR-3, PSR-6 and PSR-14 orchestration microservice mapper engine.
 */
class MapperEngine {
    private array $incomingRoutes = [];
    private array $mappings = [];
    private array $outgoingRoutes = [];

    public function __construct(
        private LoggerInterface $logger,
        private CacheItemPoolInterface $cache,
        private ?object $eventDispatcher = null
    ) {
        $this->logger->info("Initializing PSR Gateway Configuration Engine.");
        $this->loadRoutesAndMappings();
    }

    private function loadRoutesAndMappings(): void {
        // Hydrated with active playground structures dynamically
        $this->incomingRoutes = json_decode(\'${routesArrayText.replace(/'/g, "\\'")}\', true) ?? [];
        $this->mappings = json_decode(\'${mappingsArrayText.replace(/'/g, "\\'")}\', true) ?? [];
        $this->outgoingRoutes = json_decode(\'${outgoingArrayText.replace(/'/g, "\\'")}\', true) ?? [];
        
        $this->logger->info("Preloaded structures:", [
            \'incoming_routes_count\' => count($this->incomingRoutes),
            \'mappings_count\' => count($this->mappings),
            \'outgoing_routes_count\' => count($this->outgoingRoutes)
        ]);
    }

    public function handleRequest(string $method, string $path, array $headers, array $body): array {
        $this->logger->info("Handling HTTP $method stream request on path: $path");
        
        if ($this->eventDispatcher) {
            $this->eventDispatcher->dispatch(new RequestReceivedEvent($body, $path, $method));
        }

        // Match patterns 
        $matchedRoute = null;
        foreach ($this->incomingRoutes as $route) {
            if ($route[\'method\'] !== \'ANY\' && strcasecmp($route[\'method\'], $method) !== 0) {
                continue;
            }
            // Check URI match simple
            if ($this->matchPathPattern($route[\'path\'], $path)) {
                // Verify authentication headers/tokens if activated
                if ($this->authenticate($route, $headers, $path)) {
                    $matchedRoute = $route;
                    break;
                }
            }
        }

        if (!$matchedRoute) {
            $this->logger->warning("No compliant route matched or auth failed for request path: $path");
            return [
                \'status\' => 404,
                \'headers\' => [\'Content-Type\' => \'application/json\'],
                \'body\' => [\'error\' => \'Route not found or unauthorized\']
            ];
        }

        $this->logger->info("Matched Incoming Route: " . $matchedRoute[\'name\']);
        if ($this->eventDispatcher) {
            $this->eventDispatcher->dispatch(new IncomingRouteMatchedEvent($matchedRoute, $body));
        }

        // If mock route, fulfill immediately as defined by mocks config
        if ($matchedRoute[\'responseMode\'] === \'mock\') {
            $responseBody = json_decode($matchedRoute[\'mockResponseBody\'] ?? \'{}\', true) ?? [];
            return [
                \'status\' => $matchedRoute[\'mockResponseStatusCode\'] ?? 200,
                \'headers\' => [\'Content-Type\' => \'application/json\'],
                \'body\' => $responseBody
            ];
        }

        // Otherwise proxy using mapper configurations
        $outgoingRouteId = $matchedRoute[\'outgoingRouteId\'] ?? null;
        $outgoingRoute = null;
        foreach ($this->outgoingRoutes as $r) {
            if ($r[\'id\'] === $outgoingRouteId) {
                $outgoingRoute = $r;
                break;
            }
        }

        if (!$outgoingRoute) {
            $this->logger->error("Resolved Proxy route with ID $outgoingRouteId, but target config details were missing!");
            return [
                \'status\' => 502,
                \'headers\' => [\'Content-Type\' => \'application/json\'],
                \'body\' => [\'error\' => \'Target microservice offline\' ]
            ];
        }

        // Apply map translation
        $mappingApplied = null;
        $mappedPayload = $body;
        if (!empty($outgoingRoute[\'mappingId\'])) {
            foreach ($this->mappings as $m) {
                if ($m[\'id\'] === $outgoingRoute[\'mappingId\']) {
                    $mappingApplied = $m;
                    break;
                }
            }
        }

        if ($mappingApplied) {
            $mappedPayload = $this->transformPayload($body, $mappingApplied);
            if ($this->eventDispatcher) {
                $this->eventDispatcher->dispatch(new OutgoingPayloadMappedEvent($body, $mappedPayload, $mappingApplied[\'name\']));
            }
        }

        // Apply Egress transformations (adds/removes paths)
        if (!empty($outgoingRoute[\'egressTransforms\'])) {
            foreach ($outgoingRoute[\'egressTransforms\'] as $transform) {
                $key = $transform[\'path\'];
                if ($transform[\'action\'] === \'remove\') {
                    unset($mappedPayload[$key]);
                } else if ($transform[\'action\'] === \'set\') {
                    $mappedPayload[$key] = $transform[\'value\'];
                }
            }
        }

        $this->logger->info("Sending proxied request forward to " . $outgoingRoute[\'targetUrl\']);
        return [
            \'status\' => 200,
            \'headers\' => [\'Content-Type\' => \'application/json\', \'X-Proxied-By\' => \'PSR-Data-Mapper\'],
            \'body\' => $mappedPayload
        ];
    }

    private function matchPathPattern(string $pattern, string $path): bool {
        $p = trim($pattern, \'/\');
        $path = trim($path, \'/\');
        if ($p === $path) return true;
        // basic placeholders
        $regex = preg_replace(\'/\\\\:[a-zA-Z0-9_]+/\', \'[a-zA-Z0-9_]+\', preg_quote($p, \'/\'));
        return (bool)preg_match(\'/^\' . $regex . \'$/\', $path);
    }

    private function authenticate(array $route, array $headers, string $path): bool {
        $auth = $route[\'authentication\'] ?? [\'type\' => \'none\'];
        if ($auth[\'type\'] === \'none\') return true;

        if ($auth[\'type\'] === \'api-key\') {
            $param = $auth[\'paramName\'] ?? \'X-API-KEY\';
            $val = null;
            if ($auth[\'location\'] === \'header\') {
                $val = $headers[strtolower($param)] ?? $headers[strtoupper($param)] ?? null;
            }
            if ($val && in_array($val, $auth[\'allowedKeys\'] ?? [])) return true;
        }

        if ($auth[\'type\'] === \'bearer\') {
            $header = $headers[\'authorization\'] ?? $headers[\'Authorization\'] ?? \'\';
            if (preg_match(\'/Bearer\\\\s+(.+)/i\', $header, $matches)) {
                if (in_array($matches[1], $auth[\'allowedTokens\'] ?? [])) return true;
            }
        }

        return false;
    }

    private function transformPayload(array $sourceBody, array $mapping): array {
        $target = [];
        foreach ($mapping[\'datamap\'] as $rule) {
            $src = $rule[\'sourceField\'];
            $tgt = $rule[\'targetField\'];
            if (isset($sourceBody[$src])) {
                $val = $sourceBody[$src];
                // Cast logic
                switch ($rule[\'targetType\']) {
                    case \'integer\': $val = (int)$val; break;
                    case \'number\': $val = (float)$val; break;
                    case \'boolean\': $val = (bool)$val; break;
                    case \'string\': $val = (string)$val; break;
                }
                $target[$tgt] = $val;
            }
        }
        return $target;
    }
}
`,

      "index.php": `<?php
require_once __DIR__ . \'/vendor/autoload\';

use Gateway\\Contracts\\DummyLogger;
use Gateway\\Contracts\\DummyCache;
use Gateway\\Gateway\\MapperEngine;

/**
 * ⚡ PSR-COMPLIANT MICROSERVICE DISPATCH PIPELINE
 * Intercepts request metadata, builds interfaces, logs resolutions, and emits responses.
 */

// 1. Initialize Compliance Modules
$logger = new DummyLogger();
$cache = new DummyCache();

// 2. Load Mapping Request Stream Details
$logger->info("--- Initializing HTTP Middleware Pipeline ---");

$method = $_SERVER[\'REQUEST_METHOD\'] ?? \'POST\';
$path = parse_url($_SERVER[\'REQUEST_URI\'] ?? \'/users\', PHP_URL_PATH);
$headers = getallheaders() ?: [];

// Extract dynamic inputs body
$input = file_get_contents(\'php://input\');
$body = json_decode($input, true) ?: [];

// Create Router mapper solution
$engine = new MapperEngine($logger, $cache);

// 3. Process matching schemas
$response = $engine->handleRequest($method, $path, $headers, $body);

// 4. Output Response Stream standard
http_response_code($response[\'status\']);
header(\'Content-Type: application/json\');
foreach ($response[\'headers\'] as $name => $value) {
    header("$name: $value");
}

echo json_encode($response[\'body\'], JSON_PRETTY_PRINT);
`
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard successfully!", 'success');
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  };

  // Generate mapping JSON
  const selectedMapping = mappings.find(m => m.id === selectedMappingId) || null;
  const jsonString = selectedMapping
    ? JSON.stringify(selectedMapping, null, 2)
    : "Select a mapping from the dropdown to view its JSON structure.";

  const activeSqlCode = generateSqlDDL();
  const phpFiles = getPSRPHPFiles();
  const activePhpCode = phpFiles[selectedPhpFile] || '';

  return (
    <div className="space-y-8">
      {/* Exporter Dashboard header */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
          </svg>
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold tracking-wider rounded-full text-xs uppercase">
            Developer Exporter Suite
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">Code & Database Exporter</h1>
          <p className="text-teal-100 text-base leading-relaxed">
            Convert local mappings, payload bodies, and custom proxies instantly into production-ready SQL schemas or a full PSR-compliant PHP microservice engine.
          </p>
        </div>
      </div>

      {/* Main Tab selectors with fluid motion indicator */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-2">
        <button
          onClick={() => setActiveExporterTab('json')}
          className={`flex-1 transition-all duration-200 gap-2 flex items-center justify-center py-3 text-sm font-semibold rounded-xl ${
            activeExporterTab === 'json'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
          JSON Schema Models
        </button>
        <button
          onClick={() => setActiveExporterTab('sql')}
          className={`flex-1 transition-all duration-200 gap-2 flex items-center justify-center py-3 text-sm font-semibold rounded-xl ${
            activeExporterTab === 'sql'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75" />
          </svg>
          Database Table SQL
        </button>
        <button
          onClick={() => setActiveExporterTab('php')}
          className={`flex-1 transition-all duration-200 gap-2 flex items-center justify-center py-3 text-sm font-semibold rounded-xl ${
            activeExporterTab === 'php'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 rounded font-black">PHP</span>
          PSR Compliant Solution
        </button>
      </div>

      {/* Exporter Area Content Panels */}
      {activeExporterTab === 'json' && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dynamic Mapping JSON</h2>
              <p className="text-slate-500 text-xs mt-0.5">Inspect defined relational target mapping models stored in the active environment.</p>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <select
                onChange={(e) => setSelectedMappingId(e.target.value)}
                value={selectedMappingId}
                className={`flex-grow sm:max-w-xs ${DEFAULT_INPUT_CLASSES}`}
                aria-label="Select dynamic mapping JSON"
              >
                <option value="" disabled>-- Select Mapping --</option>
                {mappings.map((mapping) => (
                  <option key={mapping.id} value={mapping.id}>
                    {mapping.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => copyToClipboard(jsonString)}
                disabled={!selectedMapping}
                className={`${PRIMARY_BUTTON_CLASSES} ${!selectedMapping ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                Copy JSON
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-200 p-6 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-800 shadow-inner max-h-[500px]">
              <code>{jsonString}</code>
            </pre>
          </div>
        </div>
      )}

      {activeExporterTab === 'sql' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SQL Parameters Controls Bar */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              SQL Generation Controls
            </h2>

            {/* Dialect Switcher */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Database Dialect</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border">
                {(['sqlite', 'mysql', 'postgres'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDialect(d)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors ${
                      dialect === d
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Scheme Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source Entity Target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSqlObjectSource('mapping')}
                  className={`py-2 px-3 text-xs font-medium border rounded-lg text-center ${
                    sqlObjectSource === 'mapping'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  From Active Mappings
                </button>
                <button
                  type="button"
                  onClick={() => setSqlObjectSource('route')}
                  className={`py-2 px-3 text-xs font-medium border rounded-lg text-center ${
                    sqlObjectSource === 'route'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  From Mock Payloads
                </button>
              </div>
            </div>

            {/* Select Target Object based on Source Type */}
            {sqlObjectSource === 'mapping' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Select Mapping Source</label>
                {mappings.length === 0 ? (
                  <p className="text-xs text-red-500 italic">No mappings available to generate columns.</p>
                ) : (
                  <select
                    value={selectedSqlMappingId}
                    onChange={(e) => setSelectedSqlMappingId(e.target.value)}
                    className={DEFAULT_INPUT_CLASSES}
                  >
                    {mappings.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Select Route Template Source</label>
                {incomingRoutes.length === 0 ? (
                  <p className="text-xs text-red-500 italic">No incoming route mock templates stored.</p>
                ) : (
                  <select
                    value={selectedSqlRouteId}
                    onChange={(e) => setSelectedSqlRouteId(e.target.value)}
                    className={DEFAULT_INPUT_CLASSES}
                  >
                    {incomingRoutes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.method} {r.path})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Structure layout only applies to mappings */}
            {sqlObjectSource === 'mapping' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Active Columns Generation Mode</label>
                <select
                  value={sqlStructureType}
                  onChange={(e) => setSqlStructureType(e.target.value as any)}
                  className={DEFAULT_INPUT_CLASSES}
                >
                  <option value="both">Generate Both (Source & Target Tables)</option>
                  <option value="source">Generate Source Data Fields only</option>
                  <option value="target">Generate Target Data Fields only</option>
                </select>
              </div>
            )}

            {/* Custom Table Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600">Override Database Table Name</label>
              <input
                type="text"
                value={customTableName}
                onChange={(e) => setCustomTableName(e.target.value)}
                placeholder="e.g., legacy_transactions_backup"
                className={DEFAULT_INPUT_CLASSES}
              />
            </div>

            {/* Action Indicators */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => downloadFile(`${customTableName || 'schema'}_export.sql`, activeSqlCode)}
                className={`w-full ${SECONDARY_BUTTON_CLASSES} flex items-center justify-center gap-2`}
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download SQL Code
              </button>
            </div>
          </div>

          {/* DDL Output Schema Previews */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {dialect.toUpperCase()} DDL Output Script
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Optimized column mappings generated directly from active model relationships.</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(activeSqlCode)}
                className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-250 transition-colors"
              >
                Copy SQL Command
              </button>
            </div>

            <pre className="bg-slate-900 text-teal-400 p-6 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto shadow-inner flex-grow min-h-[300px]">
              <code>{activeSqlCode}</code>
            </pre>
          </div>
        </div>
      )}

      {activeExporterTab === 'php' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Visual File Tree Structure */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <span className="text-emerald-500">📁</span> Compliance Directory
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedPhpFile('composer.json')}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  selectedPhpFile === 'composer.json'
                    ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📦</span> composer.json
              </button>

              <div className="pt-2 pl-1 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Source Classes</span>
                <button
                  onClick={() => setSelectedPhpFile('src/Gateway/MapperEngine.php')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    selectedPhpFile === 'src/Gateway/MapperEngine.php'
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>⚙️</span> MapperEngine.php
                </button>
                <button
                  onClick={() => setSelectedPhpFile('src/Contracts/Events.php')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    selectedPhpFile === 'src/Contracts/Events.php'
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>⚡</span> Events.php (PSR-14)
                </button>
                <button
                  onClick={() => setSelectedPhpFile('src/Contracts/DummyLogger.php')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    selectedPhpFile === 'src/Contracts/DummyLogger.php'
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>📜</span> DummyLogger.php (PSR-3)
                </button>
                <button
                  onClick={() => setSelectedPhpFile('src/Contracts/DummyCache.php')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    selectedPhpFile === 'src/Contracts/DummyCache.php'
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>⚡</span> DummyCache.php (PSR-6)
                </button>
              </div>

              <div className="pt-2 pl-1 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">EntryPoint API</span>
                <button
                  onClick={() => setSelectedPhpFile('index.php')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    selectedPhpFile === 'index.php'
                      ? 'bg-amber-500/10 text-amber-700 border-l-4 border-amber-500 pl-2'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🌐</span> index.php (Execution API/Web)
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1.5 font-medium leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <span>💡</span> PSR Compliance Checklist:
                </p>
                <ul className="space-y-1 text-amber-800 list-disc list-inside text-[11px]">
                  <li><strong>PSR-3:</strong> PSR/AbstractLogger log stream</li>
                  <li><strong>PSR-6:</strong> Cache item pool interface mapping</li>
                  <li><strong>PSR-7:</strong> HTTP Message message formatting</li>
                  <li><strong>PSR-14:</strong> Event Dispatcher payload hooking</li>
                  <li><strong>PSR-17:</strong> Unified HTTP Factories</li>
                  <li><strong>PSR-18:</strong> Proxy standard HTTP Client requests</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => downloadFile(selectedPhpFile.split('/').pop() || 'file.php', activePhpCode)}
                className={`w-full ${PRIMARY_BUTTON_CLASSES} text-xs py-2`}
              >
                Download Select Class File
              </button>
            </div>
          </div>

          {/* Right PSR Compliant PHP Code Area */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedPhpFile} Contents
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">PSR-compliant object code built from configured endpoints.</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(activePhpCode)}
                className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Copy PHP Class
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-200 p-6 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto shadow-inner flex-grow min-h-[450px]">
              <code>{activePhpCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
