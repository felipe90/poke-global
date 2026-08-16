<script setup lang="ts">
import { computed } from 'vue'

import { getTypeMeta } from '@/data/types'
import type { TypeName } from '@/types/pokemon'

const props = defineProps<{ type: TypeName }>()

const meta = computed(() => getTypeMeta(props.type))
</script>

<template>
  <span
    class="type-badge"
    :style="meta ? { backgroundColor: meta.color } : {}"
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
    <span class="type-badge__label">{{ meta?.esLabel ?? props.type }}</span>
  </span>
</template>
