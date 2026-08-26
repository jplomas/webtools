<template>
  <div class="webtools-atmosphere flex min-h-dvh flex-col">
    <header class="border-b border-base-content/10">
      <div class="container-site flex h-16 items-center justify-between gap-3">
        <router-link to="/" class="flex min-w-0 items-center gap-2.5" aria-label="QRL Web Tools home">
          <img
            class="h-7 w-auto shrink-0 sm:h-8"
            :src="logoSvg"
            alt=""
            width="96"
            height="32"
          />
          <span class="min-w-0">
            <span class="block truncate font-display text-lg/5 font-semibold tracking-tight">Web Tools</span>
            <span class="block truncate font-mono text-xs/4 text-base-content/50">theqrl.org</span>
          </span>
        </router-link>

        <nav class="hidden lg:block" aria-label="Tools">
          <ul class="menu menu-horizontal gap-1 p-0">
            <li><router-link to="/address" class="nav-link">Address</router-link></li>
            <li><router-link to="/mnemonic" class="nav-link">Mnemonic</router-link></li>
            <li><router-link to="/hexseed" class="nav-link">Hexseed</router-link></li>
            <li><router-link to="/wallet" class="nav-link">Wallet</router-link></li>
          </ul>
        </nav>

        <div class="flex shrink-0 items-center gap-1">
          <nav class="hidden sm:block" aria-label="Project">
            <ul class="menu menu-horizontal gap-1 p-0">
              <li><router-link to="/docs" class="nav-link">Docs</router-link></li>
              <li><router-link to="/about" class="nav-link">About</router-link></li>
            </ul>
          </nav>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square relative"
            :aria-label="isLight ? 'Switch to dark theme' : 'Switch to light theme'"
            :aria-pressed="isLight"
            @click="toggleTheme"
          >
            <span class="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
            <svg v-show="!isLight" class="size-5 sm:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round" />
            </svg>
            <svg v-show="isLight" class="size-5 sm:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <details class="dropdown dropdown-end lg:hidden">
            <summary class="btn btn-ghost btn-sm btn-square list-none" role="button" aria-label="Open navigation">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
            </summary>
            <ul class="menu dropdown-content z-20 mt-2 w-52 rounded-box border border-base-content/10 bg-base-200 p-2 shadow-xl">
              <li><router-link to="/address">Address validator</router-link></li>
              <li><router-link to="/mnemonic">Mnemonic validator</router-link></li>
              <li><router-link to="/hexseed">Hexseed validator</router-link></li>
              <li><router-link to="/wallet">Wallet generator</router-link></li>
              <li class="sm:hidden"><router-link to="/docs">Documentation</router-link></li>
              <li class="sm:hidden"><router-link to="/about">About</router-link></li>
            </ul>
          </details>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="$route.path" class="page-enter" />
      </router-view>
    </main>

    <footer class="border-t border-base-content/10 py-6">
      <div class="container-site flex flex-col gap-4 text-sm/6 text-base-content/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p v-if="qrllibLoaded" class="flex items-center gap-2 text-base-content/75">
            <span class="size-2 rounded-full bg-success" aria-hidden="true"></span>
            <span class="flex items-baseline gap-2">
              <span>QRL Library loaded</span>
              <span class="font-mono text-xs text-base-content/45">v{{ qrllibVersion }}</span>
            </span>
          </p>
          <p v-else-if="qrllibLoadFailed" class="flex items-center gap-2 text-error">
            <span class="size-2 rounded-full bg-error" aria-hidden="true"></span>
            QRL Library failed to load. Do not use wallet features.
          </p>
        </div>
        <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="font-mono text-xs tabular-nums">{{ buildId }}</span>
          <a class="link link-hover" href="https://www.theqrl.org" rel="noopener">theqrl.org</a>
          <a class="link link-hover" href="https://docs.theqrl.org" rel="noopener">docs</a>
          <a class="link link-hover" href="https://github.com/theQRL/webtools" rel="noopener">source</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import logoSvgRaw from '/logo.svg?raw';

const MAX_QRLLIB_RETRIES = 100;

export default {
  name: 'App',
  data() {
    return {
      qrllibLoaded: false,
      qrllibLoadFailed: false,
      qrllibVersion: __QRLLIB_VERSION__,
      buildId: __APP_BUILD_ID__,
      isLight: false,
      logoSvg: `data:image/svg+xml;base64,${btoa(logoSvgRaw)}`,
    };
  },
  mounted() {
    this.qrllibRetries = 0;
    this.qrllibTimerId = null;
    this.isDestroyed = false;
    this.syncTheme();
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
    syncTheme() {
      this.isLight = document.documentElement.getAttribute('data-theme') === 'qrl-dawn-light';
    },
    toggleTheme() {
      document.documentElement.setAttribute('data-theme', this.isLight ? 'qrl-dawn' : 'qrl-dawn-light');
      this.syncTheme();
    },
    checkQRLLIB() {
      if (this.isDestroyed) return;

      if (typeof QRLLIB !== 'undefined' && typeof QRLLIB.str2bin === 'function') {
        try {
          const probe = QRLLIB.str2bin('qrl');
          this.qrllibLoaded = typeof probe?.size === 'function' && probe.size() === 3;
          this.qrllibLoadFailed = !this.qrllibLoaded;
        } catch {
          this.qrllibLoaded = false;
          this.qrllibLoadFailed = true;
        }
        this.qrllibTimerId = null;
      } else if (this.qrllibRetries < MAX_QRLLIB_RETRIES) {
        this.qrllibRetries += 1;
        this.qrllibTimerId = setTimeout(() => {
          this.qrllibTimerId = null;
          this.checkQRLLIB();
        }, 100);
      } else {
        this.qrllibLoadFailed = true;
        this.qrllibTimerId = null;
        console.error('Failed to load QRLLIB after', MAX_QRLLIB_RETRIES, 'attempts');
      }
    },
  },
};
</script>
