import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    host: true,                                      // acceso externo
    port: process.env.PORT || 4173,                   // puerto Render o local
    allowedHosts: [                                   // permite estos hosts
      'holypot-landing.onrender.com',
      'localhost',
      '.onrender.com'                                 // wildcard para todos subdominios Render (pro)
    ]
  }
})
