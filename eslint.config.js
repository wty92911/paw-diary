import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { 
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'src-tauri/target/',
      '*.min.js',
      '*.bundle.js',
      'coverage/',
      '*.log'
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Header component specific rules
  {
    files: ['src/components/header/**/*.{ts,tsx}'],
    rules: {
      // Enforce React component naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'function',
          format: ['PascalCase'],
          filter: {
            regex: '^use[A-Z]',
            match: false,
          },
        },
        {
          selector: 'function',
          format: ['camelCase'],
          filter: {
            regex: '^use[A-Z]',
            match: true,
          },
        },
      ],
      // Ensure proper prop destructuring for better performance
      'react/destructuring-assignment': 'off',
      // Allow empty interfaces for extending base types
      '@typescript-eslint/no-empty-interface': 'off',
      // Strict null checks for header configurations
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
)
