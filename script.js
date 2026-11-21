/**
 * TinyDev Toolkit — script.js
 * Vanilla JS, no frameworks, no dependencies.
 * Features: JSON formatter/validator, word/character counter,
 *           string case converter, copy-to-clipboard, tab navigation.
 */

'use strict';

/* ── Utility: Toast notification ── */
const toast = (() => {
  const el = document.getElementById('toast');
  let timer = null;

  return function showToast(message, type = 'success', duration = 2500) {
    if (timer) clearTimeout(timer);
    el.textContent = message;
    el.className = `toast show ${type}`;
    timer = setTimeout(() => {
      el.className = 'toast';
    }, duration);
  };
})();

/* ── Utility: Copy to clipboard ── */
async function copyToClipboard(text, label = 'Text') {
  if (!text.trim()) {
    toast(`${label} is empty — nothing to copy.`, 'fail');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(`✓ ${label} copied to clipboard!`, 'success');
  } catch {
    // Fallback for older/restricted environments
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      toast(`✓ ${label} copied (fallback)!`, 'success');
    } else {
      toast('Copy failed — please copy manually.', 'fail');
    }
  }
}

/* ── Utility: Set status bar ── */
function setStatus(el, message, type /* 'ok' | 'error' | 'empty' */ ) {
  el.textContent = message;
  el.className = `status-bar ${type}`;
}

/* ========================================================
   TAB NAVIGATION
   ======================================================== */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  btn.addEventListener('keydown', e => {
    // Arrow-key navigation between tabs (ARIA pattern)
    const tabs = [...tabBtns];
    const idx  = tabs.indexOf(btn);
    if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx + 1) % tabs.length].focus(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); }
    if (e.key === 'Home')       { e.preventDefault(); tabs[0].focus(); }
    if (e.key === 'End')        { e.preventDefault(); tabs[tabs.length - 1].focus(); }
  });
});

function activateTab(tabId) {
  tabBtns.forEach(b => {
    const active = b.dataset.tab === tabId;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  tabPanels.forEach(p => {
    const active = p.id === `panel-${tabId}`;
    p.classList.toggle('active', active);
    p.hidden = !active;
  });
}

/* ========================================================
   JSON FORMATTER & VALIDATOR
   ======================================================== */
const jsonInput     = document.getElementById('json-input');
const jsonOutput    = document.getElementById('json-output');
const jsonStatus    = document.getElementById('json-status');
const jsonFormatBtn = document.getElementById('json-format-btn');
const jsonClearBtn  = document.getElementById('json-clear-btn');
const jsonCopyBtn   = document.getElementById('json-copy-btn');

jsonFormatBtn.addEventListener('click', formatJSON);
jsonClearBtn.addEventListener('click', () => {
  jsonInput.value  = '';
  jsonOutput.value = '';
  setStatus(jsonStatus, '', 'empty');
  jsonInput.focus();
});
jsonCopyBtn.addEventListener('click', () => copyToClipboard(jsonOutput.value, 'Formatted JSON'));

// Format on Ctrl+Enter / Cmd+Enter inside the input
jsonInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); formatJSON(); }
});

function formatJSON() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    setStatus(jsonStatus, 'ℹ Input is empty.', 'empty');
    jsonOutput.value = '';
    return;
  }
  try {
    const parsed    = JSON.parse(raw);
    jsonOutput.value = JSON.stringify(parsed, null, 2);
    const type       = Array.isArray(parsed) ? 'array' : typeof parsed;
    const keyCount   = (type === 'object' && parsed !== null)
      ? ` · ${Object.keys(parsed).length} key(s)`
      : '';
    setStatus(jsonStatus, `✓ Valid JSON — ${type}${keyCount}`, 'ok');
  } catch (err) {
    jsonOutput.value = '';
    // Extract line/column info from error message when available
    setStatus(jsonStatus, `✗ Invalid JSON — ${err.message}`, 'error');
  }
}

/* ========================================================
   WORD / CHARACTER COUNTER
   ======================================================== */
const textInput    = document.getElementById('text-input');
const statChars    = document.getElementById('stat-chars');
const statCharsNS  = document.getElementById('stat-chars-ns');
const statWords    = document.getElementById('stat-words');
const statLines    = document.getElementById('stat-lines');
const statSentences= document.getElementById('stat-sentences');
const statRead     = document.getElementById('stat-read');
const textCopyBtn  = document.getElementById('text-copy-btn');
const textClearBtn = document.getElementById('text-clear-btn');

textInput.addEventListener('input', updateStats);
textCopyBtn.addEventListener('click', () => copyToClipboard(textInput.value, 'Text'));
textClearBtn.addEventListener('click', () => { textInput.value = ''; updateStats(); textInput.focus(); });

function updateStats() {
  const text = textInput.value;

  const chars      = text.length;
  const charsNoSp  = text.replace(/\s/g, '').length;
  const words      = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const lines      = text === '' ? 0 : text.split('\n').length;
  // Sentences: end with . ! ? optionally followed by quotes/parens
  const sentences  = text.trim() === '' ? 0
    : (text.match(/[.!?][)'"»\s]|[.!?]$/g) || []).length;
  const readSec    = Math.round((words / 200) * 60);
  const readLabel  = readSec < 60
    ? `${readSec} sec`
    : `${Math.floor(readSec / 60)}m ${readSec % 60}s`;

  statChars.textContent    = chars.toLocaleString();
  statCharsNS.textContent  = charsNoSp.toLocaleString();
  statWords.textContent    = words.toLocaleString();
  statLines.textContent    = lines.toLocaleString();
  statSentences.textContent= sentences.toLocaleString();
  statRead.textContent     = readLabel;
}

/* ========================================================
   CASE CONVERTER
   ======================================================== */
const caseInput  = document.getElementById('case-input');
const caseOutput = document.getElementById('case-output');
const caseStatus = document.getElementById('case-status');
const caseCopyBtn  = document.getElementById('case-copy-btn');
const caseClearBtn = document.getElementById('case-clear-btn');

caseCopyBtn.addEventListener('click',  () => copyToClipboard(caseOutput.value, 'Converted text'));
caseClearBtn.addEventListener('click', () => {
  caseInput.value = caseOutput.value = '';
  setStatus(caseStatus, '', 'empty');
  caseInput.focus();
});

document.querySelectorAll('[data-case]').forEach(btn => {
  btn.addEventListener('click', () => applyCase(btn.dataset.case));
});

function applyCase(caseType) {
  const text = caseInput.value;
  if (!text.trim()) {
    setStatus(caseStatus, 'ℹ Input is empty.', 'empty');
    return;
  }
  caseOutput.value = convertCase(text, caseType);
  setStatus(caseStatus, `✓ Converted to ${caseType}`, 'ok');
}

function convertCase(text, type) {
  // Tokenise by splitting on common delimiters (spaces, hyphens, underscores)
  const words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // split camelCase / PascalCase
    .split(/[\s_\-]+/)
    .filter(Boolean);

  switch (type) {
    case 'upper':
      return text.toUpperCase();

    case 'lower':
      return text.toLowerCase();

    case 'title':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    case 'sentence': {
      const lower = text.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    case 'camel':
      return words
        .map((w, i) => i === 0
          ? w.toLowerCase()
          : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');

    case 'pascal':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

    case 'snake':
      return words.map(w => w.toLowerCase()).join('_');

    case 'kebab':
      return words.map(w => w.toLowerCase()).join('-');

    case 'constant':
      return words.map(w => w.toUpperCase()).join('_');

    case 'alternating':
      return text.split('').map((c, i) =>
        i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
      ).join('');

    default:
      return text;
  }
}
