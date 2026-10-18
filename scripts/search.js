export function compileRegex(input, flags = 'i') {
    if (!input || !input.trim()) return null;
    try {
        return new RegExp(input, flags);
    } catch {
        return null;
    }
}

export function highlight(text, re) {
    if (!re || !text) return escapeHTML(text || '');

    const safe = escapeHTML(text);
    return safe.replace(re, match => `<mark>${match}</mark>`);
}

export function filterRecords(records, regex, fields = ['description', 'category']) {
    if (!regex) return records;
    return records.filter(rec =>
        fields.some(field => {
            const value = String(rec[field] ?? '');
            return regex.test(value);
        })
    );
}

export function escapeHTML(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}
