import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
      },
      manifest: {
        name: 'Family Expense Tracker',
        short_name: 'Семейный Бюджет',
        description: 'Совместный учёт расходов с синхронизацией',
        theme_color: '#0f0f23',
        background_color: '#0f0f23',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          }
        ],
      },
    }),
  ],
})
