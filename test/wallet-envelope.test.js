import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  buildEncryptedEnvelope,
  buildUnencryptedEnvelope,
  decryptEnvelope,
  buildAad,
  DEFAULT_SCRYPT_PARAMS,
} from '../src/wallet-envelope.js';

// Nothing in this project decrypted a wallet it had written until these tests
// existed. A divergence between the writer and the official reader would be
// invisible at save time — the file writes, the UI reports success, the user
// destroys their paper backup — and would surface months later as an
// unconditional authentication failure with the correct password.

// The production work factor needs 128 MiB and ~1s per derivation. The
// construction under test is identical at a lower N, so the suite uses one
// that keeps CI fast. `roundtrips at the production work factor` covers the
// real parameters once.
const FAST = { ...DEFAULT_SCRYPT_PARAMS, N: 1 << 12 };
const OPTS = { subtle: webcrypto.subtle, params: FAST };
const PASSWORD = 'correct horse battery staple';

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

const encrypt = (password = PASSWORD, wallet = WALLET) =>
  buildEncryptedEnvelope(wallet, password, undefined, OPTS);

test('an encrypted wallet decrypts to exactly what was encrypted', async () => {
  const envelope = await encrypt();
  const recovered = await decryptEnvelope(envelope, PASSWORD, { subtle: webcrypto.subtle });
  assert.deepEqual(recovered, WALLET);
});

test('envelope has the v3 shape a reader expects', async () => {
  const envelope = await encrypt();
  assert.equal(envelope.version, 3);
  assert.equal(envelope.encrypted, true);
  assert.equal(envelope.kdf.name, 'scrypt');
  assert.equal(envelope.cipher.name, 'aes-256-gcm');
  // Salt, IV and tag are hex of the documented lengths.
  assert.match(envelope.kdf.params.salt, /^[0-9a-f]{64}$/);
  assert.match(envelope.cipher.iv, /^[0-9a-f]{24}$/);
  assert.match(envelope.cipher.authTag, /^[0-9a-f]{32}$/);
  assert.match(envelope.data, /^[0-9a-f]+$/);
  // The tag is stored separately, not appended to data.
  assert.ok(!envelope.data.endsWith(envelope.cipher.authTag));
});

test('the wrong password is rejected', async () => {
  const envelope = await encrypt();
  await assert.rejects(() => decryptEnvelope(envelope, 'wrong password', { subtle: webcrypto.subtle }));
});

test('salt and IV are fresh on every save, so key and nonce cannot both repeat', async () => {
  const [a, b] = await Promise.all([encrypt(), encrypt()]);
  assert.notEqual(a.kdf.params.salt, b.kdf.params.salt);
  assert.notEqual(a.cipher.iv, b.cipher.iv);
  assert.notEqual(a.data, b.data);
});

// Each of these fields is bound into the AAD. Tampering with any of them must
// fail authentication rather than silently weakening the file — an attacker
// who could lower N would make brute force cheap.
const TAMPER_CASES = [
  ['ciphertext', (e) => { e.data = `${e.data.slice(0, -2)}${e.data.slice(-2) === 'ff' ? '00' : 'ff'}`; }],
  ['scrypt work factor N', (e) => { e.kdf.params.N = 1024; }],
  ['scrypt salt', (e) => { e.kdf.params.salt = 'ff'.repeat(32); }],
  ['scrypt r', (e) => { e.kdf.params.r = 1; }],
  ['cipher IV', (e) => { e.cipher.iv = 'ff'.repeat(12); }],
  ['auth tag', (e) => { e.cipher.authTag = 'ff'.repeat(16); }],
  ['envelope version', (e) => { e.version = 4; }],
];

for (const [label, tamper] of TAMPER_CASES) {
  test(`tampering with the ${label} is rejected`, async () => {
    const envelope = await encrypt();
    tamper(envelope);
    await assert.rejects(
      () => decryptEnvelope(envelope, PASSWORD, { subtle: webcrypto.subtle }),
      `tampering with ${label} was NOT detected`,
    );
  });
}

test('AAD is the exact byte string readers must reproduce', async () => {
  // Pinning this is the point: any change to key order, whitespace, or field
  // selection breaks every wallet this application has ever written. If this
  // test fails, the format changed — that is a breaking change, not a fixup.
  const aad = buildAad({
    version: 3,
    kdf: {
      name: 'scrypt',
      params: { N: 131072, r: 8, p: 1, dkLen: 32, salt: 'ab'.repeat(32) },
    },
    cipher: { name: 'aes-256-gcm', iv: 'cd'.repeat(12), authTag: 'ef'.repeat(16) },
  });
  assert.equal(
    new TextDecoder().decode(aad),
    '{"version":3,"kdf":{"name":"scrypt","params":{"N":131072,"r":8,"p":1,"dkLen":32,'
    + `"salt":"${'ab'.repeat(32)}"}},"cipher":{"name":"aes-256-gcm","iv":"${'cd'.repeat(12)}"}}`,
  );
  // authTag must be excluded — it is computed over these bytes.
  assert.ok(!new TextDecoder().decode(aad).includes('authTag'));
});

test('unencrypted envelope carries the wallet verbatim', () => {
  const envelope = buildUnencryptedEnvelope(WALLET);
  assert.deepEqual(envelope, { version: 3, encrypted: false, data: WALLET });
});

test('decrypting an unencrypted envelope is refused rather than misread', async () => {
  await assert.rejects(
    () => decryptEnvelope(buildUnencryptedEnvelope(WALLET), PASSWORD, { subtle: webcrypto.subtle }),
    /not encrypted/,
  );
});

test('roundtrips at the production work factor (N=2^17, 128 MiB)', async () => {
  const envelope = await buildEncryptedEnvelope(WALLET, PASSWORD, undefined, { subtle: webcrypto.subtle });
  assert.equal(envelope.kdf.params.N, 1 << 17);
  assert.equal(envelope.kdf.params.r, 8);
  const recovered = await decryptEnvelope(envelope, PASSWORD, { subtle: webcrypto.subtle });
  assert.deepEqual(recovered, WALLET);
});

test('a non-ASCII password roundtrips', async () => {
  const password = 'pässwörd–ünïcode-🔐-Ω';
  const envelope = await encrypt(password);
  assert.deepEqual(
    await decryptEnvelope(envelope, password, { subtle: webcrypto.subtle }),
    WALLET,
  );
});

test('the progress callback is invoked and its return value is ignored', async () => {
  // scrypt-js treats a truthy return from the progress callback as a
  // cancellation request. A callback rewritten to the concise arrow form
  // would return a number and abort every encryption from 1% onwards.
  let calls = 0;
  const envelope = await buildEncryptedEnvelope(
    WALLET,
    PASSWORD,
    (progress) => { calls += 1; return progress; },
    OPTS,
  );
  assert.ok(calls > 0, 'progress callback was never called');
  assert.deepEqual(await decryptEnvelope(envelope, PASSWORD, { subtle: webcrypto.subtle }), WALLET);
});

