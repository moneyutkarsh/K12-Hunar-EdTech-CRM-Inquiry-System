# Security & Architecture Audit: Authentication Surface

**Date:** 2026-10-30  
**Auditor:** Automated Release Pack Verification  
**Scope:** Admin account creation, self-registration endpoints, and UI sign-up flows.

---

## 1. Executive Summary

| Finding | Severity | Evidence | Impact |
| :--- | :--- | :--- | :--- |
| **Unauthenticated Public Admin Registration Endpoint** | **BLOCKER** | `backend/src/routes/auth.routes.js:33` | Anyone on the public internet can create an active administrator account with full CRM access without approval or invite code. |
| **Public Navbar "Sign up" CTA Exposing Admin Creation** | **HIGH** | `frontend/src/pages/HomePage.tsx:316, 385` | The public marketing header displays a prominent "Sign up" button that links directly to `/admin/login?mode=signup`. |
| **Unrestricted OAuth / OTP Admin Provisioning** | **HIGH** | `backend/src/services/otp.service.js:118` & `admins.repo.js:108` | Any email address receiving an OTP code is automatically upserted with `role = 'admin'` and `is_active = true`. |

---

## 2. Detailed Evidence & Code Inspection

### 2.1 Public Endpoint: `POST /api/auth/signup`
In `backend/src/routes/auth.routes.js`:
```javascript
// Line 32-33
// Public: Admin signup/registration
router.post('/signup', validate(loginSchema), asyncHandler(signup));
```
In `backend/src/services/auth.service.js`:
```javascript
// Lines 76-88
export async function registerAdmin({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await findAdminByEmail(normalizedEmail);
  if (existing) {
    throw HttpError.badRequest('An admin account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newAdmin = await upsertAdmin({ email: normalizedEmail, passwordHash, role: 'admin' });
  ...
}
```
**Conclusion:** A public endpoint exists that can create an administrator in the database with no authentication, invitation token, or administrative approval required.

---

### 2.2 Frontend "Sign up" Navigation & Mode Toggle
In `frontend/src/pages/HomePage.tsx`:
```tsx
// Lines 314-322
<Link
  to="/admin/login?mode=signup"
  className="btn-shine-effect text-xs px-3.5 py-1.5 rounded-full bg-[#FFD60A] text-[#0A0A0A] font-bold"
>
  Sign up &rarr;
</Link>
```
In `frontend/src/pages/AdminLoginPage.tsx`:
```tsx
// Lines 209-215
const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
const res = await api.post(endpoint, {
  email: data.email.trim(),
  password: data.password,
});
```
**Conclusion:** Clicking "Sign up" in the main navigation switches the login page into registration mode (`mode=signup`), allowing any visitor to create credentials and immediately gain administrator access to the CRM dashboard.

---

### 2.3 OAuth / OTP Self-Provisioning
In `backend/src/repositories/admins.repo.js`:
```javascript
// Lines 107-122
export async function upsertOAuthAdmin({ email, name, avatarUrl, provider = 'google' }) {
  const oauthDummyHash = '$2a$10$OAUTH.LOGIN.NO.PASSWORD.SET.' + Math.random().toString(36).substring(2, 15);
  const sql = `
    INSERT INTO admins (email, password_hash, name, avatar_url, role, is_active, token_version, last_login_at)
    VALUES (LOWER($1), $2, $3, $4, 'admin', true, 1, NOW())
    ...
  `;
}
```
**Conclusion:** Any email address that verifies a 6-digit OTP code is automatically provisioned into the `admins` table with role `admin` and `is_active = true`.

---

## 3. Recommended Remediation (Proposed Fix)

1. **Gate Public Sign-Up**:
   - For an internal CRM, public registration should either be disabled entirely in production (`ENABLE_PUBLIC_SIGNUP=false`) or require an admin invite token (`/api/auth/invite/:token`).
   - If self-registration is intended for demo/evaluation purposes, restrict the default role to `evaluator` / read-only or gate by `@k12hunar.com` domain allowlist.
2. **Update Navbar CTA**:
   - In public consumer portals, the top CTA is typically "Submit Inquiry" rather than "Sign up" (which confuses public parents/students with internal administrators).
3. **OAuth Domain Restriction**:
   - Check incoming email domain during OAuth/OTP sign-in against an allowed list or existing admin directory before granting administrator role.
