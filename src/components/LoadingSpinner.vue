<script setup lang="ts">
/**
 * Generic loading spinner — the app's non-pokeball busy indicator.
 * Decorative: containers signal loading state via aria-busy.
 */
</script>

<template>
  <span
    class="loading-spinner"
    aria-hidden="true"
  />
</template>

<style scoped>
.loading-spinner {
  display: inline-block;
  width: var(--space-2xl);
  height: var(--space-2xl);
  border: 3px solid var(--primary);
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: loading-spin 0.9s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>