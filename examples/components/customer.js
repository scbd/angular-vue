
export default {
    template:
        `<div>
  <h5> vvv this is vue vvv</h5>
  client: {{ client }}
  
  <h5> vvv this is angular vvv</h5>
  <vue-ng :myVueToNgMappedName="client" @theMappedFunctionName="myAlert($event)">
      <d-customer v-pre customer="myVueToNgMappedName" callback="theMappedFunctionName($event)"></d-customer>
  </vue-ng>
</div>
`,

    data: () => ({
        client: {
            firstName : 'my',
            lastName  : 'name'
        }
    }),
    methods: {
        myAlert(msg) {
            alert(msg)
        }
    }
}
