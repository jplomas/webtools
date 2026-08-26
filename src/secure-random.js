export const SECURE_RANDOM_ERROR =
  'This browser has no secure random number generator. Wallet generation cannot continue safely.';

export const ALL_ZEROES_ERROR =
  'The secure random number generator returned all zeroes. Wallet generation stopped.';

// Every source of randomness in this project goes through here. The all-zeroes
// check exists to catch a getRandomValues that returns without writing to its
// target — a real failure mode for stubs, shims, and hostile extensions, and
// one the type and length checks above it cannot see.
export function getSecureRandomBytes(length, cryptoObject) {
  const cryptoSource = arguments.length < 2 ? globalThis.crypto : cryptoObject;

  if (!cryptoSource || typeof cryptoSource.getRandomValues !== 'function') {
    throw new Error(SECURE_RANDOM_ERROR);
  }

  let bytes;
  try {
    bytes = cryptoSource.getRandomValues(new Uint8Array(length));
  } catch {
    throw new Error(SECURE_RANDOM_ERROR);
  }
  if (!(bytes instanceof Uint8Array) || bytes.length !== length) {
    throw new Error(SECURE_RANDOM_ERROR);
  }
  if (bytes.every((byte) => byte === 0)) {
    throw new Error(ALL_ZEROES_ERROR);
  }

  return bytes;
}

export function getSecureRandomSeed(cryptoObject) {
  return arguments.length === 0
    ? getSecureRandomBytes(48)
    : getSecureRandomBytes(48, cryptoObject);
}

