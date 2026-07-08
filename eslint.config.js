// @ts-check
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = tseslint.config(
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'playwright/.auth/**'],
  },
  tseslint.configs.recommended,
  {
    files: ['*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
