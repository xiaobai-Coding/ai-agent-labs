module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
}

