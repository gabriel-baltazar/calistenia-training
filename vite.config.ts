import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/calistenia-training/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // framer-motion fica fora de propósito: o Rollup separa o domMax no chunk assíncrono.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          three: ['three', '@react-three/fiber'],
          firebase: ['firebase/app', 'firebase/auth'],
        },
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
