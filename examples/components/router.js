export default {
  props:['clickCount'],
  methods: {
    clicked() {
      this.$emit('update:clickCount', this.clickCount+1);
      this.$router.push({ path: `/updated/${ this.clickCount }`});
    }
  },
  template :'<div>'+
    '<pre>Current route: {{$route}}</pre>'+
    '<div>clickCount: {{clickCount}}</div>'+
    '<div><button type="button" @click="clicked()">Update route</button></div>'+
    '</div>'
}
