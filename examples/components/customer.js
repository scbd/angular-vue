export default {
    template:
        `<div>
  <h5> vvv this is vue vvv</h5>
  <div>client: {{ client }}</div>
  <div>clickCount: {{ clickCount }}</div>
  <div>isOk: {{ isOk }}</div>
  <div>clickCount: <input v-model="clickCount" type="number"></div>
  
  <h5> vvv this is angular using v-model:click-count="clickCount" vvv</h5>
  <d-customer v-vue-ng :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" placeholder="my place hoder" v-model:click-count="clickCount"></d-customer>

  <h5> vvv this is angular "&lt;div v-vue-ng:d-customer.a .../&gt;" vvv</h5>
  <div v-vue-ng:d-customer.a :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" :click-count="clickCount"></div>

  <h5> vvv this is angular "&lt;div v-vue-ng:d-customer.c .../&gt;" vvv</h5>
  <div v-vue-ng:d-customer.c :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" :click-count="clickCount"></div>

  <h5> vvv this is angular "&lt;div v-vue-ng:d-customer .../&gt;" vvv</h5>
  <div v-vue-ng:d-customer :customer="client" @callback="myAlert($event)" :is-ok="(clickCount%2)!=0" :click-count="clickCount"></div>


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
