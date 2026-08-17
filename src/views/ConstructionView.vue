<script setup lang="ts">
import ConstructionState from '@/components/ConstructionState.vue'
</script>

<template>
  <div class="construction-view">
    <ConstructionState />
  </div>
</template>

<style scoped>
.construction-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
