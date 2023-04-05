export default function ({ logout, fetchUser }={}) {
    const state = Vue.observable({
      user     : null,
      userToken: null,
    });
  
    const auth = {
      get user()          { return state.user; },
      get loggedIn()      { return !!(state.user && state?.user?.isAuthenticated); },
      setUser(newUser)    { state.user = newUser; },
      setUserToken(token) { state.userToken = token; },
  
      logout()        {
        if(!logout) { throw new Error('Not Implemented'); } 

        logout();
      },
      async fetchUser()     {
        if(!fetchUser) { throw new Error('Not Implemented'); } 

        const user = await fetchUser();
        this.setUser(user);
        return user;
      },
      hasScope(scopeName)      {
        let rolesToValidate = [];
        if (typeof scopeName === 'string') rolesToValidate = [ scopeName ];
        else if (!Array.isArray(scopeName)) throw new Error('`scopeName` must be string or array od string');
  
        rolesToValidate = scopeName;
  
        const hasRole = rolesToValidate.find((scope) => this.user?.roles.includes(scope));
  
        return !!hasRole;
      },
      refreshTokens() { throw new Error('Not Implemented'); },
      onError()       { throw new Error('Not Implemented'); },
      onRedirect()    { throw new Error('Not Implemented'); },
      strategy: {
        token: {
          get()      { return state.userToken; },
          set(token) { state.userToken = token; },
        },
        get refreshToken() { throw new Error('Not Implemented');  },
      },
    };
  
    return {
      install(Vue, options) {
        if (!Vue.prototype.$auth) {
          Object.defineProperty(Vue.prototype, '$auth', {
            get() { return auth; },
          });
        }
      },
    };
  }
  