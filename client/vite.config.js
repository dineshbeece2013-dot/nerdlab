import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Only /api is proxied. `/tasks` and `/tasks/:id` are app routes, and
      // proxying them meant any full page load there returned an API 404
      // instead of the lab catalogue. Lab HTML is fetched via
      // /api/tasks/:id/content, so nothing needs the server's static mount.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Bundle labs are static files served by the API (ADR-010). Safe to
      // proxy: /labs is not an app route, unlike /tasks.
      '/labs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
