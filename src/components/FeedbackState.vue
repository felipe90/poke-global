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