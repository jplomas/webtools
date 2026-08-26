<template>
  <router-link
    :to="to"
    class="group rounded-box border border-base-content/10 bg-base-200/65 p-5 transition-colors duration-200 hover:border-primary/35 hover:bg-base-200 sm:p-6"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex size-11 shrink-0 items-center justify-center rounded-field bg-primary/10 text-lg text-primary">
        <font-awesome-icon :icon="icon" />
      </div>
      <svg class="size-5 text-base-content/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <p class="mt-5 font-mono text-xs/5 font-semibold uppercase tracking-[0.14em] text-secondary">{{ eyebrow }}</p>
    <h2 class="mt-1 text-xl/7 font-semibold">{{ title }}</h2>
    <p class="mt-2 max-w-[48ch] text-sm/6 text-base-content/65">{{ description }}</p>
  </router-link>
</template>

<script>
export default {
  name: 'ToolCard',
  props: {
    to: { type: String, required: true },
    icon: { type: String, required: true },
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
};
</script>
