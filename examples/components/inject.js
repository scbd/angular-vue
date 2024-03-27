import { inject } from 'vue'    
export default {
    template:`<div>The injected value is: {{injectedValue()}}<br><button v-if="injectedFn" @click="onClick()">Callback</button></div>`,
    setup() {

        const injected = inject('testInject') || "not set";
        const injectedFn = inject('testCallback');

        const injectedValue = ()=> injected;
        const onClick = () => {
            const retValue = injectedFn(injectedValue());
            alert(`returned value: ${retValue}`);
        }

        return { injectedValue, injectedFn, onClick }
    }
}
