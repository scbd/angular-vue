
export default ['$location', ($location)=> ({
    restrict: 'E',
    templateUrl: '/examples/directives/customer.html',
    scope: {
        customer: '=customer',
        callbackFn: '&callback',
        isOk: '&isOk',
        clickCount: '=clickCount'
    },
    link: function(scope) {


        console.log('customer', scope.customer);
        console.log('callback', scope.callbackFn);
    }
})];



