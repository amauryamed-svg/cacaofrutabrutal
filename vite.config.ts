import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mirror Vercel's rewrite of `/` → `/investor-landing.html` in dev,
// so the landing works the same locally as in prod.
const rootToInvestor = {
  name: 'root-to-investor-landing',
  configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, _res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/' || req.url === '') req.url = '/investor-landing.html'
      next()
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [rootToInvestor, react(), tailwindcss()],
  server: {
    port: 3000,
    middlewareMode: false,
  },
  base: '/',
})
