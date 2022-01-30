module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  /*extends: [
    "plugin:@typescript-eslint/all"
  ],*/
  rules: {
    "@typescript-eslint/explicit-member-accessibility": ["error"],
    "@typescript-eslint/require-await": ["error"],
    "@typescript-eslint/await-thenable": ["error"],
    "@typescript-eslint/quotes": ["error"],
    "@typescript-eslint/semi": ["error"],
    "@typescript-eslint/no-shadow": ["error"],
    "@typescript-eslint/member-delimiter-style": ["error"],
    "@typescript-eslint/no-unnecessary-condition": ["error", { allowConstantLoopConditions: true }],
    "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
    "@typescript-eslint/non-nullable-type-assertion-style": ["error"],
    "@typescript-eslint/prefer-reduce-type-parameter": ["error"],
    "@typescript-eslint/prefer-return-this-type": ["error"],
    "@typescript-eslint/no-duplicate-imports": ["error"],
    "@typescript-eslint/prefer-readonly": ["error"],
    "@typescript-eslint/typedef": ["error"],
    "@typescript-eslint/explicit-function-return-type": ["error", {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowDirectConstAssertionInArrowFunctions: true,
      allowConciseArrowFunctionExpressionsStartingWithVoid: true
    }],
    "@typescript-eslint/no-unused-expressions": ["error"],
    "@typescript-eslint/no-unused-vars": ["error"]
  }
};