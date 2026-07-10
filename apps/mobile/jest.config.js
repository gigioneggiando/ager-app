// jest-expo gives tests the React Native / Expo transform + environment. For M1 the
// suite is intentionally pure-logic (no native rendering) so it stays fast and stable
// in CI; component tests (react-native-testing-library) arrive with the feature PRs.
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
