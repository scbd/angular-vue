import camelCase from 'lodash-es/camelCase';

//= =========================================
//= =========================================
//= =========================================
const plugins = [];
const components = [];
const directives = [];

export function registerPlugin (plugin, options) {
  if (!plugin) throw Error('pluging is null');
  if (!plugin.install) throw Error('pluging has no install function');
  if (plugins.find(o => o.plugin === plugin)) throw Error('pluging already registered');

  plugins.push({ plugin, options });
}

export function registerComponent (name, component) {
  name = camelCase(name || '');

  if (!name) throw Error('Component name not set');
  if (!component) throw Error('Component not set');
  if (components[name]) throw Error(`Component with same name already registered: ${name}`);

  components[name] = component;
}

function registerDirectives (name, directive) {
  name = camelCase(name || '');

  if (!name) throw Error('Directive name not set');
  if (!directive) throw Error('Directive not set');
  if (directives[name]) throw Error(`Directive with same name already registered: ${name}`);

  directives[name] = directive;
}

export function install (app) {
  if (!app) throw Error('app is null');

  plugins.forEach(({ plugin, options }) => {
    app.use(plugin, options);
  });

  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component);
  });

  Object.entries(directives).forEach(([name, directive]) => {
    app.directive(name, directive);
  });
}

export default {
  use (plugin, options) {
    registerPlugin(plugin, options);
    return this;
  },

  component (name, component) {
    registerComponent(name, component);
    return this;
  },

  directive (name, component) {
    registerDirectives(name, component);
    return this;
  }
};
