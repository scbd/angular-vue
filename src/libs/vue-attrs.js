import isFunction from 'lodash-es/isFunction';
import camelCase from 'lodash-es/camelCase';
import kebabCase from 'lodash-es/kebabCase';

export function parseAttrs ($attrs) {
  const isPropSync = /^onUpdate:/;
  const isEvent = /^on[A-Z]/;

  let entries = Object.entries($attrs);

  // starts with events

  const events = entries.filter(([attrKey, handler]) => isEvent.test(attrKey) && isFunction(handler)).map(([attrKey, handler]) => ({
    attrKey,
    attrName: kebabCase(attrKey.replace(/^on/, '')),
    ngName: camelCase(attrKey.replace(/^on/, '')),
    handler
  }));

  entries = entries.filter(([attrKey]) => !events.find(o => o.attrKey === attrKey)); // exclude events;
  entries = entries.filter(([attrKey]) => !isPropSync.test(attrKey)); // exclude onUpdate: properties;

  // Remainings are props

  const props = entries.map(([attrKey, value]) => ({
    attrKey,
    attrName: kebabCase(attrKey),
    ngName: camelCase(attrKey),
    handler: $attrs[`onUpdate:${camelCase(attrKey)}`],
    value
  }));

  return { props, events };
}
