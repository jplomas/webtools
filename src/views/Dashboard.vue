<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold mb-4">QRL Web Tools</h1>
      <p class="text-lg text-base-content/70">A collection of browser-based tools for the Quantum Resistant Ledger</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <ToolCard
        to="/address"
        icon="magnifying-glass"
        title="Address Validator"
        description="Validate QRL addresses and view details like signature type, tree height, and hash function."
      />
      <ToolCard
        to="/mnemonic"
        icon="spell-check"
        title="Mnemonic Validator"
        description="Validate mnemonic phrases, check for invalid words, and detect common issues."
      />
      <ToolCard
        to="/hexseed"
        icon="fingerprint"
        title="Hexseed Validator"
        description="Validate hexseed format, check for invalid characters, whitespace, and length issues."
      />
      <ToolCard
        to="/wallet"
        icon="wallet"
        title="Wallet Generator"
        description="Generate new QRL wallets with various tree heights and hash functions. Export as PDF, JSON, or print."
      />
    </div>

    <div class="mt-12 text-center">
      <div class="alert alert-warning max-w-2xl mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h3 class="font-bold">Security Notice</h3>
          <p class="text-sm">For maximum security when generating wallets, use these tools offline on an air-gapped computer.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ToolCard from '@/components/shared/ToolCard.vue';

export default {
  name: 'Dashboard',
  components: {
    ToolCard
  }
};
</script>
