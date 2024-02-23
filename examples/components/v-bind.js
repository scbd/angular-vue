export default {
    template:`<pre>{{$props}}</pre>`,
    props: {
        message: {},
        vueVersion: {},
        aPropValue: {},
        clickCount: {},
        nonBoundProp: { default:"this value is not set on v-bind object" } 
    }
}
