<script setup lang="ts">
import loaderUrl from '@/assets/screens/Loader.svg'
</script>

<template>
  <img
    :src="loaderUrl"
    class="pokeball-loader"
    alt=""
    aria-hidden="true"
  />
</template>

<style scoped>
.pokeball-loader {
  display: inline-block;
  position: relative;
  width: 155px;
  height: 155px;
  /* Pivota desde la base, no desde el centro — balanceo orgánico */
  transform-origin: bottom center;
  animation: pokeball-wobble 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .pokeball-loader {
    animation: none;
  }
}
</style>