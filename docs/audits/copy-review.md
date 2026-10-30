# Copy & Claims Review Audit

**Date:** 2026-10-30  
**Scope:** Marketing promises, guarantees, time-bound SLAs, and named internal bodies across public and internal surfaces.  
**Rule:** Read-only audit; no strings modified in this task.

---

## Findings Summary

| # | File & Line | Current Text | Risk Level | Nature of Risk |
| :- | :--- | :--- | :-: | :--- |
| 1 | `frontend/src/pages/HomePage.tsx:39` | `You will receive an initial response within 24 hours of submission, with urgent and scholarship queries often addressed within 10 to 12 hours.` | **MEDIUM** | Strict SLA promise; creates consumer expectation during weekends or holidays. |
| 2 | `frontend/src/pages/HomePage.tsx:480-482` | `Connect directly with the K12 Hunar admissions committee, merit scholarship board, and festival teams. Every inquiry receives a dedicated reference code and a guaranteed 24-hour response.` | **HIGH** | Unbacked legal guarantee ("guaranteed 24-hour response"); names fictional/internal entities ("merit scholarship board, festival teams"). |
| 3 | `frontend/src/pages/HomePage.tsx:526` | `Guaranteed reply in 24h` | **HIGH** | Hard legal claim on hero trust badge. |
| 4 | `frontend/src/pages/HomePage.tsx:528` | `Verified counselor response` | **LOW** | "Verified counselor" implies official government or state licensing. |
| 5 | `frontend/src/pages/HomePage.tsx:947` | `A verified counselor reviews your query, logs internal notes, and connects with you directly with comprehensive guidance.` | **LOW** | Implies external accreditation/certification of counselors. |
| 6 | `frontend/src/pages/HomePage.tsx:1120` | `Transparent, guaranteed 24-hour admissions and scholarship inquiry portal for grade schools across India.` | **HIGH** | Repeated unbacked SLA guarantee in global footer description. |
| 7 | `frontend/src/pages/AdminLoginPage.tsx:444` | `...connect students with practical skills, projects, mentorship, leadership experiences, and verified opportunities beyond the classroom.` | **LOW** | "Verified opportunities" promotional phrasing. |
| 8 | `frontend/src/pages/AdminLoginPage.tsx:465` | `Verified Opportunities` | **LOW** | Feature bullet in marketing split pane. |
| 9 | `frontend/src/pages/PublicTrackerPage.tsx:96` | `Record Verified` | **LOW** | Status badge indicating email/reference match in database (accurate). |
| 10 | `frontend/src/pages/PublicTrackerPage.tsx:328` | `Estimated response: within 24 hours` | **LOW** | Neutral and accurate ("Estimated response"). |

---

## Detailed Evaluation & Neutral Alternatives

### 1. `frontend/src/pages/HomePage.tsx:39` (FAQ Item)
* **Current:** `"Our admissions and counseling team reviews all inquiries during active office hours (IST). You will receive an initial response within 24 hours of submission, with urgent and scholarship queries often addressed within 10 to 12 hours."`
* **Risk:** Sets a fixed 24h/12h SLA without qualification for office closures or high surge periods.
* **Suggested Neutral Alternative:**
  > `"Our admissions and counseling team reviews inquiries during business hours (Mon?Fri, IST). Most inquiries receive an initial response within 1 to 2 business days."`

---

### 2. `frontend/src/pages/HomePage.tsx:480-482` (Hero Subtitle)
* **Current:** `"Connect directly with the K12 Hunar admissions committee, merit scholarship board, and festival teams. Every inquiry receives a dedicated reference code and a guaranteed 24-hour response."`
* **Risk:** Legally unbacked "guaranteed 24-hour response" and specific named bodies ("merit scholarship board", "festival teams").
* **Suggested Neutral Alternative:**
  > `"Connect directly with the K12 Hunar admissions and program coordinators. Every inquiry receives a dedicated reference code and a prompt response from our advising team."`

---

### 3. `frontend/src/pages/HomePage.tsx:526` (Hero Trust Pill 1)
* **Current:** `"Guaranteed reply in 24h"`
* **Risk:** Strict promissory language.
* **Suggested Neutral Alternative:**
  > `"Target reply: 1 business day"` or `"Fast counselor response"`

---

### 4. `frontend/src/pages/HomePage.tsx:528` (Hero Trust Pill 3)
* **Current:** `"Verified counselor response"`
* **Risk:** Implies third-party legal credentialing.
* **Suggested Neutral Alternative:**
  > `"Direct counselor response"` or `"Official school advisor"`

---

### 5. `frontend/src/pages/HomePage.tsx:947` (How It Works Step 3)
* **Current:** `"A verified counselor reviews your query, logs internal notes, and connects with you directly with comprehensive guidance."`
* **Risk:** Promotional "verified counselor" terminology.
* **Suggested Neutral Alternative:**
  > `"A dedicated advisor reviews your query, logs internal notes, and connects with you directly with comprehensive guidance."`

---

### 6. `frontend/src/pages/HomePage.tsx:1120` (Footer About Copy)
* **Current:** `"Transparent, guaranteed 24-hour admissions and scholarship inquiry portal for grade schools across India."`
* **Risk:** Reiteration of unconditional 24-hour guarantee.
* **Suggested Neutral Alternative:**
  > `"Transparent admissions and scholarship inquiry portal for grade schools across India."`
