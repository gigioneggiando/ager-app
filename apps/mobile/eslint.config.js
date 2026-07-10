// Flat ESLint config for the mobile app — Expo's shared rules (React Native, imports,
// a11y) via eslint-config-expo. https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "expo-env.d.ts"],
  },
]);
