# ⚙️ TinyDev Toolkit

A minimal, fully functional browser-based developer utility.  
No backend · No database · No frameworks · No build step.

---

## Features

| Tool | Description |
|------|-------------|
| **JSON Formatter & Validator** | Paste raw JSON → pretty-print it with 2-space indentation; inline validation with helpful error messages |
| **Word & Character Counter** | Live stats: characters, characters (no spaces), words, lines, sentences, estimated reading time |
| **String Case Converter** | 10 conversions: UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, aLtErNaTiNg |
| **Copy to Clipboard** | One-click copy on every output; fallback for restricted environments |

---

## Run Locally

No installation or build step required.

```bash
git clone https://github.com/thelokeshsain/scroll-animation-test.git
cd scroll-animation-test
```

Then open `index.html` directly in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

Or serve it with any static file server (optional):

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

---

## File Structure

```
.
├── index.html   # Single-page app — all three tools
├── style.css    # Dark-theme responsive CSS (no external CSS)
├── script.js    # Vanilla JS — no frameworks, no dependencies
├── README.md    # This file
├── LICENSE      # MIT
└── .gitignore
```

---

## Browser Support

Tested on:
- Chrome / Edge (Chromium) 115+
- Firefox 115+
- Safari 16+

---

## Testing Checklist

- [x] JSON validation — valid objects, arrays, primitives
- [x] JSON validation — malformed JSON (error message shown)
- [x] Character count — empty, single-char, multi-line
- [x] Word count — whitespace edge cases
- [x] All 10 case conversions
- [x] Copy-to-clipboard — success toast shown
- [x] Tab keyboard navigation (arrow keys)
- [x] Responsive layout — 320 px to 1920 px
- [x] No browser console errors
- [x] No broken file references
- [x] Keyboard-accessible buttons and textareas

---

## License

[MIT](LICENSE) © 2024 thelokeshsain
