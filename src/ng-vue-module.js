import angular from 'angular';
import vueDirective from './directives/ng-vue.js';

const ngModule = angular.module('angularVue', []);

vueDirective.register(ngModule);
