# ADR-005: AeroShards WebGL Canvas Background & Fallback Strategy

## Status
Accepted

## Context
High-end visual aesthetics require dynamic, living visual elements without degrading frame rates, exhausting mobile GPU batteries, or violating accessibility guidelines for users sensitive to motion.

## Decision
1. **Dynamic Shader Canvas**: The public landing page (`/`) and login screen (`/admin/login`) utilize the React Bits `AeroShards` component, rendering GPU-accelerated golden-yellow ambient shards over a `#050505` dark background.
2. **Lazy-Loading via Suspense**: The heavy WebGL shader code is code-split and loaded via `React.lazy()` so that the initial HTML/CSS and form inputs render in under 100ms.
3. **Accessibility & Reduced Motion**:
   - `prefers-reduced-motion: reduce` is detected via the `useReducedMotion` hook.
   - When reduced motion is preferred, WebGL rendering is disabled, gracefully replaced with a static radial gradient (`radial-gradient(ellipse at top, rgba(255, 214, 10, 0.08) 0%, #050505 70%)`).
4. **Dashboard Readability**:
   - In the protected admin portal (`/admin`), `AppBackground` applies an 88% dark overlay (`bg-[#050505]/88`) to maximize contrast for tabular data and charts while maintaining ambient continuity.
