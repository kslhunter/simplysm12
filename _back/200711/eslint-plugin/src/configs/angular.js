"use strict";

module.exports = {
  overrides: [
    {
      files: ["*.ts"],
      plugins: ["@angular-eslint"],
      rules: {
        "@angular-eslint/component-class-suffix": ["error", {
          suffixes: ["Page", "Component", "Modal", "Control", "PrintTemplate", "Toast"]
        }],
        "@angular-eslint/directive-selector": [
          "error",
          {type: "attribute", prefix: "sd", style: "camelCase"}
        ],
        "@angular-eslint/component-selector": [
          "error",
          {type: "element", prefix: "sd", style: "kebab-case"}
        ],
        "@angular-eslint/contextual-lifecycle": "error",
        "@angular-eslint/directive-class-suffix": "error",
        "@angular-eslint/no-attribute-decorator": "error",
        "@angular-eslint/no-conflicting-lifecycle": "error",
        "@angular-eslint/no-host-metadata-property": "error",
        "@angular-eslint/no-input-prefix": "error",
        "@angular-eslint/no-inputs-metadata-property": "error",
        "@angular-eslint/no-lifecycle-call": "error",
        "@angular-eslint/no-output-on-prefix": "error",
        "@angular-eslint/no-output-rename": "error",
        "@angular-eslint/no-outputs-metadata-property": "error",
        "@angular-eslint/no-pipe-impure": "error",
        "@angular-eslint/no-queries-metadata-property": "error",
        "@angular-eslint/prefer-on-push-component-change-detection": "error",
        "@angular-eslint/prefer-output-readonly": "error",
        "@angular-eslint/relative-url-prefix": "error",
        "@angular-eslint/use-component-selector": "error",
        "@angular-eslint/use-component-view-encapsulation": "error",
        "@angular-eslint/use-injectable-provided-in": "error",
        "@angular-eslint/use-lifecycle-interface": "error",
        "@angular-eslint/use-pipe-decorator": "error",
        "@angular-eslint/use-pipe-transform-interface": "error"
      },
      overrides: [
        {
          files: ["+(*Page.ts|*Component.ts|*Modal.ts|*Control.ts|*PrintTemplate.ts|*Toast.ts)"],
          plugins: ["@simplysm"],
          processor: "@simplysm/extract-angular-inline-html"
        }
      ]
    },
    {
      files: ["+(*Page.html|*Component.html|*Modal.html|*Control.html|*PrintTemplate.html|*Toast.html)"],
      parser: "@angular-eslint/template-parser",
      plugins: ["@angular-eslint/template"],
      rules: {
        "@angular-eslint/template/cyclomatic-complexity": "off",
        "@angular-eslint/template/no-call-expression": "off",

        "@angular-eslint/template/banana-in-a-box": "error",
        "@angular-eslint/template/no-negated-async": "error"
      }
    }
  ]
};