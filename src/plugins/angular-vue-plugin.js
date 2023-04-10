import angular from 'angular';
import AngularVueComponent from "../components/vue-ng.js";
import pascalCase from '../libs/pascal-case.js';

export default function AngularVuePlugin({ $injector, ngApp, vueApp }) {

  // if(!$injector)
  //     throw new Error('Angular $injector not provided, cannot use AngularVuePlugin plugin');

  const ngVuePlugin = {
    get $injector()   { return $injector || angular.injector(); },
    get vueApp()      { return vueApp; },
    get ngApp()       { return ngApp; },
  }

  return {

    install(Vue, options) {
        if(!Vue.prototype.$ngVue) {

          const { vueNgName } = options || {};

          Vue.component(pascalCase(vueNgName || 'VueNg'), AngularVueComponent)

          Object.defineProperty(Vue.prototype, '$ngVue', {
            get () { return ngVuePlugin }
          })
        }
    }
  };
}
