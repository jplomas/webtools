<template>
  <div class="card bg-base-200 shadow-lg mx-auto my-8 max-w-4xl">
    <div class="card-body">
      <h1 class="card-title text-3xl mb-4">Documentation</h1>

      <div class="space-y-8">
        <p>QRL Web Tools is a collection of browser-based utilities for the Quantum Resistant Ledger. For maximum security when generating wallets, it is designed to be used in an offline environment. It is recommended to use this software from a bootable OS (e.g. Desktop Ubuntu distribution) without any network connection.</p>

        <p>To run offline, download the latest .zip file from the <a class="link link-primary" href="https://github.com/theQRL/qrl-webtools/releases">GitHub Releases</a> page, extract the zip then run the index.html file in your browser.</p>

        <!-- Address Validator -->
        <div class="collapse collapse-arrow bg-base-100">
          <input type="checkbox" />
          <div class="collapse-title text-xl font-medium">
            <font-awesome-icon icon="magnifying-glass" class="mr-2 text-primary" />
            Address Validator
          </div>
          <div class="collapse-content">
            <div class="space-y-4 pt-4">
              <p>The Address Validator validates QRL addresses and extracts details encoded in the address format.</p>

              <h3 class="font-semibold">Information Extracted:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>Signature Type:</strong> XMSS (single) or MULTISIG (multi-signature)</li>
                <li><strong>Tree Height:</strong> Determines how many signatures the wallet can produce</li>
                <li><strong>Hash Function:</strong> SHA2_256, SHAKE_128, or SHAKE_256</li>
              </ul>

              <h3 class="font-semibold mt-4">Tree Height Reference:</h3>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Height</th>
                      <th>Signatures</th>
                      <th>Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>4</td><td>16</td><td>Testing only</td></tr>
                    <tr><td>6</td><td>64</td><td>Limited use</td></tr>
                    <tr><td>8</td><td>256</td><td>Light usage</td></tr>
                    <tr><td>10</td><td>1,024</td><td>Default / recommended</td></tr>
                    <tr><td>12</td><td>4,096</td><td>Heavy usage</td></tr>
                    <tr><td>14</td><td>16,384</td><td>Very heavy usage</td></tr>
                    <tr><td>16</td><td>65,536</td><td>Enterprise</td></tr>
                    <tr><td>18</td><td>262,144</td><td>Maximum</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Mnemonic Validator -->
        <div class="collapse collapse-arrow bg-base-100">
          <input type="checkbox" />
          <div class="collapse-title text-xl font-medium">
            <font-awesome-icon icon="spell-check" class="mr-2 text-primary" />
            Mnemonic Validator
          </div>
          <div class="collapse-content">
            <div class="space-y-4 pt-4">
              <p>The Mnemonic Validator allows you to validate QRL mnemonic phrases and check for common issues before attempting to restore a wallet.</p>

              <h3 class="font-semibold">Features:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li>Validates each word against the QRL wordlist (4,096 words)</li>
                <li>Checks for exactly 34 words</li>
                <li>Detects common issues: extra spaces, non-standard characters, uppercase letters</li>
                <li>Highlights invalid words and provides suggestions for similar valid words</li>
                <li>Click on suggestions to automatically replace invalid words</li>
              </ul>

              <h3 class="font-semibold mt-4">Common Issues:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>Extra spaces:</strong> Multiple spaces between words</li>
                <li><strong>Copy-paste errors:</strong> Non-standard unicode characters that look similar to ASCII</li>
                <li><strong>Typos:</strong> Misspelled words</li>
                <li><strong>OCR errors:</strong> When scanning a paper wallet (0 vs O, 1 vs l)</li>
              </ul>

              <div class="alert alert-warning mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>This tool only validates the format of the mnemonic. It does not verify that the mnemonic corresponds to any actual wallet.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hexseed Validator -->
        <div class="collapse collapse-arrow bg-base-100">
          <input type="checkbox" />
          <div class="collapse-title text-xl font-medium">
            <font-awesome-icon icon="fingerprint" class="mr-2 text-primary" />
            Hexseed Validator
          </div>
          <div class="collapse-content">
            <div class="space-y-4 pt-4">
              <p>The Hexseed Validator checks QRL hexseeds for correct format and common issues.</p>

              <h3 class="font-semibold">What is a Hexseed?</h3>
              <ul class="list-disc list-inside space-y-1">
                <li>A hexseed is a 102-character hexadecimal string (0-9, a-f)</li>
                <li>It represents the 51-byte seed used to generate a QRL wallet</li>
                <li>Like the mnemonic, the hexseed can restore your complete wallet</li>
                <li>Both hexseed and mnemonic encode the same underlying data</li>
              </ul>

              <h3 class="font-semibold mt-4">Validation Checks:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li>Exactly 102 hexadecimal characters</li>
                <li>No whitespace or line breaks</li>
                <li>Only valid hex characters (0-9, a-f)</li>
                <li>Automatic detection of common copy-paste issues</li>
              </ul>

              <h3 class="font-semibold mt-4">Auto-Fix Feature:</h3>
              <p>The Fix button will automatically:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>Remove all whitespace and line breaks</li>
                <li>Convert uppercase letters to lowercase</li>
                <li>Strip non-hexadecimal characters</li>
              </ul>

              <div class="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Never share your hexseed with anyone. It provides full access to your wallet.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Wallet Generator -->
        <div class="collapse collapse-arrow bg-base-100">
          <input type="checkbox" />
          <div class="collapse-title text-xl font-medium">
            <font-awesome-icon icon="wallet" class="mr-2 text-primary" />
            Wallet Generator
          </div>
          <div class="collapse-content">
            <div class="space-y-4 pt-4">
              <p>Generate new QRL wallets directly in your browser using the QRLLIB WebAssembly library. When the library has loaded successfully, a green checkmark will appear in the footer.</p>

              <h3 class="font-semibold">Configuration Options:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>Hash Function:</strong> SHAKE_128 (default), SHAKE_256, or SHA2_256</li>
                <li><strong>Tree Height:</strong> Determines the number of signatures available (default: 10 = 1,024 signatures)</li>
              </ul>
              <p>The defaults are suitable for most users. Higher tree heights provide more signatures but take longer to generate. Read more at <a class="link link-primary" href="https://docs.theqrl.org/wallet/basics/#qrl-web-wallet">the QRL docs site</a>.</p>

              <h3 class="font-semibold mt-4">Generation Process:</h3>
              <p>Click <strong>Generate</strong> to create a new wallet. A spinner will display with estimated and elapsed time. Generation typically takes a few seconds with default settings, but may take up to 30 minutes on older hardware with maximum tree height.</p>

              <h3 class="font-semibold mt-4">Wallet Output:</h3>
              <p>Once generated, your wallet details are displayed:</p>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>Address:</strong> Your public QRL address (safe to share)</li>
                <li><strong>Mnemonic:</strong> 34-word recovery phrase (keep secret)</li>
                <li><strong>Hexseed:</strong> Hexadecimal seed (keep secret)</li>
              </ul>

              <h3 class="font-semibold mt-4">Saving Your Wallet:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>Print:</strong> Print wallet details directly</li>
                <li><strong>Save PDF:</strong> Download as a PDF document</li>
                <li><strong>Save JSON (encrypted):</strong> Password-protected format compatible with the QRL web wallet (recommended)</li>
                <li><strong>Save JSON (unencrypted):</strong> Plain format compatible with QRL web wallet and QRL nodes</li>
              </ul>

              <h3 class="font-semibold mt-4">Regenerate from Existing:</h3>
              <p>You can also regenerate a wallet by entering an existing hexseed or mnemonic phrase. This is useful for verifying backups or recovering wallet details.</p>

              <div class="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Never share your mnemonic phrase or hexseed. Anyone with access to these can control your funds.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
