// Uploads the hidden sourcemaps emitted by vite build to PostHog so crash
// stack traces symbolicate (exception capture replaced Sentry in v2.57.0),
// then deletes every .map from dist so they are never deployed publicly.
//
// Requires POSTHOG_CLI_API_KEY (personal API key, phx_...) — set in Vercel.
// Without it (local builds, forks) the upload is skipped but maps are still
// stripped, so the deployed output is identical either way.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

const mapFiles = readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.map'));

if (mapFiles.length === 0) {
  console.log('[sourcemaps] no .map files in dist — nothing to do');
  process.exit(0);
}

if (process.env.POSTHOG_CLI_API_KEY) {
  const env = {
    ...process.env,
    POSTHOG_CLI_PROJECT_ID: process.env.POSTHOG_CLI_PROJECT_ID || '155164',
  };
  // The CLI's static musl binary (used on Vercel's build image, where the
  // glibc one is incompatible) needs the CA bundle path spelled out or its
  // HTTPS client fails to initialize ("Request error: builder error").
  if (!env.SSL_CERT_FILE) {
    const caBundle = [
      '/etc/pki/tls/certs/ca-bundle.crt', // Amazon Linux (Vercel)
      '/etc/ssl/certs/ca-certificates.crt', // Debian/Ubuntu
    ].find((p) => existsSync(p));
    if (caBundle) env.SSL_CERT_FILE = caBundle;
  }
  const releaseVersion = process.env.VERCEL_GIT_COMMIT_SHA;
  const releaseArgs = releaseVersion
    ? ['--release-name', 'freetradejournal', '--release-version', releaseVersion]
    : [];
  const run = (args) =>
    execFileSync('npx', ['posthog-cli', '--host', 'https://eu.posthog.com', ...args], {
      stdio: 'inherit',
      env,
      cwd: root,
    });
  try {
    run(['sourcemap', 'inject', '--directory', 'dist', ...releaseArgs]);
    run(['sourcemap', 'upload', '--directory', 'dist', ...releaseArgs]);
    console.log(`[sourcemaps] uploaded ${mapFiles.length} sourcemaps to PostHog`);
  } catch (err) {
    // Symbolication is nice-to-have; it must never take down a deploy.
    console.warn(`[sourcemaps] upload failed — continuing without symbolication: ${err.message}`);
  }
} else {
  console.log('[sourcemaps] POSTHOG_CLI_API_KEY not set — skipping upload');
}

for (const f of mapFiles) rmSync(path.join(dist, f), { force: true });
console.log(`[sourcemaps] stripped ${mapFiles.length} .map files from dist`);
