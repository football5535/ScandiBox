import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject the API key safely during build. 
    // This replaces 'process.env.API_KEY' in your code with the actual string value.
    'process.env.API_KEY': JSON.stringify("AIzaSyDXDgUO96uK-W088MQcfxs44t_nl_GLuNc")
  },
  build: {
    outDir: 'dist',
  }
})