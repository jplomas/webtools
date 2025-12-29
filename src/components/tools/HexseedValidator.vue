<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Hexseed Validator</h1>
      <p class="text-base-content/70">Validate QRL hexseed format and check for common issues</p>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="form-control">
          <div class="mb-2">
            <div class="font-semibold">Enter Hexseed</div>
            <div class="text-sm text-base-content/60">102 hex characters expected</div>
          </div>
          <textarea
            v-model="hexseed"
            class="textarea textarea-bordered w-full h-24 font-mono text-sm focus:textarea-secondary focus:border-secondary"
            placeholder="Enter your hexseed here..."
          ></textarea>
        </div>

        <div v-if="hexseed.trim()" class="mt-6">
          <!-- Character Count -->
          <div class="flex items-center gap-2 mb-4">
            <span class="font-semibold">Hex Characters:</span>
            <span :class="hexLength === 102 ? 'badge badge-success' : 'badge badge-error'">
              {{ hexLength }} / 102
            </span>
          </div>

          <!-- Issues Found -->
          <div v-if="issues.length > 0" class="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <h3 class="font-bold">Issues Detected</h3>
              <ul class="text-sm list-disc list-inside">
                <li v-for="(issue, idx) in issues" :key="idx">{{ issue }}</li>
              </ul>
            </div>
            <button
              v-if="hasFixableIssues"
              class="btn btn-sm btn-primary"
              @click="fixIssues"
            >
              <font-awesome-icon icon="wand-magic-sparkles" class="mr-1" />
              Fix
            </button>
          </div>

          <!-- Valid Hexseed -->
          <div v-if="isValid" class="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Valid hexseed format! 102 hexadecimal characters.</span>
          </div>

          <!-- Invalid Characters Display -->
          <div v-if="invalidChars.length > 0" class="mt-4">
            <h3 class="font-semibold mb-2">Invalid Characters Found</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(char, idx) in invalidChars"
                :key="idx"
                class="badge badge-error font-mono"
              >
                "{{ char.char }}" at position {{ char.position }}
              </span>
            </div>
          </div>

          <!-- Cleaned Hexseed Preview -->
          <div v-if="cleanedHexseed && cleanedHexseed !== hexseed.trim()" class="mt-4">
            <h3 class="font-semibold mb-2">Cleaned Preview</h3>
            <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all">
              {{ cleanedHexseed }}
            </div>
            <p class="text-sm text-base-content/60 mt-1">
              {{ cleanedHexseed.length }} characters after cleaning
            </p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-base-content/50">
          <font-awesome-icon icon="fingerprint" class="text-5xl mb-4" />
          <p>Enter a hexseed above to validate it</p>
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div class="card bg-base-200 mt-6">
      <div class="card-body">
        <h3 class="card-title text-lg">About QRL Hexseeds</h3>
        <ul class="list-disc list-inside text-sm text-base-content/70 space-y-1">
          <li>A hexseed is 102 hexadecimal characters (0-9, a-f)</li>
          <li>It represents the 51-byte seed used to generate a QRL wallet</li>
          <li>The hexseed can be used to restore a wallet, just like the mnemonic</li>
          <li>Common issues include whitespace, non-hex characters, and copy-paste errors</li>
          <li>Never share your hexseed with anyone</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HexseedValidator',
  data() {
    return {
      hexseed: ''
    };
  },
  computed: {
    cleanedHexseed() {
      // Remove all non-hex characters and convert to lowercase
      return this.hexseed.toLowerCase().replace(/[^0-9a-f]/g, '');
    },
    hexLength() {
      return this.cleanedHexseed.length;
    },
    isValid() {
      return this.hexLength === 102 && this.issues.length === 0;
    },
    issues() {
      const issues = [];
      const input = this.hexseed;

      // Check for leading/trailing whitespace
      if (input !== input.trim()) {
        issues.push('Leading or trailing whitespace detected');
      }

      // Check for whitespace within the hexseed
      if (/\s/.test(input.trim())) {
        issues.push('Whitespace detected within hexseed');
      }

      // Check for non-hexadecimal characters (excluding whitespace)
      const nonWhitespace = input.replace(/\s/g, '');
      if (/[^0-9a-fA-F]/.test(nonWhitespace)) {
        issues.push('Non-hexadecimal characters detected');
      }

      // Check for uppercase (not an error, but worth noting)
      if (/[A-F]/.test(input)) {
        issues.push('Uppercase letters detected (will be converted to lowercase)');
      }

      // Check length
      if (this.hexLength > 0 && this.hexLength !== 102) {
        if (this.hexLength < 102) {
          issues.push(`Hexseed too short: ${this.hexLength} characters (need ${102 - this.hexLength} more)`);
        } else {
          issues.push(`Hexseed too long: ${this.hexLength} characters (${this.hexLength - 102} extra)`);
        }
      }

      return issues;
    },
    invalidChars() {
      const chars = [];
      const input = this.hexseed.replace(/\s/g, ''); // Remove whitespace for position counting
      for (let i = 0; i < input.length; i++) {
        if (!/[0-9a-fA-F]/.test(input[i])) {
          chars.push({ char: input[i], position: i + 1 });
        }
      }
      return chars;
    },
    hasFixableIssues() {
      const hasWhitespace = /\s/.test(this.hexseed);
      const hasUppercase = /[A-F]/.test(this.hexseed);
      const hasNonHex = /[^0-9a-fA-F\s]/.test(this.hexseed);
      return hasWhitespace || hasUppercase || hasNonHex;
    }
  },
  methods: {
    fixIssues() {
      // Remove all non-hex characters, convert to lowercase
      this.hexseed = this.cleanedHexseed;
    }
  }
};
</script>
