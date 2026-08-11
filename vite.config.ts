/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import { fetchMarketFeed, FEED_TABS } from './api/_lib/market-feed'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const twelveDataKey = env.TWELVEDATA_API_KEY || env.VITE_TWELVEDATA_API_KEY || ''
  const finnhubKey = env.FINNHUB_API_KEY || env.VITE_FINNHUB_API_KEY || ''
  const fredKey = env.FRED_API_KEY || env.VITE_FRED_API_KEY || ''
  const appendKey = (path: string, param: string, key: string) =>
    path + (path.includes('?') ? '&' : '?') + `${param}=${key}`

  // Dev-only quote cache. Production edge-caches quotes for 5 minutes in
  // api/twelvedata/[...path].ts, but the plain dev proxy hits TwelveData on
  // every widget mount (doubled by StrictMode), burning the free quota into
  // console 429s. Same contract as prod: successes cached, errors never.
  const QUOTE_CACHE_MS = 60_000
  const quoteCache = new Map<string, { body: string; contentType: string; at: number }>()
  const devTwelveDataQuoteCache = (): Plugin => ({
    name: 'dev-twelvedata-quote-cache',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/twelvedata/quote', (req, res) => {
        void (async () => {
          const symbol = new URL(req.url || '/', 'http://localhost').searchParams.get('symbol') || ''
          const hit = quoteCache.get(symbol)
          if (hit && Date.now() - hit.at < QUOTE_CACHE_MS) {
            res.setHeader('Content-Type', hit.contentType)
            res.setHeader('X-Dev-Quote-Cache', 'hit')
            res.end(hit.body)
            return
          }
          try {
            const params = new URLSearchParams({ symbol, apikey: twelveDataKey })
            const upstream = await fetch(`https://api.twelvedata.com/quote?${params}`)
            const body = await upstream.text()
            const contentType = upstream.headers.get('content-type') || 'application/json'
            if (upstream.ok) quoteCache.set(symbol, { body, contentType, at: Date.now() })
            res.statusCode = upstream.status
            res.setHeader('Content-Type', contentType)
            res.setHeader('X-Dev-Quote-Cache', 'miss')
            res.end(body)
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end('{"error":"upstream fetch failed"}')
          }
        })()
      })
    },
  })

  // Dev twin of api/news.ts — same shared fetch/parse module, so there is one
  // parser code path. Cached like the quote proxy so StrictMode double-mounts
  // don't hammer the RSS upstreams.
  const NEWS_CACHE_MS = 5 * 60_000
  const newsCache = new Map<string, { body: string; at: number }>()
  const devNewsFeed = (): Plugin => ({
    name: 'dev-news-feed',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/news', (req, res) => {
        void (async () => {
          const tab = new URL(req.url || '/', 'http://localhost').searchParams.get('tab') || 'forex'
          res.setHeader('Content-Type', 'application/json')
          if (!FEED_TABS.includes(tab)) {
            res.statusCode = 400
            res.end('{"error":"Invalid tab"}')
            return
          }
          const hit = newsCache.get(tab)
          if (hit && Date.now() - hit.at < NEWS_CACHE_MS) {
            res.end(hit.body)
            return
          }
          try {
            const posts = await fetchMarketFeed(tab)
            if (posts.length === 0) {
              res.statusCode = 503
              res.end('{"error":"Feeds unavailable"}')
              return
            }
            const body = JSON.stringify(posts)
            newsCache.set(tab, { body, at: Date.now() })
            res.end(body)
          } catch {
            res.statusCode = 502
            res.end('{"error":"Feed fetch failed"}')
          }
        })()
      })
    },
  })

  return {
  plugins: [
    devTwelveDataQuoteCache(),
    devNewsFeed(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/screenshots/**', '**/logos/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
    react({
    babel: {
      plugins: [],
      presets: [
        ['@babel/preset-env', {
          targets: {
            chrome: '91',
            firefox: '90', 
            safari: '14',
            edge: '91'
          },
          modules: false,
          bugfixes: true,
          shippedProposals: true,
          exclude: [
            '@babel/plugin-transform-classes',
            '@babel/plugin-transform-spread',
            '@babel/plugin-transform-arrow-functions',
            '@babel/plugin-transform-block-scoping',
            '@babel/plugin-transform-destructuring',
            '@babel/plugin-transform-for-of',
            '@babel/plugin-transform-object-rest-spread',
            '@babel/plugin-transform-template-literals'
          ]
        }]
      ]
    }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/ingest': {
        target: 'https://eu.i.posthog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ingest/, ''),
      },
      '/api/twelvedata': {
        target: 'https://api.twelvedata.com',
        changeOrigin: true,
        rewrite: (path) => appendKey(path.replace(/^\/api\/twelvedata/, ''), 'apikey', twelveDataKey),
      },
      '/api/finnhub': {
        target: 'https://finnhub.io/api/v1',
        changeOrigin: true,
        rewrite: (path) => {
          const stripped = path
            .replace(/^\/api\/finnhub/, '')
            .replace('/economic-calendar', '/calendar/economic')
          return appendKey(stripped, 'token', finnhubKey)
        },
      },
      '/api/fred': {
        target: 'https://api.stlouisfed.org/fred',
        changeOrigin: true,
        rewrite: (path) => {
          // Mirror api/fred/[...path].ts: single-segment client path ->
          // real FRED endpoint, plus the key and JSON file_type.
          const stripped = path
            .replace(/^\/api\/fred/, '')
            .replace(/^\/observations/, '/series/observations')
          const withKey = appendKey(stripped, 'api_key', fredKey)
          return appendKey(withKey, 'file_type', 'json')
        },
      },
    },
  },
  esbuild: {
    target: 'es2022',
    format: 'esm'
  },
  build: {
    target: 'es2022',
    // 'hidden' emits .map files without a sourceMappingURL comment in the JS.
    // scripts/upload-sourcemaps.mjs uploads them to PostHog (crash
    // symbolication) and deletes them so they are never deployed publicly.
    sourcemap: 'hidden',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-popover', '@radix-ui/react-dropdown-menu'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],
          'vendor-date': ['date-fns', 'date-fns-tz', 'react-day-picker'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-animation': ['framer-motion'],
          'vendor-icons': ['@phosphor-icons/react'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'vendor-remotion': ['remotion', '@remotion/player']
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (extType === 'css') {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  }
})
