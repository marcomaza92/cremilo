# Design Tokens — Cremilo Monthly Calculator

Source of truth: `app/globals.css` (`:root` block).
Shared CSS Module utilities: `app/styles/tokens.module.css`.
Design spec: `.prds/0001-monthly-calculator/DESIGN.md`.

---

## nequi Audit

[nequi](https://github.com/marcomaza92/nequi) is a local SCSS design system (at `~/www/personal/nequi`) that provides:

| nequi primitive | Status in Cremilo |
|---|---|
| Utility classes (`.background-base-*`, `.color-base-*`) | **Not bundled** — Vercel can't resolve local symlinks. Patterns replicated via CSS custom properties in `globals.css`. |
| Component classes (`.button-primary`, `.button-secondary`) | **Not bundled** — replaced by CSS Module per-component overrides (see auth screens). |
| Link classes (`.link-primary`, `.link-secondary`) | **Not bundled** — `a { color: inherit }` reset in `globals.css`; styled per-component. |
| CSS reset / base styles | **Replicated** — box-sizing, margin/padding resets in `globals.css`. |
| Typography scale | **Replicated** — `globals.css` + `tokens.module.css` expose `.headlineLg/.Md/.Sm`, `.bodyLg/.Md`, `.labelBold/.labelSm`. |
| Color variables | **Extended** — nequi's generic palette replaced by Mondrian Neobrutalism brand tokens. |

**Rule:** nequi is a reference design system. Cremilo implements the Mondrian theme as self-contained CSS custom properties + CSS Modules. If nequi is ever published to npm, it can be imported and overridden at the variable level.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-brand-red` | `#D62828` | Primary CTA, negative balances, financial alerts |
| `--color-brand-blue` | `#0047BB` | Growth indicators, interactive elements, focused states |
| `--color-brand-yellow` | `#F5C400` | Structural accents, secondary highlights, card top borders |
| `--color-brand-black` | `#111111` | Borders, shadows, high-contrast text |
| `--color-surface` | `#fcf9f8` | App background |
| `--color-on-surface` | `#1c1b1b` | Default text |
| `--color-primary` | `#b20112` | Brand primary (darker red) |
| `--color-secondary` | `#1d54c7` | Brand secondary (blue) |
| `--color-tertiary-container` | `#d0a600` | Brand tertiary (gold/yellow) |
| `--color-error` | `#ba1a1a` | Error states |

## Typography Tokens

| Token | Font | Size | Weight |
|---|---|---|---|
| `--font-display` | Bebas Neue | — | 400 |
| `--font-body` | Space Grotesk | — | 400/500/700 |
| `.headlineLg` | Bebas Neue | 64px | 400 |
| `.headlineMd` | Bebas Neue | 32px | 400 |
| `.headlineSm` | Bebas Neue | 24px | 400 |
| `.bodyLg` | Space Grotesk | 18px | 500 |
| `.bodyMd` | Space Grotesk | 16px | 400 |
| `.labelBold` | Space Grotesk | 14px | 700 |
| `.labelSm` | Space Grotesk | 12px | 500 |

All headlines are uppercase by default via `globals.css`.

## Spacing Tokens

Base unit: 4px.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-4` | 16px (gutter) |
| `--space-6` | 24px (card padding) |
| `--space-10` | 40px (section margin desktop) |

## Neobrutalism Geometry

| Token | Value | Usage |
|---|---|---|
| `--border-width` | 3px | All border strokes |
| `--border-color` | `--color-brand-black` | All borders |
| `--shadow-offset` | 4px | Drop shadow offset (x and y) |
| `--shadow` | `4px 4px 0 #111111` | Standard neobrutalist shadow |
| `--radius` | 0px | No rounded corners |

## CSS Module Token Utilities

Import from `@/app/styles/tokens.module.css`:

```tsx
import tokens from "@/app/styles/tokens.module.css";

// Usage
<div className={tokens.brutalistCard}>...</div>
<h1 className={tokens.headlineLg}>...</h1>
<span className={tokens.labelBold}>...</span>
```

Available classes: `surfaceBase`, `surfaceLow`, `surfaceContainer`, `surfaceHigh`, `surfaceWhite`, `textBase`, `textMuted`, `textPrimary`, `fillRed`, `fillBlue`, `fillYellow`, `fillBlack`, `brutalistBorder`, `brutalistShadow`, `brutalistCard`, `headlineLg`, `headlineMd`, `headlineSm`, `bodyLg`, `bodyMd`, `labelBold`, `labelSm`, `paddingCard`, `paddingSection`, `gutter`.
