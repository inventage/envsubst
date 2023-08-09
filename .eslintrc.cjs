module.exports = {
  extends: ['eslint:recommended', 'plugin:unicorn/recommended', 'prettier'],
  plugins: ['import', 'no-only-tests', 'ava', 'require-extensions'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: { node: true },
  rules: {
    'no-only-tests/no-only-tests': 'error',
    'import/extensions': ['error', 'ignorePackages'],
  },
  overrides: [],
};
