import { inject } from 'vue';
import safeApply from '../libs/safe-apply';

const defaultInjectKey = 'router';

class AngularVueRouterPlugin {
  #ngVue;

  constructor ({ plugins } = {}) {
    if (!plugins?.ngVue) throw Error('option: plugins.ngVue is not set');

    this.#ngVue = plugins.ngVue;
  }

  get #location () {
    const { $injector } = this.#ngVue;
    const $location = $injector.get('$location');
    return $location;
  }

  get #rootScope () {
    const { $injector } = this.#ngVue;
    const $rootScope = $injector.get('$rootScope');
    return $rootScope;
  }

  push ({ path, query, hash }) {
    const $location = this.#location;
    const $rootScope = this.#rootScope;

    safeApply($rootScope, () => {
      if (path) { $location.path(path); }
      if (query) { $location.search(query || {}); }
      if (hash !== undefined) { $location.hash((hash || '').replace(/^#/, '')); }
    });
  }

  replace (...args) {
    const $location = this.#location;
    const $rootScope = this.#rootScope;

    safeApply($rootScope, () => {
      $location.replace();
      this.push(...args);
    });
  }

  install (app, options) {
    app.provide(defaultInjectKey, this);

    if (!app.config.globalProperties.$router) { app.config.globalProperties.$router = this; }
  }
}

export function createRouter ({ plugins }) {
  return new AngularVueRouterPlugin({ plugins });
}

export function useRouter () {
  return inject(defaultInjectKey);
}
