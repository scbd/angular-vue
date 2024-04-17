export default {
    template:
        `<div>
  <h5> vvv this is vue vvv</h5>
  <div>client: {{ client }}</div>
  <div>clickCount: {{ clickCount }}</div>
  <div>isOk: {{ isOk }}</div>
  <div>clickCount: <input v-model="clickCount" type="number"></div>
  
  <h5> vvv this is angular using :click-count="clickCount" vvv</h5>
  <d-customer v-vue-ng :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" :click-count="clickCount"></d-customer>

  <h5> vvv this is angular using v-model:click-count="clickCount" vvv</h5>
  <d-customer v-vue-ng :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" v-model:click-count="clickCount"></d-customer>

</div>
`,


    data: () => ({
        clickCount : 0,
        client: {
            firstName : 'my',
            lastName  : 'name'
        }
    }),
    computed: {
        isOk() { return this.clickCount%2!=0 }
    },
    methods: {
        myAlert(msg) {
            this.clickCount++;
            alert(msg)
        },
        myVueIsOk() {
            return this.clickCount%2!=0;
        }
    }
}
