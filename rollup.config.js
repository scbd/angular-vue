// rollup.config.js (building more than one bundle)
import { terser } from 'rollup-plugin-terser';
import { eslint } from "rollup-plugin-eslint";
import babel from '@rollup/plugin-babel';

const globals = {
  lodash : '_',
  angular: 'angular',
  Vue    : 'Vue',
};

const plugins = []

if(process.env.ROLLUP_WATCH=='true') {
  plugins.push(eslint({ fix: true })) // eslint --fix in dev/watch mode
}

plugins.push(babel({ babelHelpers: 'bundled' })) // use babel

const outputOptions = {
  format   : 'umd',
  sourcemap: true,
  globals,
};

export default [{
  input : './src/index.js',
  output: [{
    ...outputOptions,
    file: 'dist/angular-vue.js',
  }, {
    ...outputOptions,
    file   : 'dist/angular-vue.min.js',
    plugins: [ terser() ],
  }],
  external: [ ...Object.keys(globals) ],
  plugins : [ ...plugins],
}];
