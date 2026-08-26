# QRL Web Tools

A collection of browser-based utilities for the Quantum Resistant Ledger:

- Wallet generation and regeneration
- Address inspection
- Hexseed validation
- Mnemonic validation and repair hints

## Use the offline release

Download the latest `qrl-webtools_v<version>.zip` and
`qrl-webtools_v<version>_signatures.txt` from
[GitHub Releases](https://github.com/theQRL/webtools/releases/latest).
Verify the ML-DSA-87 signature as described in [RELEASE.md](RELEASE.md), extract
the archive, disconnect the machine from the network, and open `index.html`
in a modern WebAssembly-capable browser. The HTML is a self-contained build;
no server or installation is required.

For wallet generation, prefer a clean bootable OS and keep the machine offline.
Never share a mnemonic or hexseed.

## Wallet files

Wallet exports use the QRL v3 wallet envelope:

- Encrypted exports use scrypt (N=2^17, r=8, p=1) and AES-256-GCM.
- Weak passwords are refused rather than merely warned about.
- Unencrypted exports use the same v3 envelope with plaintext wallet data.

The byte-level compatibility contract is documented in
[docs/v3-wallet-format.md](docs/v3-wallet-format.md) and cross-verified in the
test suite against `@theqrl/wallet-helpers`.

## Developing

Requirements: Node.js 22 or 24 (see `.nvmrc`) and npm.

```bash
npm ci
npm run dev
```

Verification commands:

```bash
npm run lint
npm test
npm run build
npm run check:offline
npm run test:browser
```

`npm run build` produces the self-contained `dist/index.html`.
The Playwright suite loads that exact file over `file://`, denies outbound
network requests, generates a wallet, and verifies an encrypted v3 download can
be decrypted to the values shown in the UI.

## Releases and CI

GitHub Actions replaces the previous CircleCI pipeline. CI runs linting, Node
22/24 unit and format-conformance tests, dependency audits, deterministic-build
checks, static single-file checks, and headless Chromium smoke tests.

Signed tags build `qrl-webtools_v<version>.zip`, sign the bundle with ML-DSA-87
under the permanent context `qrl-webtools-release-signatures` using theQRL
organisation release key, attest its build provenance, and publish the bundle
plus `qrl-webtools_v<version>_signatures.txt`. See
[RELEASE.md](RELEASE.md) for maintainer setup and verification.

## Help

- [Discord community](https://discord.gg/jBT6BEp)
- <support@theqrl.org>

## License

MIT. See [LICENSE](LICENSE).
