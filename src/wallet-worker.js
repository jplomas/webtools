import qrllibSource from '@theqrl/qrllib-browserify/dist/qrllib.js?raw';
import { generateWalletData } from './wallet-generation.js';

self.window = self;
self.document = { createElement: () => ({}) };
const qrllibReady = new Promise((resolve, reject) => {
  const timeout = setTimeout(
    () => reject(new Error('QRL cryptography library failed to load')),
    15000,
  );
  let qrllib;
  Object.defineProperty(self, 'QRLLIB', {
    configurable: true,
    get() { return qrllib; },
    set(value) {
      qrllib = value;
      if (typeof value?.str2bin === 'function') {
        clearTimeout(timeout);
        resolve(value);
      }
    },
  });
  (0, eval)(qrllibSource);
});

// The timeout above rejects 15s after this module loads. If no message has
// arrived by then nothing is awaiting the promise yet, and the rejection would
// surface as an unhandled rejection in the worker. onmessage still sees it.
qrllibReady.catch(() => {});

self.onmessage = async ({ data }) => {
  try {
    const qrllib = await qrllibReady;
    self.postMessage(await generateWalletData(qrllib, data));
  } catch (error) {
    self.postMessage({ error: error.message || 'Wallet generation failed' });
  }
};

