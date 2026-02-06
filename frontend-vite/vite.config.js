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
    host: true,                    // permite acceso externo (Render domain)
    port: process.env.PORT || 4173 // usa $PORT Render o 4173 local
  }
})
