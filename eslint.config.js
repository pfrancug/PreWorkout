import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      'react/jsx-curly-brace-presence': [
        'warn',
        {
          props: 'always',
          propElementValues: 'always',
          children: 'always',
        },
      ],
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: false,
          ignoreCase: true,
          multiline: 'last',
          noSortAlphabetically: false,
          reservedFirst: false,
          shorthandFirst: true,
        },
      ],
    },
  },
]);
