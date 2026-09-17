import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'react', 'react-dom', 'lucide-react', 'recharts'],
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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: [/^core-js/],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'vendor-pdf';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion') || id.includes('motion') || id.includes('canvas-confetti')) {
              return 'vendor-motion';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-is')) {
              return 'vendor-react';
            }
          }
        },
      },
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
