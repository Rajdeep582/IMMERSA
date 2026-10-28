import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      // The editor's atomic-write temp files and native watchers can hit
      // Windows EBUSY locks; polling is slower but stable in this workspace.
      usePolling: true,
      interval: 400,
      ignored: ['**/.tmp/**', '**/*.tmpdir/**', '**/*.TMP', '**/*.tmp', '**/*~RF*', '**/dist/**'],
    },
  },
});

