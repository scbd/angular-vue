import { parseAttrs } from '../libs/vue-attrs';
import { safeApply } from '../libs/angular-calls';
import renderVNodeToDomElement from '../libs/render-v-node-to-dom-element';
import { shallowRef } from 'vue';

// NOT FULLY FUNCTIONNAL
// NOT FULLY FUNCTIONNAL
// NOT FULLY FUNCTIONNAL
// NOT FULLY FUNCTIONNAL
// NOT FULLY FUNCTIONNAL
// NOT FULLY FUNCTIONNAL

export default {
  setup () {
    return { ngScope: shallowRef(null) };
  },
  render () { },
  mounted () {
    const { $ngVue, $attrs, $el } = this;

    if (!$ngVue) throw new Error('AngularVuePlugin not installed');

    const { $injector } = $ngVue;

    // lookup throughout parent tree first to find closest ngScope.... otherwise
    const $parentScope = angular.element($el).parents('.ng-scope:first')?.scope() ||
            $injector.get('$rootScope');

    const $scope = $parentScope.$new(true); // create new isolated scope!
    this.ngScope = $scope;

    const { props, propsSync, events } = parseAttrs($attrs);

    // From Vue => Angular
    props.forEach(({ attrKey, ngName, vueValue }) => {
      console.debug(`vue(ng): initial set vue => ng (${ngName}):`, $attrs[attrKey]);
      // initial set
      $scope[ngName] = vueValue;

      this.$watch(() => $attrs[attrKey], (v) => {
        if ($scope.$$destroyed) return;

        safeApply($scope, () => {
          if ($scope[ngName] === v) return;

          console.debug(`vue(ng): vue => ng (${ngName})`, v);
          $scope[ngName] = v;
        });
      });
    });

    // From Angular => Vue (if v-model:)
    propsSync.forEach(({ attrKey, ngName, vueHandler }) => {
      console.debug(`vue(ng): two-way vue <=> ng (${ngName}):`);

      $scope.$watch(() => $scope[ngName], (v) => {
        if ($attrs[attrKey] === v) return;

        console.debug(`vue(ng): vue <= ng (${ngName})`, v);

        return vueHandler(v);
      });
    });

    // From Angular => Vue (v-on:)
    events.forEach(({ ngName, vueHandler }) => {
      console.debug(`vue(ng): binding event vue <= ng (${ngName}):`);

      $scope[ngName] = ($event) => {
        console.debug(`vue(ng): vue <= ng emit:${ngName}`, '$event =', $event);

        return vueHandler($event);
      };
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
