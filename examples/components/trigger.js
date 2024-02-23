export default {
    template:`<div><button @click="trigger(message)">Send Alert!</button> with: {{message}}</div>`,
    props: [ 'message' ],
    emits: ['alert'],
    methods:{
        trigger(v){ this.$emit('alert', v)}
    }
}
