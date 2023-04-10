import camelCase from "lodash/camelCase";

export default function pascalCase(t) {
  t = camelCase(t);

  if(t) t = t[0].toUpperCase() + t.slice(1);

  return t;
};

