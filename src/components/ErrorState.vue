<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import Magikarp from '@/components/Magikarp.vue'

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="state" role="alert">
    <h2 class="state__title">Algo salió mal...</h2>
    <p class="state__subtitle">No pudimos cargar la información...</p>
    <Magikarp class="state__illustration" />
    <AppButton @click="emit('retry')">
      Reintentar
    </AppButton>
  </section>
</template>
