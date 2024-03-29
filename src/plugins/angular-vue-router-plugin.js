import Vue from 'Vue';

export default function AngularVueRouterPlugin($injector) {
    
    if(!$injector)
        $injector = Vue?.prototype?.$ngVue?.$injector;

    if(!$injector)
        throw new Error('Angular $injector not provided, cannot use AngularVueRouterPlugin plugin');

    const $location = $injector.get('$location');
    const $rootScope = $injector.get('$rootScope');
    if(!$location)
        throw new Error('Angular $location service not available, cannot use AngularVueRouterPlugin plugin');

    const ngApply = (callback) => {
        if($rootScope.$$phase) 
            callback();
        else 
            $rootScope.$apply(callback);
    } 

    var router ={
        push ({path, query, hash}){
            ngApply(() => {
                if(path)  
                    $location.path(path);
                if(query) 
                    $location.search(query||{});
                if(hash!==undefined) 
                    $location.hash((hash||'').replace(/^#/, ''));
            });
        },
        replace(...args) {
            ngApply(() => {
                $location.replace();
                this.push(...args);
            });
        }
    }
    return {
        install(Vue, options) {
            if(!Vue.prototype.$router)
                Vue.prototype.$router = router;
        }
      }
}