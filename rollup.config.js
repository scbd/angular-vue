import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const babel = () => getBabelOutputPlugin({
  presets: [['@babel/preset-env', { targets: "> 0.25%, not dead"}]],
  allowAllFormats: true,
})

const globals = {
  angular: 'angular',
  Vue    : 'Vue',
};

export default [
  bundle('src/index.js',                             'dist/index.js',                        'AngularVue'),
  bundle('src/directives/ng-vue.js',                 'dist/directives/ng-vue.js',            'AngularVueDirective'),
  bundle('src/directives/ng-vue-2.js',               'dist/directives/ng-vue2.js',           'AngularVue2Directive'),
  bundle('src/components/vue-ng.js',                 'dist/components/vue-ng.js',            'VueAngularComponent'),
  bundle('src/plugins/angular-vue-plugin.js',        'dist/plugins/ng-vue-plugin.js',        'AngularVuePlugin'),
  bundle('src/plugins/angular-vue-plain-plugin.js',  'dist/plugins/ng-vue-plain-plugin.js',  'AngularVuePlainPlugin'),
  bundle('src/plugins/angular-vue-route-plugin.js',  'dist/plugins/ng-vue-route-plugin.js',  'AngularVueRoutePlugin'),
  bundle('src/plugins/angular-vue-router-plugin.js', 'dist/plugins/ng-vue-router-plugin.js', 'AngularVueRouterPlugin'),

  //Legacy Compatibility
  bundle('src/ng-vue-module.js',  'dist/angular-vue.js',         'AngularVueModule'),
  bundle('src/plugins/index.js',  'dist/angular-vue-plugins.js', 'AngularVuePlugins'),
];

function bundle(inFile, outFile, name) {

  const outputOptions = {
    format   : 'esm',
    sourcemap: true,
    name,
    globals,
  };

  return {
    input : inFile,
    output: [
      { ...outputOptions, format : 'umd', file: outFile },
      { ...outputOptions, format : 'umd', file: outFile.replace(/\.js$/, '.min.js'),  plugins: [ terser() ] },
      { ...outputOptions, format : 'esm', file: outFile.replace(/\.js$/, '.mjs') },
      { ...outputOptions, format : 'esm', file: outFile.replace(/\.js$/, '.min.mjs'), plugins: [ terser() ] },
    ],
    external: [ ...Object.keys(globals) ],
    plugins : [
      nodeResolve(),
      commonjs(),
      babel(),
    ],
  }

}