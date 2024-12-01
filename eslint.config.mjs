import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import formatjs from 'eslint-plugin-formatjs';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:react/jsx-runtime',
      'prettier'
    )
  ),
  {
    plugins: {
      'jsx-a11y': fixupPluginRules(jsxA11Y),
      'react-hooks': fixupPluginRules(reactHooks),
      formatjs,
      'no-relative-import-paths': noRelativeImportPaths,
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 6,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        pragma: 'React',
        version: '18.3.1',
      },
    },

    rules: {
      '@typescript-eslint/camelcase': 0,
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/no-unused-expressions': ['off'],
      'jsx-a11y/no-noninteractive-tabindex': 0,
      'arrow-parens': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
        },
      ],

      'jsx-a11y/no-onchange': 'off',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: true,
        },
      ],
    },
  },
  {
    files: ['src/**/*.tsx'],

    rules: {
      'react/prop-types': 'off',
    },
  },
];
