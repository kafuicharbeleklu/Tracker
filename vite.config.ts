import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: mode === 'production' ? '/Tracker/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@azure/msal')) return 'vendor-msal';
              if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
              if (id.includes('html2canvas')) return 'vendor-html2canvas';
              if (id.includes('jspdf')) return 'vendor-jspdf';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
              if (id.includes('tesseract.js')) return 'vendor-ocr';
              if (id.includes('dompurify') || id.includes('purify')) return 'vendor-dompurify';
              return 'vendor';
            }

            if (/src[\\/]data[\\/]mockData\.tsx?$/.test(id) || /src[\\/]context[\\/]DataContext\.tsx?$/.test(id)) {
              return 'app-data';
            }

            return undefined;
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
