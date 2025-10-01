import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Cuando el frontend pida /api/X, Vite lo redirigirá a http://localhost:3001/api/X
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // La dirección de tu servidor Express
        changeOrigin: true,
        secure: false, // Puedes ponerlo a true si usas HTTPS en el backend
      },
    },
    // Añadir el puerto si no está configurado (por defecto 5173)
    port: 5173,
  },
})
