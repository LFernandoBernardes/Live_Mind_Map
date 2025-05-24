
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['77aff23e-fa20-43bc-a91e-885aaa0a2d01-00-14zdwih7oyl07.spock.replit.dev', '.replit.dev']
  }
})
