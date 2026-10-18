const DESCRIPTION_RE = /^\S(?:.*\S)?$/;
const DOUBLE_SPACE_RE = /  /;

export function validateDescription(value) {
    if (!value || value.trim().length === 0) {
        return { valid: false, message: 'Description is required.' };
    }
    if (!DESCRIPTION_RE.test(value)) {
        return { valid: false, message: 'Description must not have leading or trailing spaces.' };
    }
    if (DOUBLE_SPACE_RE.test(value)) {
        return { valid: false, message: 'Description must not contain double spaces.' };
    }
    return { valid: true, message: '' };
}

const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export function validateAmount(value) {
    const str = String(value).trim();
    if (!str) {
        return { valid: false, message: 'Amount is required.' };
    }
    if (!AMOUNT_RE.test(str)) {
        return { valid: false, message: 'Enter a valid amount (e.g., 12.50, 0, 100).' };
    }
    return { valid: true, message: '' };
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// The regex checks the shape only; this rejects impossible dates such as 2026-02-31.
function isRealCalendarDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateDate(value) {
    const str = String(value).trim();
    if (!str) {
        return { valid: false, message: 'Date is required.' };
    }
    if (!DATE_RE.test(str)) {
        return { valid: false, message: 'Date must be YYYY-MM-DD (e.g., 2026-10-14).' };
    }
    if (!isRealCalendarDate(str)) {
        return { valid: false, message: 'That date does not exist in the calendar.' };
    }
    return { valid: true, message: '' };
}

const CATEGORY_RE = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

export function validateCategory(value) {
    const str = String(value);
    if (!str.trim()) {
        return { valid: false, message: 'Category is required.' };
    }
    if (str !== str.trim()) {
        return { valid: false, message: 'Category must not have leading or trailing spaces.' };
    }
    if (!CATEGORY_RE.test(str)) {
        return { valid: false, message: 'Category may only contain letters, spaces, and hyphens.' };
    }
    return { valid: true, message: '' };
}

const DUPLICATE_WORD_RE = /\b(\w+)\s+\1\b/i;

export function checkDuplicateWords(value) {
    if (DUPLICATE_WORD_RE.test(value)) {
        return { hasDuplicate: true, message: 'Warning: duplicate consecutive words detected (e.g., "the the").' };
    }
    return { hasDuplicate: false, message: '' };
}

export function validateRecord(record) {
    const errors = {};

    const desc = validateDescription(record.description);
    if (!desc.valid) errors.description = desc.message;

    const amt = validateAmount(record.amount);
    if (!amt.valid) errors.amount = amt.message;

    const dt = validateDate(record.date);
    if (!dt.valid) errors.date = dt.message;

    const cat = validateCategory(record.category);
    if (!cat.valid) errors.category = cat.message;

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        warning: desc.valid ? checkDuplicateWords(record.description) : null
    };
}

export const PATTERNS = {
    DESCRIPTION_RE,
    DOUBLE_SPACE_RE,
    AMOUNT_RE,
    DATE_RE,
    CATEGORY_RE,
    DUPLICATE_WORD_RE
};
