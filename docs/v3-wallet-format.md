# V3 wallet format

The format this application writes, specified so that any reader can be built
against it. It exists because a divergence between this writer and a reader is
**silent at save time** and **unrecoverable later**: the file writes, the
interface reports success, the user destroys their paper backup, and the defect
surfaces months later as an authentication failure with the correct password.

Reference implementation: [`src/wallet-envelope.js`](../src/wallet-envelope.js).
Conformance tests: [`test/wallet-envelope.test.js`](../test/wallet-envelope.test.js).

## Encrypted envelope

```json
{
  "version": 3,
  "encrypted": true,
  "kdf": {
    "name": "scrypt",
    "params": { "N": 131072, "r": 8, "p": 1, "dkLen": 32, "salt": "<64 hex chars>" }
  },
  "cipher": {
    "name": "aes-256-gcm",
    "iv": "<24 hex chars>",
    "authTag": "<32 hex chars>"
  },
  "data": "<hex ciphertext, WITHOUT the authentication tag>"
}
```

The file is written pretty-printed with two-space indentation. That is a
presentation choice and carries no meaning — see the warning under *Additional
authenticated data*.

| Field | Encoding | Notes |
|---|---|---|
| `version` | JSON number | Always `3`. Not a string. |
| `encrypted` | JSON boolean | The only top-level field **not** covered by the AAD. |
| `kdf.params.salt` | lowercase hex, 32 bytes | Fresh per save. |
| `cipher.iv` | lowercase hex, 12 bytes | Fresh per save. GCM nonce. |
| `cipher.authTag` | lowercase hex, 16 bytes | Stored **separately** from `data`. |
| `data` | lowercase hex | Ciphertext only. The tag is not appended. |

## Key derivation

```
key = scrypt(password_utf8, salt, N = 2^17, r = 8, p = 1, dkLen = 32)
```

Memory cost is `128 * N * r` = 128 MiB. The password is encoded as UTF-8 with
no normalisation applied, so a reader must not normalise either.

`N`, `r`, `p`, `dkLen` and `salt` are all read from the file and all covered by
the AAD, so a tampered work factor causes an authentication failure rather than
a cheaper brute force. A reader must use the values in the file, not hardcoded
constants — that is what makes future parameter increases possible.

## Encryption

AES-256-GCM with a 128-bit authentication tag.

```
ciphertext || tag = AES-256-GCM(key, iv, plaintext, aad)
```

`plaintext` is the UTF-8 JSON serialisation of the wallet object (see below).

WebCrypto's `encrypt` returns `ciphertext || tag` concatenated. This format
stores them apart: the trailing 16 bytes go to `cipher.authTag` and the
remainder to `data`.

**A reader must re-append the tag before calling `decrypt`:**

```js
const combined = new Uint8Array(ciphertext.length + authTag.length);
combined.set(ciphertext);
combined.set(authTag, ciphertext.length);
await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128, additionalData: aad }, key, combined);
```

## Additional authenticated data

This is the part that breaks readers. The AAD is a **compact UTF-8 JSON
serialisation** of a specific object, and a reader must reproduce those bytes
exactly — a single differing byte makes every wallet undecryptable.

```
{"version":3,"kdf":{"name":"scrypt","params":{"N":131072,"r":8,"p":1,"dkLen":32,"salt":"<hex>"}},"cipher":{"name":"aes-256-gcm","iv":"<hex>"}}
```

Requirements, all load-bearing:

- **Key order is insertion order**, at every level: `version, kdf, cipher`;
  then `name, params`; then `N, r, p, dkLen, salt`; then `name, iv`.
  Do **not** canonicalise keys alphabetically.
- **No whitespace.** `JSON.stringify` with no `space` argument. The file on
  disk is indented; the AAD is not. Do not hash or slice bytes out of the file.
- **`authTag` is excluded** — it is computed over these bytes, so it cannot be
  an input to them.
- **`encrypted` and `data` are excluded.**
- **`version` is the JSON number `3`**, not `"3"`.

`test/wallet-envelope.test.js` pins the exact expected string. If that test
fails, the format has changed — that is a breaking change to every wallet ever
written by this application, not a fixup.

### On the `encrypted` flag

It is deliberately outside the AAD, and this is not a meaningful weakness: an
attacker who can write to the file can replace it wholesale with an
unencrypted envelope containing their own seed. No AAD design in a
self-contained file with no external signature prevents that. It is documented
rather than silently tolerated.

## Unencrypted envelope

```json
{ "version": 3, "encrypted": false, "data": { /* wallet object */ } }
```

Note the type change: when `encrypted` is `true`, `data` is a hex **string**;
when `false`, it is the wallet **object**. A reader must branch on `encrypted`
before interpreting `data`.

## Wallet object

The plaintext, both inside the encrypted envelope and as `data` when
unencrypted:

```json
{
  "address": "Q...",
  "pk": "<hex>",
  "hexseed": "<102 hex chars>",
  "mnemonic": "<34 space-separated words>",
  "height": 10,
  "hashFunction": 0,
  "signatureType": 0,
  "index": 0
}
```

`hashFunction` and `signatureType` are the numeric QRLLIB enum values read back
from the generated address. `index` is the OTS index, always `0` for a freshly
generated wallet.

## Compatibility

This format targets the v3 wallet format used by the QRL web wallet and
`@theqrl/wallet-helpers`, and conformance is **tested against both**, in both
directions.

`test/wallet-helpers-crossverify.test.js` runs `@theqrl/wallet-helpers` (a
development dependency) against wallets this application writes, and vice
versa: the reference reader decrypts our output at both the reduced test work
factor and the production N=2^17, rejects a wrong password, and detects a
tampered work factor; we decrypt what the reference writer produces; and the
two envelopes are asserted structurally identical.

That matters because the failure it guards is silent. A divergence in the AAD
serialisation would let a wallet save successfully, report success, and only
fail months later when the user needs the funds — so it is checked rather than
assumed.

`test/wallet-envelope.test.js` additionally pins the exact AAD byte string. If
that test fails, the format has changed, which is a breaking change to every
wallet this application has ever written.

### Verified against the QRL web wallet's own implementation

`@theqrl/wallet-helpers` conformance alone is not sufficient. The QRL web
wallet does not call the library's decrypt — it carries its own detection and
crypto in `imports/ui/lib/wallet-format.js` and `wallet-crypto.js`, so it is a
second independent implementation. Wallets generated through this
application's interface were verified to open in it directly (qrl-wallet
`f3f2e11`, 2026-07-30): both the encrypted and unencrypted envelopes are
classified `V3-ENVELOPE` with `deprecated: false` and yield the exact address,
public key, hexseed and mnemonic that were displayed; a wrong password and a
downgraded `kdf.params.N` are both rejected.

Two constraints of that reader are worth respecting in any future change:

- It requires exactly the eight wallet-object fields listed above, and
  regex-validates `address`, `pk`, `hexseed` and `mnemonic`.
- Its accepted scrypt range is N ≤ 2^21, p ≤ 4, dkLen 16-64, and a 512 MiB cap
  on `128 * r * N`. Our parameters sit inside that; raising `N` beyond 2^21, or
  `r` such that memory exceeds 512 MiB, would produce wallets it refuses.

That reader also validates KDF parameters *before* deriving, on the grounds
that they come from the file and are therefore attacker-chosen and consumed
before anything is authenticated — an unbounded `N` or `r` would otherwise
allow a crafted envelope to exhaust memory before the auth tag is checked.
This application only writes envelopes, so the concern does not arise here;
**if a decrypt path is ever added, that bounds check must come with it.**

