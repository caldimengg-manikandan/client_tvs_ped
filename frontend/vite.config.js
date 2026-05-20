import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // React + Ant Design + all rc-* internals MUST share one chunk.
            // Splitting them causes "Cannot read properties of undefined
            // (reading 'createContext')" in production because rc-* packages
            // resolve React from a different chunk that may not yet be evaluated.
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/antd/') ||
              id.includes('/@ant-design/') ||
              id.includes('/rc-') ||
              id.includes('/react-is/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react-ui';
            }

            if (id.includes('/ag-grid')) {
              return 'vendor-aggrid';
            }
            if (
              id.includes('/chart.js') ||
              id.includes('/react-chartjs-2') ||
              id.includes('/chartjs-')
            ) {
              return 'vendor-charts';
            }
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (
              id.includes('/xlsx/') ||
              id.includes('/jspdf') ||
              id.includes('/pptxgenjs/')
            ) {
              return 'vendor-export';
            }

            return 'vendor-misc';
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  };
})
