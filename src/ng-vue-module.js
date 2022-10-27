import angular from 'angular';
import ngVueDirective from './directives/ng-vue.js';

const ngModule = angular.module('angularVue', []);

ngModule.directive('ngVue', ngVueDirective);

export default ngModule;

