import angular from 'angular';
import AngularVueComponent from "../components/ng-vue.js";
import camelCase from "lodash/camelCase";

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

          const { ngVueName } = options || {};
 
          if(ngVueName && ngVueName!=camelCase(ngVueName)) 
            throw new Error("ngVueName component name must be 'camelCase'")

          Vue.component(ngVueName || 'ngVue', AngularVueComponent)

          Object.defineProperty(Vue.prototype, '$ngVue', {
            get () { return ngVuePlugin }
          })
        }
    }
  };
}
