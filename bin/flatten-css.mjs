// Removes every `@layer` wrapper from a generated stylesheet, keeping the inner
// rules in source order so the output is fully unlayered. The Plex /watch iframe
// has unlayered element resets that would otherwise beat Tailwind v4's layered
// utilities.
//
// Usage: node bin/flatten-css.mjs <cssFile>

import { readFileSync, writeFileSync } from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node bin/flatten-css.mjs <cssFile>');
  process.exit(1);
}

const css = readFileSync(file, 'utf8');

let out = '';
let i = 0;
const len = css.length;
// Stack entry === true when the matching `}` closes an `@layer { }` block we removed.
const layerBraceStack = [];

while (i < len) {
  const ch = css[i];

  // Preserve string literals verbatim so braces inside `content: "…"` are ignored.
  if (ch === '"' || ch === "'") {
    const quote = ch;
    out += ch;
    i++;
    while (i < len) {
      out += css[i];
      if (css[i] === '\\') {
        out += css[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (css[i] === quote) {
        i++;
        break;
      }
      i++;
    }
    continue;
  }

  if (ch === '@' && css.startsWith('@layer', i)) {
    // Find the end of the at-rule prelude: either `;` (statement) or `{` (block).
    let j = i + '@layer'.length;
    while (j < len && css[j] !== ';' && css[j] !== '{') j++;
    if (css[j] === ';') {
      // `@layer a, b;` declaration — drop it entirely (including trailing newline).
      i = j + 1;
      if (css[i] === '\n') i++;
      continue;
    }
    if (css[j] === '{') {
      // `@layer name {` block — drop the wrapper, keep its contents unlayered.
      layerBraceStack.push(true);
      i = j + 1;
      if (css[i] === '\n') i++;
      continue;
    }
  }

  if (ch === '{') {
    layerBraceStack.push(false);
    out += ch;
    i++;
    continue;
  }

  if (ch === '}') {
    const wasLayer = layerBraceStack.pop();
    if (wasLayer) {
      // Skip the closing brace of a removed layer wrapper.
      i++;
      if (css[i] === '\n') i++;
      continue;
    }
    out += ch;
    i++;
    continue;
  }

  out += ch;
  i++;
}

writeFileSync(file, out);
