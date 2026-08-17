<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ genderRate: number }>()

/** -1 = genderless; otherwise male = (8 - rate)/8, female = rate/8. */
const malePercent = computed(() => (props.genderRate === -1 ? null : ((8 - props.genderRate) / 8) * 100))
const femalePercent = computed(() => (props.genderRate === -1 ? null : (props.genderRate / 8) * 100))

const maleLabel = computed(() =>
  malePercent.value === null ? '' : `${format(malePercent.value)}%`,
)
const femaleLabel = computed(() =>
  femalePercent.value === null ? '' : `${format(femalePercent.value)}%`,
)

const genderless = computed(() => props.genderRate === -1)

function format(value: number): string {
  return value.toFixed(1).replace('.', ',')
}
</script>

<template>
  <div class="gender-bar">
    <span class="gender-bar__label">{{ genderless ? 'Género' : 'Género' }}</span>
    <template v-if="genderless">
      <span class="gender-bar__empty">Sin género</span>
    </template>
    <template v-else>
      <div class="gender-bar__track">
        <div
          class="gender-bar__segment"
          :style="{ width: `${malePercent ?? 0}%` }"
        />
      </div>
      <div class="gender-bar__legend">
        <span class="gender-bar__legend-item">
          <svg
            class="gender-bar__icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.5 1.5h-4v1.8h1.35l-1.8 1.8a4.2 4.2 0 1 0 0 5.94L9.9 10l1.27 1.27-1.25 1.25a4.2 4.2 0 1 0 0-5.94l1.8-1.8V6.6h1.8zM8.25 11.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8z"
              fill="#424242"
            />
          </svg>
          <span>{{ maleLabel }}</span>
        </span>
        <span class="gender-bar__legend-item">
          <svg
            class="gender-bar__icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8.25 2.4h1.5v2.1a3.6 3.6 0 1 1-3.9 3.6v-.15h-1.5v-1.5h1.5V4.95H4.5v-1.5h1.05V2.4h1.5v1.05h1.2zM9 6.3a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2z"
              fill="#424242"
            />
          </svg>
          <span>{{ femaleLabel }}</span>
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gender-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-info-gap);
}

.gender-bar__label {
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
  text-align: center;
}

.gender-bar__track {
  width: 100%;
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--progress-track);
}

.gender-bar__empty {
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
  text-align: center;
}

.gender-bar__segment {
  height: 100%;
  background: #2551c3;
  border-radius: 9999px;
}

.gender-bar__legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gender-bar__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.gender-bar__icon {
  color: var(--subtitle);
}
</style>