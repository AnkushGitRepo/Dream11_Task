import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';

// aiService loads the offline mock with a dynamic import. Warm it once so tests that use fake
// timers are not waiting on a real module load.
beforeAll(async () => {
  await import('@/services/mockApi');
});
