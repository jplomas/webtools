# Releasing

A signed `vMAJOR.MINOR.PATCH` tag runs
`.github/workflows/release.yml`. The workflow verifies the tag against the
committed maintainer allowlist, runs the full CI suite, creates
`qrl-webtools-<version>.zip`, signs that bundle with ML-DSA-87, adds a GitHub
build-provenance attestation, and publishes the zip plus
`mldsa-signatures.txt`.

The former `shasum.256.asc` file is intentionally gone. A checksum generated
beside an artefact detects transfer corruption but does not authenticate its
publisher. The ML-DSA signature authenticates the exact zip bytes.

## One-time ML-DSA setup

Generate a fresh ML-DSA keypair with qrlft. Do not reuse a legacy Dilithium
hexseed: it would derive a different ML-DSA key even though both seed strings
have the same length.

```bash
qrlft new -a mldsa --context="qrl-webtools-github-releases-v1" webtools-release
```

1. Store the contents of `webtools-release.private.hexseed` as the repository
   Actions secret `MLDSA_HEXSEED`.
2. Publish the public-key hex through a channel independent of the GitHub
   release assets and record its fingerprint in project release documentation.
3. Back up the private key and hexseed offline. Losing them prevents future
   signatures from chaining to the published identity.
4. Never substitute the context. The permanent verification context is
   `qrl-webtools-github-releases-v1`.

The workflow is pinned to the audited
`theQRL/actions-mldsa-sign` v1.0.0 commit rather than a mutable tag.

## Maintainer tag-signing allowlist

SSH signing keys live in `.github/allowed-signers`, one entry per key. The
release fails closed if neither that file nor `.github/maintainer-keys.asc`
contains a real key. Confirm signing-key fingerprints out of band before adding
them.

## Cut a release

1. Bump `package.json` and `package-lock.json` without creating npm's tag:
   `npm version <version> --no-git-tag-version`.
2. Commit and merge after CI passes.
3. Sign the released commit:
   `git tag -s v<version> -m "QRL Web Tools <version>"`.
4. Verify locally with `git verify-tag v<version>`.
5. Push the tag: `git push origin v<version>`.

## Verify a release

Download the zip and `mldsa-signatures.txt`. The signature file contains the
signature hex followed by the filename. With the independently published
ML-DSA public-key hex:

```bash
SIGNATURE=$(awk '$2 == "qrl-webtools-<version>.zip" { print $1 }' mldsa-signatures.txt)
qrlft verify -a mldsa \
  --context="qrl-webtools-github-releases-v1" \
  --signature="$SIGNATURE" \
  --publickey="<published-public-key-hex>" \
  qrl-webtools-<version>.zip
```

Also verify GitHub's build provenance:

```bash
gh attestation verify qrl-webtools-<version>.zip --repo theQRL/webtools
```

For the strongest check, rebuild the tagged source and compare the zip's
`index.html` with `dist/index.html`. Use a real git clone because the build
identifier includes the commit SHA.

```bash
git clone https://github.com/theQRL/webtools.git
cd webtools
git checkout v<version>
nvm use
npm ci
npm run build:verified
```

