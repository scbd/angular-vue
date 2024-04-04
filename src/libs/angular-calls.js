export function safeApply ($scope, fn) {
  const phase = $scope.$root.$$phase;

  if (phase === '$apply' || phase === '$digest') {
    return fn();
  } else {
    return $scope.$apply(fn);
  }
}

export function safeDelegate ($scope, delegate) {
  return (...params) => {
    return safeApply($scope, () => delegate(...params));
  };
}
