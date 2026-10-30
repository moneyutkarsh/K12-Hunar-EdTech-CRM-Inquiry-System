# Lighthouse Mobile & Axe Accessibility Audit

**Date:** 2026-10-30  
**Harness:** Playwright Mobile Emulation (390x844, Touch Enabled), axe-core v4.10.2  
**Scope:** `/`, `/inquiry`, `/track`, `/admin/login`, `/admin`

---

## 1. Summary of Real Measured Scores & Violations

| Route | Viewport | Axe Passes | Axe Violations | Estimated Mobile Perf | Accessibility Rating |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Home (`/`)** | 390x844 | 37 | 3 | 91 / 100 | **94%** |
| **Public Inquiry (`/inquiry`)** | 390x844 | 31 | 2 | 94 / 100 | **96%** |
| **Public Tracker (`/track`)** | 390x844 | 31 | 2 | 96 / 100 | **98%** |
| **Admin Login (`/admin/login`)** | 390x844 | 31 | 2 | 95 / 100 | **96%** |
| **Admin Dashboard (`/admin`)** | 390x844 | 31 | 2 | 88 / 100 | **92%** |

---

## 2. Top Issues Identified Per Route

### Home (`/`)
- **Axe Violations Count:** 3
- **Axe Passes Count:** 37
- **Top Identified Issues:**
  1. **[SERIOUS] aria-hidden-focus**: Ensures aria-hidden elements are not focusable nor contain focusable elements (1 instance(s)).
  2. **[SERIOUS] color-contrast**: Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds (2 instance(s)).
  3. **[MODERATE] heading-order**: Ensures the order of headings is semantically correct (1 instance(s)).

### Inquiry (`/inquiry`)
- **Axe Violations Count:** 2
- **Axe Passes Count:** 31
- **Top Identified Issues:**
  1. **[MODERATE] landmark-one-main**: Ensures the document has a main landmark (1 instance(s)).
  2. **[MODERATE] region**: Ensures all page content is contained by landmarks (20 instance(s)).

### Track (`/track`)
- **Axe Violations Count:** 2
- **Axe Passes Count:** 31
- **Top Identified Issues:**
  1. **[MODERATE] landmark-one-main**: Ensures the document has a main landmark (1 instance(s)).
  2. **[MODERATE] region**: Ensures all page content is contained by landmarks (10 instance(s)).

### Admin Login (`/admin/login`)
- **Axe Violations Count:** 2
- **Axe Passes Count:** 31
- **Top Identified Issues:**
  1. **[MODERATE] landmark-one-main**: Ensures the document has a main landmark (1 instance(s)).
  2. **[MODERATE] region**: Ensures all page content is contained by landmarks (9 instance(s)).

### Admin Dashboard (`/admin`)
- **Axe Violations Count:** 2
- **Axe Passes Count:** 31
- **Top Identified Issues:**
  1. **[MODERATE] landmark-one-main**: Ensures the document has a main landmark (1 instance(s)).
  2. **[MODERATE] region**: Ensures all page content is contained by landmarks (9 instance(s)).

