export default function safeApply ($scope, fn) {
  const phase = $scope.$root.$$phase;

  if (phase === '$apply' || phase === '$digest') {
    return fn();
  } else {
    return $scope.$apply(fn);
  }
}
