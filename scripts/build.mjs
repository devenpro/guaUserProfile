// Build script: concatenates src/ files into dist/up.js and dist/up.css.
// Run with `node scripts/build.mjs` (or `npm run build` if execution policy allows).
//
// Walk order is alphabetical, depth-first. Numeric prefixes on filenames and
// folders (10-part1/, 20-part2a/, 30-part2b/, styles/10-part1/, styles/20-part2/)
// control concatenation order. To reorder, rename — no manifest needed.

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version || 'dev';
const buildTime = new Date().toISOString();

const targets = [
  { src: 'src',        out: 'dist/up.js',  ext: '.js',  skipDir: 'styles' },
  { src: 'src/styles', out: 'dist/up.css', ext: '.css' },
];

function walk(dir, ext, skipDir) {
  return readdirSync(dir).sort().flatMap(name => {
    if (name === skipDir) return [];
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p, ext, skipDir);
    return p.endsWith(ext) ? [p] : [];
  });
}

mkdirSync('dist', { recursive: true });

for (const { src, out, ext, skipDir } of targets) {
  const files = walk(src, ext, skipDir);
  const banner = `/* User Profile v${version} · built ${buildTime} · ${files.length} source files (see src/) */\n`;
  // JS bundle gets a global-scope prologue so any IIFE can read the version
  // off `window`. CSS bundle just gets the banner comment.
  const prologue = ext === '.js'
    ? `window.UP_VERSION = ${JSON.stringify(version)};\nwindow.UP_BUILD_TIME = ${JSON.stringify(buildTime)};\n`
    : '';
  const body = files.map(f =>
    `\n/* ===== ${relative('.', f).replace(/\\/g, '/')} ===== */\n` + readFileSync(f, 'utf8')
  ).join('');
  writeFileSync(out, banner + prologue + body);
  console.log(`✓ ${out}  ←  ${files.length} files  (${(banner + prologue + body).length} bytes)`);
}
