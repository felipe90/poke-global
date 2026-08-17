<script setup lang="ts">
defineProps<{
  label: string
  value: string
  /** Icon shown next to the label (first row). Optional until assets land. */
  iconUrl?: string
}>()
</script>

<template>
  <div class="property-box">
    <div class="property-box__header">
      <img
        v-if="iconUrl"
        class="property-box__icon"
        :src="iconUrl"
        alt=""
        aria-hidden="true"
      />
      <span class="property-box__label">{{ label }}</span>
    </div>
    <div class="property-box__value">{{ value }}</div>
  </div>
</template>

<style scoped>
.property-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-box__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-box__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.property-box__label {
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.property-box__value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 154px;
  height: 43px;
  padding: 8px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 15px;
  font-size: var(--font-data-value);
  font-weight: 500;
  line-height: 1.15;
  color: var(--title);
  text-align: center;
  box-sizing: border-box;
  overflow: hidden;
}
</style>