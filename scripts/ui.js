import {
    getState, getRecords, getSettings, setView, setSort, setSearch,
    addRecord, updateRecord, deleteRecord, setEditing, setRecords,
    updateSettings, updateCurrencyRate, getDisplayAmount, formatAmount, subscribe
} from './state.js';
import { validateRecord, checkDuplicateWords } from './validators.js';
import { compileRegex, highlight, filterRecords, escapeHTML } from './search.js';
import { exportJSON, importJSON } from './storage.js';

const $ = id => document.getElementById(id);

export function initNav() {
    const navLinks = document.querySelectorAll('[data-view]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            setView(view);
        });
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });
}

function updateNav() {
    const { currentView } = getState();
    document.querySelectorAll('[data-view]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === currentView);
        link.setAttribute('aria-current', link.getAttribute('data-view') === currentView ? 'page' : 'false');
    });
    document.querySelectorAll('.view-section').forEach(section => {
        const isActive = section.id === `view-${currentView}`;
        section.hidden = !isActive;
        section.setAttribute('aria-hidden', !isActive);
    });
}

function renderDashboard() {
    const records = getRecords();
    const settings = getSettings();

    const totalEl = $('stat-total');
    if (totalEl) totalEl.textContent = records.length;

    const totalSpending = records.reduce((sum, r) => sum + r.amount, 0);
    const displayTotal = getDisplayAmount(totalSpending);
    const totalSpendingEl = $('stat-spending');
    if (totalSpendingEl) totalSpendingEl.textContent = formatAmount(displayTotal);

    const catCounts = {};
    records.forEach(r => {
        catCounts[r.category] = (catCounts[r.category] || 0) + r.amount;
    });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    const topCatEl = $('stat-top-category');
    if (topCatEl) topCatEl.textContent = topCat ? `${topCat[0]} (${formatAmount(getDisplayAmount(topCat[1]))})` : 'N/A';

    renderBudgetStatus(totalSpending);

    renderTrendChart(records);
}

function renderBudgetStatus(totalSpending) {
    const settings = getSettings();
    const cap = settings.budgetCap || 0;
    const statusEl = $('budget-status');
    if (!statusEl) return;

    if (cap <= 0) {
        statusEl.textContent = 'No budget cap set.';
        statusEl.setAttribute('aria-live', 'polite');
        statusEl.className = 'budget-status neutral';
        return;
    }

    const displayCap = getDisplayAmount(cap);
    const displaySpent = getDisplayAmount(totalSpending);
    const remaining = cap - totalSpending;
    const displayRemaining = getDisplayAmount(Math.abs(remaining));

    if (remaining >= 0) {
        statusEl.textContent = `${formatAmount(displayRemaining)} remaining of ${formatAmount(displayCap)} budget.`;
        statusEl.setAttribute('aria-live', 'polite');
        statusEl.className = 'budget-status under';
    } else {
        statusEl.textContent = `Over budget by ${formatAmount(displayRemaining)}! Cap: ${formatAmount(displayCap)}.`;
        statusEl.setAttribute('aria-live', 'assertive');
        statusEl.className = 'budget-status over';
    }

    const progressEl = $('budget-progress');
    if (progressEl) {
        const pct = Math.min((totalSpending / cap) * 100, 100);
        progressEl.style.width = `${pct}%`;
        progressEl.className = `budget-progress-bar ${remaining < 0 ? 'over' : pct > 75 ? 'warn' : 'ok'}`;
        progressEl.setAttribute('aria-valuenow', Math.round(pct));
        progressEl.setAttribute('aria-label', `Budget usage: ${Math.round(pct)}%`);
    }
}

function renderTrendChart(records) {
    const chartEl = $('trend-chart');
    if (!chartEl) return;

    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }

    const dailyTotals = days.map(day => {
        return records
            .filter(r => r.date === day)
            .reduce((sum, r) => sum + r.amount, 0);
    });

    const max = Math.max(...dailyTotals, 1);

    chartEl.innerHTML = `
    <div class="chart-container" role="img" aria-label="Spending trend over last 7 days">
      ${days.map((day, i) => {
        const height = (dailyTotals[i] / max) * 100;
        const label = new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
        const amt = formatAmount(getDisplayAmount(dailyTotals[i]));
        return `
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: ${Math.max(height, 2)}%"
                 title="${amt} on ${day}" aria-label="${amt} on ${label}">
            </div>
            <span class="chart-label">${label}</span>
          </div>`;
    }).join('')}
    </div>`;
}

function renderRecords() {
    const state = getState();
    let records = [...getRecords()];
    const searchRegex = compileRegex(state.searchQuery, state.searchCaseSensitive ? '' : 'i');

    if (searchRegex) {
        records = filterRecords(records, searchRegex, ['description', 'category', 'date']);
    }

    records.sort((a, b) => {
        let cmp = 0;
        switch (state.sortField) {
            case 'date':
                cmp = a.date.localeCompare(b.date);
                break;
            case 'description':
                cmp = a.description.localeCompare(b.description);
                break;
            case 'amount':
                cmp = a.amount - b.amount;
                break;
            case 'category':
                cmp = a.category.localeCompare(b.category);
                break;
            default:
                cmp = 0;
        }
        return state.sortOrder === 'asc' ? cmp : -cmp;
    });

    const searchStatus = $('search-status');
    if (searchStatus) {
        if (state.searchQuery) {
            if (searchRegex) {
                searchStatus.textContent = `${records.length} record(s) match your search.`;
            } else {
                searchStatus.textContent = 'Invalid regex pattern.';
            }
        } else {
            searchStatus.textContent = '';
        }
    }

    const tbody = $('records-tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-message">No records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(rec => {
        const isEditing = state.editingId === rec.id;
        const displayAmt = getDisplayAmount(rec.amount);
        const descHTML = highlight(rec.description, searchRegex);
        const catHTML = highlight(rec.category, searchRegex);
        const dateHTML = highlight(rec.date, searchRegex);
        const settings = getSettings();

        if (isEditing) {
            return `
        <tr class="editing-row" data-id="${rec.id}">
          <td><input type="text" class="edit-desc" value="${escapeHTML(rec.description)}" aria-label="Edit description"></td>
          <td><input type="number" class="edit-amount" value="${rec.amount}" step="0.01" min="0" aria-label="Edit amount"></td>
          <td>
            <select class="edit-category" aria-label="Edit category">
              ${settings.categories.map(c => `<option value="${escapeHTML(c)}" ${c === rec.category ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
            </select>
          </td>
          <td><input type="date" class="edit-date" value="${rec.date}" aria-label="Edit date"></td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-save" data-id="${rec.id}" aria-label="Save changes">Save</button>
            <button class="btn btn-sm btn-cancel" data-id="${rec.id}" aria-label="Cancel editing">Cancel</button>
          </td>
        </tr>`;
        }

        return `
      <tr data-id="${rec.id}">
        <td data-label="Description">${descHTML}</td>
        <td data-label="Amount">${formatAmount(displayAmt)}</td>
        <td data-label="Category">${catHTML}</td>
        <td data-label="Date">${dateHTML}</td>
        <td data-label="Actions" class="actions-cell">
          <button class="btn btn-sm btn-edit" data-id="${rec.id}" aria-label="Edit ${escapeHTML(rec.description)}">Edit</button>
          <button class="btn btn-sm btn-delete" data-id="${rec.id}" aria-label="Delete ${escapeHTML(rec.description)}">Delete</button>
        </td>
      </tr>`;
    }).join('');

    bindTableActions();
}

function bindTableActions() {

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => setEditing(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const rec = getRecords().find(r => r.id === btn.dataset.id);
            if (rec && confirm(`Delete "${rec.description}"? This cannot be undone.`)) {
                deleteRecord(btn.dataset.id);
                announceStatus(`Record "${rec.description}" deleted.`);
            }
        });
    });

    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', () => saveInlineEdit(btn.dataset.id));
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => setEditing(null));
    });
}

function saveInlineEdit(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    const data = {
        description: row.querySelector('.edit-desc').value,
        amount: row.querySelector('.edit-amount').value,
        category: row.querySelector('.edit-category').value,
        date: row.querySelector('.edit-date').value
    };

    const validation = validateRecord(data);
    if (!validation.valid) {
        const msgs = Object.values(validation.errors).join(' ');
        announceStatus(`Validation error: ${msgs}`);
        return;
    }

    if (validation.warning && validation.warning.hasDuplicate) {
        announceStatus(validation.warning.message);
    }

    updateRecord(id, data);
    setEditing(null);
    announceStatus('Record updated successfully.');
}

export function initSortHeaders() {
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            setSort(header.dataset.sort);
        });
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSort(header.dataset.sort);
            }
        });
    });
}

function updateSortIndicators() {
    const { sortField, sortOrder } = getState();
    document.querySelectorAll('[data-sort]').forEach(header => {
        const isActive = header.dataset.sort === sortField;
        header.classList.toggle('sort-active', isActive);
        header.setAttribute('aria-sort', isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none');
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = isActive ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '';
        }
    });
}

export function initSearch() {
    const input = $('search-input');
    const toggle = $('search-case-toggle');
    if (!input) return;

    input.addEventListener('input', () => {
        const caseSensitive = toggle ? toggle.checked : false;
        setSearch(input.value, caseSensitive);
    });

    if (toggle) {
        toggle.addEventListener('change', () => {
            setSearch(input.value, toggle.checked);
        });
    }
}

export function initForm() {
    const form = $('add-record-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFormErrors();

        const data = {
            description: $('form-description').value,
            amount: $('form-amount').value,
            category: $('form-category').value,
            date: $('form-date').value
        };

        const validation = validateRecord(data);

        if (!validation.valid) {
            showFormErrors(validation.errors);
            return;
        }

        if (validation.warning && validation.warning.hasDuplicate) {
            const warnEl = $('form-description-error');
            if (warnEl) {
                warnEl.textContent = validation.warning.message;
                warnEl.classList.add('warning');
            }
        }

        addRecord(data);
        form.reset();
        setTodayDate();
        announceStatus('Record added successfully!');
        setView('records');
    });
}

function showFormErrors(errors) {
    let firstErrorField = null;
    for (const [field, msg] of Object.entries(errors)) {
        const el = $(`form-${field}-error`);
        if (el) {
            el.textContent = msg;
            el.classList.add('visible');
        }
        if (!firstErrorField) firstErrorField = $(`form-${field}`);
    }
    if (firstErrorField) firstErrorField.focus();
    announceStatus('Please fix the validation errors.');
}

function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible', 'warning');
    });
}

function setTodayDate() {
    const dateInput = $('form-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }
}

function populateCategories() {
    const settings = getSettings();
    const selects = document.querySelectorAll('.category-select');
    selects.forEach(select => {
        const current = select.value;
        select.innerHTML = settings.categories.map(c =>
            `<option value="${escapeHTML(c)}" ${c === current ? 'selected' : ''}>${escapeHTML(c)}</option>`
        ).join('');
    });
}

export function initSettings() {
    // Currency rate inputs
    const settings = getSettings();

    const currSelect = $('settings-active-currency');
    if (currSelect) {
        currSelect.innerHTML = Object.keys(settings.currencies).map(code =>
            `<option value="${code}" ${code === settings.activeCurrency ? 'selected' : ''}>${code}</option>`
        ).join('');
        currSelect.addEventListener('change', () => {
            updateSettings({ activeCurrency: currSelect.value });
        });
    }

    renderCurrencyRates();

    const capInput = $('settings-budget-cap');
    if (capInput) {
        capInput.value = settings.budgetCap || '';
        capInput.addEventListener('change', () => {
            const val = parseFloat(capInput.value) || 0;
            updateSettings({ budgetCap: val });
        });
    }

    renderCategoryEditor();

    const darkToggle = $('settings-dark-mode');
    if (darkToggle) {
        darkToggle.checked = settings.darkMode;
        darkToggle.addEventListener('change', () => {
            updateSettings({ darkMode: darkToggle.checked });
            applyDarkMode(darkToggle.checked);
        });
        applyDarkMode(settings.darkMode);
    }

    const exportBtn = $('btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportJSON(getRecords());
            announceStatus('Records exported successfully.');
        });
    }

    const importBtn = $('btn-import');
    const importFile = $('import-file');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', async () => {
            if (!importFile.files[0]) return;
            try {
                const data = await importJSON(importFile.files[0]);
                if (confirm(`Import ${data.length} records? This will replace all existing data.`)) {
                    setRecords(data);
                    announceStatus(`${data.length} records imported successfully.`);
                }
            } catch (err) {
                announceStatus(`Import error: ${err.message}`);
            }
            importFile.value = '';
        });
    }

    const seedBtn = $('btn-load-seed');
    if (seedBtn) {
        seedBtn.addEventListener('click', async () => {
            try {
                const resp = await fetch('seed.json');
                const data = await resp.json();
                if (confirm(`Load ${data.length} seed records? This will replace all existing data.`)) {
                    setRecords(data);
                    announceStatus(`${data.length} seed records loaded.`);
                }
            } catch (err) {
                announceStatus(`Failed to load seed data: ${err.message}`);
            }
        });
    }
}

function renderCurrencyRates() {
    const container = $('currency-rates');
    if (!container) return;
    const settings = getSettings();
    const currencies = settings.currencies;

    container.innerHTML = Object.entries(currencies).map(([code, data]) => `
    <div class="currency-rate-row">
      <label for="rate-${code}">${code} (${data.symbol})</label>
      <input type="number" id="rate-${code}" value="${data.rate}" step="0.001" min="0"
             ${code === settings.baseCurrency ? 'disabled' : ''}
             aria-label="${code} exchange rate">
    </div>
  `).join('');

    Object.keys(currencies).forEach(code => {
        const input = $(`rate-${code}`);
        if (input && code !== settings.baseCurrency) {
            input.addEventListener('change', () => {
                const rate = parseFloat(input.value) || 0;
                updateCurrencyRate(code, rate);
                announceStatus(`${code} rate updated to ${rate}.`);
            });
        }
    });
}

function renderCategoryEditor() {
    const container = $('category-editor');
    if (!container) return;
    const settings = getSettings();

    container.innerHTML = `
    <ul class="category-list" role="list">
      ${settings.categories.map((cat, i) => `
        <li class="category-item">
          <span>${escapeHTML(cat)}</span>
          <button class="btn btn-xs btn-delete-cat" data-index="${i}" aria-label="Remove category ${escapeHTML(cat)}">✕</button>
        </li>
      `).join('')}
    </ul>
    <div class="category-add">
      <input type="text" id="new-category-input" placeholder="New category..." aria-label="New category name">
      <button class="btn btn-sm btn-add-cat" id="btn-add-category">Add</button>
    </div>
  `;

    container.querySelectorAll('.btn-delete-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            const cats = [...settings.categories];
            cats.splice(parseInt(btn.dataset.index), 1);
            updateSettings({ categories: cats });
            renderCategoryEditor();
            populateCategories();
        });
    });

    const addBtn = $('btn-add-category');
    const addInput = $('new-category-input');
    if (addBtn && addInput) {
        const doAdd = () => {
            const val = addInput.value.trim();
            if (!val) return;
            const cats = [...settings.categories, val];
            updateSettings({ categories: cats });
            renderCategoryEditor();
            populateCategories();
            announceStatus(`Category "${val}" added.`);
        };
        addBtn.addEventListener('click', doAdd);
        addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
        });
    }
}

function applyDarkMode(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function announceStatus(message) {
    const el = $('status-announcer');
    if (el) {
        el.textContent = '';
  
        requestAnimationFrame(() => {
            el.textContent = message;
        });
    }
}

export function render() {
    updateNav();
    renderDashboard();
    renderRecords();
    updateSortIndicators();
    populateCategories();
}

export function initUI() {
    initNav();
    initSortHeaders();
    initSearch();
    initForm();
    initSettings();
    setTodayDate();

    subscribe((state, changeType) => {
        render();
    });

    render();
}
