module.exports = {
  env: {
    node: true,
    es2020: true
  },
  plugins: ["import"],
  rules: {
    // import
    "import/no-extraneous-dependencies": ["error"],

    "no-console": ["warn"],
    "no-warning-comments": ["warn"],

    "require-await": ["error"],
    "quotes": ["error"],
    "semi": ["error"],
    "no-shadow": ["error"],
    "no-duplicate-imports": ["error"],
    "no-unused-expressions": ["error"],
    "no-unused-vars": ["error"],
    "no-undef": ["error"],
    // "comma-dangle": ["error"]
  }
};