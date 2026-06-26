import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'out/', '.vite/', 'dist/', '**/*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Injected by @electron-forge/plugin-vite (declared in forge.env.d.ts).
        MAIN_WINDOW_VITE_DEV_SERVER_URL: 'readonly',
        MAIN_WINDOW_VITE_NAME: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  // CommonJS build-tool configs (postcss/tailwind) at the repo root.
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Electron security boundary (CLAUDE.md §5.2): the renderer, shared, and
  // audience layers must never import privileged main-process APIs. Hard errors
  // so a regression fails lint and CI.
  {
    files: ['src/renderer/**', 'src/shared/**', 'src/audience/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'electron',
              message:
                'No electron in renderer/shared/audience — use the preload window.api bridge.',
            },
            {
              name: 'electron/renderer',
              message: 'No direct electron access in the renderer.',
            },
            {
              name: 'fs',
              message: 'No fs in renderer/shared/audience — main process only.',
            },
            {
              name: 'better-sqlite3',
              message: 'Database access is main-process only.',
            },
          ],
          patterns: [
            {
              group: ['node:*'],
              message: 'No node:* modules in renderer/shared/audience — main process only.',
            },
          ],
        },
      ],
    },
  },
  // Must be last: turn off stylistic rules that conflict with Prettier.
  prettier,
);
