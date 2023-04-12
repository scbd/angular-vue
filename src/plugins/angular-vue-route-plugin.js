import Vue from 'Vue';

export default function AngularVueRoutePlugin($injector) {

  if(!$injector)
    $injector = Vue?.prototype?.$ngVue?.$injector;

    if(!$injector)
        throw new Error('Angular $injector not provided, cannot use AngularVueRoutePlugin plugin');
  
    const $location  = $injector.get('$location');
    const $route     = $injector.get('$route');
    const $rootScope = $injector.get('$rootScope');
  
    if(!$location)
        throw new Error('Angular $location service not available, cannot use AngularVueRoutePlugin plugin');
    if(!$route)
        throw new Error('Angular $route service not available, cannot use AngularVueRoutePlugin');
  
    const observableRoute = window.Vue.observable({
      _route : null
    })
  
    function updateRoute() {
      const fullPath = $location.url();
      const path   = $location.path();
      const hash   = $location.hash();
      const query  = { ...($location.search()    || {})};
      const params = { ...($route.current?.params|| {})};

      observableRoute._route = {
        get fullPath() { return fullPath; },
        get path()   { return path; },
        get hash()   { return hash ? `#${hash}` : ''; },
        get query()  { return { ...query  }; },
        get params() { return { ...params }; },
      }
    }
  
    $rootScope.$on('$routeUpdate',        updateRoute);
    $rootScope.$on('$routeChangeSuccess', updateRoute);
  
    if(!$route.current) { // initial route (at boot time)
      const cancelWatch = $rootScope.$watch(()=>$route.current, (currentRoute)=>{
        if(currentRoute===undefined) return;
        cancelWatch();
        updateRoute();
      });
    }
  
    updateRoute();
  
    return {
        install(Vue, options) {
            if(!Vue.prototype.$route) {
              Object.defineProperty(Vue.prototype, '$route', {
                get () { return observableRoute._route }
              })
            }
        }
      }
  };