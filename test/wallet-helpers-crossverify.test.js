import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import { buildEncryptedEnvelope, decryptEnvelope, DEFAULT_SCRYPT_PARAMS } from '../src/wallet-envelope.js';

// The one property the rest of the suite cannot establish.
//
// test/wallet-envelope.test.js proves this application can read back what it
// writes, which catches regressions but not an original divergence: if our
// AAD serialisation had always differed from the reference implementation's,
// our own round-trip would still pass and every wallet would still be
// unreadable by the QRL web wallet.
//
// @theqrl/wallet-helpers is the library the web wallet uses. Decrypting our
// output with it is what turns "we believe this is v3" into "this is v3".

// The package's public entry, not dist/v3wallet.js — reaching into a
// dependency's internal layout means a repackaging upstream breaks the one
// test that proves our wallets are readable.
const require = createRequire(import.meta.url);
const { v3WalletDecrypt, v3Wallet } = require('@theqrl/wallet-helpers');

// Reduced work factor keeps the suite fast; the serialisation under test is
// identical at any N, and the parameters travel inside the envelope.
const FAST_PARAMS = { ...DEFAULT_SCRYPT_PARAMS, N: 1 << 12 };
const OPTS = { subtle: webcrypto.subtle, params: FAST_PARAMS };
const PASSWORD = 'Xk7#mQp2Lv9w';

const WALLET = {
  address: 'Q010500e1f2c3d4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff0011',
  pk: 'aa'.repeat(67),
  hexseed: '00'.repeat(51),
  mnemonic: Array(34).fill('aback').join(' '),
  height: 10,
  hashFunction: 0,
  signatureType: 0,
  index: 0,
};

test('the official reader decrypts a wallet this application wrote', async () => {
  const envelope = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, OPTS);
  const recovered = v3WalletDecrypt(envelope, PASSWORD);
  const parsed = typeof recovered === 'string' ? JSON.parse(recovered) : recovered;
  assert.deepEqual(parsed, WALLET);
});

test('the official reader rejects the wrong password on our output', async () => {
  const envelope = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, OPTS);
  assert.throws(() => v3WalletDecrypt(envelope, 'not the password'));
});

test('the official reader detects tampering with our envelope', async () => {
  // Confirms the AAD binding survives the boundary, not just our own reader.
  const envelope = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, OPTS);
  envelope.kdf.params.N = 1024;
  assert.throws(() => v3WalletDecrypt(envelope, PASSWORD));
});

test('we decrypt a wallet the official writer produced', async () => {
  // The other direction. A user who created a wallet in the web wallet and
  // opens it here must get the same bytes back.
  const theirs = v3Wallet(WALLET, true, PASSWORD, { kdf: 'scrypt', scrypt: FAST_PARAMS });
  const envelope = typeof theirs === 'string' ? JSON.parse(theirs) : theirs;
  const recovered = await decryptEnvelope(envelope, PASSWORD, { subtle: webcrypto.subtle });
  assert.deepEqual(recovered, WALLET);
});

test('our envelope is structurally identical to the official writer output', async () => {
  const ours = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, OPTS);
  const theirsRaw = v3Wallet(WALLET, true, PASSWORD, { kdf: 'scrypt', scrypt: FAST_PARAMS });
  const theirs = typeof theirsRaw === 'string' ? JSON.parse(theirsRaw) : theirsRaw;

  assert.deepEqual(Object.keys(ours).sort(), Object.keys(theirs).sort());
  assert.deepEqual(Object.keys(ours.cipher).sort(), Object.keys(theirs.cipher).sort());
  assert.deepEqual(Object.keys(ours.kdf).sort(), Object.keys(theirs.kdf).sort());
  assert.deepEqual(Object.keys(ours.kdf.params).sort(), Object.keys(theirs.kdf.params).sort());

  assert.equal(ours.version, theirs.version);
  assert.equal(ours.encrypted, theirs.encrypted);
  assert.equal(ours.kdf.name, theirs.kdf.name);
  assert.equal(ours.cipher.name, theirs.cipher.name);
  assert.equal(typeof ours.data, typeof theirs.data);
  // Salt, IV, tag and ciphertext differ per encryption; their lengths must not.
  assert.equal(ours.kdf.params.salt.length, theirs.kdf.params.salt.length);
  assert.equal(ours.cipher.iv.length, theirs.cipher.iv.length);
  assert.equal(ours.cipher.authTag.length, theirs.cipher.authTag.length);
});

test('cross-verification holds at the production work factor', async () => {
  const envelope = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, { subtle: webcrypto.subtle });
  assert.equal(envelope.kdf.params.N, 1 << 17);
  const recovered = v3WalletDecrypt(envelope, PASSWORD);
  const parsed = typeof recovered === 'string' ? JSON.parse(recovered) : recovered;
  assert.deepEqual(parsed, WALLET);
});

