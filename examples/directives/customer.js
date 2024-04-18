
export default ['$location', ($location)=> ({
    restrict: 'EAC',
    templateUrl: '/examples/directives/customer.html',
    scope: {
        customer: '=customer',
        callbackFn: '&callback',
        isOk: '&isOk',
        clickCount: '=clickCount',
        placeholder: '@placeholder'
    },
    link: function(scope) {


        console.log('customer', scope.customer);
        console.log('callback', scope.callbackFn);
    }
})];



