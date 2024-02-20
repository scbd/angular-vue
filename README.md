** DOCUMENTATION IS INCOMPLETE AND NOT UP-TO-DATE NEED REVIEW**

@see examples/index.html

# SCBD angularVue (Vue3)

The goal of this library is to help SCBD to migrate away from AngularJS by allowing VueJs component to be use into the AngularJS world (hoping) without having to change code afterwards. Only SCBD needed features are implemented. If you are looking for robust implementation to mix the two platforms please look at https://github.com/ngVue/ngVue

**Update to Vue3. for vue2 please have a lokk at version 4.0.0 of this project**

[Using Vue into AngularJS](#using-vue-into-angularjs)

# Using Vue into AngularJS

Why another angular to vue:
- Seamless / Transparent integration
- Use natural VueJS syntax. (`v-bind:my-prop="myAngularExpression"` or `:my-prop="myAngularExpression"`) and event (`v-on:my-event="myAngularFunction($event)"` / `@my-event="myAngularFunction($event)"`) on bridged component
- Possibility to use [local registration of components](https://vuejs.org/guide/components/registration#local-registration.html#Local-Registration-in-a-Module-System) without having to register them globally (not need to call `Vue.component('myComponent', {...})`)
- No need to change the code of a component when angular parent component/view is migrated to VueJs...  component props/event binding remain unchanged

*This documentation is incomplete*

## How it works

**angularVue** Use non interfering helper directives (`ng-vue`) on the root of the Vue section/component in the angular partial/templates. 

## Getting started

```javascript
const { NgVueDirective } = AngularVue;

const ngApp = angular.module("app",[...])

ngApp.directive('ngVue',  NgVueDirective); //Register ng-vue directive

angular.bootstrap(document, [ngApp.name]);   

```

### The `ng-vue` directive

When this directive attribute is present on a html element it becomes managed by Vue (becomes a vue component). At this stage, AngularJS directive, binding and interpolation is disabled and VueJs take over. You cannot use any angular directives on this element and its descendent anymore. The `ng-vue` directive will bridge/evaluate angularJs expression in the prop/event attribute value and pass it to the named props defined using `v-bind:` (`:`) and `v-on:` (`@`). In another term the left part of the html attribute binding is the property name in vue world and the right part is the angular expression evaluated using angular `$eval()` on the current scope.
eg:

```html
<div ng-vue :name="ngContact.firstName">{{name}}</div>
```
in the above example `name` is the props name that vue use to expose the angular `ngContact.firstName` expression. While it's not exactly this you can see it as a computed property.

```javascript
const name = computed(()=>$eval($scope, 'ngContact.firstName'));
```

```html
<div ng-app="app">
    <div ng-controller="MyController">
        <h1>My name from angular is {{nameInAngular}}</h1>
        <h1 ng-vue :name-in-vue="nameInAngular" >
          My name from angular is {{nameInVue}}
        </h1>
    </div>
</div>
```

```javascript
const { NgVueDirective } = AngularVue;

const app = angular.module('app')
  .directive('ngVue',  NgVueDirective); //Register ng-vue directive
  .controller('MyController', function ($scope) {
    $scope.nameInAngular  = "stephane";
    $scope.vueWorld = "Vue";
  })

```

## Vue Options 

You can pass *Vue host wrapper* `components` options ot the `ngVue` attribute. Options must be object where key/value will be assigned on *Vue host wrapper*. It allows user to pass additional parameters to the component definition object of the Vue host. Eg: you can use `ngVue` to passe locally registered components to the vue host 

```html
<hello ng-vue="{ components : myLocallyDefinedComponents }"></hello>
```
the expression `{ components : myLocallyDefinedComponents }` will be evaluated using angular $eval()

```javascript
$scope.myLocallyDefinedComponents = { hello : MyHelloComponent };
```

## Component registation

** TODO NOT IMPLEMENTED YET **

Vue3 requires you to register global component on each app. Using `ng-vue` create mutiple independate app you have to register a component globally using a wrapper function `registerComponent`.


```html
<greeting ng-vue :contact="contact"></greeting>
```
```javascript
const { registerComponent } = AngularVue; 

registerComponent("greeting", {
    props: [ 'contact' ],
    template: `<b> Hello {{contact.firstName}} {{contact.lastName}}!!<b>`
});

$scope.contact: {
    firstName : "Stephane"
    lastName : "Bilodeau"
}

```

Otherwise locally using `ngVue` `.components`

```html
<hello ng-vue="{ components : myLocalComponents }" :contact="contact"></hello>
```
```javascript
// Local component
const hello : Vue.extend({
    props: [ 'contact' ],
    template: `<b> Hello {{contact.firstName}} {{contact.lastName}}!!<b>`
})

$scope.myLocalComponents = { components : { hello }}

$scope.contact: {
    firstName : "Stephane"
    lastName : "Bilodeau"
}
```

## Props

You can pass angular variable to ng-vue components using `props`. Like on Vue `props` are one-way binding

```html
<hello ng-vue="vueOptions" :first-name="contact.firstName", :last-name="contact.lastName"></hello>
```
```javascript
// Local component
const hello : Vue.extend({
    props: [ 'firstName', 'lastName' ],
    template: `<b> Hello {{firstName}} {{lastName}}!!<b>`
})

$scope.vueOptions= { components : { hello }}
$scope.contact: {
    firstName : "Stephane"
    lastName : "Bilodeau"
}
```

But you can make props two-way binding using props `v-model:prop-name`. modifiers and emitting the good `update:prop` event. `.sync` is deprecated. 

```html
<!-- only first-name wil be two-way bound -->

<hello ng-vue="vueOptions" v-model:first-name="contact.firstName", :last-name="contact.firstName"></hello>
```
```javascript
// Local component
const hello : Vue.extend({
    props: [ 'firstName', 'lastName' ],
    computed: {
        fn: { get() { return this.firstName}, set(v) { this.$emit("update:firstName", v) }  },
        ln: { get() { return this.lastName }, set(v) { this.$emit("update:lastName", v) }  }
    },
    template: `
    <div>
        <label>first Name</label> <input v-model="fn"><br>
        <label>Last Name </label> <input v-model="ln"><br>
    </div>`
})

$scope.vueOptions = { components : { hello }}
$scope.contact: {
    firstName : "Stephane"
    lastName : "Bilodeau"
}
```


## Plugins

Since the objective of the library is help run VueJS in a `hybrid` mode lot of VueJS features may not be available for eg. `vueRouter`, to overcome that plugins were introduced so that certain features from AngularJS can be sent to VueJS in object form to be further used in vue components. The intention of plugin is to create wrapper object of the features currently not available in vue due to the hybrid limitation for eg, create wrapper object of `router` so that if the component is moved to pure VueJS project minimal changes will be required for the switch. In situation where the wrapper object is not required plain angularJs objects can be passed using the `createService` plugin

# example usage
```javascript
const { 
  registerPlugin,
  createNgVue,
  createAuth,
  createRouter,
  createRoute,
  createService
  NgVueDirective 
} = AngularVue;

const ngApp = angular.module("app",['ngRoute'])

ngApp.directive('ngVue',  NgVueDirective); //Register ng-vue directive

ngApp.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $routeProvider.when('/', {});
    $routeProvider.when('/updated', {});
    $routeProvider.when('/updated/:count', {});
}]);

ngApp.run(['$injector', 'realm', 'locale', ($injector, realm, locale) => {

    const ngVue = createNgVue({ $injector, ngApp });

    registerPlugin(ngVue);
    registerPlugin(createAuth({ }));
    registerPlugin(createRouter({ plugins: { ngVue } }));
    registerPlugin(createRoute( { plugins: { ngVue } }));
    registerPlugin(createService('$realm', realm));
    registerPlugin(createService('$locale', locale));
}]);
```

# Know problems

**MANY MANY MANY**

** TODO TO REVIEW **

- You cannot pass `$property` from angular-to-vue. (eg `$index` from `ngRepeat`) you have to reassign them using `ngInit`
- Not well taking advantage of the reactive framework. `.sync` modifier push value up to angular that push it back down to vue component (double trigger).   / overuse of angular `$watch`
- `ng-vue` directive only look at the root element to detect simple binding. Should browse the element tree 

# Using AngularJS into Vue

## The `<vue-ng />` angular code component wrapper 

The `vue-ng` component is wrapped around html to allow usage of angular stuff into vue world (the reverse the `vue-ng` angular directive above). The goal is to reuse already developed angular component into vue without having to re-code everything into vue once passed from AngularJs to Vue

### Setup

Angular vue special plugins is required to be used. The plugin require *runtime* agularjs `$injector` instance to work.

```javascript
const { 
  registerPlugin,
  createNgVue,
} = AngularVue;

const ngApp  =  angular.module("app",[...])

ngApp.directive('ngVue',  NgVueDirective); //Register ng-vue directive

ngApp.run(['$injector', function($injector){
    registerPlugin(createNgVue({ $injector, ngApp }));
}]);

angular.bootstrap(document, [ngApp.name]);   

```

### Usage

To inject angular code into vue app, you simply need to use the special `ng-vue` component that will use angular to run the html contained inside the `vue-ng` component `default` slot html. Angular html portion should use `v-pre` directive to tell `Vue` to keep the html as is (preformatted html). you only have to declare all prop you want to expose to angular.

```html  
This code run in Vue. my name from Vue: {{name}}
<vue-ng :name="name">
    <div v-pre>
        this code run in angular!
        My name passed to Angular {{name}}
    </div>
</vue-ng>

```

You can also renamed props exposed to angular

```html  
My name from Vue is stored in myNameInVue = {{myNameInVue}}
<vue-ng :my-name-in-angular="myNameInVue">
    <div v-pre>
        My name passed to Angular in myNameInAngular = {{myNameInAngular}}
    </div>
</vue-ng>

```


Or do two-way binding

** TODO TO REVIEW **

```html  
My name from Vue is stored in myNameInVue = {{myNameInVue}}
<vue-ng :my-name-in-angular.sync="myNameInVue">
    <div v-pre>
       Type your name from Angular in myNameInAngular = <input ng-model="myNameInAngular"><br>
       Your name {{myNameInAngular}} will be sync back to Vue parent `myNameInVue` prop.

    </div>
</vue-ng>

```


Of course you can mix and match `vue-ng` & `ng-vue`

```html  
My name from Vue is: {{name}}
<vue-ng :name="name">
    <div v-pre>

        My name from Angular (inside vue) is: {{name}}

        <div ng-vue :name="name">

           My name from Vue (inside Angular (inside Vue)) is: {{name}}

           <vue-ng :name="name">
               <div v-pre>
                   My name from Angular (inside Vue (inside Angular (inside Vue))) is: {{name}}
                   ...
               </div>
           </vue-ng>

        </div>

    </div>
</vue-ng>

```