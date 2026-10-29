# Component & Asset Attributions

This project incorporates curated open-source components from the React Bits registry and modern web utilities.

## React Bits Registry Components

| Component | Source Registry | License | Customizations Applied |
|---|---|---|---|
| **AeroShards** | React Bits (TypeScript / Tailwind) | MIT | Configured for K12 Hunar's black & yellow color palette (`#FFD60A`), wrapped in `AppBackground.tsx` with lazy-loading, tab visibility pause, and `prefers-reduced-motion` gradient fallback. |
| **MaskedHeading** | React Bits (Typography) | MIT | Integrated into the public inquiry hero section with high-contrast text and a static fallback for screen readers. |
| **GlassIcons** | React Bits (Icons & Glassmorphism) | MIT | Extended to support active selection states, accessible `radiogroup` keyboard navigation (Arrow keys, Space/Enter), and yellow ring focus states. |

## Fonts
- **Space Grotesk** by Florian Karsten (SIL Open Font License) - Self-hosted via `@fontsource/space-grotesk`
- **Inter** by Rasmus Andersson (SIL Open Font License) - Self-hosted via `@fontsource/inter`
