# Releasing

A signed `vMAJOR.MINOR.PATCH` tag runs
`.github/workflows/release.yml`. The workflow verifies the tag against the
committed maintainer allowlist, runs the full CI suite, creates
`qrl-webtools_v<version>.zip`, signs that bundle with ML-DSA-87, adds a GitHub
build-provenance attestation, and publishes the zip plus
`qrl-webtools_v<version>_signatures.txt`.

The former `shasum.256.asc` file is intentionally gone. A checksum generated
beside an artefact detects transfer corruption but does not authenticate its
publisher. The ML-DSA signature authenticates the exact zip bytes.

## Signing key and context

Web Tools does not have a signing key of its own. It signs with theQRL
organisation release key, the same key behind every signed theQRL product, whose
public half is published as `theqrl-release-key.pub` in
[theQRL/qrlft](https://github.com/theQRL/qrlft). One key means one thing for
users to check once, instead of a new key to establish per repository.

Domain separation comes from the context string instead. Each product signs
under `<product>-release-signatures`, so this repository uses
`qrl-webtools-release-signatures` and qrlft uses `qrlft-release-signatures`. A
signature made for one product therefore cannot be presented as belonging to
another, even though both come from the same key.

1. Store the organisation release hexseed as the repository Actions secret
   `MLDSA_HEXSEED`. Do not generate a new keypair for this repository, and do
   not reuse a legacy Dilithium hexseed: Dilithium and ML-DSA seeds are both 32
   bytes, so the wrong one is accepted silently and derives a different key.
2. Never change the context. `qrl-webtools-release-signatures` is permanent, and
   changing it invalidates every signature already published under it.
3. Keep the release artefact naming as `qrl-webtools_v<version>.zip`. Verifiers
   read the product from the segment before the first underscore to decide which
   context applies, so a name without one cannot be checked automatically.

The workflow pins `theQRL/actions-mldsa-sign` to commit `97a05ab`, which is what
the `v1.0.0` tag points at, rather than to the mutable tag itself.

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

Download the zip and `qrl-webtools_v<version>_signatures.txt`. Each line holds a
signature followed by the filename it covers.

The quickest check is [validate.theqrl.org](https://validate.theqrl.org): drop
both files onto the page and it verifies them in the browser, working out the
context from the filenames. To check it locally instead, fetch
`theqrl-release-key.pub` from
[theQRL/qrlft](https://github.com/theQRL/qrlft) and run:

```bash
ZIP=qrl-webtools_v<version>.zip
SIGNATURE=$(awk -v f="$ZIP" '$2 == f { print $1 }' qrl-webtools_v<version>_signatures.txt)
qrlft verify -a mldsa \
  --context="qrl-webtools-release-signatures" \
  --signature="$SIGNATURE" \
  --pkfile=theqrl-release-key.pub \
  "$ZIP"
```

Also verify GitHub's build provenance:

```bash
gh attestation verify qrl-webtools_v<version>.zip --repo theQRL/webtools
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

