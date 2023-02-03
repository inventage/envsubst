module.exports = {
  extends: ['eslint:recommended', 'plugin:unicorn/recommended', 'prettier'],
  plugins: ['import'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: { node: true },
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
  },
  overrides: [],
};
