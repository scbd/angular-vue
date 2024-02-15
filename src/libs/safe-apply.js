export default function safeApply ($scope, fn) {
  const phase = $scope.$root.$$phase;

  if (phase === '$apply' || phase === '$digest') {
    fn();
  } else {
    $scope.$apply(fn);
  }
}
