<template>
  <div class="container-site py-12 sm:py-16 lg:py-20">
    <section class="max-w-3xl">
      <p class="kicker">QRL utility suite</p>
      <h1 class="text-balance text-hero/none font-semibold tracking-tight">Inspect, repair, and create QRL wallet data.</h1>
      <p class="mt-5 max-w-[56ch] text-pretty text-lead/8 text-base-content/68">
        Four focused tools in one self-contained file. Nothing leaves the browser, and the wallet generator works without a server.
      </p>
      <div class="mt-6 flex flex-wrap gap-2 text-sm/6">
        <span class="badge badge-outline border-success/35 text-success">Offline capable</span>
        <span class="badge badge-outline border-secondary/35 text-secondary">Single-file build</span>
        <span class="badge badge-outline border-base-content/20">QRL v3 wallets</span>
      </div>
    </section>

    <section class="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Available tools">
      <ToolCard
        to="/address"
        icon="magnifying-glass"
        eyebrow="Inspect"
        title="Address validator"
        description="Check a QRL address and read its signature scheme, tree height, and hash function."
      />
      <ToolCard
        to="/mnemonic"
        icon="spell-check"
        eyebrow="Repair"
        title="Mnemonic validator"
        description="Check all 34 words, find malformed input, and replace likely misspellings."
      />
      <ToolCard
        to="/hexseed"
        icon="fingerprint"
        eyebrow="Check"
        title="Hexseed validator"
        description="Find whitespace, invalid characters, case problems, and incorrect seed lengths."
      />
      <ToolCard
        to="/wallet"
        icon="wallet"
        eyebrow="Create"
        title="Wallet generator"
        description="Generate or restore an XMSS wallet, then save it in the authenticated QRL v3 format."
      />
    </section>

    <aside class="mt-8 rounded-box border border-warning/25 bg-warning/8 p-5 sm:flex sm:items-start sm:gap-4">
      <svg class="mt-0.5 size-5 shrink-0 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M12 9v4m0 4h.01M10.3 4.9 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="mt-3 sm:mt-0">
        <h2 class="text-base/6 font-semibold">Generate wallets on an offline machine</h2>
        <p class="mt-1 max-w-[68ch] text-sm/6 text-base-content/65">
          Use a clean bootable OS, verify the release signature, and disconnect before creating or restoring a wallet.
        </p>
      </div>
    </aside>
  </div>
</template>

<script>
import ToolCard from '@/components/shared/ToolCard.vue';

export default {
  name: 'Dashboard',
  components: { ToolCard },
};
</script>
