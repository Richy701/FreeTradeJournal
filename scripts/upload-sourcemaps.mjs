// Uploads the hidden sourcemaps emitted by vite build to PostHog so crash
// stack traces symbolicate (exception capture replaced Sentry in v2.57.0),
// then deletes every .map from dist so they are never deployed publicly.
//
// Requires POSTHOG_CLI_API_KEY (personal API key, phx_...) — set in Vercel.
// Without it (local builds, forks) the upload is skipped but maps are still
// stripped, so the deployed output is identical either way.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
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

// On Linux x64 (Vercel), run the CLI's normal glibc binary directly instead of
// going through its npm wrapper. The wrapper refuses glibc older than the one
// it was BUILT on (2.35) and falls back to a static musl binary whose HTTPS
// client cannot start ("Request error: builder error"), which silently broke
// every production upload from July to September 2026. The binary itself only
// needs GLIBC_2.34 symbols (checked with `strings` for v0.8.1 and v0.18.3),
// and Vercel's Amazon Linux 2023 image ships exactly 2.34.
// Returns [command, leadingArgs]; any problem falls back to the wrapper.
function resolveCli() {
  const viaWrapper = ['npx', ['posthog-cli']];
  if (process.platform !== 'linux' || process.arch !== 'x64') return viaWrapper;
  try {
    const { version } = JSON.parse(
      readFileSync(path.join(root, 'node_modules/@posthog/cli/package.json'), 'utf8'),
    );
    const dir = mkdtempSync(path.join(os.tmpdir(), 'posthog-cli-'));
    const tarball = path.join(dir, 'cli.tar.gz');
    const url = `https://github.com/PostHog/posthog/releases/download/posthog-cli/v${version}/posthog-cli-x86_64-unknown-linux-gnu.tar.gz`;
    execFileSync('curl', ['-fsSL', '--max-time', '120', '-o', tarball, url], { stdio: 'inherit' });
    execFileSync('tar', ['-xzf', tarball, '-C', dir], { stdio: 'inherit' });
    const binary = readdirSync(dir, { recursive: true })
      .map((f) => path.join(dir, String(f)))
      .find((f) => path.basename(f) === 'posthog-cli');
    if (!binary) throw new Error('posthog-cli not found in the release archive');
    // Proves the binary loads against this machine's glibc before we rely on it.
    const reported = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
    console.log(`[sourcemaps] using glibc CLI binary directly (${reported})`);
    return [binary, []];
  } catch (err) {
    console.warn(`[sourcemaps] direct CLI binary unavailable (${err.message}); falling back to the npm wrapper`);
    return viaWrapper;
  }
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
  const [cliCommand, cliPrefix] = resolveCli();
  const run = (args) =>
    execFileSync(cliCommand, [...cliPrefix, '--host', 'https://eu.posthog.com', ...args], {
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
