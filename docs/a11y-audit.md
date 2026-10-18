# Accessibility Audit (M7)

## Method
1. **Static HTML check** — `html-validate` (v9) run on `index.html`.
2. **Source review** — landmarks, labels, ARIA usage, focus handling, motion.
3. **Manual keyboard / screen-reader pass** — checklist below (to be ticked off by the author while testing in the browser).

## Automated results
- Before fixes: **19 errors**. After fixes: **6 remaining** (all low-impact, listed below).
- **Fixed:** invalid `menubar`/`menuitem` roles on the navigation links (plain links in a `<nav>` list are the correct pattern), redundant `banner`/`main`/`contentinfo`/`columnheader` roles, missing `type="button"` on buttons, missing `scope="col"` on table headers, `aria-label` on a non-interactive `div`.
- **Added:** a `prefers-reduced-motion: reduce` media query that disables animations and transitions.
- **Accepted (not blocking users):** inline styles on the progress bar width (set dynamically), three small presentational inline styles in Settings, a `role="progressbar"` `div` where `<progress>` would also work, and one redundant `for` on a label that wraps its input.

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
- [ ] Colour contrast of text, buttons and `<mark>` checked with a contrast tool in both themes

## Known limitations
- The budget cap is compared against the **total of all records**, although the Settings label says "Monthly Budget".
- The date rule checks the `YYYY-MM-DD` shape only, so impossible dates such as `2026-02-31` pass the regex.
- Exchange rates are manual, not fetched.
