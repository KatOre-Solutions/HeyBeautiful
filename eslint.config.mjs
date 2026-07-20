// Flat ESLint config (ESLint 9 / Next 16). `next lint` was removed in Next 16,
// so lint is invoked directly as `eslint .` — see issue #52.
//
// `eslint-config-next` ships flat-config arrays under these subpaths:
//   /core-web-vitals — base Next rules + Core Web Vitals checks (as errors)
//   /typescript      — TypeScript parser + TS-aware rules
// Both are spread in below. Keep the major in lockstep with `next`.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      '.netlify/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Underscore-prefixed identifiers are intentional throwaways (unused
      // callback params, destructure placeholders). Treat the prefix as the
      // opt-out rather than sprinkling per-line disables.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default config;
