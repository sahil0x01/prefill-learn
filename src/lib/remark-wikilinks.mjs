// Turns [[id]] and [[id|label]] into links to notes, widgets or projects.
// Ids are file names and must be unique across those collections.
// An unknown id fails the build, so broken links can't ship.
import fs from 'node:fs';
import path from 'node:path';

const KINDS = ['notes', 'widgets', 'projects'];
const WIKI = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const SKIP = new Set(['link', 'linkReference', 'code', 'inlineCode', 'math', 'inlineMath']);

function buildIndex(root) {
  const index = new Map();
  for (const kind of KINDS) {
    const dir = path.join(root, 'src/content', kind);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!/\.mdx?$/.test(file)) continue;
      const id = file.replace(/\.mdx?$/, '');
      const prev = index.get(id);
      if (prev) throw new Error(`Duplicate id "${id}" in ${kind}/ and ${prev.kind}/`);
      const src = fs.readFileSync(path.join(dir, file), 'utf8');
      const title = src.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? id;
      index.set(id, { kind, title, url: `/${kind}/${id}/` });
    }
  }
  return index;
}

export default function remarkWikiLinks() {
  return (tree, file) => {
    // Rebuilt per file so new notes resolve in dev without a restart.
    const index = buildIndex(file.cwd ?? process.cwd());

    const walk = (node) => {
      if (!node.children || SKIP.has(node.type)) return;
      const out = [];
      for (const child of node.children) {
        if (child.type !== 'text' || !child.value.includes('[[')) {
          walk(child);
          out.push(child);
          continue;
        }
        let last = 0;
        for (const m of child.value.matchAll(WIKI)) {
          const id = m[1].trim();
          const target = index.get(id);
          if (!target) throw new Error(`Broken wiki link [[${id}]] in ${file.path}`);
          if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
          out.push({
            type: 'link',
            url: target.url,
            data: { hProperties: { className: ['wikilink', `wikilink--${target.kind}`], 'data-id': id } },
            children: [{ type: 'text', value: m[2]?.trim() ?? target.title }],
          });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
      }
      node.children = out;
    };

    walk(tree);
  };
}
