import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const SERVER_ENV_KEYS = [
  'GEMINI_API_KEY',
  'LLM_MODEL',
  'TTS_PROVIDER',
  'TTS_MODEL',
  'RATE_LIMIT_PER_MIN',
] as const;

/** Mounts the /api/* handlers in `vite dev` (same code Vercel runs in production). Dev-only. */
function apiDevPlugin(): Plugin {
  return {
    name: 'kya-hua-api-dev',
    apply: 'serve',
    configureServer(server) {
      // Server-only secrets come from .env* via Vite's own loader and never reach the client bundle.
      const env = loadEnv(server.config.mode, server.config.root, '');
      for (const key of SERVER_ENV_KEYS) {
        if (env[key] && process.env[key] === undefined) process.env[key] = env[key];
      }
      for (const route of ['speak', 'learn']) {
        server.middlewares.use(`/api/${route}`, (req, res) => {
          server
            .ssrLoadModule(`/api/${route}.ts`)
            .then((mod) =>
              (mod as { default: (r: typeof req, s: typeof res) => Promise<void> }).default(req, res),
            )
            .catch((error: unknown) => {
              server.config.logger.error(`[api/${route}] ${error instanceof Error ? error.name : 'error'}`);
              res.statusCode = 500;
              res.end(JSON.stringify({ code: 'INTERNAL', message: 'Unexpected error.' }));
            });
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts', 'api/**/*.test.ts'],
    css: false,
  },
});
