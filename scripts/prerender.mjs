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
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: "networkidle0",
        timeout: PAGE_TIMEOUT,
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

prerender().catch((err) => {
  console.error("Prerender script failed:", err);
  // Don't exit with error code — a failed prerender shouldn't break the build
  process.exit(0);
});
