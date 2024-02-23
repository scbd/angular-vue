import camelCase from 'lodash-es/camelCase';
import kebabCase from 'lodash-es/kebabCase';
import isPlainObject from 'lodash-es/isPlainObject';
import { installPlugins, installComponents } from '../plugins/registry';
import { createApp, shallowRef, toRef, isReactive, defineComponent } from 'vue';

export default [function () {
  return {
    restrict: 'A',
    terminal: true, // any directive with lower priority will be ignored
    priority: 1001, // 1 more than ngNonBindable => disable angular interpolation!
    link ($scope, [mountingPointElement], attrs) {
      const isDebug = attrs.ngVueDebug !== undefined;
      const { components } = $scope.$eval(attrs.ngVue || '{}'); // managed option that is directly passed to component definition

      const wrapperDatas = {}; // ng => vue intermedia reactive data holder.
      const wrapperMethods = {}; // vuw => ng intermedia event handler.
      const instance = shallowRef(null); // instanciated compment that is unsed to emit events

      const attributes = getNormalizedAttributes(mountingPointElement); // get a copy of the normalized attributes
      const managedAttrs = attributes.filter(attr => isManaged(attr.name));

      // Create data wrapper for managed binding (v-bind: / v-model)
      managedAttrs.filter(attr => isBinding(attr.name)).forEach(attr => {
        const name = bindingName(attr.name);
        const expression = attr.value;

        const ngValue = warnIfNonReactive($scope.$eval(expression), `${attr.name}="${attr.value}"`);
        const data = toRef(ngValue);

        $scope.$watch(expression, (n, o) => {
          if (n === o) return;
          if (isDebug) console.debug(`ng(${expression}) => vue(${name})):`, n);

          data.value = warnIfNonReactive(n, `ng(${expression}) => vue(${name})): ${n}`);
        }, true);

        attr.value = `ngDataWrapper_${camelCase(name)}`;

        if (isDebug) console.debug(`Binding prop : ng(${expression}) => vue(${name})`);

        wrapperDatas[attr.value] = data;
      });

      // Create event wrapper for managed events (v-on:)
      managedAttrs.filter(attr => isEvent(attr.name)).forEach(attr => {
        const name = eventName(attr.name);
        const expression = attr.value;

        attr.value = `ngEventWrapper_${camelCase(name)}`;

        if (isDebug) console.debug(`Binding event: vue(${name}) => ng(${expression})`);

        wrapperMethods[attr.value] = ($event) => {
          if (isDebug) console.debug(`emit: vue(${name}) => ng(${expression}) -`, '$event:', $event);

          $scope.$apply(() => {
            $scope.$eval(`${expression}`, { $event });
          });
        };
      });

      // Create rendering component which will be boudn to named props.

      const componentElement = cloneElement(mountingPointElement, { attributes: false });

      const componentDefinition = defineComponent({
        components,
        template: componentElement.outerHTML
      });

      // create app route component which will be bound to event/data wrapper

      const rootTemplateElement = document.createElement('component'); // create a dynamic component element
      rootTemplateElement.setAttribute('ref', 'instance'); // set the ref to locale variable `instance` where the instanciate component will be accesble from.
      rootTemplateElement.setAttribute(':is', 'componentDefinition'); // set component variable name to load the definition from.

      attributes.forEach(a => rootTemplateElement.setAttributeNode(a));

      const app = createApp({
        template: rootTemplateElement.outerHTML,
        setup () {
          return { instance, ...wrapperDatas, ...wrapperMethods, componentDefinition };
        }
      });

      installPlugins(app);
      installComponents(app);

      if (isDebug) {
        console.debug('component template:\n', componentElement.outerHTML);
        console.debug('local components:\n', components);
        console.debug('app root template:\n', rootTemplateElement.outerHTML);
      }

      // Delete all attribute & content from the dom mounting element

      cleanElement(mountingPointElement); // remove all attributes and inner content;

      app.mount(mountingPointElement); // mount the app
    }
  };
}];

function isManaged (attrName) {
  return isBinding(attrName) || isEvent(attrName);
}

function isBinding (attrName) {
  return /^(:|v-model:|v-model$|v-bind:|v-bind$)/.test(attrName);
}

function isEvent (attrName) {
  return /^(@|v-on:)/.test(attrName);
}

function bindingName (attrName) {
  const name = attrName.replace(/^(:|v-bind:|v-model:)/, '')
    .replace(/\..*/, '');

  return toVueName(name);
}

function eventName (attrName) {
  const name = attrName.replace(/^(@|v-on:)/, '')
    .replace(/\..*/, '');

  return toVueName(name);
}

function toAttrName (name) {
  return name.replace(/[^:.@]+/g, kebabCase);
}

function toVueName (name) {
  return name.replace(/[^:.@]+/g, camelCase);
}

function getModifiers (attrName) {
  const modifiersRe = /\..+/;
  const matches = attrName.match(modifiersRe) || [];

  return matches[0] || '';
}

function getNormalizedAttributes (element) {
  const isSyncRe = /^v-bind:.*?\.sync/; // Migration vue2=>vue3

  const clonedElement = cloneElement(element);

  [...clonedElement.attributes].forEach(attr => {
    if (/^ng-vue-debug/.test(attr.name)) {
      clonedElement.removeAttributeNode(attr);
    }

    if (/^ng-vue-expose/.test(attr.name)) { // Migration vue2=>vue3: DROPPED
      const epressions = attr.value.split(',');

      const newAttrs = epressions.map(prop => {
        if (prop[0] === '&') { // callback
          prop = prop.substr(1);
          return `@${toAttrName(prop)}="${prop}($event)"`;
        }

        return `:${toAttrName(prop)}="${prop}"`;
      });

      console.error(`use of ng-vue-expose is not supported. Convert ${attr.name}="${attr.value}" to somenting similar to: ${newAttrs.join(' ')}\n`, element.outerHTML);
    }

    if (/^:/.test(attr.name)) {
      const attrName = `v-bind:${attr.name.replace(/^:/, '')}`;
      const expr = attr.value;

      clonedElement.removeAttributeNode(attr);

      clonedElement.setAttribute(attrName, expr);

      attr = clonedElement.getAttributeNode(attrName);
    }

    if (/^@/.test(attr.name)) {
      const attrName = `v-on:${attr.name.replace(/^@/, '')}`;
      const expr = attr.value;

      clonedElement.removeAttributeNode(attr);

      clonedElement.setAttribute(attrName, expr);

      attr = clonedElement.getAttributeNode(attrName);
    }

    if (/^v-model:/.test(attr.name) || isSyncRe.test(attr.name)) {
      const name = bindingName(attr.name);
      const expr = attr.value;
      let modifiers = getModifiers(attr.name);

      if (/\.sync/.test(modifiers)) { // Migration vue2=>vue3: WARNING
        console.warn(`use of .sync is deprecated. Use v-model:${toAttrName(name)} instead for \n${element.outerHTML}`);
        modifiers = modifiers.replace(/\.sync/, '');
      }

      clonedElement.removeAttributeNode(attr);

      clonedElement.setAttribute(`v-bind:${toAttrName(name)}${modifiers}`, expr);
      clonedElement.setAttribute(`v-on:update:${toAttrName(name)}`, `${expr} = $event`);
    } else if (/^v-model/.test(attr.name)) {
      const name = 'modelValue';
      const event = 'update:modelValue';
      const modifiers = getModifiers(attr.name);

      const expr = attr.value;

      clonedElement.removeAttributeNode(attr);

      clonedElement.setAttribute(`v-bind:${toAttrName(name)}${modifiers}`, expr);
      clonedElement.setAttribute(`v-on:${toAttrName(event)}`, `${expr} = $event`);
    }
  });

  const attributes = removeAttributes(clonedElement);

  return attributes;
}

function cloneElement (srcElement, { attributes, innerHTML } = {}) {
  const cloneAttributes = attributes === undefined || !!attributes;
  const cloneInnerHtml = innerHTML === undefined || !!innerHTML;

  const element = srcElement.cloneNode();

  if (!cloneAttributes) removeAttributes(element);
  if (cloneInnerHtml) element.innerHTML = srcElement.innerHTML;

  return element;
}

function removeAttributes (element) {
  const attributes = [...element.attributes];

  attributes.forEach(attr => element.removeAttributeNode(attr));

  return attributes;
}

function cleanElement (element) {
  removeAttributes(element);
  element.innerHTML = '';
}

function warnIfNonReactive (v, context) {
  let warn = true; // SHOUDL WARN ON DEV ONLY

  warn = warn && typeof (v) === 'object';
  warn = warn && isPlainObject(v);
  warn = warn && !isReactive(v);

  if (warn) console.warn('Plain Object passed to props should be defined \'reactive() in angular\' if you want to track its properties value changes', context);

  return v;
}
