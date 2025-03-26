import { h } from 'vue';

export default {
  render () {
    return h('span', this.$slots.default ? this.$slots.default() : '');
  }
};
