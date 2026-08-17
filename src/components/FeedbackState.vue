<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'

withDefaults(
  defineProps<{
    image: string
    title: string
    subtitle: string
    buttonLabel?: string
    alert?: boolean
  }>(),
  { buttonLabel: undefined, alert: false },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section
    class="state"
    :role="alert ? 'alert' : undefined"
  >
    <img
      :src="image"
      alt=""
      class="state__illustration"
      aria-hidden="true"
    >
    <h2 class="state__title">{{ title }}</h2>
    <p class="state__subtitle">{{ subtitle }}</p>
    <AppButton
      v-if="buttonLabel"
      @click="emit('retry')"
    >
      {{ buttonLabel }}
    </AppButton>
  </section>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-card);
  padding: var(--space-card);
  flex: 1 1 auto;
  background: var(--bg);
}

.state__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--state-title);
}

.state__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--state-subtitle);
  max-width: 420px;
}

.state__illustration {
  width: 160px;
  height: auto;
}
</style>