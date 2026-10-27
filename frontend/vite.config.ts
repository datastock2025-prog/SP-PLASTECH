import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname, '..'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/node_modules/')) {
              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/react-router/') ||
                normalizedId.includes('/node_modules/react-router-dom/')
              ) {
                return 'vendor-react';
              }
              if (normalizedId.includes('/node_modules/@tanstack/')) {
                return 'vendor-query';
              }
              if (normalizedId.includes('/node_modules/lucide-react/')) {
                return 'vendor-icons';
              }
              if (
                normalizedId.includes('/node_modules/chart.js/') ||
                normalizedId.includes('/node_modules/react-chartjs-2/') ||
                normalizedId.includes('/node_modules/recharts/')
              ) {
                return 'vendor-charts';
              }
              if (normalizedId.includes('/node_modules/xlsx/')) {
                return 'vendor-xlsx';
              }
              if (
                normalizedId.includes('/node_modules/zod/') ||
                normalizedId.includes('/node_modules/date-fns/') ||
                normalizedId.includes('/node_modules/clsx/') ||
                normalizedId.includes('/node_modules/tailwind-merge/')
              ) {
                return 'vendor-utils';
              }
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL || 'http://localhost:4000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res) => {
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API server offline, serving from multi-tenant client store' }));
              }
            });
          },
        },
      },
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/middleware/**', '**/db/**', '**/docs/**'],
      },
    },
  };
});
