<script setup lang="ts">
import { computed } from 'vue'

import { FALLBACK_TYPE_COLOR, getTypeMeta, resolveEsLabel } from '@/data/types'
import { usePokemonStore } from '@/stores/pokemon'
import type { TypeName } from '@/types/pokemon'

const props = defineProps<{ type: TypeName }>()

const store = usePokemonStore()

const meta = computed(() => getTypeMeta(props.type))

const label = computed(() => resolveEsLabel(props.type, store.typeCatalog(props.type)))

const background = computed(() => meta.value?.color ?? FALLBACK_TYPE_COLOR)
</script>

<template>
  <span
    class="type-badge"
    :style="{ backgroundColor: background }"
  >
    <span
      class="type-badge__icon"
      :style="{ backgroundColor: 'var(--surface-default)', borderRadius: '100px' }"
    >
      <img
        v-if="meta"
        :src="meta.icon"
        alt=""
        aria-hidden="true"
      />
    </span>
    <span class="type-badge__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5.8px;
  padding: 2.9px 6px;
  border-radius: 48.6px;
  color: var(--color-white);
  font-family: var(--font-family);
  font-size: 11px;
  font-weight: 500;
}

.type-badge__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-icon-circle);
  background: var(--surface-default);
  pointer-events: none;
}

.type-badge__icon img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
</style>
