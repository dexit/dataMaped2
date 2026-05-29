# Solution Features: Data Mapper Pro

The application provides a feature-rich, local-first API mock proxy, datamapping, and client testing suite with the following key modules:

## 1. Incoming Route Mock Interceptors
- **Service Worker Local Gateway**: Intercepts fetch requests on the origin without communicating with real backends, mocking or forwarding requests on-the-fly.
- **Dynamic Request Body Payload Extraction**: Automatically parses pasted sample JSON, extracting schema paths (e.g., `body.items[0].id`).
- **Interactive Rule Injector**: One-click condition creation using parsed payload keys relative to requests.
- **Live Match Sandbox Simulator**: Assesses active rules against the defined payload and outlines rule matched/failed status with visual indicators inside the route editor.

## 2. Global AI-Powered Schema Mapper
- **Gemini-Powered Mapping Recommendations**: Integrates the Gemini model (`gemini-2.5-flash`) via the modern `@google/genai` SDK to suggest semantic connections between complex JSON structures.
- **Visual Mapping Grid**: Displays key associations and infers data type transformations.

## 3. Mock Endpoint and Remote Proxy Forwarder
- **State-based Authentication Gate**: Configures API Key or Bearer Token authentication requirements on proxy entry points.
- **Configurable Outgoing egress transforms**: Sets custom headers, deletes elements, or overrides payloads prior to external transmission.

## 4. API Client and HTTP Test Suite
- **Template-driven Hydration**: Quickly populates client testing variables (URL, HTTP Method, body schemas) from sample payload configurations of specified mock endpoints.
- **Unified JSON formatters**: Provides clean code block spacing and validates string structures across all payload entries in the platform.

## 5. Comprehensive Relational Schema Exporter
- **Automated Dialect Translation**: Fully compiles logical relational mapping models or static body mock configurations into database DDL queries (supporting SQL formats for SQLite, MySQL, and PostgreSQL).
- **Control Overlay and Settings**: Permits overriding database table naming keys on-the-fly, generating source payloads or target payloads structures separately, or compiling dual table structures side-by-side with full copy and file download integrations.

## 6. Enterprise-Grade PHP PSR compliance Builder
- **Multi-File Generation**: Instantly produces a compliant PHP project architecture.
- **Rules Mapping**: Automatically binds the workspace's active mapping logic, authentication settings, path variables, and condition states into concrete PHP match constructs.
- **Standards Implemented**: Includes standard constructor-level classes tracing **PSR-3** (Logger logs pool), **PSR-6** (Cache pooling), **PSR-7 & PSR-17** (HTTP Server Requests, Responses, and Factories), **PSR-14** (Event dispatch pipelines for extension events), and **PSR-18** (standard PHP HTTP requests client).
- **Interactive File Explorer**: Features a tabbed code directory sidebar to switch classes, review typed variables, and copy/download components.
