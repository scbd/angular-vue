import camelCase from 'lodash-es/camelCase';

const registeredPlugins = [];

export function registerPlugin (plugin, options) {
  if (!plugin) throw Error('pluging is null');
  if (!plugin.install) throw Error('pluging has no install function');
  if (registeredPlugins.find(o => o.plugin === plugin)) throw Error('pluging already registered');

  registeredPlugins.push({ plugin, options });
}

export function installPlugins (app) {
  if (!app) throw Error('app is null');

  registeredPlugins.forEach(({ plugin, options }) => {
    app.use(plugin, options);
  });
}

const registerComponents = {};

export function registerComponent (name, component) {
  name = camelCase(name || '');

  if (!name) throw Error('Component name not set');
  if (!component) throw Error('Component not set');
  if (registerComponents[name]) throw Error(`Component with same name already registered: ${name}`);

  registerComponents[name] = component;
}

export function installComponents (app) {
  if (!app) throw Error('app is null');

  Object.entries(registerComponents).forEach(([name, component]) => {
    app.component(name, component);
  });
}

export const pluginRegistry = {

  use (plugin, options) {
    registerPlugin(plugin, options);
    return this;
  }
};

export const compomentRegistry = {

  component (name, component) {
    registerComponent(name, component);
    return this;
  }
};
