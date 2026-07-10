// Babel is used by Metro (bundling) and by jest-expo (test transform). Metro can find
// babel-preset-expo on its own, but under pnpm's isolated node_modules jest cannot —
// so babel-preset-expo is an explicit devDependency of this package. The preset reads
// app.json `experiments` (typed routes, React Compiler) and wires the matching plugins.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
