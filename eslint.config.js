import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Naming convention enforcement
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables must be camelCase or UPPER_CASE
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          filter: {
            // Allow React component variables
            regex: '^(Component|[A-Z])',
            match: false,
          },
        },
        // Functions must be camelCase (except React components)
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // Interfaces, Types, Classes must be PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Object properties must be camelCase
        {
          selector: 'property',
          format: ['camelCase'],
          // Allow quoted properties for special cases
          filter: {
            regex: '^(data-|aria-)',
            match: false,
          },
        },
        // Enum members can be PascalCase or UPPER_CASE
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        // Parameters must be camelCase
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],

      // Warn about snake_case usage (common mistake)
      'no-underscore-dangle': ['warn', {
        allow: ['_id'], // Allow MongoDB _id
        allowAfterThis: false,
        allowAfterSuper: false,
        enforceInMethodNames: true,
      }],
    },
  },
])
