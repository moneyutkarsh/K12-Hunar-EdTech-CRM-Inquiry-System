# STOP AND ROTATE: Live Credentials Detected in Workspace

**Date:** 2026-10-30  
**Audit Scope:** Git history (all commits on all branches) and active uncommitted working tree.  
**Severity:** **BLOCKER**

---

## 1. Executive Notice: STOP AND ROTATE

Live production/staging secrets were detected in the local working directory (`backend/.env`). Although `.env` is correctly excluded by `.gitignore` and has **not** been pushed to the remote Git repository, these live secrets must be rotated immediately before production launch or code sharing.

### Compromised / Live Credentials Requiring Rotation:

1. **Supabase PostgreSQL Password:**
   - **Location:** `backend/.env` (`DATABASE_URL`)
   - **Host:** `aws-0-eu-west-1.pooler.supabase.com:6543`
   - **User:** `postgres.jefdtxzpfgtjkyeukbnn`
   - **Status:** Active live database connection.
   - **Action Required:** Open Supabase Project Settings -> Database -> Reset database password.

2. **Google Account App Password (SMTP):**
   - **Location:** `backend/.env` (`SMTP_PASS`)
   - **Associated Account:** `moneyutkarsh@gmail.com`
   - **Action Required:** Revoke app password at `myaccount.google.com/apppasswords` and generate a fresh one if needed.

3. **HMAC-SHA256 JWT Secret:**
   - **Location:** `backend/.env` (`JWT_SECRET`)
   - **Value:** 44-character base64 secret (`H9ggy...`)
   - **Action Required:** Generate a new random secret using `node -e "console.log(crypto.randomBytes(48).toString('base64'))"` upon rotation.

---

## 2. Git History Audit Results

A full diff search across all commits (`git log -p -S ...`) was conducted for:
- Connection strings (`postgresql://`)
- Supabase project reference strings (`jefdtxzpfgtjkyeukbnn`)
- Database passwords (`Moneyutkarsh`)
- Gmail app passwords (`egfpvhbgaxaehcde`)
- Base64 JWT secrets

### History Finding:
* **Clean History:** No real production credentials or personal credentials were found in Git commit history.
* Historical commits only contain standard development placeholders (`postgres:postgrespassword@postgres:5432` in `docker-compose.yml`, and `yourprojectref:yourpassword` in `.env.example`).
* `.gitignore` includes `.env`, `.env.local`, and `backend/.env`.

---

## 3. Preventative Safeguards

1. Install `git-secrets` or add a pre-commit hook scanning for `postgresql://.*:.*@` and `SMTP_PASS=`.
2. Ensure CI runner rejects PRs containing `.env` files or high-entropy tokens.
