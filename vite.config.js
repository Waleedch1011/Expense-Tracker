import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Waleed Expense Tracker',
        short_name: 'Expense',
        description: 'Personal finance tracker — log transactions instantly',
        theme_color: '#0a0d14',
        background_color: '#0a0d14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Quick Add',
            short_name: 'Quick',
            description: 'Add a transaction in seconds',
            url: '/quick',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // Cache settings reads so categories/accounts load offline
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://dzmugxoxpoikhtmwqsil.supabase.co' &&
              url.pathname.includes('/rest/v1/user_settings'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-settings',
              expiration: { maxEntries: 5, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Don't precache index.html as 'index' — let it be served fresh
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/rest/],
      },
    }),
  ],
})
