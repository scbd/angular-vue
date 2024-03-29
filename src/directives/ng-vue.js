import Vue from 'Vue';
import paths from '../libs/paths';
import omit from 'lodash/omit'
import _get from 'lodash/get';
import _set from 'lodash/get';
import forEach from 'lodash/forEach';
import kebabCase from 'lodash/kebabCase';
import camelCase from 'lodash/camelCase';
import union from 'lodash/union';
import uniq  from 'lodash/uniq';
import sort  from 'lodash/sortBy';
import lookupParentComponent from '../libs/lookup-parent-component.js'
import safeApply from '../libs/safe-apply';

export default [ function () {
    return {
      restrict: 'A',
      terminal: true, // any directive with lower priority will be ignored
      priority: 1001, // 1 more than ngNonBindable => disable angular interpolation!
      link(scope, element, attrs) {
        const ngDelegates             = loadExposedDelegates(attrs);
        const ngProperties            = loadExposedProperties(attrs);
        const syncedPropertiesMapping = loadSyncedPropertiesMapping(attrs);

        // test declarations

        ngProperties.forEach((prop) => testDefined(scope, prop));
        ngDelegates.forEach((prop) => testDefined(scope, prop));

        const vueData    = {};
        const vueMethods = {};

        ngProperties.filter(paths.isRoot).forEach((ngProp) => {
          const vueProp    = ngProp;
          vueData[vueProp] = scope.$eval(ngProp); // set initial value
        });

        // Create root component;
        let options = {};

        if (attrs.ngVue) options = scope.$eval(attrs.ngVue) || {};
        options = omit(options, 'props', 'data', 'computed', 'methods', 'watch')

        ngDelegates.forEach((ngDelegate) => {
          vueMethods[ngDelegate] = (...args) => {
            console.debug(`ng(vue): Calling ng delegate: ${ngDelegate}()`);
            safeApply(scope, () => scope.$eval(ngDelegate).apply(scope, args));
          };
        });

        // try to lookup the closet vue parent component in the DOM tree; 
        const parent = lookupParentComponent(element) || Vue.prototype?.$ngVue?.vueApp || undefined;

        const vm = new Vue({
          parent,
          ...options,
          data   : vueData,
          methods: vueMethods,
        }).$mount(element[0]);

        vm.$el.$component = vm; //save current component to DOM element 

        scope.$on('$destroy', ()=>{ //Destroy vue component when parent scope is destroyed. 
          console.debug('ng(vue): destroying vue-comp', vm)
          vm.$destroy();
        });

        // Watch changes

        ngProperties.forEach((ngProp) => {
          const vueProp = ngProp;

          scope.$watch(ngProp, (value) => {
            console.debug(`ng(vue): ng(${ngProp}) => vue(${vueProp}) =`, value);

            let target = vm;
            let prop   = vueProp;

            if (!paths.isRoot(prop)) {
              target = _get(vm, paths.parent(prop));
              prop   = paths.leaf(prop);
            }

            Vue.set(target, prop, value);
          });
        });

        forEach(syncedPropertiesMapping, (ngProp, vueProp) => { // .sync

          vm.$children.forEach((c) => c.$on(`update:${camelCase(vueProp)}`, (value) => {
            console.debug(`ng(vue): vue(${vueProp}) => ng(${ngProp}) =`, value);
            safeApply(scope, () => _set(scope, ngProp, value));
          }));

          //shoudl only use CamelCase.. keep kebabCase support for backward compatibility 
          vm.$children.forEach((c) => c.$on(`update:${kebabCase(vueProp)}`, (value) => {
            console.warn(`$emit event using camelCase (update:${camelCase(vueProp)}). instead of kebabCase (update:${kebabCase(vueProp)}).`)
            console.debug(`ng(vue): vue(${vueProp}) => ng(${ngProp}) =`, value);
            safeApply(scope, () => _set(scope, ngProp, value));
          }));

        });
      },
    };

    function loadExposedProperties(attrs) {
      const vDirectives = /^(?:v-model|v-html|v-text|v-show|v-class|v-attr|v-style|v-if)(?:\.[a-z0-9]+)*$/i;
      const vBind       = /^(?:v-bind)?:[a-z-]+(\.[a-z]+)*$/i;
      const vBindValue  = /^[a-z$_][a-z0-9$_]*(\.[a-z$_][a-z0-9$_]*)*$/i;

      const properties = (attrs.ngVueExpose ?? '').split(',').map((o) => o.trim()).filter((o) => vBindValue.test(o));

      // autodetect simple binding on props detect

      const attributes = remapAttributes(attrs);

      forEach(attributes, (value, name) => {
        const validName =  vBind.test(name)
                            || vDirectives.test(name);

        if (validName && vBindValue.test(value)) {
          properties.push(value);
        }
      });

      // Add parent properties

      let allProperties = [ ...properties ];

      properties.forEach((prop) => {
        allProperties =  union(allProperties, paths.parents(prop));
      });

      return sort(uniq(allProperties));
    }

    function loadSyncedPropertiesMapping(attrs) {
      // autodetect simple binding on props detect

      const vModel     = /^(?:v-model)$/i;
      const vBind      = /^(?:v-bind)?:([a-z-]+)\.sync*$/i;
      const vBindValue = /^[a-z$_][a-z0-9$_]*(\.[a-z$_][a-z0-9$_]*)*$/i;

      const mapping    = {};
      const attributes = remapAttributes(attrs);

      forEach(attributes, (value, name) => {
        if (vModel.test(name)) {
          const vueProp = 'value';

          if (!vBindValue.test(value)) throw Error(`Unsupported v-model binding value: ${value}`);

          mapping[vueProp] = value;
        }

        if (vBind.test(name)) {
          const vueProp = name.replace(vBind, '$1') // Keep only property name
            .replace(/-[a-z]/g, (m) => m[1].toUpperCase()).replace(/^[A-Z]/, (m) => m[1].toLowerCase()); // convert to camel-case

          if (!vBindValue.test(value)) throw Error(`Unsupported v-bind:${vueProp}.sync binding value: ${value}`);

          mapping[vueProp] = value;
        }
      });

      return mapping;
    }

    function loadExposedDelegates(attrs) {
      const ngVueDeclaredRe = /^&([a-z$_][a-z0-9$_]*)$/i;
      const ngDelegates     = (attrs.ngVueExpose ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter((o) => ngVueDeclaredRe.test(o))
        .map((o) => o.replace(ngVueDeclaredRe, '$1'));

      // autodetect simple delegate call with empty ()
      // eg: call_function()

      const vOnRe         = /^(?:v-on:|@)[a-z-]+(:[a-z0-9-]+)?(\.[a-z0-9-]+)*/i;
      const vOnDelegateRe = /^([a-z_$][a-z0-9_$]*)(?:\(\))?$/i;

      const attributes = remapAttributes(attrs);

      forEach(attributes, (value, name) => {
        const validName = vOnRe.test(name);

        if (validName && vOnDelegateRe.test(value)) {
          ngDelegates.push(value.replace(vOnDelegateRe, '$1'));
        }
      });

      return ngDelegates;
    }

    function remapAttributes(attrs) {
      const attributes = {};

      forEach(attrs.$attr, (name, key) => {
        const value      = attrs[key];
        attributes[name] = value;
      });

      return attributes;
    }

    function testDefined(scope, expression) {
      if (scope.$eval(expression) === undefined) {
        throw Error(`"${expression}" is not defined on parent scope`);
      }
    }
  } 
]
