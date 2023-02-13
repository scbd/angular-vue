

export const AngularVueAuthPlugin = ($injector) =>{

    if(!$injector)
        throw new Error('Angular $injector not provided, cannot use AngularVueRoutePlugin plugin');

    let user;
    let userToken;

    const auth ={
        get user()          { return user; },
        get loggedIn()      { return user && user.isAuthenticated },
        setUser(newUser)    { user = newUser },
        setUserToken(token) { userToken = token; },

        logout()        { 
            const authentication = $injector.get('authentication');
            return authentication.signOut();
        },
        fetchUser()     { 
            const authentication = $injector.get('authentication');
            return authentication.getUser();
        },
        hasScope(scopeName)      { 

            let rolesToValidate = [];
            if(typeof scopeName == 'string')
                rolesToValidate = [scopeName];
            else if(!Array.isArray(scopeName))
                throw new Error("`scopeName` must be string or array od string");

            rolesToValidate = scopeName;

            const hasRole = rolesToValidate.find(scope=>user?.roles.includes(scope));

            return !!hasRole;
        },
        refreshTokens() { throw new Error('Not Implemented'); },
        onError()       { throw new Error('Not Implemented'); },
        onRedirect()    { throw new Error('Not Implemented'); },
        strategy :      { 
            token : { 
                get()      { return userToken; },
                set(token) { userToken = token }                
            },
            get refreshToken() { throw new Error('Not Implemented');  }            
         },
    }

    return {
        install(Vue, options) {
            if(!Vue.prototype.$auth)
                Vue.prototype.$auth = auth;
        }
      }
};