import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      '.expo/**',
      'node_modules/**',
      'dist/**',
      'android/**',
      'ios/**',
      'src/components/**',
      'src/screens/**',
      'src/hooks/**',
      'src/navigation/**',
      'scripts/**',
    ],
    files: ['src/utils/**/*.ts', 'tests/**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-tabs': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-console': 'warn',
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    },
  },
]);
