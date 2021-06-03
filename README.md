# SCBD angularVue

The goal of this library is to help SCBD to migrate away from AngularJS by allowing VueJs component to be use into the AngularJS world without having to change code afterwards. Only SCBD needed features are implemented. If you are looking for robust implementation to mix the two platforms please look at https://github.com/ngVue/ngVue

Why another angular to vue:
- Seamless / Transparent integration
- Use natural VueJS syntax. (`v-bind:my-prop="..."` or `:my-prop="..."`) and event (`v-on:my-event="..."` / `@my-event="..."`) on bridged component
- Possibility to use [local registration of components](https://vuejs.org/v2/guide/components-registration.html#Local-Registration-in-a-Module-System) without having to register them globally (not need to call `Vue.component('myComponent', {...})`)
- No need to register created a wrapper directives or use a special elements (eg: `<vue-component />`) to use vue components
- No need to change the code of a component when angular parent component/view is migrated to VueJs...  component props/event binding remain unchanged

*This documentation is incomplete*

## How it works

**angularVue** Use non interfering helper directives (`ng-vue` & `ng-vue-expose`) on the root of the Vue section in the angular partial/templates. 

### The `ng-vue` directive

When this directive attribute is present on a html element it becomes managed by Vue (becomes a vue component). At this stage, AngularJS directive, binding and interpolation is disabled and VueJs take over. You cannot use any angular directives on this element and its descendent anymore. The `ng-vue` directive will automatically expose angular properties present in `v-bind:` and `v-on:` attributes value if they use simple format `myProps` `contact.firstName`. `ng-vue` do not detect binding in interpolation syntax eg: `{{ contact.firstName }}` you need to declare them using `ng-vue-expose` 

### The `ng-vue-expose` attribute 

`ng-vue-expose` goes along with `ng-vue`. It contains a comma separated value that list all angular properties & delegates that need to be exposed to Vue component (if cannot be detect by the simple binding). `ng-vue-expose="myProp1,myProp2,&myDelegate"`. delegates in `ng-vue-expose` must be prefixed by `&` (angular inspiration!);


```html
<div ng-app="app">
    <div ng-controller="MyController">
        <h1>Hello from {{ngWorld}}</h1>
        <h1 ng-vue ng-vue-expose="vueWorld" >Hello from {{vueWorld}}</h1>
        <button ng-vue ng-vue-expose="vueWorld,&alert" :click="alert('Hello from'+vueWorld)">click me</button>
    </div>
</div>
```

```javascript
const app = angular.module('app', ['angularVue'])
  .controller('MyController', function ($scope) {
    $scope.ngWorld  = "Angular";
    $scope.vueWorld = "Vue";
    $scope.alert = function(msg) {
        alert(msg)
    }
  });
```

Auto detect binding from `v-bind:`, v-bind short hand `:m-props`, `v-model`, `v-html`, `v-text`, `v-show`, `v-class`, `v-attr`, `v-style`, `v-if`. 
```html
    <h1 ng-vue v-text="vueWorld" :></h1>
```


## Vue Options 

You can pass *Vue host wrapper* component options ot the `ngVue` attribute. Options must be object where key/value will be assigned on *Vue host wrapper*. It allows user to pass additional parameters to the component definition object of the Vue host. Eg: you can use `ngVue` to passe locally registered components to the vue host 

```html
<hello ng-vue="{ components : myVueLocallyDefinedComponents }"></hello>
```

```javascript
myVueLocallyDefinedComponents = { hello : MyHelloComponent };
```

Following properties are blacklisted:

- props
- data
- computed
- methods
- watch

Lifecycle hooks can be passed but the behaviour is not tested yet (no angularjs $apply()/$digest()):

- beforeCreate
- created
- beforeMount
- mounted
- beforeUpdate
- updated
- beforeDestroy
- destroyed
   

## Component registation

 You can register a component globally 

```html
<greeting ng-vue :contact="contact"></greeting>
```
```javascript
Vue.component("greeting", {
    props: [ 'contact' ],
    template: `<b> Hello {{contact.firstName}} {{contact.lastName}}!!<b>`
})

$scope.contact: {
    firstName : "Stephane"
    lastName : "Bilodeau"
}

```

Or locally using `ngVue` `.components`

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
<hello ng-vue :first-name="contact.firstName", :last-name="contact.lastName" ng-vue-options="vueOptions"></hello>
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

But you can make props two-way binding using props `.sync` modifiers and emitting the good `update:prop` event.

```html
<!-- only first-name wil be two-way bound -->

<hello ng-vue :first-name.sync="contact.firstName", :last-name="contact.firstName" ng-vue-options="vueOptions"></hello>
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


# Know problems

**MANY MANY MANY**

- Delegate must be bounded as root property `@click="clicked()"`. Dot is not supported eg: ``@click="ctrl.clicked()"``
- You cannot pass `$property` from angular-to-vue. (eg `$index` from `ngRepeat`) you have to reassign them using `ngInit`
- Not well taking advantage of the reactive framework. `.sync` modifier push value up to angular that push it back down to vue component (double trigger).   / overuse of angular `$watch`
- `ng-vue` directive only look at the root element to detect simple binding. Should browse the element tree 
- Require lodash!
