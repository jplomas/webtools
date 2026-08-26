import { reactive } from 'vue';

const state = reactive({
  // SHAKE_256 matches the hardened offline generator default and provides a
  // larger preimage-resistance margin without a material generation penalty.
  hash: 'SHAKE_256',
  height: 10,
});

export default {
  state,
  install(app) {
    app.config.globalProperties.$store = this;
  },
};
