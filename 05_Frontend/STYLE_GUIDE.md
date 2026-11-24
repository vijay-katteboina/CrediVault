# CrediVault Frontend Style Guide

## Design principles

Use a calm, trustworthy visual language for an academic credential platform. Prefer
clear hierarchy, restrained color, readable text, and consistent page spacing. Keep
existing application behavior and route/API contracts unchanged when styling pages.

## Design tokens

Import `src/styles/tokens.css` before component styles and use its `--cv-*` variables
instead of introducing page-specific colors, typography, or spacing values.

- **Primary:** deep indigo (`--cv-color-primary`) for primary actions and links.
- **Surfaces:** neutral background, white surface, subtle surface, and border tokens.
- **Text:** use `--cv-color-text` for primary content and `--cv-color-muted` for
  supporting text.
- **Semantic states:** use success, warning, danger, and info tokens. Status badges
  should include a readable label and must not rely on color alone.
- **Typography:** use `--cv-font-sans` and the `--cv-text-*`, `--cv-weight-*`, and
  `--cv-line-*` scales. Keep the system font fallback available.
- **Spacing:** use the 4/8/12/16/24/32/48px scale (`--cv-space-*`) for page and
  component gaps.
- **Shape and depth:** use the shared radius, shadow, and transition variables.

## Shared components

Import from `src/components/ui` rather than duplicating common patterns:

- `Button` for actions; choose primary, secondary, danger, or ghost variants and
  use its loading/disabled behavior.
- `FormField`, `Input`, `Select`, and `Textarea` for labelled form controls. Connect
  helper and validation text through `FormField`.
- `Card` for grouped page content, `Alert`/`Toast` for feedback, and `StatusBadge`
  for account and credential states.
- `Modal`/`ConfirmDialog` for dialogs, `DataTable`/`Pagination` for tabular data,
  and `SearchBar` for search forms.
- `Spinner`, `Skeleton`, `EmptyState`, and `ErrorState` for consistent asynchronous
  and no-data states.
- `RoleLayout`/`AppShell` for role-aware navigation and responsive page structure.

Keep page-specific classes for layout only. Reuse shared component styles rather than
overriding their colors, focus indicators, or semantic state treatment.

## Layout and responsive behavior

- Use the role shell for signed-in role pages; keep page content within its main
  content region.
- Use CSS grid/flex with `min-width: 0` for nested content and avoid fixed page widths.
- At narrow widths, stack forms and actions, collapse grids, and constrain tables to
  their own horizontal scroll containers instead of overflowing the page.
- Use the breakpoints already represented by the shared stylesheet conventions:
  40rem, 56.25rem, 65.625rem, and 80rem.

## Accessibility and interaction

- Use semantic headings in order and associate every form control with a visible label.
- Preserve visible `:focus-visible` outlines and keyboard access for all actions.
- Use `Alert` for announced feedback, and use dialogs that support keyboard dismissal
  and focus management.
- Pair status colors with text or an icon/label; never communicate verification status
  by color alone.
- Respect reduced-motion preferences and maintain readable contrast on surfaces.
- Do not show credentials, tokens, private keys, or other secrets in UI content.

## Page styling checklist

1. Use shared tokens instead of hardcoded colors and duplicate type scales.
2. Reuse shared controls and state components before creating new ones.
3. Keep existing API calls, authentication, route guards, and business behavior intact.
4. Verify loading, empty, error, and success states.
5. Check layout at 360px, tablet, and desktop widths; keep horizontal scrolling local
   to wide tables.
