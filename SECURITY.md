# Security Policy

## Reporting a vulnerability

Email <security@theqrl.org>. Please do not open a public issue for a
vulnerability in this tool.

Include the version or commit, affected file or workflow, likely impact, and a
proof of concept when available.

## Security properties

The wallet generator depends on these properties:

1. **The release bundle is authentic.** The zip is signed with ML-DSA-87 under
   the permanent context `qrl-webtools-release-signatures`, using theQRL
   organisation release key, and carries a
   GitHub build-provenance attestation; see [RELEASE.md](RELEASE.md).
2. **The generated seed is unpredictable.** Entropy comes from the browser
   CSPRNG through a fail-closed wrapper that rejects missing, throwing,
   wrong-length, or all-zero results.
3. **Encrypted wallet files resist offline attack and tampering.** The v3
   envelope uses scrypt (N=2^17, r=8, p=1) plus AES-256-GCM, with format
   metadata bound into authenticated data. See
   [docs/v3-wallet-format.md](docs/v3-wallet-format.md).
4. **The downloadable HTML is self-contained.** CI statically checks the
   single-file build and loads it over `file://` in Chromium while denying
   outbound requests.

The project cannot defend against a compromised machine that reads secrets from
the page, insecure storage after export, or disclosure of a mnemonic/hexseed.
Use a clean bootable OS, disconnect it from the network, and protect backups.

## Scope

Everything in this repository is in scope, including GitHub Actions and the
release process. QRLLIB and the underlying `qrllib` WebAssembly library should
be reported to [the QRL qrllib project](https://github.com/theQRL/qrllib).

