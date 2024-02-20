import { ref, unref, computed, inject } from 'vue';
const defaultInjectKey = 'route';

class AngularVueRoutePlugin {
  #ngVue;
  #routeRef = ref({});

  constructor ({ plugins } = {}) {
    if (!plugins?.ngVue) throw Error('option: plugins.ngVue is not set');

    this.#ngVue = plugins.ngVue;

    this.#rootScope.$on('$routeUpdate', () => this.#updateRoute());
    this.#rootScope.$on('$routeChangeSuccess', () => this.#updateRoute());

    console.log('this.#route', this.#route);
    if (!this.#route.current) { // initial route (at boot time)
      const cancelWatch = this.#rootScope.$watch(() => this.#route.current, (currentRoute) => {
        if (currentRoute === undefined) return;
        cancelWatch();
        this.#updateRoute();
      });
    }

    this.#updateRoute();
  }

  get #location () {
    const { $injector } = this.#ngVue;
    const $location = $injector.get('$location');
    return $location;
  }

  get #route () {
    const { $injector } = this.#ngVue;
    const $route = $injector.get('$route');
    return $route;
  }

  get #rootScope () {
    const { $injector } = this.#ngVue;
    const $rootScope = $injector.get('$rootScope');
    return $rootScope;
  }

  #updateRoute () {
    const fullPath = this.#location.url();
    const path = this.#location.path();
    const hash = this.#location.hash() ? `#${this.#location.hash()}` : '';
    const query = { ...(this.#location.search() || {}) };
    const params = { ...(this.#route.current?.params || {}) };

    this.#routeRef.value = {
      fullPath,
      path,
      hash,
      query,
      params
    };
  }

  get fullPath () { return this.#routeRef.value.fullPath; }
  get path () { return this.#routeRef.value.path; }
  get hash () { return this.#routeRef.value.hash; }
  get query () { return this.#routeRef.value.query; }
  get params () { return this.#routeRef.value.params; }

  install (app, options) {
    app.provide(defaultInjectKey, computed(() => unref(this.#routeRef)));

    Object.defineProperty(app.config.globalProperties, '$route', {
      enumerable: true,
      get: () => unref(this.#routeRef)
    });
  }
}

export function createRoute ({ plugins }) {
  return new AngularVueRoutePlugin({ plugins });
}

export function useRoute () {
  return inject(defaultInjectKey);
}
