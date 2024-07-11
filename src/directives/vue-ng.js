import { parseAttrs } from '../libs/vue-attrs';
import { safeApply } from '../libs/angular-calls';
import kebabCase from 'lodash-es/kebabCase';
import camelCase from 'lodash-es/camelCase';
import isString from 'lodash-es/isString';
import isObject from 'lodash-es/isObject';

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

  const directiveName = camelCase(binding.arg || el.tagName);
  const [directiveDef] = $injector.get(`${camelCase(directiveName)}Directive`);
  const { restrict, scope, transclude } = directiveDef; // see `restrict` https://docs.angularjs.org/guide/directive

  if (!isObject(scope)) throw Error(`Only supporting directive.scope = {...}. Current value: ${scope}`);

  const tagName = restrictTo(restrict) === 'E' ? kebabCase(directiveName) : kebabCase(el.tagName);

  const template = document.createElement(tagName);

  if (restrictTo(restrict) === 'A') template.setAttribute(directiveName, '');
  if (restrictTo(restrict) === 'C') template.setAttribute('class', directiveName);

  const $ngProps = parseNgProps(directiveDef.scope || {});
  const { props, events } = parseAttrs(vnode.props);

  const $parentScope = angular.element(el).parents('.ng-scope:first')?.scope() || $injector.get('$rootScope');

  safeApply($parentScope, () => {
    const $scope = $parentScope.$new(true); // create new isolated scope!

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

    // for (const node of el.childNodes) {
    //   el.removeChild(node);
    //   template.appendChild(node);
    // }

    const $compile = $injector.get('$compile');
    const bindFn = $compile(template);
    const [$ngElement] = bindFn($scope); // Bind to scope

    if (transclude) {
      // NOT THE IDEAL SOLUTION BU IT WORKS FOR BASIC ng-transclude
      // https://docs.angularjs.org/api/ng/directive/ngTransclude#basic-transclusion
      // It would have been better to work with slots but bannot access them from directive
      const ngTransclude = $ngElement.querySelector('ng-transclude') || $ngElement.querySelector('*[ng-transclude');

      if (ngTransclude) {
        if (el.childNodes.length > 1) throw new Error('only support one slot transclusion');

        for (const node of el.childNodes) {
          ngTransclude.parentElement.replaceChild(node, ngTransclude);
        }
      }
    }

    // Replace this component wrapper (el) in the browser DOM with the angular one (ngElement)
    el.parentElement.replaceChild($ngElement, el);

    // Attach to other `el` as el will be passed to other event handler;
    el.$ngScope = $scope;
    el.$ngProps = $ngProps;
    el.$ngElement = $ngElement;
  }); // Force update
}

//= ============================================
//
//= ============================================
function beforeUpdate (el, binding, vnode) {
  const $scope = el?.$ngScope;

  if (!$scope) return;

  const $ngProps = el?.$ngProps || {};
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
function beforeUnmount (el) {
  const $ngElement = el?.$ngElement;

  if ($ngElement && $ngElement.parentElement) { // put back original htmlElemnet to unmount
    $ngElement.parentElement.replaceChild(el, $ngElement);
    delete el.$ngElement;
  }
}

//= ============================================
//
//= ============================================
function unmounted (el) {
  const $scope = el?.$ngScope;

  if ($scope) {
    safeApply($scope, () => $scope.$destroy());
  }
}

//= ============================================
//
//= ============================================
function parseNgProps (scope) {
  // https://docs.angularjs.org/api/ng/service/$compile#-scope-
  const prefixRe = /^(<|=|&|@|)\??/;
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

  throw new Error(`Unknown 'restrict': ${restrict}`);
}

function toString (v) {
  if (v === undefined) v = '';
  if (v === null) v = '';
  if (!isString(v)) v = JSON.stringify(v);

  return v;
}

function debugHook (message, handler) {
  return (el, binding, vnode, prevVNode) => {
    if (binding.modifiers.debug) { console.debug(message, el, binding, vnode, prevVNode); }

    if (handler) { return handler(el, binding, vnode, prevVNode); }
  };
}

export default {
  created: debugHook('created', created),
  beforeMount: debugHook('beforeMount'),
  mounted: debugHook('mounted', mounted),
  beforeUpdate: debugHook('beforeUpdate', beforeUpdate),
  updated: debugHook('updated'),
  beforeUnmount: debugHook('beforeUnmount', beforeUnmount),
  unmounted: debugHook('unmounted', unmounted)
};
