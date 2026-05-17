// Build script: concatenates src/ files into dist/up.js and dist/up.css.
// Run with `node scripts/build.mjs` (or `npm run build` if execution policy allows).
//
// Walk order is alphabetical, depth-first. Numeric prefixes on filenames and
// folders (10-part1/, 20-part2a/, 30-part2b/, styles/10-part1/, styles/20-part2/)
// control concatenation order. To reorder, rename — no manifest needed.
//
// After concatenation, the script attempts to minify both bundles with
// esbuild (via `npx --yes esbuild`). Minification is BEST-EFFORT locally:
// if esbuild can't be fetched (offline, no npm, etc.), the script prints a
// warning and exits 0 with only the unminified bundles. In CI the network
// is always available, so the released dist/ always contains both pairs.

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

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

// -- Minification pass ------------------------------------------------------
//
// Invoked via `npx --yes esbuild` so contributors don't need to install
// esbuild locally. On first run npx fetches it (~10 MB) into the npm cache;
// subsequent runs are instant. If npx or esbuild is unreachable (no network,
// no node_modules cache), we log a warning and exit successfully — the
// unminified bundles are still valid deliverables for local development.

function runEsbuild(args) {
  // Try the locally-installed `esbuild` first (fast path when package.json
  // has it as a devDependency). Fall back to `npx --yes esbuild`. The
  // double-attempt avoids npx's ~1s warm-up cost on machines that pinned
  // esbuild.
  const local = spawnSync('node', ['node_modules/esbuild/bin/esbuild', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (local.status === 0) return { ok: true, via: 'local' };
  if (local.status !== null && local.error && local.error.code !== 'ENOENT') {
    // Local install present but failed for a real reason — surface it.
    return { ok: false, via: 'local', stderr: local.stderr?.toString() || '' };
  }

  const viaNpx = spawnSync('npx', ['--yes', 'esbuild', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (viaNpx.status === 0) return { ok: true, via: 'npx' };
  return {
    ok: false,
    via: 'npx',
    stderr: (viaNpx.stderr?.toString() || '') + (viaNpx.error ? `\n${viaNpx.error.message}` : ''),
  };
}

function minifyJS() {
  const outFile = 'dist/up.min.js';
  const banner  = `/* User Profile v${version} · built ${buildTime} · minified */`;
  const r = runEsbuild([
    'dist/up.js',
    '--minify',
    '--target=es2017',
    '--legal-comments=none',
    '--sourcemap',
    `--banner:js=${banner}`,
    `--outfile=${outFile}`,
  ]);
  if (!r.ok) return r;
  // Smoke-check: the minified bundle must still expose the producer-app
  // globals the consumer apps depend on. esbuild shouldn't ever touch these
  // (they're property accesses on `window`), but pinning the invariant here
  // catches any future flag-mismatch regression.
  const minified = readFileSync(outFile, 'utf8');
  for (const sym of ['_upState', '_upRender', '_upSyncToTextarea']) {
    if (!minified.includes(sym)) {
      return { ok: false, via: r.via, stderr: `Minified bundle missing required global "${sym}"` };
    }
  }
  return r;
}

function minifyCSS() {
  const outFile = 'dist/up.min.css';
  const banner  = `/* User Profile v${version} · built ${buildTime} · minified */`;
  return runEsbuild([
    'dist/up.css',
    '--minify',
    '--loader:.css=css',
    `--banner:css=${banner}`,
    `--outfile=${outFile}`,
  ]);
}

const skipMinify = process.env.UP_SKIP_MINIFY === '1';
if (skipMinify) {
  console.log('⚠ UP_SKIP_MINIFY=1 — skipping minification pass.');
} else {
  const js = minifyJS();
  if (js.ok) {
    console.log(`✓ dist/up.min.js + dist/up.min.js.map  (via ${js.via})`);
  } else {
    console.warn(`⚠ Skipped JS minification (${js.via}). Unminified bundle is still valid.`);
    if (js.stderr) console.warn(js.stderr.trim());
  }

  const css = minifyCSS();
  if (css.ok) {
    console.log(`✓ dist/up.min.css  (via ${css.via})`);
  } else {
    console.warn(`⚠ Skipped CSS minification (${css.via}). Unminified bundle is still valid.`);
    if (css.stderr) console.warn(css.stderr.trim());
  }
}

// Print final dist/ summary so CI logs (and local devs) can eyeball sizes.
if (existsSync('dist/up.js')) {
  const sizes = [
    ['dist/up.js',     statSync('dist/up.js').size],
    ['dist/up.min.js', existsSync('dist/up.min.js') ? statSync('dist/up.min.js').size : null],
    ['dist/up.css',    statSync('dist/up.css').size],
    ['dist/up.min.css',existsSync('dist/up.min.css') ? statSync('dist/up.min.css').size : null],
  ];
  console.log('— dist/ summary —');
  for (const [path, bytes] of sizes) {
    if (bytes === null) console.log(`  ${path.padEnd(20)} (not built)`);
    else                console.log(`  ${path.padEnd(20)} ${(bytes/1024).toFixed(1)} KB`);
  }
}
