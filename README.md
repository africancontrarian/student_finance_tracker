# Student Finance Tracker

A responsive, accessible, vanilla HTML/CSS/JavaScript web application for tracking student finances. Built without any frameworks or libraries.

## Chosen Theme

**Student Finance Tracker** — track budgets, transactions, and search through expenses.

## Features

- **Add/Edit/Delete** transactions with real-time validation
- **Regex-powered search** with match highlighting and case-sensitivity toggle
- **Sortable records table** — sort by description, amount, category, or date
- **Dashboard** with total records, total spending, top category, and 7-day trend chart
- **Monthly budget cap** (current calendar month) with ARIA live alerts (polite when under, assertive when over)
- **Multi-currency** support (ZAR, USD, EUR) with manual exchange rates
- **JSON import/export** with structure validation
- **Seed data** loader (12 sample records)
- **Dark mode** toggle (persisted)
- **Mobile-first** responsive design (360px → 768px → 1024px+)
- **Fully accessible** — keyboard navigation, skip link, ARIA live regions, visible focus

## File Structure

```
student-finance-tracker/
├── index.html          # Single-page application
├── tests.html          # Automated test assertions
├── seed.json           # 12 sample records
├── README.md           # This file
├── styles/
│   └── main.css        # Mobile-first responsive stylesheet
├── scripts/
│   ├── app.js          # Entry point (ES module)
│   ├── state.js        # Central state + pub/sub + CRUD
│   ├── storage.js      # localStorage + JSON I/O
│   ├── ui.js           # DOM rendering + event handling
│   ├── validators.js   # Regex validation (5 rules + calendar check)
│   ├── budget.js       # Month-scoped budget helpers + local date
│   └── search.js       # Safe regex compiler + highlight
├── docs/
│   ├── spec.md         # M1 spec, data model, a11y plan
│   ├── a11y-audit.md   # M7 accessibility audit
│   └── demo-script.md  # Demo video outline
└── assets/
    └── wireframes/     # mobile.svg, desktop.svg
```

## 🔍 Regex Catalog

| # | Purpose | Pattern | Example Match |
|---|---------|---------|---------------|
| 1 | Description (no leading/trailing spaces) | `/^\S(?:.*\S)?$/` | `"Lunch at café"` ✅ / `" Lunch "` ❌ |
| 2 | Amount (valid currency) | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `"12.50"` ✅ / `"012"` ❌ |
| 3 | Date (YYYY-MM-DD; shape checked by regex, then calendar-validated so `2026-02-31` is rejected) | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `"2026-10-14"` ✅ / `"14-10-2026"` ❌ |
| 4 | Category (letters, spaces, hyphens only) | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `"Self-Care"` ✅ / `"Food1!"` ❌ |
| 5 | **Advanced**: Duplicate consecutive words (back-reference) | `/\b(\w+)\s+\1\b/i` | `"and and"` ⚠️ warning |
| 6 | Cents present (search) | `/\.\d{2}\b/` | `"12.50"` ✅ |
| 7 | Beverage keyword (search) | `/(coffee\|tea)/i` | `"Coffee"` ✅ |

## Keyboard Navigation Map

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Move focus forward / backward |
| `Enter` or `Space` | Activate buttons, nav links, sort headers |
| `Escape` | Cancel inline edit |
| Skip link | First `Tab` press reveals "Skip to main content" link |

All interactive elements (nav links, sort headers, buttons, form controls) are focusable with visible `:focus-visible` outlines.

## Accessibility Notes

- **Semantic HTML**: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` landmarks
- **Single `<h1>`** (in logo), proper `<h2>` per section, logical heading hierarchy
- **Skip-to-content link** as first focusable element
- **`aria-live` regions**: polite for status messages, assertive for budget overage alerts
- **`aria-sort`** on sortable table headers
- **`aria-label`** / `aria-describedby` on all interactive controls
- **`role="status"`** and `role="alert"` for form errors
- **Color contrast**: all text/surface pairs meet WCAG AA (≥ 4.5:1) in light and dark themes; ratios are tabulated in `docs/a11y-audit.md`
- **Visible focus styles**: 2px solid accent outline with offset on all focusable elements
- **Reduced motion**: a `prefers-reduced-motion: reduce` media query disables animations and transitions
- **`<mark>`** highlighting preserves readability and contrast

## Milestones

| # | Milestone | Where |
|---|-----------|-------|
| M1 | Spec & wireframes | `docs/spec.md`, `assets/wireframes/` |
| M2 | Semantic HTML & base CSS | `index.html`, `styles/main.css` |
| M3 | Forms & regex validation | `scripts/validators.js`, `tests.html` |
| M4 | Render, sort, regex search | `scripts/search.js`, `scripts/ui.js` |
| M5 | Stats, cap & targets | `scripts/state.js`, dashboard in `ui.js` |
| M6 | Persistence, import/export, settings | `scripts/storage.js`, `seed.json` |
| M7 | Polish & a11y audit | `docs/a11y-audit.md`, this README |

## Demo Video

> **Link:** _paste the 2–3 minute demo video URL here_ (outline in `docs/demo-script.md`)

## Running Tests

1. Open `tests.html` in any modern browser
2. All assertions run automatically on page load
3. Results show PASS (green) / FAIL (red) for each test
4. Summary at bottom shows total pass rate

## How to Run

1. Clone or download this repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)
3. Click "Load Seed Data" in Settings to populate sample records
4. No build step or server required — it's all static files

> **Note**: ES modules require serving via HTTP. Use VS Code Live Server, `python -m http.server`, or any static server. Double-clicking the file may not work due to CORS restrictions on module imports.

## Data Format

Each record follows this structure:

```json
{
  "id": "txn_0001",
  "description": "Lunch at cafeteria",
  "amount": 12.50,
  "category": "Food",
  "date": "2026-10-14",
  "createdAt": "2026-10-14T08:30:00Z",
  "updatedAt": "2026-10-14T08:30:00Z"
}
```

## Built With

- Vanilla HTML5
- Vanilla CSS3 (custom properties, Flexbox, Grid, media queries)
- Vanilla JavaScript (ES modules)
- No frameworks, no libraries, no build tools