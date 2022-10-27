export default function safeApply($scope, fn) {
    var phase = $scope.$root.$$phase;

    if (phase == '$apply' || phase == '$digest') {
        fn();
    } else {
        $scope.$apply(fn);
    }
};