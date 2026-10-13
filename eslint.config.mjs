import base from "@cyc-seattle/ts-config/eslint";

export default [
  ...base,
  // Parse Server loads the fake's files with require(), so they're CommonJS.
  {
    files: ["fake/**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];
