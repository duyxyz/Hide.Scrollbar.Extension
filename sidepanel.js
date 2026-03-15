const textarea = document.getElementById('whitelistTextarea');
const saveStatus = document.getElementById('saveStatus');

const sanitizeDomain = (raw) =>
  raw.trim().toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '');

const save = () => {
  const domains = textarea.value.split('\n')
    .map(sanitizeDomain).filter(d => d);
  const unique = [...new Set(domains)].sort();
  chrome.storage.sync.set({ whitelist: unique }, () => {
    if (chrome.runtime.lastError) {
      saveStatus.textContent = chrome.i18n.getMessage("error") || 'Error';
      return;
    }
    saveStatus.textContent = chrome.i18n.getMessage("saved") || 'Saved';
    setTimeout(() => saveStatus.textContent = '', 1500);
  });
};

// Load
chrome.storage.sync.get({ whitelist: [] }, (data) => {
  if (!chrome.runtime.lastError) {
    textarea.value = data.whitelist.join('\n');
  }
});

// Save on input
let t;
textarea.addEventListener('input', () => {
  saveStatus.textContent = chrome.i18n.getMessage("saving") || 'Saving...';
  clearTimeout(t);
  t = setTimeout(save, 500);
});

// Init Localization
document.querySelectorAll('[data-i18n]').forEach((el) => {
  const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
  if (msg) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.placeholder = msg;
    } else {
      el.textContent = msg;
    }
  }
});
