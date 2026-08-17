<script setup lang="ts">
/**
 * Figma "Check" component (Components > Check, id 10:5823):
 * a 32×32 touch circle wrapping an 18×18 r4 box.
 * Unchecked: #fafafa fill with #d6d6d6 border.
 * Checked:   #1f49b6 fill with #0d47a1 border + white check.
 * The native input stays visually hidden for accessibility; the visual is
 * driven by :checked + :focus-visible states.
 */
withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
  }>(),
  { label: undefined },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

function onChange(event: Event): void {
  const value = (event.target as HTMLInputElement).checked
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <span class="custom-checkbox">
    <input
      type="checkbox"
      class="custom-checkbox__input"
      :checked="modelValue"
      :aria-label="label"
      @change="onChange"
    />
    <span class="custom-checkbox__box" aria-hidden="true">
      <svg
        v-if="modelValue"
        class="custom-checkbox__check"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-6.5" />
      </svg>
    </span>
  </span>
</template>

<style scoped>
.custom-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.custom-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--check-border, #d6d6d6);
  border-radius: 4px;
  background: var(--surface-default);
  color: var(--color-white);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.custom-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.custom-checkbox__input:checked + .custom-checkbox__box {
  background: var(--check-default, #1f49b6);
  border-color: var(--tab-active, #0d47a1);
}

.custom-checkbox__input:focus-visible + .custom-checkbox__box {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.custom-checkbox__check {
  width: 14px;
  height: 14px;
}
</style>