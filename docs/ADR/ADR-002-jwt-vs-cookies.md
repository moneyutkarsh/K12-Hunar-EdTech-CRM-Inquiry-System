# ADR-002: Custom JWT Bearer Tokens vs httpOnly Cookies

## Status
Accepted

## Context
In production deployments, the frontend is hosted on Vercel (`https://[app].vercel.app`) while the backend API is deployed on Render (`https://[api].onrender.com`). These distinct public domains constitute cross-site origins. Modern browser privacy defaults (Safari ITP, Chrome Privacy Sandbox, Firefox ETP) heavily restrict or block cross-origin third-party cookies when `SameSite=None; Secure` is used without custom apex domains. Relying on `httpOnly` cookies in this decoupled hosting model leads to silent authentication failures, dropped credentials during navigation, and fragile preflight interactions.

## Decision
We implement custom JWT Bearer token authentication:
1. Upon successful login at `/api/auth/login`, the server returns a signed HS256 JWT in the JSON response payload.
2. The client stores the token in memory and persists it to `localStorage` for session continuity across page refreshes.
3. An Axios request interceptor automatically attaches the `Authorization: Bearer <token>` header to all outgoing requests.
4. On 401 Unauthorized or expired tokens, an Axios response interceptor purges the token and redirects to `/admin/login`.

## Security Trade-off & Mitigations
### Risk: Cross-Site Scripting (XSS) Token Extraction
Tokens accessible to JavaScript in `localStorage` can theoretically be extracted if malicious scripts execute in the browser context.

### Mitigations:
1. **Zero `dangerouslySetInnerHTML`**: React's JSX auto-escaping is strictly adhered to throughout the codebase; untrusted content is never rendered as raw HTML.
2. **Helmet Security Headers**: The API enforces strict HTTP security headers via `helmet()` (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security).
3. **CORS Allowlist**: Express CORS middleware strictly whitelists explicit frontend origins defined in `CLIENT_URL` with `credentials: false`.
4. **Short Token TTL**: JWTs carry an 8-hour expiration (`exp: '8h'`) and validate `iss: 'k12-crm'`, `aud: 'k12-crm-admin'`, and algorithm `HS256`.
