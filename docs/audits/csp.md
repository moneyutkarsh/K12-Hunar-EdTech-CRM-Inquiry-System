# Audit: Content Security Policy (CSP) Report-Only Evaluation

## 1. Overview
The frontend deployment uses `Content-Security-Policy-Report-Only` via `frontend/vercel.json` (and `vercel.json`) to monitor directive violations without blocking or degrading runtime functionality.

## 2. Configured Policy Directives
```http
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  worker-src 'self' blob:;
  connect-src 'self' http://localhost:* https://*.onrender.com https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
```

## 3. How to Inspect Violations in Browser Console
1. Open the deployed application (or local preview) in Google Chrome, Microsoft Edge, or Firefox.
2. Open DevTools (`F12` or `Ctrl+Shift+I`) and select the **Console** tab.
3. Filter console logs by `[Report Only]` or `CSP`.
4. Any resource loaded that violates the proposed policy will trigger an advisory warning:
   ```text
   [Report Only] Refused to load the script '...' because it violates the following Content Security Policy directive: "script-src 'self' ..."
   ```
5. Since the header is Report-Only, the resource is still loaded and executed normally without breaking user workflows.

## 4. Promotion Criteria
Once a 14-day production observation window exhibits zero legitimate application warnings in console reports, the policy is promoted to enforcing mode (`Content-Security-Policy`) per [ADR-006](../ADR/ADR-006-csp-enforcement.md).
