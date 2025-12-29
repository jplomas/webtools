<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Mnemonic Validator</h1>
      <p class="text-base-content/70">Validate QRL mnemonic phrases and check for common issues</p>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="form-control">
          <div class="mb-2">
            <div class="font-semibold">Enter Mnemonic Phrase</div>
            <div class="text-sm text-base-content/60">34 words expected</div>
          </div>
          <textarea
            v-model="mnemonic"
            class="textarea textarea-bordered w-full h-32 font-mono text-sm focus:textarea-secondary focus:border-secondary"
            placeholder="Enter your 34-word mnemonic phrase here..."
            @input="validateMnemonic"
          ></textarea>
        </div>

        <div v-if="mnemonic.trim()" class="mt-6">
          <!-- Word Count -->
          <div class="flex items-center gap-2 mb-4">
            <span class="font-semibold">Word Count:</span>
            <span :class="wordCount === 34 ? 'badge badge-success' : 'badge badge-error'">
              {{ wordCount }} / 34
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

          <!-- Valid Mnemonic -->
          <div v-if="isValid" class="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Valid mnemonic phrase! All 34 words are recognized.</span>
          </div>

          <!-- Word Grid -->
          <div class="mt-4">
            <h3 class="font-semibold mb-2">Word Validation</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <div
                v-for="(word, idx) in words"
                :key="idx"
                class="flex items-center gap-2 p-2 rounded-lg text-sm"
                :class="wordStatus[idx] ? 'bg-success/20' : 'bg-error/20'"
              >
                <span class="text-xs text-base-content/50 w-5">{{ idx + 1 }}.</span>
                <span class="font-mono truncate flex-1" :class="wordStatus[idx] ? 'text-success' : 'text-error'">
                  {{ word }}
                </span>
                <font-awesome-icon
                  :icon="wordStatus[idx] ? 'check' : 'times'"
                  :class="wordStatus[idx] ? 'text-success' : 'text-error'"
                />
              </div>
            </div>
          </div>

          <!-- Invalid Words Summary -->
          <div v-if="invalidWords.length > 0" class="mt-6">
            <h3 class="font-semibold mb-2">Invalid Words</h3>
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Word</th>
                    <th>Suggestions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inv in invalidWords" :key="inv.index">
                    <td>{{ inv.index + 1 }}</td>
                    <td class="font-mono text-error">{{ inv.word }}</td>
                    <td>
                      <div v-if="inv.suggestions.length > 0" class="flex flex-wrap gap-1">
                        <span
                          v-for="sug in inv.suggestions"
                          :key="sug"
                          class="badge badge-outline badge-sm cursor-pointer hover:badge-primary"
                          @click="replaceWord(inv.index, sug)"
                        >
                          {{ sug }}
                        </span>
                      </div>
                      <span v-else class="text-base-content/50 text-sm">No suggestions</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-base-content/50">
          <font-awesome-icon icon="spell-check" class="text-5xl mb-4" />
          <p>Enter a mnemonic phrase above to validate it</p>
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div class="card bg-base-200 mt-6">
      <div class="card-body">
        <h3 class="card-title text-lg">About QRL Mnemonics</h3>
        <ul class="list-disc list-inside text-sm text-base-content/70 space-y-1">
          <li>QRL uses a 34-word mnemonic phrase from a wordlist of 4,096 words</li>
          <li>Each word encodes part of your wallet's private key</li>
          <li>Common issues include typos, extra spaces, and copy-paste errors</li>
          <li>Never share your mnemonic phrase with anyone</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import qrlWordlist from '@/qrl-wordlist.js';

export default {
  name: 'MnemonicTester',
  data() {
    return {
      mnemonic: '',
      wordlist: qrlWordlist,
      wordlistLoaded: true
    };
  },
  computed: {
    words() {
      return this.mnemonic.trim().split(/\s+/).filter(w => w.length > 0);
    },
    wordCount() {
      return this.words.length;
    },
    wordStatus() {
      if (!this.wordlistLoaded) return this.words.map(() => true);
      // Check if the cleaned version of each word (letters only) is valid
      return this.words.map(word => {
        const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
        return this.wordlist.includes(cleaned);
      });
    },
    isValid() {
      return this.wordCount === 34 && this.wordStatus.every(s => s) && this.issues.length === 0;
    },
    issues() {
      const issues = [];

      // Check for leading/trailing whitespace
      if (this.mnemonic !== this.mnemonic.trim()) {
        issues.push('Leading or trailing whitespace detected');
      }

      // Check for multiple spaces
      if (/\s{2,}/.test(this.mnemonic)) {
        issues.push('Multiple consecutive spaces detected');
      }

      // Check for non-standard characters (outside printable ASCII)
      if (/[^\x20-\x7E]/.test(this.mnemonic)) {
        issues.push('Non-standard characters detected (possible copy-paste issue)');
      }

      // Check for punctuation or numbers attached to words
      if (/[^a-zA-Z\s]/.test(this.mnemonic)) {
        issues.push('Non-letter characters detected in words (punctuation, numbers, etc.)');
      }

      // Check word count
      if (this.wordCount > 0 && this.wordCount !== 34) {
        issues.push(`Expected 34 words, found ${this.wordCount}`);
      }

      // Check for uppercase
      if (/[A-Z]/.test(this.mnemonic)) {
        issues.push('Uppercase letters detected (mnemonic words should be lowercase)');
      }

      return issues;
    },
    invalidWords() {
      if (!this.wordlistLoaded) return [];
      return this.words
        .map((word, index) => {
          // Clean the word (letters only) before checking validity
          const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
          return { word, index, cleaned, valid: this.wordlist.includes(cleaned) };
        })
        .filter(w => !w.valid)
        .map(w => ({
          ...w,
          suggestions: this.getSuggestions(w.cleaned)
        }));
    },
    hasFixableIssues() {
      // Check if there are issues that can be auto-fixed
      const hasWhitespaceIssues = this.mnemonic !== this.mnemonic.trim() || /\s{2,}/.test(this.mnemonic);
      const hasNonStandardChars = /[^\x20-\x7E]/.test(this.mnemonic);
      const hasNonLetterChars = /[^a-zA-Z\s]/.test(this.mnemonic);
      const hasUppercase = /[A-Z]/.test(this.mnemonic);
      return hasWhitespaceIssues || hasNonStandardChars || hasNonLetterChars || hasUppercase;
    }
  },
  methods: {
    fixIssues() {
      let fixed = this.mnemonic;
      // Convert to lowercase
      fixed = fixed.toLowerCase();
      // Normalize unicode characters to ASCII equivalents
      fixed = fixed.normalize('NFKD').replace(/[^\x20-\x7E]/g, '');
      // Remove any non-letter characters except spaces (strips punctuation, numbers, etc.)
      fixed = fixed.replace(/[^a-z\s]/g, '');
      // Trim and collapse multiple spaces
      fixed = fixed.trim().replace(/\s+/g, ' ');
      this.mnemonic = fixed;
    },
    validateMnemonic() {
      // Validation happens reactively via computed properties
    },
    getSuggestions(word) {
      if (!this.wordlistLoaded || !this.wordlist.length) return [];

      const lowerWord = word.toLowerCase();
      const suggestions = [];

      // Find words that start with the same letters
      const startsWithMatches = this.wordlist.filter(w =>
        w.startsWith(lowerWord.substring(0, 3)) && w !== lowerWord
      ).slice(0, 3);

      // Find words with Levenshtein distance of 1-2
      for (const dictWord of this.wordlist) {
        if (suggestions.length >= 5) break;
        const dist = this.levenshteinDistance(lowerWord, dictWord);
        if (dist > 0 && dist <= 2 && !suggestions.includes(dictWord)) {
          suggestions.push(dictWord);
        }
      }

      // Combine and limit
      return [...new Set([...startsWithMatches, ...suggestions])].slice(0, 5);
    },
    levenshteinDistance(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      const matrix = [];

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[b.length][a.length];
    },
    replaceWord(index, newWord) {
      const wordsArray = this.words.slice();
      wordsArray[index] = newWord;
      this.mnemonic = wordsArray.join(' ');
    }
  }
};
</script>
