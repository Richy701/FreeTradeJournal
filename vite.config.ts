/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const twelveDataKey = env.TWELVEDATA_API_KEY || env.VITE_TWELVEDATA_API_KEY || ''
  const finnhubKey = env.FINNHUB_API_KEY || env.VITE_FINNHUB_API_KEY || ''
  const fredKey = env.FRED_API_KEY || env.VITE_FRED_API_KEY || ''
  const appendKey = (path: string, param: string, key: string) =>
    path + (path.includes('?') ? '&' : '?') + `${param}=${key}`

  return {
  plugins: [
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
