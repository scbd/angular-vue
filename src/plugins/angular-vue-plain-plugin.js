import { inject } from 'vue';

class PlainServicePlugin {
  #name;
  #service;

  constructor (key, service) {
    this.#name = key;
    this.#service = service;
  }

  install (app) {
    app.provide(`plainService_${this.#name}`, this.#service);
    app.config.globalProperties[this.#name] = this.#service;
  }
}

export function createService (name, service) {
  return new PlainServicePlugin(name, service);
}

export function useService (name) {
  return inject(injectName(name));
}

function injectName (name) {
  return `plainService_${name}`;
}
