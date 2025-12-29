<template>
  <router-link :to="to" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-200 hover:scale-[1.02] transform cursor-pointer">
    <div class="card-body items-center text-center">
      <div class="text-4xl text-primary mb-2">
        <font-awesome-icon :icon="icon" />
      </div>
      <h2 class="card-title">{{ title }}</h2>
      <p class="text-base-content/70">{{ description }}</p>
    </div>
  </router-link>
</template>

<script>
export default {
  name: 'ToolCard',
  props: {
    to: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }
};
</script>
