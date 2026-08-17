<script setup lang="ts">
import { computed } from 'vue'

import femaleIcon from '@/assets/icons/gender/female.svg'
import maleIcon from '@/assets/icons/gender/male.svg'

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
    <span class="gender-bar__label">Género</span>
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
          <img
            class="gender-bar__icon"
            :src="maleIcon"
            alt=""
            aria-hidden="true"
          />
          <span>{{ maleLabel }}</span>
        </span>
        <span class="gender-bar__legend-item">
          <img
            class="gender-bar__icon"
            :src="femaleIcon"
            alt=""
            aria-hidden="true"
          />
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
  font-family: var(--font-family, 'Poppins'), sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 100%;
  letter-spacing: 5%;
  text-transform: uppercase;
  color: var(--subtitle);
  text-align: center;
}

.gender-bar__track {
  width: 100%;
  height: 8px;
  border-radius: 49px;
  overflow: hidden;
  /* The track shows the female share; the male segment covers its part. */
  background: #ff7596;
}

.gender-bar__empty {
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
  text-align: center;
}

.gender-bar__segment {
  height: 100%;
  /* Straight division: no border-radius on the segment. */
  background: #2551c3;
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
  width: 18px;
  height: 18px;
  color: var(--subtitle);
}
</style>