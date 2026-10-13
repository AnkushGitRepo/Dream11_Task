import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'data', 'coverage', 'playwright-report'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    // Server-only code (LLM/TTS providers and their keys) must never be bundled into the client.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // templates.ts is the one client-safe module in shared/ai (pure, deterministic fallbacks).
              group: [
                '**/shared/ai/*',
                '!**/shared/ai/templates',
                '@shared/ai/*',
                '!@shared/ai/templates',
                '**/api/*',
              ],
              message: 'Server-only module: import it from api/ only, never from src/.',
            },
          ],
        },
      ],
    },
  },
);
