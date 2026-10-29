# ADR-003: Timing-Safe Password Authentication and Brute-Force Lockout

## Status
Accepted

## Context
Standard authentication endpoints frequently suffer from account enumeration vulnerabilities:
1. Responding faster when an email is not found than when verifying a bcrypt hash reveals valid usernames.
2. Distinct error messages ("User does not exist" vs "Incorrect password") leak user directory existence.
3. Automated credential-stuffing attacks can saturate server CPU and compromise weak administrative passwords.

## Decision
1. **Constant-Time Comparison with Dummy Hash**: When an email lookup returns no record or an inactive account, `bcrypt.compare` is still executed against a precomputed 12-round dummy hash. As a result, response times for nonexistent accounts and wrong passwords are statistically identical (~60-90ms).
2. **Generic Error Responses**: Both non-existent accounts and invalid passwords return identical HTTP 401 status with the uniform message `"Invalid email or password"`.
3. **Database-Backed Account Lockout**:
   - Every login attempt (success or failure) is logged in the `login_attempts` table with a timestamp and hashed client IP.
   - If 5 failed attempts occur for the same lowercase email within a 15-minute sliding window, the server returns HTTP 429 `ACCOUNT_LOCKED` with a calculated `retryAfterSeconds`.
   - On successful login, the counter is naturally bypassed and the admin's `last_login_at` is updated.
