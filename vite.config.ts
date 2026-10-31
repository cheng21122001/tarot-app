/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/tarot-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '小艾',
        short_name: '小艾',
        start_url: '/tarot-app/',
        scope: '/tarot-app/',
        display: 'standalone',
        background_color: '#141a2b',
        theme_color: '#141a2b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  test: { environment: 'node' },
});
