const RECORDS_KEY = 'sft:records';
const SETTINGS_KEY = 'sft:settings';

export function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.error('Failed to parse stored records');
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    console.error('Failed to parse stored settings');
    return null;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportJSON(records) {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance-records.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const validation = validateImportData(data);
        if (!validation.valid) {
          reject(new Error(validation.message));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function validateImportData(data) {
  if (!Array.isArray(data)) {
    return { valid: false, message: 'Data must be an array of records.' };
  }
  const requiredFields = ['id', 'description', 'amount', 'category', 'date'];
  for (let i = 0; i < data.length; i++) {
    const rec = data[i];
    if (typeof rec !== 'object' || rec === null) {
      return { valid: false, message: `Record at index ${i} is not an object.` };
    }
    for (const field of requiredFields) {
      if (!(field in rec)) {
        return { valid: false, message: `Record at index ${i} is missing field "${field}".` };
      }
    }
    if (typeof rec.amount !== 'number' || rec.amount < 0) {
      return { valid: false, message: `Record at index ${i} has invalid amount.` };
    }
  }
  return { valid: true, message: '' };
}
