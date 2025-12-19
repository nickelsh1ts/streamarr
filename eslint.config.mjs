import formatjs from 'eslint-plugin-formatjs';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import nextConfig from 'eslint-config-next';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

const eslintConfig = [
  ...nextConfig,
  prettier,
  {
    plugins: {
      formatjs,
      'no-relative-import-paths': noRelativeImportPaths,
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },

    rules: {
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'arrow-parens': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',

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

      // Restored TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // Restored accessibility rules
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
    },
  },
];

export default eslintConfig;
