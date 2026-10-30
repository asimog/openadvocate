import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['ajv/dist/2020.js'] },
  server: { port: 5173, strictPort: true },
});
