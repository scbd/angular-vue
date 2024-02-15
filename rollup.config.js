import { nodeResolve } from '@rollup/plugin-node-resolve';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const babel = () => getBabelOutputPlugin({
  presets: [['@babel/preset-env', { targets: "> 0.25%, not dead"}]],
  allowAllFormats: true,
});

const external = ['vue', 'angular']
const globals = {
  angular: 'angular',
  vue    : 'vue',
};

const input = ['src/index.js'];

const outputOptions = {
  sourcemap: true,
  exports: "named",
  globals,
};


export default [
  {
    // UMD
    input,
    external,
    plugins: [nodeResolve(), babel()],
    output: {
      ...outputOptions,
      file: `dist/index.js`,
      format: "umd",
      name: "AngularVue", // this is the name of the global object
      esModule: false,
    },
  },
  // ESM and CJS
  {
    input,
    external,
    plugins: [nodeResolve()],
    output: [
      {
        ...outputOptions,
        dir: "dist/esm",
        format: "esm",
      },
      {
        ...outputOptions,
        dir: "dist/cjs",
        format: "cjs",
      },
    ],
  }
];
