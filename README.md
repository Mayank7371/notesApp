# Notes + Canvas

An ultra-responsive visual workspace combining structured rich text notes (powered by **Tiptap**) and an infinite diagramming canvas (powered by **Excalidraw**).

## Features

- **Split Screen Workspace:** Live resizable divider with keyboard arrow adjustments and double-click 50% snap.
- **Tiptap Rich Text Editor:** Syntax-highlighted code blocks, interactive checklist task items, image embeds with drag-and-drop & clipboard paste.
- **Interactive Slash Commands (`/`):** Quick block insertion for headings, checklists, code blocks, and media with keyboard navigation.
- **Excalidraw Infinite Canvas:** Auto-synchronized theme (dark/light), scene state persistence, and initial mock diagram skeleton rendering.
- **Local Persistence & Privacy:** Fast in-memory refs for typing and drawing latency with local state management.
- **Accessible Design:** Compliant with WCAG 2.2 AAA visible focus rings, ARIA semantic roles, and `prefers-reduced-motion`.

## Performance Audit (Vercel React Best Practices)

Audited against Vercel Engineering's 8 core performance pillars:

1. **Eliminating Waterfalls:** Server-first layout hierarchy and client-boundary leaf nodes.
2. **Bundle Optimization:** `optimizePackageImports` for `lucide-react` in `next.config.ts`, dynamic SSR-free Excalidraw loading.
3. **Hydration Parity:** Zero SSR-to-client attribute mismatch on theme toggles.
4. **Re-render Optimization:** Component memoization with `React.memo` (`TopBar`, `NotesLibrary`, `NoteEditor`, `CanvasPanel`) to isolate typing and drawing from outer workspace state.
5. **Compute & Traversal:** Memoized query filtering in sidebar and eliminated full-AST document traversals on idle editor renders.
6. **Passive Listeners:** Event listener optimization with passive click-outside handlers.
7. **Zero-CLS Fonts:** Self-hosted `Plus_Jakarta_Sans` and `JetBrains_Mono` variable fonts via `next/font/google`.
8. **Accessibility:** Screen-reader live regions (`aria-live="polite"`), modal alertdialogs, and touch targets >= 44x44px.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # TypeScript validation
npm run build      # Production Turbopack build
```
