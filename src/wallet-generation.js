export function toUint8Vector(qrllib, bytes) {
  const vector = new qrllib.Uint8Vector();
  for (const byte of bytes) vector.push_back(byte);
  return vector;
}

// Fails rather than defaulting: the hash function determines the address
// format and signature scheme, so silently substituting one would produce a
// wallet the user did not ask for with no visible difference until it is used
// on-chain. `in` rather than `||` so an enum whose value is 0 still resolves.
function getHashFunction(qrllib, name) {
  if (!(name in qrllib.eHashFunction)) {
    throw new Error(`Unknown hash function: ${name}`);
  }
  return qrllib.eHashFunction[name];
}

export async function generateWalletData(qrllib, options) {
  const { randomSeed, xmssHeight, hashFunction, regen, hexseedMnemonic } = options;
  let xmss;

  if (!regen) {
    if (!Array.isArray(randomSeed) || randomSeed.length !== 48) {
      throw new Error('Wallet generation requires exactly 48 bytes of secure entropy');
    }
    const seedVector = toUint8Vector(qrllib, randomSeed);
    xmss = qrllib.Xmss.fromParameters(
      seedVector,
      xmssHeight,
      getHashFunction(qrllib, hashFunction),
    );
  } else if (hexseedMnemonic.trim().length === 102) {
    xmss = qrllib.Xmss.fromHexSeed(hexseedMnemonic.trim());
  } else if (hexseedMnemonic.trim().split(/\s+/).length === 34) {
    xmss = qrllib.Xmss.fromMnemonic(hexseedMnemonic.trim());
  } else {
    throw new Error('Invalid hexseed/mnemonic');
  }

  return {
    address: xmss.getAddress(),
    pk: xmss.getPK(),
    hexseed: xmss.getHexSeed(),
    mnemonic: xmss.getMnemonic(),
  };
}

