import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
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
  esbuild: {
    target: 'es2022',
    format: 'esm'
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-popover', '@radix-ui/react-dropdown-menu'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],
          'vendor-date': ['date-fns', 'date-fns-tz', 'react-datepicker', 'react-day-picker'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-animation': ['framer-motion'],
          'vendor-icons': ['lucide-react', 'react-icons', '@radix-ui/react-icons'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority']
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
  }
})
