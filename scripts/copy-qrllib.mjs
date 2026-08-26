// Copies the QRLLIB bundle out of node_modules so index.html can load it and
// the offline build can inline it. Runs as `postinstall`.
//
// Was `cp -r ...`, which does not exist in cmd.exe — npm runs lifecycle
// scripts through cmd on Windows, so `npm ci` failed there outright and the
// rebuild-and-compare verification in RELEASE.md was impossible on Windows.
//
// Also reports the digest it copied. The bundle is the cryptography this tool
// depends on, it is gitignored, and its only integrity control is the
// package-lock hash — so at minimum the copy should be visible.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/@theqrl/qrllib-browserify/dist/qrllib.js');
const target = resolve(root, 'public/qrllib.js');

try {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
} catch (error) {
  console.error(`postinstall: could not copy qrllib.js\n  from ${source}\n  to   ${target}\n  ${error.message}`);
  process.exit(1);
}

// Reporting only. The copy above is what the build needs, so a failure to
// read metadata or hash the file must not fail `npm ci`.
try {
  const bytes = readFileSync(target);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const pkg = JSON.parse(readFileSync(resolve(root, 'node_modules/@theqrl/qrllib-browserify/package.json'), 'utf8'));
  console.log(
    `postinstall: qrllib ${pkg.dependencies?.qrllib ?? pkg.version} `
    + `(${bytes.length} bytes, sha256 ${digest.slice(0, 16)}…) -> public/qrllib.js`,
  );
} catch (error) {
  console.warn(`postinstall: copied qrllib.js but could not report on it — ${error.message}`);
}

