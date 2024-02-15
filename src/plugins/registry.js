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
