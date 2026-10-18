# Accessibility Audit (M7)

## Method
1. **Static HTML check** — `html-validate` (v9) run on `index.html`.
2. **Source review** — landmarks, labels, ARIA usage, focus handling, motion.
3. **Manual keyboard / screen-reader pass** — checklist below (to be ticked off by the author while testing in the browser).

## Automated results
- **HTML validation (`html-validate` v9 on `index.html`):** 19 errors before fixes, **1 remaining** after.
  - **Fixed:** invalid `menubar`/`menuitem` roles on the nav links (plain links in a `<nav>` list are correct), redundant `banner`/`main`/`contentinfo`/`columnheader` roles, missing `type="button"`, missing `scope="col"`, `aria-label` on a non-interactive `div`, all inline styles (moved to CSS classes), a redundant `for` on a wrapping label.
  - **Accepted:** the budget bar is a `div` with `role="progressbar"` and full `aria-value*` attributes; the validator would prefer a native `<progress>`, but the ARIA version is valid and styled consistently.
- **Unit tests:** 74 assertions in `tests.html` pass (also executed under Node).
- **Motion:** a `prefers-reduced-motion: reduce` media query disables animations and transitions.

## Colour contrast (WCAG 2.1 AA, normal text needs 4.5:1)
Computed from the CSS design tokens with the WCAG relative-luminance formula. Weak brand colours (`--accent`, `--success`, `--warning`, `--danger`) are used only for fills and borders; text uses dedicated `*-text` tokens.

| Pair (text on surface) | Light | Dark |
|---|---|---|
| `text-primary` on `bg-secondary` | 17.1:1 | 14.4:1 |
| `text-primary` on `bg-primary` | 15.2:1 | 16.0:1 |
| `text-secondary` on `bg-secondary` | 7.0:1 | 8.1:1 |
| `text-secondary` on `bg-primary` | 6.3:1 | 9.0:1 |
| `text-muted` on `bg-secondary` | 6.6:1 | 6.8:1 |
| `text-muted` on `bg-primary` | 5.9:1 | 7.6:1 |
| `text-muted` on `bg-tertiary` | 6.2:1 | 6.4:1 |
| `text-muted` on `bg-card-hover` | 5.8:1 | 6.2:1 |
| `accent-text` on `bg-secondary` | 6.8:1 | 7.0:1 |
| `accent-text` on `bg-primary` | 6.0:1 | 7.8:1 |
| `danger-text` on `bg-secondary` | 6.2:1 | 5.4:1 |
| `danger-text` on `danger-light` | 5.5:1 | n/a |
| `success-text` on `bg-secondary` | 5.9:1 | 6.7:1 |
| `warning-text` on `bg-secondary` | 6.4:1 | 11.3:1 |
| `text-inverse` on `accent` (buttons) | 4.9:1 | 4.9:1 |
| `text-inverse` on `bg-nav` | 17.1:1 | 19.7:1 |
| `<mark>` text on highlight | 11.3:1 | 11.3:1 |

### Issues found and fixed during this audit
- `text-muted` was 2.9:1 (light) and 3.4:1 (dark): darkened/lightened.
- Error, warning, success and accent text used brand colours at 1.5:1–3.2:1: moved to `*-text` tokens.
- Search highlights in dark mode were light text on yellow (1.3:1): `<mark>` now uses fixed dark text.

## Manual keyboard checklist
- [ ] First Tab reveals "Skip to main content" and it moves focus to `<main>`
- [ ] Every nav link reachable and activatable with Enter
- [ ] Mobile menu toggle works with Enter/Space and updates `aria-expanded`
- [ ] Add form: Tab order follows visual order; errors announced; focus not trapped
- [ ] Sort headers focusable; Enter/Space sorts; `aria-sort` changes
- [ ] Search input: invalid regex shows a message instead of throwing
- [ ] Edit / Delete buttons reachable; Escape cancels inline edit
- [ ] Settings controls (currency select, cap, dark-mode, import/export/seed) fully operable
- [ ] Focus outline visible in light and dark themes
- [ ] Screen reader (NVDA/VoiceOver): budget status announces politely under cap and assertively over cap
- [ ] 200% browser zoom and 360px width: no horizontal scroll, no overlap
- [x] Colour contrast of text, buttons and `<mark>` in both themes (computed from tokens, see table; re-check on screen with a contrast tool if desired)

## Known limitations
- Exchange rates are manual, not fetched.
- Dates and categories are normally constrained by native controls (`type="date"`, a category dropdown); the validators additionally reject impossible dates (e.g. `2026-02-31`) and padded categories, which matters for imported data.
- The budget cap covers the **current calendar month** (by the record's date); total spending on the dashboard remains all-time.
