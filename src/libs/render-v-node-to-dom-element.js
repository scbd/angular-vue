export default function renderVNodeToDomElement(vNode) {

    const comp = new Vue({ render: () => vNode }); // create a dummy component that return the VNode from the render fn

    comp.$mount() // Mount as an orphan component

    const domElement = comp.$el; // Save the native DOM Element converted from VNode;

    comp.$destroy();

    return domElement;
}