import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSecureRandomSeed,
  getSecureRandomBytes,
  SECURE_RANDOM_ERROR,
  ALL_ZEROES_ERROR,
} from '../src/secure-random.js';
import { generateWalletData } from '../src/wallet-generation.js';

function makeQrllibStub() {
  const received = {};
  function Uint8Vector() { this.values = []; }
  Uint8Vector.prototype.push_back = function pushBack(value) { this.values.push(value); };

  const qrllib = {
    Uint8Vector,
    // Real embind enums are objects, not numbers. SHA2_256 is 0 here on
    // purpose: the previous `||` lookup could not tell a valid 0 from an
    // absent key.
    eHashFunction: { SHA2_256: 0, SHAKE_128: 1, SHAKE_256: 2 },
    Xmss: {
      fromParameters(vector, height, hashFunction) {
        received.vector = vector.values;
        received.height = height;
        received.hashFunction = hashFunction;
        return {
          getAddress: () => 'address',
          getPK: () => 'pk',
          getHexSeed: () => 'hexseed',
          getMnemonic: () => 'mnemonic',
        };
      },
    },
  };
  return { qrllib, received };
}

test('requests 48 CSPRNG bytes and passes them unchanged to fromParameters', async () => {
  const entropy = Uint8Array.from({ length: 48 }, (_, index) => index + 1);
  let requestedLength;
  const seed = getSecureRandomSeed({
    getRandomValues(target) {
      requestedLength = target.length;
      target.set(entropy);
      return target;
    },
  });

  const { qrllib, received } = makeQrllibStub();
  await generateWalletData(qrllib, {
    randomSeed: Array.from(seed), xmssHeight: 10, hashFunction: 'SHAKE_128', regen: false,
  });

  assert.equal(requestedLength, 48);
  assert.deepEqual(received.vector, Array.from(entropy));
});

test('the selected tree height and hash function reach fromParameters', async () => {
  // Tree height fixes how many signatures the wallet can ever make and the
  // hash function fixes the address format, so silently substituting either
  // produces a wallet the user did not ask for, with no visible difference
  // until it is used on-chain.
  const { qrllib, received } = makeQrllibStub();
  await generateWalletData(qrllib, {
    randomSeed: Array.from({ length: 48 }, () => 7),
    xmssHeight: 14,
    hashFunction: 'SHAKE_256',
    regen: false,
  });

  assert.equal(received.height, 14);
  assert.equal(received.hashFunction, qrllib.eHashFunction.SHAKE_256);
});

test('a hash function whose enum value is 0 is not mistaken for absent', async () => {
  const { qrllib, received } = makeQrllibStub();
  await generateWalletData(qrllib, {
    randomSeed: Array.from({ length: 48 }, () => 7),
    xmssHeight: 10,
    hashFunction: 'SHA2_256',
    regen: false,
  });
  assert.equal(received.hashFunction, 0);
});

test('an unknown hash function throws instead of silently falling back', async () => {
  const { qrllib } = makeQrllibStub();
  await assert.rejects(
    () => generateWalletData(qrllib, {
      randomSeed: Array.from({ length: 48 }, () => 7),
      xmssHeight: 10,
      hashFunction: 'SHAKE_512',
      regen: false,
    }),
    /Unknown hash function/,
  );
});

test('generation refuses entropy that is not exactly 48 bytes', async () => {
  const { qrllib } = makeQrllibStub();
  for (const randomSeed of [[], Array.from({ length: 47 }, () => 1), Array.from({ length: 49 }, () => 1)]) {
    await assert.rejects(
      () => generateWalletData(qrllib, {
        randomSeed, xmssHeight: 10, hashFunction: 'SHAKE_128', regen: false,
      }),
      /48 bytes/,
    );
  }
});

test('fails closed immediately when secure randomness is unavailable', () => {
  assert.throws(() => getSecureRandomSeed(undefined), { message: SECURE_RANDOM_ERROR });
  assert.throws(() => getSecureRandomSeed({}), { message: SECURE_RANDOM_ERROR });
  assert.throws(() => getSecureRandomSeed({ getRandomValues() { throw new Error('platform failure'); } }), {
    message: SECURE_RANDOM_ERROR,
  });
});

test('fails closed on an all-zero seed', () => {
  // The failure mode this guards is a getRandomValues that returns without
  // writing to its target — a real behaviour for stubs, shims and hostile
  // extensions, and one the type and length checks cannot see.
  assert.throws(
    () => getSecureRandomSeed({ getRandomValues(target) { return target; } }),
    { message: ALL_ZEROES_ERROR },
  );
});

test('fails closed on a wrong-length result', () => {
  assert.throws(
    () => getSecureRandomSeed({ getRandomValues() { return new Uint8Array(16).fill(1); } }),
    { message: SECURE_RANDOM_ERROR },
  );
});

test('salt and IV generation carries the same guarantees as the seed', () => {
  // The scrypt salt and the GCM IV used to bypass this guard. An all-zero
  // salt means one precomputation opens every wallet; an all-zero IV means
  // GCM nonce reuse under a repeated key.
  assert.throws(() => getSecureRandomBytes(32, undefined), { message: SECURE_RANDOM_ERROR });
  assert.throws(() => getSecureRandomBytes(32, {}), { message: SECURE_RANDOM_ERROR });
  assert.throws(
    () => getSecureRandomBytes(32, { getRandomValues(target) { return target; } }),
    { message: ALL_ZEROES_ERROR },
  );

  const bytes = getSecureRandomBytes(32);
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(bytes.length, 32);
  assert.ok(bytes.some((b) => b !== 0));
});

test('regeneration validates the shape of a hexseed or mnemonic', async () => {
  const { qrllib } = makeQrllibStub();
  await assert.rejects(
    () => generateWalletData(qrllib, { regen: true, hexseedMnemonic: 'not a seed' }),
    /Invalid hexseed\/mnemonic/,
  );
});

