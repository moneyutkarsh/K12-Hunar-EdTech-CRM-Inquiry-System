# Component & Asset Attributions

This project incorporates curated open-source components from the React Bits registry and modern web utilities.

## React Bits Registry Components

| Component | Source Registry | License | Customizations Applied |
|---|---|---|---|
| **AeroShards** | React Bits (TypeScript / Tailwind) | MIT | Configured for K12 Hunar's black & yellow color palette (`#FFD60A`), wrapped in `AppBackground.tsx` with lazy-loading, tab visibility pause, and `prefers-reduced-motion` gradient fallback. |
| **MaskedHeading** | React Bits (Typography) | MIT | Integrated into the public inquiry hero section with high-contrast text and a static fallback for screen readers. |
| **GlassIcons** | React Bits (Icons & Glassmorphism) | MIT | Extended to support active selection states, accessible `radiogroup` keyboard navigation (Arrow keys, Space/Enter), and yellow ring focus states. |
| **GridScan** | React Bits (`@react-bits/GridScan-TS-TW`) | MIT | Tuned for dark obsidian (`#050505`) and gold scan (`#FFD60A`) theme in `GridScanBackground.tsx`. Completely removed webcam/face-api paths for zero-camera privacy compliance. Wrapped in React.lazy chunk with pure CSS fallback, WebGL error boundary, and automated device/reduced-motion heuristics. Source: `https://reactbits.dev/r/GridScan-TS-TW.json` |
| **GhostFibers** | React Bits (`@react-bits/GhostFibers-TS-TW`) | MIT | Implemented exclusively for Home Page (`/`). Tuned in `GhostFibersBackground.tsx` for obsidian base (`#050505`), brand yellow (`#FFD60A`), amber (`#FB923C`), soft warm highlights, low density, gentle drift. Zero camera/getUserMedia tracking. Dynamic chunk isolation with CSS diagonal streaks fallback. Source: `https://reactbits.dev/r/GhostFibers-TS-TW.json` |

## Fonts
- **Space Grotesk** by Florian Karsten (SIL Open Font License) - Self-hosted via `@fontsource/space-grotesk`
- **Inter** by Rasmus Andersson (SIL Open Font License) - Self-hosted via `@fontsource/inter`
