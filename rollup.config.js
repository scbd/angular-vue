// rollup.config.js (building more than one bundle)
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const globals = {
  angular: 'angular',
  Vue    : 'Vue',
};

const outputOptions = {
  format   : 'umd',
  sourcemap: true,
  globals,
};

const babel = () => getBabelOutputPlugin({
  presets: [['@babel/preset-env', { targets: "> 0.25%, not dead"}]],
  allowAllFormats: true,
})

export default [{
  input : './src/index.js',
  output: [{
    ...outputOptions,
    file: 'dist/angular-vue.js',
  }],
  external: [ ...Object.keys(globals) ],
  plugins : [
    nodeResolve(),
    commonjs(),
    babel(),
  ],
},
{
  input : './src/plugins/index.js',
  output: [{
    ...outputOptions,
    file: 'dist/angular-vue-plugins.js',
    name:'AngularVuePlugins'
  }],
  external: [ ...Object.keys(globals) ],
  plugins : [
    nodeResolve(),
    commonjs(),
    babel(),
  ],
}];
