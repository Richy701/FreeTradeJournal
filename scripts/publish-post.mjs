#!/usr/bin/env node
/**
 * Save a markdown post to Ghost as a draft or publish it
 * Usage:
 *   node scripts/publish-post.mjs posts/my-post.md          -> saves as draft
 *   node scripts/publish-post.mjs posts/my-post.md --publish -> publishes live
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const GHOST_URL = process.env.GHOST_URL || 'https://ghost-production-daff.up.railway.app';
const ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('Error: GHOST_ADMIN_API_KEY environment variable not set.');
  process.exit(1);
}

const args = process.argv.slice(2);
const filePath = args.find(a => !a.startsWith('--'));
const shouldPublish = args.includes('--publish');

if (!filePath) {
  console.error('Usage: node scripts/publish-post.mjs posts/my-post.md [--publish]');
  process.exit(1);
}

const fullPath = path.resolve(filePath);
if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(fullPath, 'utf-8');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  });

  return { meta, body: match[2].trim() };
}

const { meta, body } = parseFrontmatter(raw);

if (!meta.title) {
  console.error('Error: Post must have a "title" in frontmatter.');
  process.exit(1);
}

// Generate Ghost Admin API JWT
function generateToken(adminApiKey) {
  const [id, secret] = adminApiKey.split(':');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url');
  const signature = crypto.createHmac('sha256', Buffer.from(secret, 'hex')).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const token = generateToken(ADMIN_API_KEY);

const tags = meta.tags
  ? meta.tags.split(',').map(t => ({ name: t.trim() }))
  : [];

const post = {
  title: meta.title,
  custom_excerpt: meta.subtitle || '',
  markdown: body,
  mobiledoc: JSON.stringify({
    version: '0.3.1',
    markups: [],
    atoms: [],
    cards: [['markdown', { markdown: body }]],
    sections: [[10, 0]],
  }),
  tags,
  status: shouldPublish ? 'published' : 'draft',
  ...(meta.coverImage ? { feature_image: meta.coverImage } : {}),
};

console.log(`${shouldPublish ? 'Publishing' : 'Saving draft'}: "${meta.title}"...`);

const res = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Ghost ${token}`,
  },
  body: JSON.stringify({ posts: [post] }),
});

const json = await res.json();

if (!res.ok || json.errors) {
  console.error('Ghost API error:');
  (json.errors || [{ message: res.statusText }]).forEach(e => console.error(' -', e.message));
  process.exit(1);
}

const created = json.posts[0];
console.log(`\n${shouldPublish ? 'Published!' : 'Saved as draft!'}`);
console.log(`Title: ${created.title}`);
console.log(`URL:   ${GHOST_URL}/${created.slug}`);
if (!shouldPublish) console.log(`\nReview it in Ghost admin, then publish when ready.`);
