# K12 Hunar CRM — Frontend Technical & Design System Specification

## 1. Executive Summary & Architectural Overview

The **K12 Hunar CRM & Inquiry System** frontend is built as a high-performance, dark-themed Single Page Application (SPA). Designed with an **Obsidian & Gold (`#050505` + `#FFD60A`)** aesthetic, it balances rich visual immersion (WebGL2 shaders, glassmorphism, micro-animations) with enterprise usability (keyboard navigation, high data density, sub-millisecond table interactions, and strict privacy).

---

## 2. Complete Technology Stack

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^19.3.1` | Concurrent rendering, compiler optimizations, strict lifecycle control |
| **Language** | TypeScript | `~6.0.2` | End-to-end static typing, strict typechecking (`tsc -b`), zero runtime errors |
| **Build Tool & Bundler** | Vite | `^8.3.5` | Lightning-fast HMR, Rolldown/ESBuild production pipeline, chunk isolation |
| **Styling Engine** | Tailwind CSS | `v4.0.0` | Next-gen CSS-first utility engine with `@theme` directives and zero runtime |
| **Animation Engine** | tw-animate-css & Framer Motion | `^1.4.0` / `^14.7.1` | Fluid layout spring physics, count-up numbers, drawer slide-overs |
| **UI Primitive Base** | Radix UI / Base UI / Shadcn | `^1.9.0` | Accessible headless primitives (modals, tooltips, popovers, dropdowns) |
| **Routing** | React Router DOM | `^7.18.5` | Client-side routing, URL state synchronization (query params for filters) |
| **State Management** | React Context API | Native | Lightweight, zero-dependency auth and global filter state |
| **Form Handling** | React Hook Form | `^7.91.0` | Uncontrolled performant form inputs with minimal re-renders |
| **Schema Validation** | Zod | `^4.6.7` | Runtime type validation for inquiry submissions and API responses |
| **HTTP Client** | Axios | `^1.21.0` | Interceptors for JWT auth bearer tokens and API health status checks |
| **Drag and Drop** | `@dnd-kit/core`, `@dnd-kit/sortable` | `^6.3.1` / `^10.0.0` | Kanban pipeline column reordering and status drag transitions |
| **Data Visualization** | Recharts & SVG Sparklines | `^3.10.1` | Trajectory area charts, donut breakdown, custom 14-day SVG sparklines |
| **Toast Notifications** | Sonner | `^2.0.8` | High-performance, stacked dark-mode toasts with undo action support |
| **Iconography** | Lucide React | `^1.64.0` | Tree-shakable clean SVG icons with uniform 2px stroke width |
| **Typography Bundles** | Fontsource (Space Grotesk & Inter) | `^5.3.0` | Self-hosted zero-CLS fonts for headers, metrics, and data grids |
| **3D / Shader Engine** | WebGL2 (Raw GLSL `#version 300 es`) | Native | Custom bloom ping-pong framebuffers for GridScan and AeroShards |
| **Test Runner** | Vitest | `^4.1.12` | Fast ESM unit and decision logic test suite |

---

## 3. Color Grading & Palette Specification

The design system follows a curated **60-30-10 dark color rule**:
- **60% Base**: Deep Obsidian Black (`#050505`) ensuring deep black levels without OLED smear.
- **30% Structure**: Charcoal Glass Surfaces (`#0F0F0F` to `#171717`) with `rgba(255, 255, 255, 0.04)` fill and subtle border lines.
- **10% Accents**: Brand Electric Yellow (`#FFD60A`) and semantic status colors.

### 3.1 Primary & Neutral Color Scales

```
Obsidian Base ───►  #050505  (Main app background)
Sidebar Deep ────►  #0A0A0A  (Sidebar & navigation bars)
Card Surface ────►  #0F0F0F  (Glass cards base fill)
Input / Popover ─►  #141414  (Form inputs, table rows)
Elevated Surface ►  #171717  (Modals, floating command palette)
Border Subtle ───►  #262626  (rgba(255, 255, 255, 0.08))
```

| Token Name | HEX Code | RGB | Tailwind / CSS Class | Application |
| :--- | :--- | :--- | :--- | :--- |
| **`--bg-base`** | `#050505` | `rgb(5, 5, 5)` | `bg-[#050505]` | Main canvas & viewport backdrop |
| **`--surface`** | `#0F0F0F` | `rgb(15, 15, 15)` | `bg-[#0F0F0F]` | Primary cards & kanban columns |
| **`--surface-elevated`**| `#171717` | `rgb(23, 23, 23)` | `bg-[#171717]` | Drawer panels, dropdown menus, modals |
| **`--input-base`** | `#141414` | `rgb(20, 20, 20)` | `bg-[#141414]` | Form fields, select inputs, table row hover |
| **`--border-color`** | `#262626` | `rgb(38, 38, 38)` | `border-[#262626]` | Structural dividers, card borders |
| **`--border-subtle`**| `#FFFFFF14` | `rgba(255,255,255,0.08)` | `border-white/10` | Glass card outlines, pill borders |

### 3.2 Brand Gold / Yellow Accent Scale

| Token Name | HEX Code | RGB | Use Case |
| :--- | :--- | :--- | :--- |
| **Brand Yellow (Core)** | `#FFD60A` | `rgb(255, 214, 10)` | Active navigation pill, primary CTAs, admin badge |
| **Yellow Hover** | `#FFE14D` | `rgb(255, 225, 77)` | Button hover state, interactive highlights |
| **Yellow Pressed** | `#E6BF00` | `rgb(230, 191, 0)` | Button active/pressed state |
| **Yellow Subtle Tint** | `#FFD60A1A` | `rgba(255, 214, 10, 0.10)` | Category chip backgrounds, icon containers |
| **Yellow Border Glow** | `#FFD60A40` | `rgba(255, 214, 10, 0.25)` | Focus rings, card hover glow |
| **Text on Yellow** | `#0A0A0A` | `rgb(10, 10, 10)` | High-contrast label on solid yellow buttons |

### 3.3 Semantic Status & Functional Colors

| Status / Entity | Accent HEX | Background Tint | Border Tint | Element Applications |
| :--- | :--- | :--- | :--- | :--- |
| **Total Inquiries** | `#60A5FA` | `rgba(96, 165, 250, 0.10)` | `rgba(96, 165, 250, 0.25)` | Stat card sparkline, icon, All inquiries filter |
| **New / Unread** | `#FFD60A` | `rgba(255, 214, 10, 0.10)` | `rgba(255, 214, 10, 0.30)` | Yellow pulse dot, New status badge, sparkline |
| **In Progress** | `#FB923C` | `rgba(251, 146, 60, 0.10)` | `rgba(251, 146, 60, 0.30)` | Orange status badge, In Progress sparkline |
| **Resolved** | `#4ADE80` | `rgba(74, 222, 128, 0.10)` | `rgba(74, 222, 128, 0.30)` | Emerald status badge, Resolved sparkline |
| **Overdue / Error** | `#F87171` | `rgba(248, 113, 113, 0.15)` | `rgba(248, 113, 113, 0.30)` | Needs attention badge, delete actions, errors |
| **Category: Scholarship** | `#FFD60A` | `bg-[#FFD60A]/10` | `border-[#FFD60A]/20` | Scholarship chip & chart segment |
| **Category: Admission** | `#60A5FA` | `bg-[#60A5FA]/10` | `border-[#60A5FA]/20` | Admission chip & chart segment |
| **Category: Concert** | `#FB923C` | `bg-[#FB923C]/10` | `border-[#FB923C]/20` | Concert chip & chart segment |
| **Category: Query** | `#A78BFA` | `bg-[#A78BFA]/10` | `border-[#A78BFA]/20` | General query chip & chart segment |

---

## 4. Typography & Font System

The typography pairs an industrial neo-grotesque display typeface with an ultra-clean interface sans-serif:

```
Headings & Display  ──►  'Space Grotesk'  (Weights: 600, 700)
Body, Forms & UI    ──►  'Inter'          (Weights: 400, 500, 600)
Metrics & Time      ──►  'Inter' with tabular-nums
Shortcuts & Badges  ──►  ui-monospace / JetBrains Mono
```

### 4.1 Type Scale & Hierarchy

| Role | Font Family | Size (rem / px) | Weight | Line Height | Letter Spacing | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | Space Grotesk | `2.00rem` (32px) | Bold (700) | `1.20` | `-0.03em` | `text-3xl font-extrabold tracking-tight` |
| **Page Greeting** | Space Grotesk | `1.50rem` (24px) | Bold (700) | `1.25` | `-0.02em` | `text-2xl font-bold tracking-tight` |
| **Stat Card Metric** | Space Grotesk | `1.50rem` (24px) | Bold (700) | `1.00` | `-0.02em` | `text-2xl font-bold tabular-nums` |
| **Section Title** | Space Grotesk | `1.125rem` (18px) | SemiBold (600) | `1.30` | `-0.01em` | `text-lg font-semibold` |
| **Card Header** | Inter | `0.875rem` (14px) | SemiBold (600) | `1.40` | `normal` | `text-sm font-semibold` |
| **Body / Input Text**| Inter | `0.875rem` (14px) | Regular (400) | `1.50` | `normal` | `text-sm font-normal` |
| **Table Cell / UI** | Inter | `0.75rem` (12px) | Medium (500) | `1.40` | `normal` | `text-xs font-medium` |
| **Meta Label / KPI**| Inter | `0.6875rem` (11px)| SemiBold (600) | `1.30` | `+0.05em` | `text-[11px] uppercase tracking-wider` |
| **Micro Badges / Key**| Monospace | `0.625rem` (10px) | Bold (700) | `1.00` | `normal` | `text-[10px] font-mono font-bold` |

### 4.2 Tabular Numerals
All metric cards, currency values, countdowns, timestamps, and page sizes implement:
```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```
This guarantees that numbers never jitter or shift card widths during count-up animations or live status refreshes.

---

## 5. Layout, Spacing & Sizing Hierarchy

### 5.1 Grid & Container Layouts
- **Application Shell**: Flex row layout with a fixed left sidebar (`w-64` expanded, `w-20` collapsed) and scrollable main content area (`flex-1 max-w-7xl mx-auto`).
- **Navbar**: Fixed 64px height (`h-16`) with sticky positioning (`sticky top-0 z-40 backdrop-blur-md`).
- **Stat Cards Grid**: 4 columns on desktop (`grid-cols-2 lg:grid-cols-4 gap-4 mb-3`).
- **Secondary KPI Row**: 4 columns (`grid-cols-2 lg:grid-cols-4 gap-3 mb-6`).
- **Kanban Board**: 3 equal-width columns (`grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[600px]`).
- **Details Drawer**: 440px right slide-over sheet (`w-full sm:max-w-md lg:max-w-lg z-50`).

### 5.2 Border Radius Scale

```
Pills / Buttons ──► rounded-xl  (12px)
Glass Cards ──────► rounded-2xl (16px)
Dropdowns/Chips ──► rounded-lg  (8px)
Badges / Tags ────► rounded-md  (6px)
Indicator Dots ───► rounded-full (9999px)
```

| Token | Radius Value | Component Application |
| :--- | :--- | :--- |
| `rounded-2xl` | `1rem` (16px) | Glass cards, analytics container, modal shells, drawers |
| `rounded-xl` | `0.75rem` (12px) | Primary buttons, search inputs, active filter bars |
| `rounded-lg` | `0.50rem` (8px) | Filter select inputs, avatar badges, table row buttons |
| `rounded-md` | `0.375rem` (6px) | Status chips, category pills, keyboard shortcut hints |
| `rounded-full`| `9999px` | User initials avatar, status live indicators |

### 5.3 Icon Size Standards
Icons use Lucide React with standardized stroke width `strokeWidth={2}`:
- **Hero / Section Icons**: `w-5 h-5` (20px)
- **Standard Button & Card Icons**: `w-4 h-4` (16px)
- **Inline Meta & Badge Icons**: `w-3.5 h-3.5` (14px)
- **Micro Status Dots & Indicators**: `w-3 h-3` (12px) / `w-2 h-2` (8px)

---

## 6. Visual Effects & Glassmorphism System

### 6.1 Glassmorphism Token (`.glass-card`)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-card:hover {
  border-color: rgba(255, 214, 10, 0.25);
  box-shadow: 0 8px 32px -8px rgba(255, 214, 10, 0.08);
}
```

### 6.2 Yellow Glow Effects
- **Subtle Glow (`glow-yellow-sm`)**: `box-shadow: 0 0 16px -2px rgba(255, 214, 10, 0.25)`
- **Prominent Glow (`glow-yellow-md`)**: `box-shadow: 0 0 24px -2px rgba(255, 214, 10, 0.35)`

### 6.3 Interactive Spotlight Effect
Every `StatCard` tracks the cursor coordinates relative to its bounding box via mouse events, projecting an ambient radial highlight that follows the cursor:
```css
background: radial-gradient(
  400px circle at ${mousePos.x}px ${mousePos.y}px,
  rgba(255, 214, 10, 0.06),
  transparent 40%
);
```

---

## 7. Background Architecture: GridScan vs. AeroShards

The application uses an isolated dual-background architecture:

```
           ┌─────────────────────────────┐
           │      Router useLocation     │
           └──────────────┬──────────────┘
                          │
          Is /admin (Authenticated CRM)?
           ├─── YES ────────► GridScanBackground (WebGL2 Canvas)
           │                  - Deep obsidian room
           │                  - Scan beam with bloom
           │                  - Pure CSS fallback
           │                  - Zero camera / WebRTC code
           │
           └─── NO ─────────► AppBackground (AeroShards)
                              - Public Inquiry Page
                              - Admin Login Page
```

### 7.1 WebGL2 GridScan (Admin Dashboard)
- **Shader Language**: GLSL `#version 300 es` compiled directly via raw WebGL2 (zero heavy three.js overhead, ~22 kB gzipped bundle).
- **Theme Parameters**:
  - `linesColor`: `#423402` (Dark amber-yellow grid lines at low luminescence)
  - `scanColor`: `#FFD60A` (Core brand yellow sweep)
  - `shading`: `0.0` (Zero ambient white lamp to maintain deep `#050505` black base)
  - `dpr`: `1.5` (Capped device pixel ratio for smooth 60 FPS without GPU thermal throttling)
- **Heuristic Auto-Disable**:
  Automatically falls back to `CssGridFallback` if:
  - User prefers reduced motion (`prefers-reduced-motion: reduce`)
  - Screen width is mobile (`< 768px`)
  - Device memory is low (`< 4 GB` via `navigator.deviceMemory`)
  - CPU cores are low (`< 4 cores` via `navigator.hardwareConcurrency`)
  - User has active data saver mode (`navigator.connection.saveData`)
- **Strict Privacy**:
  Zero webcam code, zero `navigator.mediaDevices.getUserMedia`, zero external models. Ambient parallax responds solely to desktop mouse coordinates.

### 7.2 Pure CSS Grid Fallback
```css
backgroundImage: `
  radial-gradient(circle 600px at 50% -10%, rgba(255, 214, 10, 0.08), transparent 70%),
  linear-gradient(to right, rgba(255, 214, 10, 0.035) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(255, 214, 10, 0.035) 1px, transparent 1px)
`;
backgroundSize: '100% 100%, 48px 48px, 48px 48px';
```

---

## 8. Interactive Features & Keybindings

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Global Admin | Opens Command Palette action launcher |
| `?` | Global Admin | Opens Keyboard Shortcuts Cheat Sheet modal |
| `T` | Global Admin | Instantly switches to **Table View** |
| `B` | Global Admin | Instantly switches to **Pipeline Kanban Board** |
| `Esc` | Global Admin | Closes Drawer, Command Palette, or Active Modal |
| `Ctrl + Enter` | Inquiry Drawer | Instantly saves internal note to inquiry timeline |
| `[` / `]` | Inquiry Drawer | Navigates to Previous / Next inquiry without closing drawer |

---

## 9. Accessibility (a11y) & Performance Compliance

1. **WCAG AA Contrast**: All body text (`#F5F5F5` and `#A3A3A3`) maintains a minimum contrast ratio of `7.8:1` against the `#050505` base.
2. **Keyboard Focus Rings**: Interactive elements render a 2px focus ring with `rgba(255, 214, 10, 0.5)` offset.
3. **Screen Readers**: All status indicators, sparklines, and icon buttons provide explicit `aria-label` or `aria-hidden="true"` tags.
4. **Bundle Code-Splitting**: Shaders and WebGL pipelines are loaded using `React.lazy` in separate asynchronous chunks, ensuring initial bundle delivery under 320 kB gzipped.
