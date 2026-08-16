<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    class="app-button"
    :class="`app-button--${variant}`"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 328px;
  height: 58px;
  padding: 16px var(--space-xl);
  border: none;
  border-radius: var(--radius-pill);
  font-size: var(--font-cta);
  font-weight: 600;
}

.app-button--primary {
  background: var(--button-primary-default-bg, #1e88e5);
  color: var(--bg);
}

.app-button--secondary {
  background: var(--button-secondary-default-bg, #eeeeee);
  color: var(--title);
}

.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-button:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>