import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'static',
  outDir: '../server/dist/astro',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  build: {
    assets: '_astro',
  },
})
