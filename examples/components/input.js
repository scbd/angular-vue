
export default {
    template:`<input v-model="internalMsg">`,
    props: {
        modelValue: String
    },
    computed: {
        internalMsg : {
            get()  { return this.modelValue },
            set(v) { this.$emit(`update:modelValue`, v) }
        }
    },
}
