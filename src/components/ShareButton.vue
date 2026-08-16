<script setup lang="ts">
import { ref } from 'vue'

import { useClipboard } from '@/composables/useClipboard'
import type { CopyStatus } from '@/composables/useClipboard'
import { buildShareText } from '@/services/pokeapi'
import type { PokemonDetail } from '@/types/pokemon'

const props = defineProps<{ detail: PokemonDetail }>()

const { copy } = useClipboard()
const feedback = ref<CopyStatus | 'idle'>('idle')

async function share(): Promise<void> {
  const status = await copy(buildShareText(props.detail))
  feedback.value = status
}
</script>

<template>
  <div class="share-button">
    <button
      type="button"
      class="share-button__cta"
      @click="share"
    >
      Compartir
    </button>
    <p
      v-if="feedback === 'success'"
      class="share-button__feedback"
      role="status"
    >
      Copiado en el portapapeles
    </p>
    <p
      v-else-if="feedback === 'error'"
      class="share-button__feedback share-button__feedback--error"
      role="alert"
    >
      No se pudo copiar la información. Inténtalo nuevamente.
    </p>
  </div>
</template>
