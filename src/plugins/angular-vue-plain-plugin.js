
export default function CreateAngularVuePlainPlugin(ngServiceName, ngService) {

    return {
        // called by Vue.use(CreateAngularVuePlainPlugin)
        install(Vue, options) {
            if(!Vue.prototype[ngServiceName])
                Vue.prototype[ngServiceName] = ngService;
        }
      }
}