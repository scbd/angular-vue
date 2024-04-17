import { parseAttrs } from '../libs/vue-attrs';
import { safeApply } from '../libs/angular-calls';

export default {
  created,
  mounted,
  updated,
  unmounted
};

//= ============================================
//
//= ============================================
function created (el, { instance }) {
  if (!instance?.$ngVue) throw new Error('AngularVuePlugin not installed');
}

//= ============================================
//
//= ============================================
function mounted (el, binding, vnode) {
  const { instance } = binding;
  const { $ngVue } = instance;
  const { $injector } = $ngVue;
  const $parentScope = angular.element(el).parents('.ng-scope:first')?.scope() || $injector.get('$rootScope');

  const $ngScope = $parentScope.$new(true); // create new isolated scope!

  const ngTemplate = el.cloneNode(true); // clone the el placeholder

  const { props, propsSync, events } = parseAttrs(vnode.props);

  props.forEach(({ attrName, ngName, vueValue }) => {
    $ngScope[ngName] = vueValue;
    ngTemplate.attributes[attrName].value = ngName;
  });

  propsSync.forEach(({ ngName, vueHandler }) => {
    $ngScope.$watch(ngName, vueHandler);
  });

  events.forEach(({ attrName, ngName, vueHandler }) => {
    $ngScope[ngName] = ($event) => vueHandler($event);
    ngTemplate.setAttribute(attrName, `${ngName}($event)`);
  });

  const $compile = $injector.get('$compile');
  const bindFn = $compile(ngTemplate);
  const [$ngElement] = bindFn($ngScope); // Bind to scope

  // Replace this component wrapper (el) in the browser DOM with the angular one (ngElement)
  el.parentElement.replaceChild($ngElement, el);

  // Attach to other `el` as el will be passed to other event handler;
  el.$ngScope = $ngScope;
  el.$ngElement = $ngElement;
}

//= ============================================
//
//= ============================================
function updated ({ $ngScope }, binding, vnode) {
  const $ngProps = parseAttrs(vnode.props);

  safeApply($ngScope, () => {
    $ngProps.props.forEach(({ ngName, vueValue }) => {
      $ngScope[ngName] = vueValue;
    });
  });
}

//= ============================================
//
//= ============================================
function unmounted ({ $ngElement, $ngScope }) {
  console.debug('v-ng: destroying ng-scope', $ngScope);
  $ngScope.$destroy();
  $ngElement.remove();
}
