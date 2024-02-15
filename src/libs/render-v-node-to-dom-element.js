import { createApp } from 'vue';

export default function renderVNodeToDomElement (vNode) {
  const comp = createApp({ render: () => vNode }); // create a dummy component that return the VNode from the render fn

  const placeHolder = document.createElement('div');

  comp.mount(placeHolder); // Mount as an orphan component

  const domElement = placeHolder.firstElementChild;

  comp.unmount();

  return domElement;
}
