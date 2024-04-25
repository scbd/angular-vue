import { parseAttrs } from '../libs/vue-attrs';
import { safeApply } from '../libs/angular-calls';
import { kebabCase, isString, camelCase } from 'lodash-es';

export default {
  created,
  mounted,
  beforeUpdate,
  unmounted
};

//= ============================================
//
//= ============================================
function created (el, { instance }, vnode) {
  if (!instance.$ngVue) throw new Error('AngularVuePlugin not installed');
}

//= ============================================
//
//= ============================================
function mounted (el, binding, vnode) {
  const { instance } = binding;
  const { $ngVue } = instance;
  const { $injector } = $ngVue;

  const $parentScope = angular.element(el).parents('.ng-scope:first')?.scope() || $injector.get('$rootScope');
  const $scope = $parentScope.$new(true); // create new isolated scope!

  const directiveName = camelCase(binding.arg || el.tagName);
  const [directiveDef] = $injector.get(`${camelCase(directiveName)}Directive`);
  const { restrict } = directiveDef; // see `restrict` https://docs.angularjs.org/guide/directive

  const tagName = restrictTo(restrict) === 'E' ? kebabCase(directiveName) : kebabCase(el.tagName);

  const template = document.createElement(tagName);

  if (restrictTo(restrict) === 'A') template.setAttribute(directiveName, '');
  if (restrictTo(restrict) === 'C') template.setAttribute('class', directiveName);

  const $ngProps = parseNgProps(directiveDef.scope || {});
  const { props, events } = parseAttrs(vnode.props);

  props.forEach(({ attrName, ngName, value, handler }) => {
    if (!template.hasAttribute(attrName)) template.setAttribute(attrName, toString(value));

    const ngAttr = template.attributes[attrName];
    const { isBinding } = $ngProps[ngName] || {};

    if (!isBinding) return;

    const scopeName = `vueDataWrapper_${ngName}`;

    $scope[scopeName] = value;
    ngAttr.value = scopeName;

    if (handler) $scope.$watch(scopeName, handler); // 2 way binding
  });

  events.forEach(({ attrName, ngName, handler }) => {
    const { isDelegate } = $ngProps[ngName] || {};

    if (!isDelegate) return;

    const scopeName = `vueEventWrapper_${ngName}`;

    $scope[scopeName] = ($event) => handler($event);
    template.setAttribute(attrName, `${scopeName}($event)`);
  });

  const $compile = $injector.get('$compile');
  const bindFn = $compile(template);
  const [$ngElement] = bindFn($scope); // Bind to scope

  // Replace this component wrapper (el) in the browser DOM with the angular one (ngElement)
  el.parentElement.replaceChild($ngElement, el);

  // Attach to other `el` as el will be passed to other event handler;
  el.$ngScope = $scope;
  el.$ngProps = $ngProps;
  el.$ngElement = $ngElement;
}

//= ============================================
//
//= ============================================
function beforeUpdate (el, binding, vnode) {
  const { $ngScope: $scope, $ngProps } = el;
  const { props } = parseAttrs(vnode.props);

  safeApply($scope, () => {
    props.forEach(({ ngName, value }) => {
      const { isBinding } = $ngProps[ngName] || {};
      const scopeName = `vueDataWrapper_${ngName}`;

      if (!isBinding) return;
      if ($scope[scopeName] === value) return;

      $scope[scopeName] = value;
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

//= ============================================
//
//= ============================================
function parseNgProps (scope) {
  // https://docs.angularjs.org/api/ng/service/$compile#-scope-
  const prefixRe = /^(<|=|&|@|)/;
  const bindingRe = /^[<=]\??/;
  const attrRe = /^@\??/;
  const delegateRe = /^&\??/;

  const entries = Object.entries(scope);

  return entries.reduce((res, [key, value]) => {
    const name = camelCase(value.replace(prefixRe, '') || key);

    return {
      ...res,
      [name]: {
        isBinding: bindingRe.test(value),
        isAttr: attrRe.test(value),
        isDelegate: delegateRe.test(value)
      }
    };
  }, {});
}

function restrictTo (restrict) {
  if (/E/.test(restrict)) return 'E';
  if (/A/.test(restrict)) return 'A';
  if (/C/.test(restrict)) return 'C';

  throw new Error(`Unknown dicrectin 'restrict' ${restrict}`);
}

function toString (v) {
  if (v === undefined) v = '';
  if (v === null) v = '';
  if (!isString(v)) v = JSON.stringify(v);

  return v;
}
