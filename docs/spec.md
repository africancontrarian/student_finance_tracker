# Student Finance Tracker — Specification (M1)

## 1. Overview
A single-page, framework-free web app (HTML, CSS, vanilla JS ES modules) that helps a student record spending, search it with regular expressions, and stay under a budget cap. All data stays in the browser (`localStorage`).

## 2. Users and goals
| User | Goal |
|------|------|
| Student on a phone | Log an expense in under 15 seconds, see how much budget is left |
| Student reviewing the month | Find past spending quickly (regex search), sort by amount/date/category |
| Keyboard / screen-reader user | Do every task without a mouse; hear budget alerts and form errors |

### User stories
1. As a student, I can add, edit and delete transactions so my records stay accurate.
2. As a student, I get immediate, specific error messages when my input is invalid.
3. As a student, I can search with a regex (with a case toggle) and see matches highlighted.
4. As a student, I can sort the records by description, amount, category or date.
5. As a student, I can see total records, total spending, top category and a 7-day trend.
6. As a student, I can set a budget cap and be warned (politely when under, assertively when over).
7. As a student, I can export/import my data as JSON and my data survives a page reload.
8. As a student, I can switch display currency (ZAR, USD, EUR) and dark mode.

## 3. Data model
### Record
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
Amounts are stored in the **base currency (ZAR)**; display conversion is applied at render time.

### Settings
| Field | Type | Default |
|-------|------|---------|
| `categories` | string[] | Food, Books, Transport, Entertainment, Fees, Other |
| `baseCurrency` | string | `ZAR` |
| `currencies` | `{code: {symbol, rate}}` | ZAR 1, USD 0.055, EUR 0.051 (manual rates) |
| `activeCurrency` | string | `ZAR` |
| `budgetCap` | number (0 = off) | `0` |
| `darkMode` | boolean | `false` |

### Persistence
`localStorage` keys: `sft:records`, `sft:settings`. JSON import validates that the file is an array, every record has `id, description, amount, category, date`, and `amount` is a non-negative number.

## 4. Validation rules (regex)
| # | Field | Rule |
|---|-------|------|
| 1 | Description | No leading/trailing space, no double spaces |
| 2 | Amount | `0` or no leading zero, up to 2 decimals |
| 3 | Date | `YYYY-MM-DD` shape |
| 4 | Category | Letters, with single spaces or hyphens between words |
| 5 | Advanced | Duplicate consecutive words via back-reference (warning, non-blocking) |

The full pattern catalogue is in the README.

## 5. Architecture
| Module | Responsibility |
|--------|----------------|
| `scripts/app.js` | Entry point, mobile menu toggle |
| `scripts/state.js` | Central state, pub/sub, CRUD, sort/search state, currency and cap settings |
| `scripts/storage.js` | `localStorage` load/save, JSON export/import with validation |
| `scripts/validators.js` | Regex validators |
| `scripts/search.js` | Safe regex compiler, match highlighting, HTML escaping |
| `scripts/ui.js` | Rendering, event wiring, ARIA announcements |

## 6. Views and layout
Views: Dashboard, Records, Add, Settings, About. Mobile-first; breakpoints at 768px and 1024px (plus a 360px tweak). On small screens the records table becomes stacked cards. Wireframes: `assets/wireframes/mobile.svg` and `assets/wireframes/desktop.svg`.

## 7. Accessibility plan
- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), one `h1`, one `h2` per view.
- Skip link as the first focusable element; visible `:focus-visible` outlines.
- Every input has a `<label>`; errors use `role="alert"` and are linked with `aria-describedby`.
- `aria-live="polite"` for status messages; `assertive` only when over budget.
- Sortable headers are focusable, activated with Enter/Space, and expose `aria-sort`.
- Colour contrast targets WCAG AA in both themes; `<mark>` highlights stay readable.
- `prefers-reduced-motion` disables animation and transitions.
- Verification approach is documented in `docs/a11y-audit.md`.

## 8. Milestone map
| Milestone | Deliverable |
|-----------|-------------|
| M1 | This spec, wireframes, data model, a11y plan |
| M2 | `index.html`, `styles/main.css` base layout |
| M3 | `scripts/validators.js`, `tests.html` |
| M4 | Render, sort, regex search (`search.js`, `ui.js`, `app.js`) |
| M5 | Stats, budget cap, ARIA live updates (`state.js`) |
| M6 | Persistence, import/export, settings (`storage.js`, `seed.json`) |
| M7 | Polish, a11y audit, README, demo video |
