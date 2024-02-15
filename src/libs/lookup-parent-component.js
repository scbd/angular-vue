export default function lookup (element) {
  let parent = element;
  let component = parent?.$component;

  while (!component && parent) {
    parent = parent.parentElement;
    component = parent?.$component;
  }

  return component;
}
