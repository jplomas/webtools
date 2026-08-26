// V3 wallet envelope: scrypt key derivation + AES-256-GCM authenticated
// encryption. Extracted from the view component so it can be tested — nothing
// in this project previously decrypted a wallet it had written.
//
// The format is specified in docs/v3-wallet-format.md. The AAD serialisation
// in `buildAad` is a compatibility contract with every reader of these files:
// a reader must reproduce those bytes exactly or no wallet will ever decrypt.
// Do not reorder the keys, do not add whitespace, and do not include authTag.

// scrypt-js is CommonJS. Vite's interop resolves a named import, but Node's
// ESM loader does not, and this module is imported directly by the test suite.
// The default-import form works under both.
import scryptJs from 'scrypt-js';
import { getSecureRandomBytes } from './secure-random.js';

const { scrypt } = scryptJs;

export const DEFAULT_SCRYPT_PARAMS = {
  N: 1 << 17, // 131072 — memory cost is 128 * N * r = 128 MiB
  r: 8,
  p: 1,
  dkLen: 32,
  saltLen: 32,
};

export const DEFAULT_IV_LEN = 12;
export const TAG_LEN = 16;

export function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i].toString(16);
    hex += value.length === 1 ? `0${value}` : value;
  }
  return hex;
}

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function encodeUtf8(text) {
  return new TextEncoder().encode(text);
}

// Key order and compact serialisation are load-bearing. See the module note.
export function buildAad(meta) {
  return encodeUtf8(JSON.stringify({
    version: meta.version,
    kdf: meta.kdf,
    cipher: {
      name: meta.cipher.name,
      iv: meta.cipher.iv,
    },
  }));
}

async function deriveKeyScrypt(password, salt, params, progressCallback) {
  const passwordBytes = typeof password === 'string' ? encodeUtf8(password) : new Uint8Array(password);

  // scrypt-js treats a truthy return from the progress callback as a
  // cancellation request and aborts with Error('cancelled'). A caller writing
  // the natural concise arrow — (p) => this.progress = p * 100 — returns a
  // number, which is truthy from 1% onwards and would silently break every
  // encryption. Swallow the return value so that cannot happen.
  const guardedProgress = progressCallback
    ? (progress) => { progressCallback(progress); }
    : undefined;

  try {
    return await scrypt(passwordBytes, salt, params.N, params.r, params.p, params.dkLen, guardedProgress);
  } finally {
    passwordBytes.fill(0);
  }
}

async function encryptAead(plainBytes, keyBytes, iv, aad, subtle) {
  const key = await subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LEN * 8, additionalData: aad },
    key,
    plainBytes,
  );
  const cipherBytes = new Uint8Array(cipherBuffer);
  return {
    encrypted: cipherBytes.slice(0, cipherBytes.length - TAG_LEN),
    authTag: cipherBytes.slice(cipherBytes.length - TAG_LEN),
  };
}

export async function buildEncryptedEnvelope(walletData, password, progressCallback, options = {}) {
  const subtle = options.subtle ?? globalThis.crypto.subtle;
  const params = { ...DEFAULT_SCRYPT_PARAMS, ...options.params };
  const salt = getSecureRandomBytes(params.saltLen);
  const iv = getSecureRandomBytes(DEFAULT_IV_LEN);

  const key = await deriveKeyScrypt(password, salt, params, progressCallback);

  const meta = {
    version: 3,
    kdf: {
      name: 'scrypt',
      params: {
        N: params.N, r: params.r, p: params.p, dkLen: params.dkLen, salt: bytesToHex(salt),
      },
    },
    cipher: { name: 'aes-256-gcm', iv: bytesToHex(iv) },
  };

  const plainBytes = encodeUtf8(JSON.stringify(walletData));
  let encrypted;
  let authTag;
  try {
    ({ encrypted, authTag } = await encryptAead(plainBytes, key, iv, buildAad(meta), subtle));
  } finally {
    // Mutable buffers can be wiped; the JSON string they came from cannot.
    plainBytes.fill(0);
    key.fill(0);
  }

  meta.cipher.authTag = bytesToHex(authTag);

  return {
    version: 3,
    encrypted: true,
    kdf: meta.kdf,
    cipher: meta.cipher,
    data: bytesToHex(encrypted),
  };
}

export function buildUnencryptedEnvelope(walletData) {
  return { version: 3, encrypted: false, data: walletData };
}

// The application never calls this — it only writes wallets. It exists so the
// test suite can prove that what we write can be read back, which is the one
// property whose failure would be both silent and unrecoverable.
export async function decryptEnvelope(envelope, password, options = {}) {
  const subtle = options.subtle ?? globalThis.crypto.subtle;
  if (envelope.encrypted !== true) throw new Error('Envelope is not encrypted');
  if (envelope.version !== 3) throw new Error(`Unsupported envelope version: ${envelope.version}`);

  const p = envelope.kdf.params;
  const key = await scrypt(encodeUtf8(password), hexToBytes(p.salt), p.N, p.r, p.p, p.dkLen);
  const aad = buildAad({
    version: envelope.version,
    kdf: envelope.kdf,
    cipher: { name: envelope.cipher.name, iv: envelope.cipher.iv },
  });

  const ciphertext = hexToBytes(envelope.data);
  const authTag = hexToBytes(envelope.cipher.authTag);
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  const cryptoKey = await subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const plain = await subtle.decrypt(
    {
      name: 'AES-GCM', iv: hexToBytes(envelope.cipher.iv), tagLength: TAG_LEN * 8, additionalData: aad,
    },
    cryptoKey,
    combined,
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

