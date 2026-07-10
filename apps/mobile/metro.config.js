// Metro config for this pnpm + Turborepo monorepo.
//
// Out of the box Metro only looks inside the app's own folder. In a workspace the
// real sources of @ager/api-client and @ager/shared live at packages/*, and pnpm
// links dependencies through an isolated, symlinked store — so Metro has to (1) watch
// the whole workspace and (2) know both node_modules roots. See
// https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch every file in the monorepo so edits to packages/* trigger a reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then fall back to the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
