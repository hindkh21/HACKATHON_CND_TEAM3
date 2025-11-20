import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    define: {
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:9001'),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:9001'),
    },
  }
})
