<script setup lang="ts">
import FeedbackState from '@/components/FeedbackState.vue'
import errorImage from '@/assets/images/Magikarp_Jump_Pattern_01 1.png'

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <FeedbackState
    :image="errorImage"
    title="Algo salió mal..."
    subtitle="No pudimos cargar la información en este momento. Verifica tu conexión o intenta nuevamente más tarde."
    button-label="Reintentar"
    alert
    @retry="emit('retry')"
  />
</template>