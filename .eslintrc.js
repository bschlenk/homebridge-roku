module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],

  parserOptions: {
    sourceType: 'script',
  },

  rules: {
    'max-classes-per-file': 'off',
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off', // I wish python had this, don't take it away from js
    strict: 'off',
  },
};
