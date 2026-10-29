# Architecture Decision Record (ADR): @dnd-kit for Kanban Board

## Context
Phase U4 of the UI/UX Upgrade Pack requires drag-and-drop between Kanban columns with accessible keyboard navigation, screen-reader announcements, and optimistic status updates.

## Decision
Adopted `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` as permitted in the specification.

## Consequences
- Clean, lightweight modular drag-and-drop architecture.
- Full keyboard accessibility (Space to lift, Arrow keys to navigate columns, Space to drop).
- Native touch sensor support without extra mobile polyfills.
- Zero layout shift with custom drag overlays.
