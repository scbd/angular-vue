const template = `
<div>
{{message}}
    <ng v-vue-ng:d-pane  title="ng->Vue transclude" >
        <b class='vue-box'>my transcluded content. vueMessage: {{ message }}</b>
    </ng>
</div>
`;

export default {
    template: template,
    props: {
        message: { type:String, default: "" },
    }
}
