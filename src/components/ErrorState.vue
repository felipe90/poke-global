<script setup lang="ts">
import Magikarp from '@/components/Magikarp.vue'

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="state" role="alert">
    <h2 class="state__title">Algo salió mal...</h2>
    <p class="state__subtitle">
      No pudimos cargar la información en este momento. Verifica tu conexión o intenta
      nuevamente más tarde.
    </p>
    <Magikarp class="state__illustration" />
    <button
      type="button"
      class="state__cta"
      @click="emit('retry')"
    >
      Reintentar
    </button>
  </section>
</template>
