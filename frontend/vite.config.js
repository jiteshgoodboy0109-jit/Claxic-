import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['core-js'],
  },
  resolve: {
    alias: {
      html2canvas: path.resolve(__dirname, 'src/utils/html2canvas-shim.js'),
      'victory-vendor/d3-shape': 'd3-shape',
      'victory-vendor/d3-scale': 'd3-scale',
      'victory-vendor/d3-path': 'd3-path',
      'victory-vendor/d3-interpolate': 'd3-interpolate',
    },
  },
  build: {
    rollupOptions: {
      external: [/^core-js/],
    },
  },
  server: {
    port: 5173,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
