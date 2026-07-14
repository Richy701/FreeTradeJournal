/**
 * Post-build prerendering script.
 *
 * Spins up a local static server from dist/, launches headless Chromium via
 * Puppeteer, visits every public route, captures the fully-rendered HTML, and
 * writes it back to dist/ so search engines get real content instead of an
 * empty <div id="root"></div>.
 */

import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// On Vercel/CI the build container has no system Chrome and Puppeteer's managed
// download is skipped by the cached install, so we drive a serverless Chromium
// binary (@sparticuz/chromium) via puppeteer-core. Locally we use the full
// puppeteer package, which finds the developer's installed Chrome.
async function launchBrowser() {
  if (process.env.VERCEL || process.env.CI) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 120_000, // 2 min for browser startup (Rosetta on Apple Silicon)
  });
}

// ── Config ───────────────────────────────────────────────────────────────────

const DIST = new URL("../dist", import.meta.url).pathname;
const PORT = 4173; // same port vite preview uses by default
const PAGE_TIMEOUT = 30_000; // 30 s per page

// Blog routes are derived from posts/*.md (slug = filename), so a new post
// automatically gets prerendered and injected into the deployed sitemap —
// no manual route or sitemap edits needed.
const POSTS_DIR = new URL("../posts", import.meta.url).pathname;
const BLOG_POSTS = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        route: `/blog/${f.replace(/\.md$/, "")}`,
        lastmod: statSync(join(POSTS_DIR, f)).mtime.toISOString().slice(0, 10),
      }))
  : [];
const BLOG_ROUTES = ["/blog", ...BLOG_POSTS.map((p) => p.route)];

const ROUTES = [
  "/",
  ...BLOG_ROUTES,
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/documentation",
  "/forex-trading-journal",
  "/futures-trading-tracker",
  "/prop-firm-dashboard",
  "/prop-tracker",
  "/changelog",
  "/pricing",
  // SEO landing pages — must stay in sync with sitemap.xml, otherwise the
  // Vercel SPA rewrite serves them the homepage shell (duplicate content →
  // "crawled, currently not indexed"). The sitemap-sync guard below enforces this.
  "/day-trading-journal",
  "/online-trading-journal",
  "/affiliate",
  "/ftmo-review",
  "/the5ers-review",
  "/top-one-futures-review",
];

// ── Tiny static file server ──────────────────────────────────────────────────

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let filePath = join(DIST, url.pathname);

      // If the path has no extension, serve index.html (SPA fallback)
      if (!extname(filePath)) {
        filePath = join(DIST, "index.html");
      }

      try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      } catch {
        // Fallback to index.html for SPA routing
        try {
          const data = await readFile(join(DIST, "index.html"));
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end("Not found");
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`  Static server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// ── Prerender ────────────────────────────────────────────────────────────────

async function prerender() {
  console.log("\n🔍 Prerendering public routes…\n");

  const server = await startServer();

  let browser;
  try {
    browser = await launchBrowser();
  } catch (err) {
    console.warn(`  ⚠  Skipping prerender — could not launch Chromium: ${err.message}`);
    server.close();
    return [];
  }

  const results = { success: [], failed: [] };

  for (const route of ROUTES) {
    const label = route === "/" ? "/" : route;
    try {
      const page = await browser.newPage();
      // Use networkidle2 (≤2 active connections) rather than networkidle0 so
      // that Firebase's persistent auth connection doesn't block the wait.
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: "networkidle2",
        timeout: PAGE_TIMEOUT,
      });

      // Wait for React to render content into #root before capturing.
      // This handles the case where networkidle2 fires while React is still
      // flushing (e.g. lazy-loaded chunks, auth context initialisation).
      await page.waitForFunction(
        () => {
          const root = document.getElementById("root");
          return root !== null && root.children.length > 0;
        },
        { timeout: 10_000 }
      ).catch(() => {
        console.warn(`  ⚠  ${route}: #root still empty after 10 s — capturing anyway`);
      });

      const html = await page.evaluate(() => {
        // Framer-motion serialises its entrance-animation initial state
        // (opacity: 0 + translate/filter) as inline styles; frozen in the
        // snapshot they hide the H1 and body content until JS hydrates.
        // Strip them so the static HTML is visible without JavaScript —
        // hydration re-applies the animation on the client regardless.
        for (const el of document.querySelectorAll('[style*="opacity"]')) {
          if (parseFloat(el.style.opacity) < 1) {
            el.style.removeProperty("opacity");
            el.style.removeProperty("transform");
            el.style.removeProperty("filter");
          }
        }
        return "<!DOCTYPE html>" + document.documentElement.outerHTML;
      });
      await page.close();

      // Determine output path
      let outPath;
      if (route === "/") {
        outPath = join(DIST, "index.html");
      } else {
        const dir = join(DIST, route);
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
        outPath = join(dir, "index.html");
      }

      await writeFile(outPath, html, "utf-8");
      console.log(`  ✅ ${label} → ${outPath.replace(DIST, "dist")}`);
      results.success.push(label);
    } catch (err) {
      console.error(`  ❌ ${label} — ${err.message}`);
      results.failed.push(label);
    }
  }

  await browser.close();
  server.close();

  // Summary
  console.log(
    `\n  Prerendered ${results.success.length}/${ROUTES.length} routes.`
  );
  if (results.failed.length > 0) {
    console.log(`  Failed: ${results.failed.join(", ")}`);
  }
  console.log("");

  return results.success;
}

// ── Blog sitemap injection ───────────────────────────────────────────────────
//
// public/sitemap.xml stays hand-maintained for the marketing pages; blog URLs
// are injected into the built dist/sitemap.xml here so posts/*.md is the only
// thing to touch when publishing. Runs before the sync guard, which then
// verifies the injected URLs were actually prerendered.
async function injectBlogUrlsIntoSitemap() {
  const sitemapPath = join(DIST, "sitemap.xml");
  let xml;
  try {
    xml = await readFile(sitemapPath, "utf-8");
  } catch {
    return;
  }

  const entries = [
    { route: "/blog", lastmod: BLOG_POSTS[0]?.lastmod },
    ...BLOG_POSTS,
  ]
    .filter(({ route }) => !xml.includes(`<loc>https://www.freetradejournal.com${route}</loc>`))
    .map(
      ({ route, lastmod }) =>
        `  <url>\n    <loc>https://www.freetradejournal.com${route}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
        `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`,
    );

  if (entries.length === 0) return;
  xml = xml.replace("</urlset>", `${entries.join("")}</urlset>`);
  await writeFile(sitemapPath, xml, "utf-8");
  console.log(`  ✅ Injected ${entries.length} blog URLs into dist/sitemap.xml.`);
}

// ── Sitemap sync guard ───────────────────────────────────────────────────────
//
// Every URL in sitemap.xml must have been prerendered to its own static HTML.
// If a sitemap route isn't prerendered, the Vercel SPA rewrite serves it the
// homepage shell — Google then sees duplicate content + a homepage canonical
// and drops the page ("crawled, currently not indexed"). On Vercel/CI this is a
// hard failure so a broken deploy never ships; locally it's a warning, since a
// dev machine may not have Chromium available.
async function assertSitemapPrerendered(prerendered) {
  const isCI = Boolean(process.env.VERCEL || process.env.CI);
  let xml;
  try {
    xml = await readFile(join(DIST, "sitemap.xml"), "utf-8");
  } catch {
    console.warn("  ⚠  No dist/sitemap.xml found — skipping sitemap-sync check.");
    return;
  }

  const sitemapPaths = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => {
      try {
        return new URL(m[1]).pathname.replace(/\/$/, "") || "/";
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const done = new Set(prerendered.map((p) => p.replace(/\/$/, "") || "/"));
  const missing = sitemapPaths.filter((p) => !done.has(p));

  if (missing.length === 0) {
    console.log(`  ✅ Sitemap sync OK — all ${sitemapPaths.length} sitemap URLs prerendered.\n`);
    return;
  }

  const msg =
    `Sitemap URLs not prerendered (would serve the homepage shell as duplicate ` +
    `content): ${missing.join(", ")}`;
  if (isCI) {
    console.error(`\n  ❌ ${msg}\n`);
    process.exit(1);
  } else {
    console.warn(`\n  ⚠  ${msg}\n     (warning only — not a CI build)\n`);
  }
}

// NOTE: CSS is intentionally NOT deferred. The old media="print" onload hack
// (a) rendered the prerendered body unstyled until the stylesheet loaded and
// (b) required 'unsafe-inline' in the CSP script-src for its onload handlers.
// A ~22KB gzipped render-blocking stylesheet is the cheaper trade.

let prerenderedRoutes = [];
prerender()
  .then((success) => {
    prerenderedRoutes = success || [];
    return injectBlogUrlsIntoSitemap();
  })
  .then(() => assertSitemapPrerendered(prerenderedRoutes))
  .catch((err) => {
    console.error("Prerender script failed:", err);
    // Don't exit with error code — a failed prerender shouldn't break the build
    process.exit(0);
  });
