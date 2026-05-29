# Developer Guidelines & Architectural Overview

Welcome, developer! This guide highlights how this framework is structured and how to extend it.

## 🏗️ Core Architecture Overview

This applet runs as a client-side Single Page Application (SPA) driven by a local service worker:

```
  React Frontend UI (State, Forms) <== [POSTMESSAGE] ==> Service Worker (Proxy Interceptors)
```

1. **State Ownership**: React handles data definition and stores rule states through storage keys.
2. **Sync Mechanism**: React broadcasts the complete list of schema paths, route rules, and map links via `postMessage({ type: 'UPDATE_RULES', payload ... })` in `App.tsx`.
3. **Execution Interceptor**: `public/service-worker.js` intercepts network requests matching the origin, applies credentials validation, evaluates JSON conditions, maps payload properties using JSONPath, and returns mocked schemas or forwards proxies.

## ⚙️ Core Modules and Directories

- `/types.ts` - All structure contracts (e.g., `IncomingRoute`, `ApiClient`, `Mapping`). Ensure any state modification extends interfaces here first.
- `/public/service-worker.js` - Routing interceptor. Normalizes path conditions (with/without leading `$.`) and evaluates JSONPath comparisons.
- `components/IncomingRoutesManager.tsx` - Visual interface to define proxy routes. Includes the Expected JSON Payload Visual Selector and Live Sandbox match evaluator.
- `components/ApiClient.tsx` - Visual tester for routes. Supports loading client parameters from any Incoming Route template model.
- `services/geminiService.ts` - AI assistant interfacing with `gemini-2.5-flash` using `@google/genai` to suggest mappings.

## ⚠️ Key Guidelines for Future Changes

1. **Keep Service Worker aligned with Frontend Simulator**: If you change condition matching operators in `public/service-worker.js`, remember to propagate those matching evaluations to `evaluateCondition` inside `components/IncomingRoutesManager.tsx` so the match preview highlights stay in sync.
2. **Maintain TSConfig and Build Compliance**: The workspace compiles strictly using `/tsconfig.json`. Ensure any module addition remains fully typesafe. Always compile-verify using `compile_applet`.
3. **Use Lucide Icons**: All visual indicators must use named icons from `lucide-react` loaded dynamically in `constants.tsx` to maintain typography and icon spacing patterns.
