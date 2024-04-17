import isFunction from 'lodash-es/isFunction';
import camelCase from 'lodash-es/camelCase';
import kebabCase from 'lodash-es/kebabCase';

export function parseAttrs ($attrs) {
  const isPropSync = /^onUpdate:/;
  const isEvent = /^on[A-Z]/;

  let entries = Object.entries($attrs);

  // Starts with are props sync (v-model:) which are all starting with `onUpdate:`
  const propsSync = entries.filter(([attrKey]) => isPropSync.test(attrKey)).map(([attrKey, vueHandler]) => ({
    attrKey,
    attrName: kebabCase(attrKey.replace(/^^onUpdate:/, '')),
    ngName: attrKey.replace(isPropSync, ''),
    vueHandler
  }));

  entries = entries.filter(([attrKey]) => !propsSync.find(o => o.attrKey === attrKey)); // exclude propsSync;

  // Continue with events which are all starting with `on` and have fandler

  const events = entries.filter(([attrKey, vueHandler]) => isEvent.test(attrKey) && isFunction(vueHandler)).map(([attrKey, vueHandler]) => ({
    attrKey,
    attrName: kebabCase(attrKey.replace(/^on/, '')),
    ngName: camelCase(attrKey.replace(/^on/, '')),
    vueHandler
  }));

  entries = entries.filter(([attrKey]) => !events.find(o => o.attrKey === attrKey)); // exclude events;

  // Remainings are props
  const props = entries.map(([attrKey, vueValue]) => ({
    attrKey,
    attrName: kebabCase(attrKey),
    ngName: camelCase(attrKey),
    vueValue
  }));

  return { props, propsSync, events };
}
