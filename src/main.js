import './app.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faTriangleExclamation, faWallet, faSpellCheck, faMagnifyingGlass, faTimes, faWandMagicSparkles, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Buffer } from "buffer";

window.Buffer = Buffer;

library.add(faCheck, faTriangleExclamation, faWallet, faSpellCheck, faMagnifyingGlass, faTimes, faWandMagicSparkles, faFingerprint);

const app = createApp(App)
  .use(router)
  .use(store)
  .component("font-awesome-icon", FontAwesomeIcon);

async function startup() {
  try {
    await window.qrllibReady;
    await router.isReady();
  } catch (error) {
    renderStartupFailure(error);
    return;
  }
  app.mount('#app');
}

function renderStartupFailure(error) {
  const root = document.getElementById('app');
  if (!root) return;
  const heading = document.createElement('h1');
  heading.textContent = 'QRL Web Tools could not start';
  const detail = document.createElement('p');
  detail.textContent = error && error.message ? error.message : String(error);
  const advice = document.createElement('p');
  advice.textContent = 'Re-download and verify the release, then check that your browser supports WebAssembly. Do not generate a wallet with a copy that fails to load.';
  root.replaceChildren(heading, detail, advice);
  root.setAttribute('style', 'max-width:40rem;margin:4rem auto;padding:0 1rem;font-family:system-ui,sans-serif');
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

startup();
