<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Address Validator</h1>
      <p class="text-base-content/70">Validate QRL addresses and view their properties</p>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="form-control">
          <div class="mb-2">
            <div class="font-semibold">Enter QRL Address</div>
          </div>
          <input
            v-model="address"
            type="text"
            class="input input-bordered w-full font-mono text-sm focus:input-secondary focus:border-secondary"
            placeholder="Q010500..."
            @input="validateAddress"
          />
        </div>

        <div v-if="address.trim()" class="mt-6">
          <!-- Validation Status -->
          <div v-if="validationResult" class="mb-6">
            <div v-if="validationResult.valid" class="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Valid QRL Address</span>
            </div>
            <div v-else class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Invalid QRL Address: {{ validationResult.error }}</span>
            </div>
          </div>

          <!-- Address Details -->
          <div v-if="validationResult && validationResult.valid && addressInfo" class="space-y-4">
            <h3 class="font-semibold text-lg">Address Details</h3>

            <div class="overflow-x-auto">
              <table class="table w-full">
                <tbody>
                  <tr>
                    <th class="w-1/3">Signature Type</th>
                    <td>
                      <span class="badge badge-primary">{{ addressInfo.signatureType }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Tree Height</th>
                    <td>
                      <span class="badge badge-secondary">{{ addressInfo.height }}</span>
                      <span class="text-sm text-base-content/60 ml-2">
                        ({{ getSignatureCount(addressInfo.height) }} signatures available)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Hash Function</th>
                    <td>
                      <span class="badge badge-accent">{{ addressInfo.hashFunction }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Raw Descriptor -->
            <div class="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div class="collapse-title font-medium">
                Technical Details
              </div>
              <div class="collapse-content">
                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <tbody>
                      <tr>
                        <th>Descriptor Byte</th>
                        <td class="font-mono">{{ addressInfo.descriptorByte }}</td>
                      </tr>
                      <tr>
                        <th>Signature Scheme (bits 0-3)</th>
                        <td class="font-mono">{{ addressInfo.signatureScheme }}</td>
                      </tr>
                      <tr>
                        <th>Height (bits 4-7)</th>
                        <td class="font-mono">{{ addressInfo.heightBits }}</td>
                      </tr>
                      <tr>
                        <th>Hash Function (bits 0-3)</th>
                        <td class="font-mono">{{ addressInfo.hashFunctionBits }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-base-content/50">
          <font-awesome-icon icon="magnifying-glass" class="text-5xl mb-4" />
          <p>Enter a QRL address above to validate it</p>
        </div>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div class="card bg-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg">Tree Heights</h3>
          <ul class="text-sm text-base-content/70 space-y-1">
            <li><strong>4:</strong> 16 signatures (test only)</li>
            <li><strong>6:</strong> 64 signatures</li>
            <li><strong>8:</strong> 256 signatures</li>
            <li><strong>10:</strong> 1,024 signatures</li>
            <li><strong>12:</strong> 4,096 signatures</li>
            <li><strong>14:</strong> 16,384 signatures</li>
            <li><strong>16:</strong> 65,536 signatures</li>
            <li><strong>18:</strong> 262,144 signatures</li>
          </ul>
        </div>
      </div>
      <div class="card bg-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg">Hash Functions</h3>
          <ul class="text-sm text-base-content/70 space-y-1">
            <li><strong>SHA2_256:</strong> Standard SHA-256</li>
            <li><strong>SHAKE_128:</strong> SHAKE128 (128-bit security)</li>
            <li><strong>SHAKE_256:</strong> SHAKE256 (256-bit security)</li>
          </ul>
          <div class="divider my-2"></div>
          <h3 class="card-title text-lg">Signature Types</h3>
          <ul class="text-sm text-base-content/70 space-y-1">
            <li><strong>XMSS:</strong> Single signature scheme</li>
            <li><strong>MULTISIG:</strong> Multi-signature address</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import validateQrlAddress from '@theqrl/validate-qrl-address';

export default {
  name: 'AddressInfo',
  data() {
    return {
      address: '',
      validationResult: null,
      addressInfo: null
    };
  },
  methods: {
    validateAddress() {
      const addr = this.address.trim();

      if (!addr) {
        this.validationResult = null;
        this.addressInfo = null;
        return;
      }

      try {
        const result = validateQrlAddress.hexString(addr);

        if (result.result) {
          this.validationResult = { valid: true };
          this.parseAddressInfo(addr);
        } else {
          this.validationResult = { valid: false, error: result.error || 'Invalid address format' };
          this.addressInfo = null;
        }
      } catch (e) {
        this.validationResult = { valid: false, error: e.message || 'Validation error' };
        this.addressInfo = null;
      }
    },
    parseAddressInfo(address) {
      // Remove 'Q' prefix if present
      const hex = address.startsWith('Q') ? address.substring(1) : address;

      // Descriptor bytes (3 bytes total, 24 bits)
      const descriptor1 = parseInt(hex.substring(0, 2), 16);
      const descriptor2 = parseInt(hex.substring(2, 4), 16);

      // Parse descriptor byte 0:
      // - Bits 0-3: Hash function (0 = SHA2_256, 1 = SHAKE_128, 2 = SHAKE_256)
      // - Bits 4-7: Signature type (0 = XMSS)
      const hashFunctionBits = descriptor1 & 0x0F;
      const signatureScheme = (descriptor1 >> 4) & 0x0F;

      // Descriptor byte 1:
      // - Bits 0-3: Tree height / 2
      // - Bits 4-7: Address format (0 = SHA256_2X)
      const heightBits = descriptor2 & 0x0F;

      // Map signature scheme
      let signatureType;
      switch (signatureScheme) {
        case 0:
          signatureType = 'XMSS';
          break;
        case 1:
          signatureType = 'MULTISIG';
          break;
        default:
          signatureType = `Unknown (${signatureScheme})`;
      }

      // Map hash function
      let hashFunction;
      switch (hashFunctionBits) {
        case 0:
          hashFunction = 'SHA2_256';
          break;
        case 1:
          hashFunction = 'SHAKE_128';
          break;
        case 2:
          hashFunction = 'SHAKE_256';
          break;
        default:
          hashFunction = `Unknown (${hashFunctionBits})`;
      }

      // Calculate actual height (multiply by 2)
      const height = heightBits * 2;

      this.addressInfo = {
        signatureType,
        height,
        hashFunction,
        descriptorByte: `0x${hex.substring(0, 4)}`,
        signatureScheme,
        heightBits,
        hashFunctionBits
      };
    },
    getSignatureCount(height) {
      return Math.pow(2, height).toLocaleString();
    }
  }
};
</script>
