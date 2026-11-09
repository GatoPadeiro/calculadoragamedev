import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { paginasParaBuscadores } from './src/paginas/paginasParaBuscadores';

export default defineConfig({
  plugins: [react(), paginasParaBuscadores()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
