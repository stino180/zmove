import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'zmove',
        short_name: 'zmove',
        start_url: '.',
        display: 'standalone',
        background_color: '#f6effa',
        theme_color: '#a259e6',
        description: 'Watch and share sports highlights from high school to pro!',
        icons: [
          {
            src: '1.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
    })
  ],
})
