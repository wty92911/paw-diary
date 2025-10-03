import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import sonarjs from 'eslint-plugin-sonarjs'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
import { fixupPluginRules } from '@eslint/compat'

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
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react': fixupPluginRules(react),
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': fixupPluginRules(jsxA11y),
      'sonarjs': sonarjs,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...jsxA11y.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // === Unused Code Analysis ===
      // Remove unused imports automatically
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // TypeScript unused vars (disabled in favor of unused-imports plugin)
      '@typescript-eslint/no-unused-vars': 'off',

      // === Code Quality & Complexity ===
      // Limit function complexity (off for complex UI components - warnings not allowed in strict mode)
      'complexity': 'off',
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',

      // SonarJS rules for code quality (relaxed for React components)
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-inverted-boolean-check': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/no-nested-conditional': 'off', // Too restrictive for React conditional rendering
      'sonarjs/no-nested-functions': 'off', // Common pattern in React hooks
      'sonarjs/pseudo-random': 'off', // Allow Math.random() for UI - not cryptographic
      'sonarjs/todo-tag': 'off', // Allow TODO comments during development
      'sonarjs/no-commented-code': 'off', // Allow commented code during development
      'sonarjs/no-intrusive-permissions': 'off', // Geolocation is a feature
      'sonarjs/prefer-single-boolean-return': 'off', // Readability over brevity
      'sonarjs/concise-regex': 'off', // Explicit regex is clearer
      'sonarjs/single-char-in-character-classes': 'off', // Clarity
      'sonarjs/no-redundant-assignments': 'off', // Sometimes needed for clarity
      'sonarjs/no-unused-vars': 'off', // Handled by unused-imports plugin

      // === TypeScript Strict Rules ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // === React Best Practices ===
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/jsx-uses-react': 'off',
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-array-index-key': 'off', // Sometimes necessary for static lists
      'react/jsx-no-useless-fragment': 'off',
      'react/self-closing-comp': 'off',
      'react/no-unescaped-entities': 'off', // Allow quotes in JSX

      // === Accessibility (a11y) ===
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'off', // Complex component patterns
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off', // Complex form patterns with Controller
      'jsx-a11y/no-autofocus': 'off', // Intentional UX pattern
      'jsx-a11y/img-redundant-alt': 'off', // Descriptive alt text is better
      'jsx-a11y/heading-has-content': 'off', // Dynamic content headings

      // === Code Style ===
      'no-console': 'off', // Allow console during development
      'no-debugger': 'error',
      'no-useless-escape': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // SonarJS style rules (all off - handled by other rules)
      'sonarjs/use-type-alias': 'off', // Too restrictive for React props
    },
  },
  // Header component specific rules
  {
    files: ['src/components/header/**/*.{ts,tsx}'],
    rules: {
      // Allow both PascalCase (components) and camelCase (utilities) for functions
      '@typescript-eslint/naming-convention': 'off',
      // Ensure proper prop destructuring for better performance
      'react/destructuring-assignment': 'off',
      // Allow empty interfaces for extending base types
      '@typescript-eslint/no-empty-interface': 'off',
      // Strict null checks for header configurations
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  // Block components and utilities with complex type scenarios
  {
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'error', // Strict: No @ts-nocheck allowed
      'react-hooks/rules-of-hooks': 'off', // Complex Controller patterns
      'react-hooks/exhaustive-deps': 'off', // Controller render functions
    },
  },
)
