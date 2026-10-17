import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { APP_ICONS } from './src/assets/appIconsData'

// Gera os ícones PNG do app (iPhone/Android) em /icons/ a partir do texto base64
// de src/assets/appIconsData.ts. Assim os ícones chegam no deploy mesmo que
// imagens binárias não sejam enviadas ao repositório (ex.: Git LFS na Vercel).
function amxAppIcons(): Plugin {
  const files = Object.entries(APP_ICONS).map(([name, b64]) => ({
    name: `icons/${name}`,
    buf: Buffer.from(b64, 'base64'),
  }))

  const serve = (req: { url?: string }, res: any, next: () => void) => {
    const url = (req.url || '').split('?')[0]
    const file = files.find((f) => url === `/${f.name}`)
    if (!file) return next()
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(file.buf)
  }

  return {
    name: 'amx-app-icons',
    configureServer(server) {
      server.middlewares.use(serve)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve)
    },
    generateBundle() {
      for (const f of files) {
        this.emitFile({ type: 'asset', fileName: f.name, source: f.buf })
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    amxAppIcons(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
