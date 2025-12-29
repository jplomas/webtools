<template>
  <div id="app" class="min-h-screen flex flex-col">
    <nav class="navbar bg-neutral shadow-lg">
      <div class="navbar-start">
        <router-link to="/" class="btn btn-ghost px-2 py-1 text-xl text-neutral-content">
          <img class="h-14" :src="logoSvg" alt="QRL">
          <span class="hidden sm:inline">Tools</span>
        </router-link>
      </div>
      <div class="navbar-center hidden md:flex">
        <ul class="menu menu-horizontal px-1">
          <li>
            <router-link to="/address" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/address' }">
              <font-awesome-icon icon="magnifying-glass" class="mr-1" />
              Address
            </router-link>
          </li>
          <li>
            <router-link to="/mnemonic" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/mnemonic' }">
              <font-awesome-icon icon="spell-check" class="mr-1" />
              Mnemonic
            </router-link>
          </li>
          <li>
            <router-link to="/hexseed" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/hexseed' }">
              <font-awesome-icon icon="fingerprint" class="mr-1" />
              Hexseed
            </router-link>
          </li>
          <li>
            <router-link to="/wallet" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/wallet' }">
              <font-awesome-icon icon="wallet" class="mr-1" />
              Wallet
            </router-link>
          </li>
        </ul>
      </div>
      <div class="navbar-end">
        <ul class="menu menu-horizontal px-1">
          <li>
            <router-link to="/docs" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/docs' }">Docs</router-link>
          </li>
          <li>
            <router-link to="/about" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/about' }">About</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Mobile tool menu -->
    <div class="md:hidden bg-base-200 border-b border-base-300">
      <ul class="menu menu-horizontal w-full justify-center">
        <li>
          <router-link to="/address" class="text-sm" :class="{ 'bg-secondary text-white': $route.path === '/address' }">
            <font-awesome-icon icon="magnifying-glass" />
            Address
          </router-link>
        </li>
        <li>
          <router-link to="/mnemonic" class="text-sm" :class="{ 'bg-secondary text-white': $route.path === '/mnemonic' }">
            <font-awesome-icon icon="spell-check" />
            Mnemonic
          </router-link>
        </li>
        <li>
          <router-link to="/hexseed" class="text-sm" :class="{ 'bg-secondary text-white': $route.path === '/hexseed' }">
            <font-awesome-icon icon="fingerprint" />
            Hexseed
          </router-link>
        </li>
        <li>
          <router-link to="/wallet" class="text-sm" :class="{ 'bg-secondary text-white': $route.path === '/wallet' }">
            <font-awesome-icon icon="wallet" />
            Wallet
          </router-link>
        </li>
      </ul>
    </div>

    <main class="flex-grow">
      <router-view />
    </main>

    <div class="h-20 bg-base-300"></div>

    <footer class="footer footer-center p-4 bg-neutral text-neutral-content border-t border-black/40 shadow-[0_-5px_5px_-5px_rgba(0,0,0,0.22)]">
      <div class="flex items-center gap-4">
        <img class="h-14" :src="logoSvg" alt="QRL Logo">
        <div v-if="qrllibLoaded" class="text-left">
          <p class="text-sm text-neutral-content/80"><font-awesome-icon icon="check" class="text-success mr-1" />QRL Library loaded</p>
          <p class="text-xs text-neutral-content/60">qrllib v1.2.4</p>
        </div>
        <div v-else-if="qrllibLoadFailed" class="text-left">
          <p class="text-sm text-error"><font-awesome-icon icon="triangle-exclamation" class="mr-1" />Failed to load QRL Library</p>
          <p class="text-xs text-neutral-content/60">Please refresh the page</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
/* global QRLLIB */
import logoSvgRaw from '/logo.svg?raw';

const MAX_QRLLIB_RETRIES = 100; // 100 retries * 100ms = 10 seconds max

export default {
  name: 'App',
  data() {
    return {
      qrllibLoaded: false,
      qrllibLoadFailed: false,
      logoSvg: 'data:image/svg+xml;base64,' + btoa(logoSvgRaw)
    };
  },
  mounted() {
    this.qrllibRetries = 0;
    this.qrllibTimerId = null;
    this.isDestroyed = false;
    this.checkQRLLIB();
  },
  beforeUnmount() {
    this.isDestroyed = true;
    if (this.qrllibTimerId !== null) {
      clearTimeout(this.qrllibTimerId);
      this.qrllibTimerId = null;
    }
  },
  methods: {
    checkQRLLIB() {
      if (this.isDestroyed) return;

      if (typeof QRLLIB !== 'undefined' && typeof QRLLIB.str2bin === 'function') {
        this.qrllibLoaded = true;
        this.qrllibTimerId = null;
      } else if (this.qrllibRetries < MAX_QRLLIB_RETRIES) {
        this.qrllibRetries++;
        this.qrllibTimerId = setTimeout(() => {
          this.qrllibTimerId = null;
          this.checkQRLLIB();
        }, 100);
      } else {
        this.qrllibLoadFailed = true;
        this.qrllibTimerId = null;
        console.error('Failed to load QRLLIB after', MAX_QRLLIB_RETRIES, 'attempts');
      }
    }
  }
};
</script>

<style>
html {
  position: relative;
  min-height: 100%;
}
</style>
