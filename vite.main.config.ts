import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, we need to tell Vite to build them in Node.js.
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      // Add external dependencies to prevent bundling
      external: [
        'better-sqlite3',
        'sqlite3',
        // Add any other native modules here
      ],
      output: {
        format: 'cjs',
      },
    },
  },
});
