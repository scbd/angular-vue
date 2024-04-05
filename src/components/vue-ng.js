import isFunction from 'lodash-es/isFunction';
import camelCase from 'lodash-es/camelCase';
import { safeApply } from '../libs/angular-calls';
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

        vueHandler(v);
      });
    });

    // From Angular => Vue (v-on:)
    events.forEach(({ ngName, vueHandler }) => {
      console.debug(`vue(ng): binding event vue <= ng (${ngName}):`);

      $scope[ngName] = ($event) => {
        console.debug(`vue(ng): vue <= ng emit:${ngName}`, '$event =', $event);

        vueHandler($event);
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

function parseAttrs ($attrs) {
  const isPropSync = /^onUpdate:/;
  const isEvent = /^on[A-Z]/;

  let entries = Object.entries($attrs);

  // Starts with are props sync (v-model:) which are all starting with `onUpdate:`
  const propsSync = entries.filter(([attrKey]) => isPropSync.test(attrKey)).map(([attrKey, vueHandler]) => ({
    attrKey,
    ngName: attrKey.replace(isPropSync, ''),
    vueHandler
  }));

  entries = entries.filter(([attrKey]) => !propsSync.find(o => o.attrKey === attrKey)); // exclude propsSync;

  // Continue with events which are all starting with `on` and have fandler

  const events = entries.filter(([attrKey, vueHandler]) => isEvent.test(attrKey) && isFunction(vueHandler)).map(([attrKey, vueHandler]) => ({
    attrKey,
    ngName: camelCase(attrKey.replace(/^on/, '')),
    vueHandler
  }));

  entries = entries.filter(([attrKey]) => !events.find(o => o.attrKey === attrKey)); // exclude events;

  // Remainings are props
  const props = entries.map(([attrKey, vueValue]) => ({
    attrKey,
    ngName: attrKey,
    vueValue
  }));

  return { props, propsSync, events };
}
