import isFunction from 'lodash-es/isFunction';
import compact from 'lodash-es/compact';
import flatten from 'lodash-es/flatten';
import { ref, inject, computed } from 'vue';
const defaultInjectKey = 'auth';

class Auth {
  #login;
  #logout;
  #fetchUser;

  #ready = ref(false);
  #user = ref(null);
  #tokens = ref({});

  constructor ({ login, logout, fetchUser, plugins } = {}) {
    if (plugins) throw Error('Auth wrapper does not support plugins option');

    if (login && !isFunction(login)) throw Error('\'login\' option must be a funtion');
    if (logout && !isFunction(logout)) throw Error('\'logout\' option must be a funtion');
    if (fetchUser && !isFunction(fetchUser)) throw Error('\'fetchUser\' option must be a funtion');

    this.#login = login;
    this.#logout = logout;
    this.#fetchUser = fetchUser;
  }

  install (app, key = defaultInjectKey) {
    app.provide(key, this);
    app.config.globalProperties.$auth = this;
  }

  // init
  ready () {
    return this.#ready.value;
  }

  async load () {
    if (!this.#ready.value) { await this.fetch(); }

    return this.#ready.value;
  }

  check (roles) {
    roles = compact(flatten([roles]));

    // TODO user config for role fields;
    const rolesFields = 'roles';

    const userRoles = (this.#user.value || [])[rolesFields] || [];

    return userRoles.some(r => roles.includes(r));
  }

  // user data
  user (setUser) {
    if (setUser !== undefined) {
      this.#user.value = setUser;
      this.#ready.value = true;
    }

    return this.#user.value;
  }

  async fetch (options) {
    if (!this.#fetchUser) notImplemented();

    const user = await this.#fetchUser(options);

    return this.user(user);
  }

  async login (options) {
    if (!this.#login) notImplemented();
    return await this.#login(options);
  }

  logout ({ makeRequest }) {
    this.user(null);

    if (this.#logout) { return this.#logout({ makeRequest }); }
  }

  async token (name, setToken, expires) {
    name = name || 'NOT_NAMED';

    if (setToken !== undefined) {
      this.#tokens.value[name] = setToken;
    }

    return this.#tokens.value[name];
  }

  // login & register
  async register (options) { notImplemented(); }
  async oauth2 (options) { notImplemented(); }

  // impersonating
  async impersonate (data) { notImplemented(); }
  async unimpersonate () { notImplemented(); }
  impersonating () { notImplemented(); }
  enableImpersonate () { notImplemented(); }
  disableImpersonate () { notImplemented(); }

  // Utils
  async remember (data) { notImplemented(); }
  async unremember () { notImplemented(); }
  async redirect () { notImplemented(); }
  async refresh (options) { notImplemented(); }
}

export function createAuth (options) {
  return new Auth(options);
}

export function useAuth (key = defaultInjectKey) {
  return inject(key);
}

export function useUser (key = defaultInjectKey) {
  const auth = useAuth(key);

  return computed(() => {
    return auth.user();
  });
}

function notImplemented () {
  throw new Error('Not Implemented');
}
