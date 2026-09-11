# Reboot ERP — Frontend Architecture & Backend Integration Guide

Welcome to the **Reboot ERP** frontend workspace reference. This document provides a complete, step-by-step breakdown of the newly added frontend features, security architectures, and instructions on how the backend services must be implemented to support them.

---

## Table of Contents

1. [Frontend Workspace Architecture Overview](#1-frontend-workspace-architecture-overview)
2. [Summary of Added Features & Capabilities](#2-summary-of-added-features--capabilities)
   - [Feature 1: Streaming UI (`<StreamingText />`)](#feature-1-streaming-ui-streamingtext-)
   - [Feature 2: Modular Prompt Builder (`<PromptBuilder />`)](#feature-2-modular-prompt-builder-promptbuilder-)
   - [Feature 3: Token Management & BFF Pattern](#feature-3-token-management--bff-pattern)
   - [Feature 4: XSS Prevention (`<SanitizedHtml />`)](#feature-4-xss-prevention-sanitizedhtml-)
   - [Feature 5: Role-Based UI Guard (`<RequireAuth />`)](#feature-5-role-based-ui-guard-requireauth-)
   - [Feature 6: Strict Content Security Policy (CSP) Awareness](#feature-6-strict-content-security-policy-csp-awareness)
3. [Step-by-Step Backend Implementation Guide](#3-step-by-step-backend-implementation-guide)
   - [Step 1: Session & Authentication Service (BFF + HttpOnly Cookies)](#step-1-session--authentication-service-bff--httponly-cookies)
   - [Step 2: Server-Sent Events (SSE) AI Token Streaming Endpoint](#step-2-server-sent-events-sse-ai-token-streaming-endpoint)
   - [Step 3: WebSocket Streaming Alternative](#step-3-websocket-streaming-alternative)
   - [Step 4: Prompt Analysis & AI Gateway Endpoints](#step-4-prompt-analysis--ai-gateway-endpoints)
   - [Step 5: Backend Role-Based Access Control (RBAC)](#step-5-backend-role-based-access-control-rbac)
   - [Step 6: Strict CSP HTTP Headers Configuration](#step-6-strict-csp-http-headers-configuration)
4. [API Contract & Schema Reference](#4-api-contract--schema-reference)
5. [Frontend File Structure](#5-frontend-file-structure)

---

## 1. Frontend Workspace Architecture Overview

Reboot ERP is built as a **Domain-Driven Modular Monolith** using modern React 19, TypeScript, and Tailwind CSS. The system decouples business domains (MES, WMS, Quality, MEP, Procurement, Finance) while centralizing shared infrastructure in `/src/shared/`.

### Core Engineering Tenets
- **Modular Monolith**: Features are partitioned into domain folders (`/src/features/*`) with distinct API layers, schemas, and components.
- **Client-Side BFF Routing**: All frontend API communications route exclusively through the centralized API client in `/src/shared/api/client.ts` pointing to the `/api` prefix.
- **Zero Token Leakage**: Tokens and JWTs are **never stored** in browser `localStorage` or `sessionStorage`. All state is held in-memory and authenticated via secure cookies.
- **DOM Isolation**: Restricted UI controls and views are completely removed from the DOM via `<RequireAuth />` rather than visually hidden with CSS.

---

## 2. Summary of Added Features & Capabilities

### Feature 1: Streaming UI (`<StreamingText />`)
**Location:** `/src/shared/components/StreamingText.tsx`

A high-performance streaming text renderer designed to consume real-time AI responses and display them token-by-token with a smooth typewriter effect.

#### Capabilities:
1. **Multi-Protocol Support**:
   - **Server-Sent Events (SSE)**: Automatically establishes an `EventSource` connection to `/api/ai/stream`.
   - **WebSockets**: Connects to `ws://` or `wss://` streams and parses incoming frame packets.
   - **Fetch ReadableStream**: Consumes standard browser `ReadableStream` chunks (NDJSON or raw text).
   - **Static Text Mode**: Typewriter simulation from pre-loaded strings.
2. **Buffer Queue & Pacing Engine**:
   - Batches incoming tokens into a high-speed internal queue (`tokenQueueRef`).
   - Smooth typewriter rendering (default 18ms per token) prevents UI stuttering and layout jumps.
3. **Integrated XSS Protection**:
   - Every rendered token passes through DOMPurify via `<SanitizedHtml />` before injection into the DOM.
4. **Interactive Controls**:
   - Pause, resume, restart, and fast-forward controls.
   - Custom blinking terminal cursor (`animate-pulse`).

---

### Feature 2: Modular Prompt Builder (`<PromptBuilder />`)
**Location:** `/src/shared/components/PromptBuilder.tsx` and `/src/shared/components/prompt-builder/`

An industrial-grade prompt engineering workbench for manufacturing domain experts. It allows operators, engineers, and plant managers to construct structured AI prompts with contextual parameters before sending them to the backend AI gateway.

#### Sub-Component Architecture:
- **`ContextSelector`**: Selects target domain context (Injection Molding MES, IATF 16949 Quality, MEP Chiller SCADA, WMS Inventory, Financial Costing, Supply Chain).
- **`ToneSlider`**: Adjusts model response tone (Technical Precision, Executive Summary, Root Cause Analysis, SOP Operator, Concise Audit).
- **`SystemPersonaSelector`**: Selects or customizes system instructions from industrial role presets.
- **`ContextInjectionToggles`**: Granular toggles to inject live telemetry, open work orders, IATF containment specs, or active BOM recipes.
- **`PromptVariableChips`**: One-click insertion of standardized parameter tokens (e.g., `[Parameter: Cavity Pressure Delta-P > 15 bar]`).
- **`CompiledPromptViewer`**: Real-time compiled prompt inspector displaying approximate token count and formatted Markdown preview.

---

### Feature 3: Token Management & BFF Pattern
**Location:** `/src/shared/api/client.ts` and `/src/features/auth/`

#### Security Directives Enforced:
1. **Zero Client Storage**:
   - **NEVER** store JWTs, refresh tokens, API keys, or credentials in `localStorage` or `sessionStorage`.
   - Session state is held in-memory via React state and validated on page load via `GET /api/auth/me`.
2. **Backend-For-Frontend (BFF)**:
   - Frontend communicates exclusively with the BFF gateway (`baseURL: '/api'`).
   - Axios is configured with `withCredentials: true` so the browser transmits `HttpOnly, Secure, SameSite=Strict` cookies on every request.
3. **Automated CSRF Protection**:
   - Centralized Axios interceptors read the `XSRF-TOKEN` cookie and attach it as the `X-XSRF-TOKEN` header on mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).

---

### Feature 4: XSS Prevention (`<SanitizedHtml />`)
**Location:** `/src/shared/components/SanitizedHtml.tsx`

Ensures that all dynamic, user-generated, or AI-generated Markdown/HTML is sterilized against cross-site scripting attacks prior to DOM insertion.

#### Sanitization Rules:
- Powered by `DOMPurify`.
- **Allowed Tags**: `b`, `i`, `em`, `strong`, `a`, `p`, `span`, `br`, `ul`, `ol`, `li`, `h1`-`h6`, `blockquote`, `code`, `pre`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `hr`, `mark`, `kbd`.
- **Allowed Attributes**: `href`, `target`, `rel`, `class`, `id`, `title`.
- **Forbidden Tags**: `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`.
- **Forbidden Attributes**: `onerror`, `onload`, `onclick`, `onmouseover`, `action`, `data`, and any URI beginning with `javascript:`.

---

### Feature 5: Role-Based UI Guard (`<RequireAuth />`)
**Location:** `/src/shared/components/RequireAuth.tsx`

Provides zero-DOM-leakage authorization gating across views, action buttons, and sensitive configuration panels.

#### How It Works:
```tsx
import { RequireAuth } from './shared/components/RequireAuth';

// Gating an action button to administrators and managers
<RequireAuth
  roles={['admin', 'manager']}
  fallback={<span className="text-xs text-slate-400">Clearance Required</span>}
>
  <button onClick={handleApprove}>One-Click Approve</button>
</RequireAuth>
```

#### Authorization Logic:
1. Reads `currentUser` from the top-level `AuthContext`.
2. Evaluates requested roles against `currentUser.role` (case-insensitive).
3. Super-user escalation: Users with `admin`, `director`, or `superadmin` automatically pass role checks.
4. General `user` role matches all authenticated operators.
5. If authorization fails, the component returns the optional `fallback` (or `null`). **Nothing is rendered to the client DOM tree.**

---

### Feature 6: Strict Content Security Policy (CSP) Awareness
The frontend workspace has been audited and hardened for strict CSP environments:
- **Zero Inline Script Execution**: No inline `<script>` tags in `index.html` or components.
- **Zero Dynamic Evaluation**: No usage of `eval()`, `new Function()`, or `setTimeout(string)`.
- **Zero Inline Event Handlers**: All event handling uses React synthetic events (`onClick`, `onChange`).
- **Asset Integrity**: CSS and fonts are served via bundled packages or trusted origin CDNs.

---

## 3. Step-by-Step Backend Implementation Guide

Follow these steps to implement the corresponding backend services (Node.js/Express, Python/FastAPI, or Go) to interact with the Reboot ERP frontend.

---

### Step 1: Session & Authentication Service (BFF + HttpOnly Cookies)

The frontend expects session cookies rather than raw bearer tokens. The backend must set `HttpOnly` cookies upon login and clear them on logout.

#### Endpoints Required:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

#### Node.js / Express Example:
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

// 1. LOGIN: Set HttpOnly, Secure, SameSite=Strict cookie
app.post('/api/auth/login', async (req, res) => {
  const { email, password, pin } = req.body;
  const user = await validateCredentials(email, password, pin);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate session token (opaque session ID or signed JWT)
  const sessionToken = generateSignedSessionToken(user.id);

  // Set secure HttpOnly session cookie
  res.cookie('reboot_session', sessionToken, {
    httpOnly: true,                                // Inaccessible to client JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict',                            // Mitigate CSRF
    maxAge: 8 * 60 * 60 * 1000,                   // 8 hours
    path: '/',
  });

  // Set readable anti-CSRF token cookie
  const csrfToken = generateRandomCsrfToken();
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,                               // Accessible to client to mirror into header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,                             // e.g. "Plant Operations Director", "admin", "quality"
      plantId: user.plantId,
      badgeId: user.badgeId,
    },
  });
});

// 2. VERIFY SESSION: Returns authenticated user
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.reboot_session;
  if (!token) {
    return res.status(401).json({ user: null });
  }

  const user = await verifySession(token);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  return res.json({ user });
});

// 3. LOGOUT: Clears the cookies
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('reboot_session', { path: '/' });
  res.clearCookie('XSRF-TOKEN', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});
```

---

### Step 2: Server-Sent Events (SSE) AI Token Streaming Endpoint

The frontend `<StreamingText protocol="sse" src="/api/ai/stream?id=..." />` connects via `EventSource`. The backend must establish a continuous `text/event-stream` response and emit chunks.

#### Supported Data Formats:
The frontend parser accepts any of the following SSE payload structures:
1. `data: {"token": "word"}`
2. `data: {"content": "word"}`
3. `data: {"delta": {"text": "word"}}`
4. `event: token\ndata: {"token": "word"}`
5. `event: done\ndata: [DONE]` (signals completion)

#### Node.js / Express Example (with Google GenAI / Gemini):
```typescript
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const router = express.Router();

router.get('/api/ai/stream', async (req, res) => {
  const queryId = req.query.id as string;
  const prompt = getStoredPrompt(queryId) || 'Analyze manufacturing telemetry for Line 01.';

  // 1. Set required SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering
  res.flushHeaders();

  try {
    // 2. Stream tokens from model
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        // 3. Format as SSE data line
        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
      }
    }

    // 4. Send completion event
    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: (error as Error).message })}\n\n`);
    res.end();
  }
});
```

#### Python / FastAPI Example:
```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

async def ai_token_generator(query_id: str):
    tokens = ["Root ", "Cause ", "Identified: ", "Cavity ", "pressure ", "drop ", "due ", "to ", "valve ", "gate ", "wear."]
    for token in tokens:
        # Emit standard SSE packet
        yield f"data: {json.dumps({'token': token})}\n\n"
        await asyncio.sleep(0.04) # simulate generation cadence
    
    # Emit completion
    yield "event: done\ndata: [DONE]\n\n"

@app.get("/api/ai/stream")
async def stream_ai(id: str):
    return StreamingResponse(
        ai_token_generator(id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

---

### Step 3: WebSocket Streaming Alternative

If `<StreamingText protocol="websocket" src="ws://localhost:3000/api/ai/ws?id=123" />` is used:

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const queryId = url.searchParams.get('id');

  // Stream token packets
  const tokens = ['Extruder ', 'Zone ', '03 ', 'temperature ', 'stabilized.'];
  for (const token of tokens) {
    ws.send(JSON.stringify({ token }));
    await new Promise((r) => setTimeout(r, 40));
  }

  // Completion packet
  ws.send(JSON.stringify({ done: true }));
  ws.close();
});
```

---

### Step 4: Prompt Analysis & AI Gateway Endpoints

When the user clicks "Compile & Analyze" in `<PromptBuilder />`, the frontend calls:
`POST /api/ai/analyze`

#### Expected Request Payload:
```json
{
  "config": {
    "domainContext": "manufacturing",
    "systemPersona": "Senior Process & Tooling Engineer...",
    "temperature": 0.4,
    "tone": "technical_precision",
    "injectLiveTelemetry": true,
    "injectActiveWorkOrders": true,
    "injectIatfRequirements": false,
    "injectBomRecipes": false,
    "maxTokens": 2048
  },
  "promptText": "[Parameter: Cavity Pressure Delta-P > 15 bar] Investigate short shot defects on Mold M-204."
}
```

#### Expected Response Format:
```json
{
  "analysis": "Parametric analysis completed for MANUFACTURING. Cavity pressure sensor telemetry indicates late fill transition.",
  "recommendations": [
    "Verify hydraulic switchover position from velocity to pressure control",
    "Check barrel thermocouple calibration at Zone 3 and nozzle"
  ],
  "confidenceScore": 0.96,
  "compiledPrompt": "...full compiled system + user prompt string..."
}
```

---

### Step 5: Backend Role-Based Access Control (RBAC)

> **CRITICAL SECURITY DIRECTIVE:** Client-side `<RequireAuth />` handles visual presentation and DOM isolation. **The backend API must independently enforce authorization on all protected endpoints.**

#### Backend RBAC Middleware Pattern (Express):
```typescript
export function requireBackendRoles(allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = req.user; // Populated from session cookie verification
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const role = (user.role || '').toLowerCase();

    // Admin super-user bypass
    if (role === 'admin' || role.includes('director') || role === 'superadmin') {
      return next();
    }

    // Role check
    const authorized = allowedRoles.some((allowed) => {
      const target = allowed.toLowerCase();
      return role === target || (target === 'user' && role.length > 0) || role.includes(target);
    });

    if (!authorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient clearance. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

// Usage in API Routes:
app.post('/api/operations/approve', requireBackendRoles(['admin', 'manager']), (req, res) => {
  // Execute approval...
});

app.post('/api/admin/firmware/reflash', requireBackendRoles(['admin']), (req, res) => {
  // Execute high-privilege action...
});
```

---

### Step 6: Strict CSP HTTP Headers Configuration

To ensure strict Content Security Policy enforcement in staging and production, configure your reverse proxy (Nginx) or application server (Helmet in Express) with the following headers:

#### Express (Helmet) Configuration:
```typescript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],                          // ZERO inline scripts ('unsafe-inline' is forbidden)
      styleSrc: ["'self'", "'unsafe-inline'"],        // Allow bundled Tailwind CSS styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],      // SSE, WebSockets, REST APIs
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],                          // Block flash/plugins
      frameAncestors: ["'self'"],                     // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  })
);
```

#### Nginx Configuration:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: https:; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'self';" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 4. API Contract & Schema Reference

### Auth Schemas (`/src/features/auth/types/authSchemas.ts`)
```typescript
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor?: string;
  initials?: string;
  plantId?: string;
  badgeId?: string;
}
```

### Prompt Builder Schemas (`/src/shared/components/PromptBuilder.tsx`)
```typescript
export interface PromptBuilderFormValues {
  domainContext: 'manufacturing' | 'quality' | 'mep_facilities' | 'inventory_wms' | 'financials_costing' | 'supply_chain';
  systemPersona: string;
  temperature: number;
  tone: 'technical_precision' | 'executive_summary' | 'root_cause_rca' | 'sop_operator' | 'concise_audit';
  injectLiveTelemetry: boolean;
  injectActiveWorkOrders: boolean;
  injectIatfRequirements: boolean;
  injectBomRecipes: boolean;
  maxTokens: number;
}
```

---

## 5. Frontend File Structure

```text
/src
├── core/                                # Application Shell
│   ├── Topbar.tsx                       # Global header with plant selector & user avatar
│   ├── Sidebar.tsx                      # Modular domain navigation with role badges
│   └── ConfirmModal.tsx                 # Modal dialogs
├── shared/                              # Cross-Cutting Infrastructure
│   ├── api/
│   │   └── client.ts                    # Centralized Axios client (BFF, withCredentials)
│   ├── components/
│   │   ├── RequireAuth.tsx              # Role-Based UI Guard (<RequireAuth roles=[...]>)
│   │   ├── SanitizedHtml.tsx            # DOMPurify XSS prevention primitive
│   │   ├── StreamingText.tsx            # SSE / WebSocket AI text typewriter
│   │   ├── PromptBuilder.tsx            # Industrial prompt constructor container
│   │   └── prompt-builder/              # Modular sub-components
│   │       ├── ContextSelector.tsx      # Domain context picker
│   │       ├── ToneSlider.tsx           # Temperature & tone scale
│   │       ├── SystemPersonaSelector.tsx# Expert persona presets
│   │       ├── ContextInjectionToggles.tsx # Telemetry/BOM injection flags
│   │       ├── PromptVariableChips.tsx  # Pre-engineered tokens
│   │       └── CompiledPromptViewer.tsx # Compiled token inspector
│   └── layouts/
│       ├── AppLayout.tsx                # Authenticated application shell layout
│       └── AuthLayout.tsx               # Unauthenticated login screen layout
└── features/                            # Bounded Context Modules
    ├── auth/                            # Login, PIN verification, session hook
    ├── ai/                              # AI prompt analysis & streaming APIs
    ├── manufacturing/                   # Production dispatch, machines, OEE
    ├── quality/                         # IATF 16949, SPC, NCRs, inspections
    └── ...
```

---

## Conclusion & Verification
All components and directives have been compiled, type-checked (`tsc --noEmit`), and verified against the live development server. For interactive testing of both the **AI Streaming UI** and the **Security Directives**, navigate to the **"7. Architecture & AI Readiness"** tab in the main application menu.
