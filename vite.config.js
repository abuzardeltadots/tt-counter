import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'TT Counter - Table Tennis Scorer',
        short_name: 'TT Counter',
        description: 'Offline table tennis score counter with volume button support',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'fullscreen',
        orientation: 'portrait',
        id: 'tt-counter-pwa',
        categories: ['sports', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          { src: 'screenshot-mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'Game screen on mobile' },
          { src: 'screenshot-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Game screen on desktop' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ]
})
