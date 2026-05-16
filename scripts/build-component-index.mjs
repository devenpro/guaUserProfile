// Component index generator. Walks components/ recursively, reads every
// .component.json file, and emits a single docs/COMPONENT-INDEX.md table
// grouped by component type. Output is DETERMINISTIC (no timestamps in the
// content) so re-running with unchanged inputs produces a byte-identical
// file — safe to chain after scripts/build.mjs without polluting diffs.
//
// Schema (informal — keys are convention, not enforced):
//   { name, type, summary, entry, source, triggers, reads, writes,
//     produces_html?, network_contract?, failure_modes, tags, related?,
//     output_contract?, breaking_change_warning? }
//
// To add a component: drop a new <name>.component.json under components/
// (any subfolder structure ok) and re-run `node scripts/build-component-index.mjs`.

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const componentsDir = 'components';
const outPath = 'docs/COMPONENT-INDEX.md';

function walk(dir) {
  return readdirSync(dir).sort().flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return p.endsWith('.component.json') ? [p] : [];
  });
}

function escMd(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

const TYPE_ORDER = ['view', 'ai-action', 'data-export'];
const TYPE_LABEL = {
  'view': 'Views',
  'ai-action': 'AI Actions',
  'data-export': 'Data Exports'
};

let files;
try {
  files = walk(componentsDir);
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log(`✓ ${outPath}  (skipped: no ${componentsDir}/ directory)`);
    process.exit(0);
  }
  throw e;
}

const components = files.map(f => {
  const raw = readFileSync(f, 'utf8');
  let json;
  try { json = JSON.parse(raw); }
  catch (e) { throw new Error(`Failed to parse ${f}: ${e.message}`); }
  json.__source_file = relative('.', f).replace(/\\/g, '/');
  return json;
});

// Group by type, preserving the canonical type order.
const grouped = {};
for (const c of components) {
  const t = c.type || 'other';
  (grouped[t] = grouped[t] || []).push(c);
}
const orderedTypes = [
  ...TYPE_ORDER.filter(t => grouped[t]),
  ...Object.keys(grouped).filter(t => !TYPE_ORDER.includes(t)).sort()
];

let md = '# Component Index\n\n';
md += 'Auto-generated from `components/**/*.component.json` by `scripts/build-component-index.mjs`. **Do not edit by hand** — your changes will be overwritten on the next build. Edit the source `.component.json` files and re-run the generator.\n\n';
md += `Total components: ${components.length}.\n\n`;
md += '---\n\n';

for (const type of orderedTypes) {
  const list = grouped[type].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  md += `## ${TYPE_LABEL[type] || (type.charAt(0).toUpperCase() + type.slice(1))}\n\n`;
  md += '| Component | Summary | Entry | Source |\n';
  md += '|---|---|---|---|\n';
  for (const c of list) {
    md += `| **${escMd(c.name)}** | ${escMd(c.summary)} | \`${escMd(c.entry)}\` | [${escMd(c.source)}](${(c.source || '').split(':')[0]}) |\n`;
  }
  md += '\n';
}

md += '---\n\n## Component detail\n\n';

for (const type of orderedTypes) {
  const list = grouped[type].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  for (const c of list) {
    md += `### ${escMd(c.name)}  \`${escMd(c.type)}\`\n\n`;
    if (c.summary) md += `${c.summary}\n\n`;
    md += `**Entry:** \`${escMd(c.entry)}\` at \`${escMd(c.source)}\`\n\n`;
    md += `**Schema source:** \`${c.__source_file}\`\n\n`;

    if (c.triggers && c.triggers.length) {
      md += '**Triggers:**\n\n';
      for (const t of c.triggers) md += `- ${t}\n`;
      md += '\n';
    }

    if (c.reads) {
      md += '**Reads:**\n\n';
      if (c.reads.state && c.reads.state.length)   md += `- State: ${c.reads.state.map(s => `\`${s}\``).join(', ')}\n`;
      if (c.reads.dom && c.reads.dom.length)       md += `- DOM: ${c.reads.dom.map(s => `\`${s}\``).join(', ')}\n`;
      if (c.reads.network && c.reads.network.length) md += `- Network: ${c.reads.network.map(s => `\`${s}\``).join(', ')}\n`;
      md += '\n';
    }

    if (c.writes) {
      md += '**Writes:**\n\n';
      if (c.writes.state && c.writes.state.length)   md += `- State: ${c.writes.state.map(s => `\`${s}\``).join(', ')}\n`;
      if (c.writes.dom && c.writes.dom.length)       md += `- DOM: ${c.writes.dom.map(s => `\`${s}\``).join(', ')}\n`;
      if (c.writes.network && c.writes.network.length) md += `- Network: ${c.writes.network.map(s => `\`${s}\``).join(', ')}\n`;
      md += '\n';
    }

    if (c.network_contract) {
      md += '**Network contract:**\n\n```json\n' + JSON.stringify(c.network_contract, null, 2) + '\n```\n\n';
    }

    if (c.output_contract) {
      md += '**Output contract:**\n\n```json\n' + JSON.stringify(c.output_contract, null, 2) + '\n```\n\n';
    }

    if (c.failure_modes && c.failure_modes.length) {
      md += '**Failure modes:**\n\n';
      for (const f of c.failure_modes) {
        md += `- **${escMd(f.scenario)}** — ${escMd(f.handling)}\n`;
      }
      md += '\n';
    }

    if (c.breaking_change_warning) {
      md += `> ⚠ **Breaking change risk:** ${c.breaking_change_warning}\n\n`;
    }

    if (c.tags && c.tags.length) {
      md += `**Tags:** ${c.tags.map(t => '`' + t + '`').join(' · ')}\n\n`;
    }

    if (c.related && c.related.length) {
      md += `**Related:** ${c.related.map(r => '`' + r + '`').join(', ')}\n\n`;
    }

    md += '---\n\n';
  }
}

mkdirSync('docs', { recursive: true });
writeFileSync(outPath, md);
console.log(`✓ ${outPath}  ←  ${components.length} components  (${md.length} bytes)`);
