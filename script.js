/**
 * TinyDev Toolkit — script.js
 * Vanilla JS, no frameworks, no dependencies.
 *
 * Features: JSON formatter/validator, word/character counter,
 *           string case converter, copy-to-clipboard, tab navigation.
 *
 * Accessibility & Performance improvements (collaborative):
 *   thelokeshsain : tab keyboard navigation (ARIA), panel animate-in
 *                   class management, Alt+1/2/3 global shortcuts,
 *                   prefers-reduced-motion awareness in JS
 *   soft5-ops     : debounced word-counter input handler (prevents
 *                   excessive DOM thrashing on fast typing), debounced
 *                   screen-reader live region announcements,
 *                   keyboard shortcut hint dismissal, observer-safe
 *                   cleanup pattern for future IntersectionObserver use
 */

'use strict';

/* ================================================================
   UTILITY — prefers-reduced-motion detection
   Checked once; re-evaluated on change via MediaQueryList listener.
   ================================================================ */
let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener('change', e => { prefersReducedMotion = e.matches; });

/* ================================================================
   UTILITY — debounce
   Contributed by: soft5-ops
   Prevents excessive function calls during rapid user input,
   reducing unnecessary DOM updates and improving performance
   on low-end and mobile devices.
   ================================================================ */
function debounce(fn, wait) {
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

/* ================================================================
   UTILITY — Toast notification
   ================================================================ */
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

/* ================================================================
   UTILITY — Copy to clipboard
   ================================================================ */
async function copyToClipboard(text, label = 'Text') {
  if (!text.trim()) {
    toast(`${label} is empty — nothing to copy.`, 'fail');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(`✓ ${label} copied to clipboard!`, 'success');
  } catch {
    // Fallback for older/restricted environments (e.g., HTTP contexts)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';
    document.body.appendChild(ta);
    ta.focus();
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

/* ================================================================
   UTILITY — Set status bar state
   ================================================================ */
function setStatus(el, message, type /* 'ok' | 'error' | 'empty' */) {
  el.textContent = message;
  el.className = `status-bar ${type}`;
}

/* ================================================================
   UTILITY — Animate panel in
   Applies the animate-in CSS class then removes it once done,
   so re-triggering works correctly.
   Skips animation entirely when prefers-reduced-motion is active.
   Contributed by: thelokeshsain
   ================================================================ */
function animatePanelIn(panel) {
  if (prefersReducedMotion) return;
  panel.classList.remove('animate-in');
  // Force reflow so removing and re-adding the class restarts the animation
  void panel.offsetWidth;
  panel.classList.add('animate-in');

  panel.addEventListener('animationend', () => {
    panel.classList.remove('animate-in');
  }, { once: true });
}

/* ================================================================
   TAB NAVIGATION
   ARIA tablist pattern: arrow keys, Home/End, Enter/Space.
   Alt+1 / Alt+2 / Alt+3 as global keyboard shortcuts.
   Contributed by: thelokeshsain
   ================================================================ */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));

  btn.addEventListener('keydown', e => {
    const tabs = [...tabBtns];
    const idx  = tabs.indexOf(btn);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length].focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length].focus();
    }
    if (e.key === 'Home') { e.preventDefault(); tabs[0].focus(); }
    if (e.key === 'End')  { e.preventDefault(); tabs[tabs.length - 1].focus(); }

    // Activate on Enter or Space (some assistive technologies send Space for buttons)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateTab(btn.dataset.tab);
    }
  });
});

// Global Alt+1/2/3 shortcuts to switch tabs
document.addEventListener('keydown', e => {
  if (!e.altKey) return;
  const tabOrder = ['json', 'text', 'case'];
  const idx = parseInt(e.key, 10) - 1;
  if (idx >= 0 && idx < tabOrder.length) {
    e.preventDefault();
    activateTab(tabOrder[idx]);
    tabBtns[idx].focus();
  }
});

function activateTab(tabId) {
  tabBtns.forEach(b => {
    const active = b.dataset.tab === tabId;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
    // tabindex -1 on inactive tabs (roving tabindex pattern)
    b.tabIndex = active ? 0 : -1;
  });

  tabPanels.forEach(p => {
    const active = p.id === `panel-${tabId}`;
    p.hidden = !active;
    if (active) animatePanelIn(p);
  });
}

// Initialise roving tabindex on load
tabBtns.forEach((b, i) => { b.tabIndex = i === 0 ? 0 : -1; });

/* ================================================================
   JSON FORMATTER & VALIDATOR
   ================================================================ */
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

// Ctrl+Enter / Cmd+Enter keyboard shortcut
jsonInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    formatJSON();
  }
});

function formatJSON() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    setStatus(jsonStatus, 'ℹ Input is empty.', 'empty');
    jsonOutput.value = '';
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    jsonOutput.value = JSON.stringify(parsed, null, 2);
    const type     = Array.isArray(parsed) ? 'array' : typeof parsed;
    const keyCount = (type === 'object' && parsed !== null)
      ? ` · ${Object.keys(parsed).length} key(s)`
      : '';
    setStatus(jsonStatus, `✓ Valid JSON — ${type}${keyCount}`, 'ok');
  } catch (err) {
    jsonOutput.value = '';
    setStatus(jsonStatus, `✗ Invalid JSON — ${err.message}`, 'error');
  }
}

/* ================================================================
   WORD / CHARACTER COUNTER
   Improvement by soft5-ops:
     - Debounced input handler (100 ms) to avoid blocking the main
       thread on every keystroke during rapid input.
     - Separate debounced screen-reader announcement (800 ms) so
       assistive technologies are not flooded with updates.
   ================================================================ */
const textInput     = document.getElementById('text-input');
const statChars     = document.getElementById('stat-chars');
const statCharsNS   = document.getElementById('stat-chars-ns');
const statWords     = document.getElementById('stat-words');
const statLines     = document.getElementById('stat-lines');
const statSentences = document.getElementById('stat-sentences');
const statRead      = document.getElementById('stat-read');
const textLiveRegion = document.getElementById('text-live-region');
const textCopyBtn   = document.getElementById('text-copy-btn');
const textClearBtn  = document.getElementById('text-clear-btn');

// Debounced stat update — 100 ms keeps the UI feeling live without flooding
const debouncedUpdateStats = debounce(updateStats, 100);

// Debounced screen-reader announcement — 800 ms avoids overwhelming AT users
const debouncedAnnounce = debounce(announceStats, 800);

textInput.addEventListener('input', () => {
  debouncedUpdateStats();
  debouncedAnnounce();
});

textCopyBtn.addEventListener('click', () => copyToClipboard(textInput.value, 'Text'));
textClearBtn.addEventListener('click', () => {
  textInput.value = '';
  updateStats();
  textLiveRegion.textContent = 'Text cleared.';
  textInput.focus();
});

function updateStats() {
  const text = textInput.value;

  const chars      = text.length;
  const charsNoSp  = text.replace(/\s/g, '').length;
  const words      = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const lines      = text === '' ? 0 : text.split('\n').length;
  const sentences  = text.trim() === '' ? 0
    : (text.match(/[.!?][)'"»\s]|[.!?]$/g) || []).length;
  const readSec    = Math.round((words / 200) * 60);
  const readLabel  = readSec < 60
    ? `${readSec} sec`
    : `${Math.floor(readSec / 60)}m ${readSec % 60}s`;

  statChars.textContent     = chars.toLocaleString();
  statCharsNS.textContent   = charsNoSp.toLocaleString();
  statWords.textContent     = words.toLocaleString();
  statLines.textContent     = lines.toLocaleString();
  statSentences.textContent = sentences.toLocaleString();
  statRead.textContent      = readLabel;
}

function announceStats() {
  const words = statWords.textContent;
  const chars = statChars.textContent;
  textLiveRegion.textContent = `${words} words, ${chars} characters.`;
}

/* ================================================================
   CASE CONVERTER
   ================================================================ */
const caseInput    = document.getElementById('case-input');
const caseOutput   = document.getElementById('case-output');
const caseStatus   = document.getElementById('case-status');
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
  // Tokenise on spaces, hyphens, underscores, and camelCase boundaries
  const words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_\-]+/)
    .filter(Boolean);

  switch (type) {
    case 'upper':     return text.toUpperCase();
    case 'lower':     return text.toLowerCase();
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
