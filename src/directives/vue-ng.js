import { parseAttrs } from '../libs/vue-attrs';
import { safeApply } from '../libs/angular-calls';
import { kebabCase } from 'lodash-es';

const RestrictTo = {
  element: 'E',
  attribute: 'A',
  class: 'C'
};

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
  const { dynamicProps } = vnode;
  const { instance } = binding;
  const { $ngVue } = instance;
  const { $injector } = $ngVue;

  let restrictTo = RestrictTo.element; // see `restrict` https://docs.angularjs.org/guide/directive

  if (binding.modifiers.c) restrictTo = RestrictTo.class;
  if (binding.modifiers.a) restrictTo = RestrictTo.attribute;

  const directiveName = kebabCase(binding.arg || el.tagName);
  const tagName = restrictTo === 'E' ? directiveName : kebabCase(el.tagName);

  const $parentScope = angular.element(el).parents('.ng-scope:first')?.scope() || $injector.get('$rootScope');
  const $scope = $parentScope.$new(true); // create new isolated scope!

  const { props, events } = parseAttrs(vnode.props);

  const template = document.createElement(tagName);

  if (restrictTo === RestrictTo.attribute) template.setAttribute(directiveName, '');
  if (restrictTo === RestrictTo.class) template.setAttribute('class', directiveName);

  props.forEach(({ attrKey, attrName, ngName, value, handler }) => {
    if (!template.hasAttribute(attrName)) template.setAttribute(attrName, value);

    if (!dynamicProps.includes(attrKey)) return;

    template.attributes[attrName].value = ngName;

    $scope[ngName] = value;

    if (handler) $scope.$watch(ngName, handler); // 2 way binding
  });

  events.forEach(({ attrName, ngName, handler }) => {
    $scope[ngName] = ($event) => handler($event);
    template.setAttribute(attrName, `${ngName}($event)`);
  });

  const $compile = $injector.get('$compile');
  const bindFn = $compile(template);
  const [$ngElement] = bindFn($scope); // Bind to scope

  // Replace this component wrapper (el) in the browser DOM with the angular one (ngElement)
  el.parentElement.replaceChild($ngElement, el);

  // Attach to other `el` as el will be passed to other event handler;
  el.$ngScope = $scope;
  el.$ngElement = $ngElement;
}

//= ============================================
//
//= ============================================
function updated ({ $ngScope: $scope }, binding, vnode) {
  const { dynamicProps } = vnode;
  const { props } = parseAttrs(vnode.props);

  safeApply($scope, () => {
    props.forEach(({ attrKey, ngName, value }) => {
      if (!dynamicProps.includes(attrKey)) return;
      if ($scope[ngName] === value) return;

      $scope[ngName] = value;
    });
  });
}

//= ============================================
//
//= ============================================
function unmounted ({ $ngElement, $ngScope: $scope }) {
  console.debug('v-ng: destroying ng-scope', $scope);
  $scope.$destroy();
  $ngElement.remove();
}
