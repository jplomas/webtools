/* global QRLLIB */
import './app.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faWallet, faSpellCheck, faMagnifyingGlass, faTimes, faWandMagicSparkles, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Buffer } from "buffer";

window.Buffer = Buffer;

library.add(faCheck, faWallet, faSpellCheck, faMagnifyingGlass, faTimes, faWandMagicSparkles, faFingerprint);

const waitForQRLLIB = (callBack) => {
  setTimeout(() => {
    if (typeof QRLLIB.str2bin === 'function') {
      callBack();
    } else {
      return waitForQRLLIB(callBack);
    }
    return false;
  }, 50);
};

const app = createApp(App)
  .use(router)
  .use(store)
  .component("font-awesome-icon", FontAwesomeIcon);

async function startup() {
  waitForQRLLIB(() => {
    router.isReady().then(() => {
      app.mount('#app');
      document.getElementById('loading').style.display = 'none';
      document.getElementById('loaded').style.display = 'block';
    });
  });
}

startup();
