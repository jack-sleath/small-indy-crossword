import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // Auto-update in the background: when the site is online and a new
      // deploy is available, the new service worker installs, swaps in, and
      // the page reloads to pick up the latest assets. No update prompt UI.
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Files copied to the build root that should be available offline.
      includeAssets: ['SmallIndy.png', '404.html'],

      // Minimal web app manifest so the game can be added to the home screen
      // on both iOS (Safari) and Android (Chrome) and launch standalone.
      manifest: {
        name: 'Small Indy',
        short_name: 'Small Indy',
        description:
          'A lightweight, shareable 5×5 mini crossword app for small private groups.',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/SmallIndy.png',
            sizes: '1200x630',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        // Precache the app shell + all hashed JS/CSS/HTML produced by the
        // build, plus the small pool manifest. Each deploy gets a fresh
        // revisioned cache; stale caches from previous deploys are cleaned
        // up on activation. This is the "deployed date" bucket you described.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}', 'pools.json'],

        // The large per-theme clue pools are cached on demand instead of all
        // up front. This is the network-first-with-fallback behaviour:
        //   - online  -> fetch the latest file, serve it, and cache it
        //   - offline -> fall back to the last cached copy (never breaks)
        runtimeCaching: [
          {
            // Matches /pool.json and /pool-<theme>.json, but NOT the
            // /pools.json manifest (that one is precached above).
            urlPattern: ({ url }) => /\/pool(-[^/]*)?\.json$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'crossword-pools',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // SPA fallback: any navigation that misses the cache serves the
        // cached index.html app shell, so deep links work offline too.
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
