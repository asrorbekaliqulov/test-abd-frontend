import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    allowedHosts: [
      'localhost:5173',
      '127.0.0.1',
      'backend.testabd.uz',
      '192.168.1.140',
    ]
  },
});

