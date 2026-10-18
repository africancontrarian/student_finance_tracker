import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

const DEFAULT_SETTINGS = {
    categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'],
    baseCurrency: 'ZAR',
    currencies: {
        ZAR: { symbol: 'R', rate: 1 },
        USD: { symbol: '$', rate: 0.055 },
        EUR: { symbol: '€', rate: 0.051 }
    },
    activeCurrency: 'ZAR',
    budgetCap: 0,
    darkMode: false
};

let state = {
    records: [],
    settings: { ...DEFAULT_SETTINGS },
    currentView: 'dashboard',
    sortField: 'date',
    sortOrder: 'desc',
    searchQuery: '',
    searchCaseSensitive: false,
    editingId: null
};

const listeners = new Set();

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function notify(changeType) {
    listeners.forEach(fn => fn(state, changeType));
}

export function getState() {
    return state;
}

export function getRecords() {
    return state.records;
}

export function getSettings() {
    return state.settings;
}

export function initState() {
    const saved = loadRecords();
    state.records = saved.length > 0 ? saved : [];

    const savedSettings = loadSettings();
    if (savedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
    
        if (!state.settings.currencies) {
            state.settings.currencies = DEFAULT_SETTINGS.currencies;
        }
    }
}

let idCounter = 0;

function generateId() {
    idCounter++;
    const existing = state.records.map(r => {
        const num = parseInt(r.id.replace('txn_', ''), 10);
        return isNaN(num) ? 0 : num;
    });
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    const next = Math.max(idCounter, max + 1);
    idCounter = next;
    return `txn_${String(next).padStart(4, '0')}`;
}

export function addRecord(data) {
    const now = new Date().toISOString();
    const record = {
        id: generateId(),
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        createdAt: now,
        updatedAt: now
    };
    state.records.push(record);
    persist();
    notify('recordAdded');
    return record;
}

export function updateRecord(id, data) {
    const index = state.records.findIndex(r => r.id === id);
    if (index === -1) return null;
    state.records[index] = {
        ...state.records[index],
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        updatedAt: new Date().toISOString()
    };
    persist();
    notify('recordUpdated');
    return state.records[index];
}

export function deleteRecord(id) {
    const index = state.records.findIndex(r => r.id === id);
    if (index === -1) return false;
    state.records.splice(index, 1);
    persist();
    notify('recordDeleted');
    return true;
}

export function setRecords(records) {
    state.records = records;
    persist();
    notify('recordsImported');
}

export function setView(view) {
    state.currentView = view;
    notify('viewChanged');
}

export function setSort(field) {
    if (state.sortField === field) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortField = field;
        state.sortOrder = 'asc';
    }
    notify('sortChanged');
}

export function setSearch(query, caseSensitive = false) {
    state.searchQuery = query;
    state.searchCaseSensitive = caseSensitive;
    notify('searchChanged');
}

export function setEditing(id) {
    state.editingId = id;
    notify('editingChanged');
}

export function updateSettings(partial) {
    state.settings = { ...state.settings, ...partial };
    saveSettings(state.settings);
    notify('settingsChanged');
}

export function updateCurrencyRate(code, rate) {
    if (state.settings.currencies[code]) {
        state.settings.currencies[code].rate = rate;
        saveSettings(state.settings);
        notify('settingsChanged');
    }
}

export function convertAmount(amount, fromCurrency, toCurrency) {
    const currencies = state.settings.currencies;
    if (!currencies[fromCurrency] || !currencies[toCurrency]) return amount;
    const baseAmount = amount / currencies[fromCurrency].rate;
    return baseAmount * currencies[toCurrency].rate;
}

export function formatAmount(amount) {
    const curr = state.settings.currencies[state.settings.activeCurrency];
    if (!curr) return amount.toFixed(2);
    return `${curr.symbol}${amount.toFixed(2)}`;
}

export function getDisplayAmount(amount) {
    const baseCurrency = state.settings.baseCurrency;
    const activeCurrency = state.settings.activeCurrency;
    if (baseCurrency === activeCurrency) return amount;
    return convertAmount(amount, baseCurrency, activeCurrency);
}

function persist() {
    saveRecords(state.records);
}
