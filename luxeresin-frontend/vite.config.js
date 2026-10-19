import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Naya import!

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Vite ko Tailwind ka power de diya!
  ],
})