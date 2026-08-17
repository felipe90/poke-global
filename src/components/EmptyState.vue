<script setup lang="ts">
import FeedbackState from '@/components/FeedbackState.vue'
import emptyImage from '@/assets/screens/Magikarp_Jump_Pattern_01 1.png'
</script>

<template>
  <FeedbackState
    :image="emptyImage"
    title="No has marcado ningún Pokémon como favorito"
    subtitle="Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí."
  />
</template>