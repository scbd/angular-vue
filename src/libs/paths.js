export default {
  parent,
  parents,
  leaf,
  root,
  isRoot,
};

function parent(path) {
  validatePath(path);

  const parts = split(path);

  parts.pop();

  return combine(parts);
}

function parents(path) {
  validatePath(path);

  const parentPaths = [];

  let parentPath = parent(path);

  while (parentPath) {
    parentPaths.push(parentPath);
    parentPath = parent(parentPath);
  }

  return parentPaths;
}

function leaf(path) {
  validatePath(path);

  const parts = split(path);
  return parts.pop();
}

function root(path) {
  validatePath(path);
  return split(path)[0];
}

function isRoot(path) {
  validatePath(path);
  return split(path).length === 1;
}

function split(path) {
  if (!path) throw new Error(`Invalid path ${path}`);

  return path.split('.');
}

function combine(parts) {
  return parts.join('.');
}

function validatePath(path) {
  const pathRe = /^[a-z_$][a-z0-9_$]+(\.[a-z_$][a-z0-9_$]+)*$/i; // abc || abc.def123.hijklXXX

  if (!path)                      throw new Error('Invalid path');
  if (typeof (path) !== 'string') throw new Error('Path must be a string');
  if (!pathRe.test(path))         throw new Error(`Path format is invalid. It must match: property OR property.subProperty.subProperty.... Path: ${path}`);
}
