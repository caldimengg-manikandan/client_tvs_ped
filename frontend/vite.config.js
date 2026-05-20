import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],

    // Force all React-family imports to resolve to a single instance.
    // Without this, nested node_modules may pull in a second copy of React
    // that has no active dispatcher, causing "First argument must be a
    // function" and similar runtime crashes in the production bundle.
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'scheduler',
      ],
    },

    build: {
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
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
      // drop console/debugger only in production to keep bundle clean
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  };
})
