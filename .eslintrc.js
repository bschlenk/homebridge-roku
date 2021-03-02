module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },

  rules: {
    'max-classes-per-file': 'off',
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    strict: 'off',
  },

  overrides: [
    {
      files: ['*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-new': 'off',
      },
    },
  ],
};
