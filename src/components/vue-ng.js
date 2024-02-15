import camelCase from 'lodash-es/camelCase';
import safeApply from '../libs/safe-apply';
import renderVNodeToDomElement from '../libs/render-v-node-to-dom-element';
import { h, shallowRef } from 'vue';

export default {
  setup () {
    return { ngScope: shallowRef(null) };
  },
  render () {
    return h(null, 'angular placeholder');
  },
  mounted () {
    if (!this.$ngVue) throw new Error('AngularVuePlugin not installed');

    const { $injector } = this.$ngVue;

    // lookup throughout parent tree first to find closest ngScope.... otherwise
    const $parentScope = angular.element(this.$el).parents('.ng-scope:first')?.scope() ||
            $injector.get('$rootScope');

    const $scope = $parentScope.$new(true); // create new isolated scope!
    this.ngScope = $scope;

    Object.keys(this.$attrs).forEach(attrKey => {
      const propKey = camelCase(attrKey);

      console.debug(`vue(ng): initial set vue => ng (${propKey}):`, this.$attrs[attrKey]);

      $scope[propKey] = this.$attrs[attrKey];

      // From Vue => Angular
      this.$watch(() => this.$attrs[attrKey], (v) => {
        if ($scope.$$destroyed) return;

        safeApply($scope, () => {
          if ($scope[propKey] === v) return;

          console.debug(`vue(ng): vue => ng (${propKey})`, v);
          $scope[propKey] = v;
        });
      });

      // From Angular => Vue
      $scope.$watch(() => $scope[propKey], (v) => {
        if (this.$attrs[attrKey] === v) return;

        console.debug(`vue(ng): ng => vue (${propKey})`, v);

        this.$emit(`update:${propKey}`, v);
      });
    });

    const domElement = renderVNodeToDomElement(this.$slots.default()); // convert default slot to domElement
    const $compile = $injector.get('$compile');
    const bindFn = $compile(domElement);
    const [ngElement] = bindFn($scope); // Bind to scope

    ngElement.$component = this; // save current component to DOM element

    // Replace this component wrapper (this.$el) in the browser DOM with the angular one (ngElement)
    this.$el.parentElement.replaceChild(ngElement, this.$el);

    $scope.$applyAsync(() => {});
  },
  beforeUnmount () {
    const $scope = this.ngScope;

    if ($scope) {
      this.ngScope = null;
      console.debug('vue(ng): destroying ng-scope', $scope);
      $scope.$destroy();
    }
  }
};
