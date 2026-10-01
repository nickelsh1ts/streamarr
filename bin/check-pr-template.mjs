#!/usr/bin/env node
/**
 * Validate that a pull request body follows .github/PULL_REQUEST_TEMPLATE.md.
 * Usage: node bin/check-pr-template.mjs <body-file>
 * Prints a JSON array of problems and exits 1 when any are found.
 */
import { readFileSync } from 'node:fs';

const bodyFile = process.argv[2];

if (!bodyFile) {
  console.error('Usage: node bin/check-pr-template.mjs <body-file>');
  process.exit(2);
}

const body = readFileSync(bodyFile, 'utf8').replace(/\r\n/g, '\n');
const issues = [];

const stripComments = (s) => {
  let previous;
  do {
    previous = s;
    s = s.replace(/<!--[\s\S]*?-->/g, '');
  } while (s !== previous);
  return s;
};

const FIXES_PLACEHOLDER = /-\s*Fixes\s*`?#x{3,4}`?/i;

const section = (heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(
    new RegExp(
      `^##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`,
      'm'
    )
  );
  return match ? stripComments(match[1]) : null;
};

const description = section('Description');
if (!description?.replace(FIXES_PLACEHOLDER, '').trim()) {
  issues.push(
    '**Description** section is missing, empty, or only contains placeholder text.'
  );
}

if (!section('Has This Been Tested?')?.trim()) {
  issues.push('**Has This Been Tested?** section is missing or empty.');
}

const checklist = section('Checklist:') ?? '';
const totalBoxes = (checklist.match(/^\s*- \[[ x]\]/gim) || []).length;
const checkedBoxes = (checklist.match(/^\s*- \[x\]/gim) || []).length;

if (totalBoxes === 0) {
  issues.push('**Checklist** section is missing or has been removed.');
} else if (checkedBoxes === 0) {
  issues.push(
    'No **Checklist** items are checked. Please check all items that apply.'
  );
}

if (
  totalBoxes > 0 &&
  !/^\s*- \[x\] I have read and followed the contribution/im.test(checklist)
) {
  issues.push('The **contribution guidelines** checkbox has not been checked.');
}

if (FIXES_PLACEHOLDER.test(stripComments(body))) {
  issues.push(
    'The `Fixes #xxx` placeholder has not been updated. Link the relevant issue or remove the line.'
  );
}

console.log(JSON.stringify(issues));
process.exit(issues.length > 0 ? 1 : 0);
