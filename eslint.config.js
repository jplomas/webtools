import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';

// Replaces the previous .eslintrc.js, which configured airbnb and the
// deprecated babel-eslint parser but was never installed and never ran in CI.
// `npm run lint` is now a gate in .github/workflows/ci.yml.

// Constants injected by Vite's `define` (see vite.config.js).
const buildTimeGlobals = {
  __APP_VERSION__: 'readonly',
  __APP_BUILD_ID__: 'readonly',
  __OFFLINE_BUILD__: 'readonly',
  __QRLLIB_VERSION__: 'readonly',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/qrllib.js',
      'test-results/**',
      'playwright-report/**',
    ],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // Browser-side application code.
  {
    files: ['src/**/*.js', 'src/**/*.vue'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: vueParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        ...globals.browser,
        ...buildTimeGlobals,
        QRLLIB: 'readonly',
      },
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      // Route components are legitimately single-word (Home, Docs, About).
      'vue/multi-word-component-names': 'off',
      // The templates mix shorthand and long form. Picking one would mean a
      // large mechanical diff across markup, which is not worth carrying on a
      // security branch — revisit separately.
      'vue/v-on-style': 'off',
      'vue/v-bind-style': 'off',
      'vue/component-definition-name-casing': 'off',
      'vue/order-in-components': 'off',
      // The template is long-form markup; wrapping it does not aid review.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/max-len': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
    },
  },

  // Web Worker context.
  {
    files: ['src/wallet-worker.js'],
    languageOptions: {
      globals: { ...globals.worker },
    },
    rules: {
      // The worker evaluates the QRLLIB UMD bundle, imported as text at build
      // time, so that it initialises in the worker's global scope. It is a
      // pinned build-time artefact, not user input, and there is no other way
      // to load a UMD bundle into a module worker.
      'no-eval': 'off',
    },
  },

  // Node-side tooling and tests.
  {
    files: ['*.config.js', 'test/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Playwright specs and the screenshot capture script run in Node but
  // evaluate callbacks inside the page, so both environments are in scope.
  {
    files: ['browser-tests/**/*.js', 'scripts/capture-screenshots.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'off',
    },
  },
];

