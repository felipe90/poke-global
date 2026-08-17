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