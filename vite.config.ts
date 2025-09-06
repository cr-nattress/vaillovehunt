import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - run npm run build to generate
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    // Enable more aggressive code splitting
    rollupOptions: {
      output: {
        // Code splitting strategy
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          // State management
          'state-vendor': ['zustand'],
          // API and validation
          'api-vendor': ['zod'],
          // Utility libraries (if any large ones are added)
          'utils-vendor': [], // placeholder for future utilities
        },
        // Optimize chunk file names
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize build size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Performance optimizations
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: ['react', 'react-dom', 'zustand', 'zod'],
    // Exclude problematic deps from pre-bundling if needed
    exclude: [],
  },
  // Server configuration for development
  server: {
    // Enable compression
    middlewareMode: false,
    // Performance options
    fs: {
      // Allow serving files outside of root for better flexibility
      strict: false,
    },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
  },
})