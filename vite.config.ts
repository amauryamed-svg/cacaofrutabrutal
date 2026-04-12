import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { securityHeaders } from './vite.config.security-headers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    middlewareMode: false,
    // Agrega security headers en desarrollo
    middleware: true,
  },
  base: '/',
})
