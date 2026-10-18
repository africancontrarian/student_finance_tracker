// Pure helpers for month-scoped budgeting. No DOM or storage access, so they are easy to test.

function pad(n) {
    return String(n).padStart(2, '0');
}

/** Local calendar date as YYYY-MM-DD (avoids the UTC off-by-one of toISOString). */
export function localDateString(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local calendar month as YYYY-MM. */
export function monthKey(date = new Date()) {
    return localDateString(date).slice(0, 7);
}

/** Sum of amounts for records whose date falls in the given YYYY-MM month. */
export function sumForMonth(records, key = monthKey()) {
    return records
        .filter(r => typeof r.date === 'string' && r.date.startsWith(key))
        .reduce((sum, r) => sum + r.amount, 0);
}
