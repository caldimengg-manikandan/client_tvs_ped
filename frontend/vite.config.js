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

            // Every package that calls React APIs (createContext, memo, etc.)
            // MUST be in the same chunk as React itself.
            // '/react' (no trailing slash) catches: react, react-dom, react-router,
            // react-router-dom, react-is, react-countup, react-chartjs-2, etc.
            // rc-* and @ant-design/* are Ant Design internals that also call React APIs.
            if (
              id.includes('/react') ||
              id.includes('/antd/') ||
              id.includes('/@ant-design/') ||
              id.includes('/rc-') ||
              id.includes('/scheduler/') ||
              id.includes('/use-count-up/') ||
              id.includes('/countup.js/')
            ) {
              return 'vendor-react-ui';
            }

            if (id.includes('/ag-grid')) {
              return 'vendor-aggrid';
            }
            if (
              id.includes('/chart.js') ||
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
