import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { 
    proxy: { '/api': 'http://localhost:8000' } 
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('axios')) {
              return 'vendor';
            }
            return 'vendor-deps';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
