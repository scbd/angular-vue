import kebabCase from 'lodash-es/kebabCase';
import AngularVueComponent from '../components/vue-ng';
import { shallowRef, inject } from 'vue';
const defaultInjectKey = 'ngVue';

class AngularVuePlugin {
  #injector = shallowRef(null);
  #ngApp = shallowRef(null);

  constructor ({ $injector, ngApp }) {
    if (!$injector) { throw new Error('Angular $injector not provided, cannot use AngularVuePlugin plugin'); }

    this.#injector.value = $injector;
    this.#ngApp.value = ngApp;
  }

  get $injector () { return this.#injector.value; }
  get ngApp () { return this.#ngApp.value; }

  install (app, options) {
    const { vueNgName } = options || {};

    app.provide(defaultInjectKey, this);
    app.component(kebabCase(vueNgName || 'VueNg'), AngularVueComponent);

    app.config.globalProperties.$ngVue = this;
  }
}

export function createNgVue (options) {
  return new AngularVuePlugin(options);
}

export function useNgVue () {
  return inject(defaultInjectKey);
}
