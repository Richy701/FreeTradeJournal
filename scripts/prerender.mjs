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
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import puppeteer from "puppeteer";

// ── Config ───────────────────────────────────────────────────────────────────

const DIST = new URL("../dist", import.meta.url).pathname;
const PORT = 4173; // same port vite preview uses by default
const PAGE_TIMEOUT = 30_000; // 30 s per page

const ROUTES = [
  "/",
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
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 120_000, // 2 min for browser startup (Rosetta on Apple Silicon)
  });

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
}

// ── Defer CSS ────────────────────────────────────────────────────────────────

import { readdir } from "node:fs/promises";

async function deferCssInAllHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await deferCssInAllHtml(fullPath);
    } else if (entry.name.endsWith(".html")) {
      let html = await readFile(fullPath, "utf-8");
      const original = html;
      // Convert render-blocking <link rel="stylesheet"> to async pattern
      html = html.replace(
        /<link rel="stylesheet"([^>]*?)>/g,
        (_match, attrs) =>
          `<link rel="stylesheet"${attrs} media="print" onload="this.media='all'">`
          + `<noscript><link rel="stylesheet"${attrs}></noscript>`
      );
      if (html !== original) {
        await writeFile(fullPath, html, "utf-8");
      }
    }
  }
}

prerender()
  .then(() => {
    console.log("  Deferring CSS in prerendered HTML…");
    return deferCssInAllHtml(DIST);
  })
  .then(() => {
    console.log("  ✅ CSS deferred in all HTML files.\n");
  })
  .catch((err) => {
    console.error("Prerender script failed:", err);
    // Don't exit with error code — a failed prerender shouldn't break the build
    process.exit(0);
  });
