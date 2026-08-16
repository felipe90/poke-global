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
      :style="{ backgroundColor: '#fafafa', borderRadius: '100px' }"
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
