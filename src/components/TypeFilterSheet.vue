<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { TYPE_META } from '@/data/types'
import { usePokemonStore } from '@/stores/pokemon'
import type { TypeName } from '@/types/pokemon'

const props = defineProps<{
  open: boolean
  /** Last successfully applied filter — the selection reverts to this on cancel. */
  applied: TypeName[]
  /** Optional initial pending selection when the sheet opens. */
  pending?: TypeName[]
}>()

const emit = defineEmits<{
  apply: [types: TypeName[]]
  close: []
  retry: []
}>()

const store = usePokemonStore()

const selected = ref<TypeName[]>([])
const applying = ref(false)
const applyFailed = ref(false)
const dialogRef = ref<HTMLElement | null>(null)

let previousFocus: HTMLElement | null = null

watch(
  () => props.open,
  (open) => {
    if (open) {
      selected.value = [...(props.pending ?? props.applied)]
      applyFailed.value = false
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      void nextTick(() => dialogRef.value?.focus())
    } else if (previousFocus) {
      previousFocus.focus()
      previousFocus = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (previousFocus) {
    previousFocus.focus()
    previousFocus = null
  }
})

const selectedCount = computed(() => selected.value.length)

const applyDisabled = computed(() => selectedCount.value === 0 || applying.value)

function toggleType(type: TypeName): void {
  selected.value = selected.value.includes(type)
    ? selected.value.filter((t) => t !== type)
    : [...selected.value, type]
  applyFailed.value = false
}

function discard(): void {
  selected.value = [...props.applied]
  emit('close')
}

async function apply(): Promise<void> {
  if (applyDisabled.value) return
  applying.value = true
  applyFailed.value = false
  await store.applyTypeFilter(selected.value)
  applying.value = false
  if (store.filterError) {
    applyFailed.value = true
  } else {
    emit('apply', [...selected.value])
    emit('close')
  }
}

async function retry(): Promise<void> {
  applying.value = true
  applyFailed.value = false
  await store.retryFilter()
  applying.value = false
  if (store.filterError) {
    applyFailed.value = true
  } else {
    emit('apply', [...selected.value])
    emit('close')
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  const focusables = Array.from(
    dialogRef.value?.querySelectorAll<HTMLElement>('input, button, [href], [tabindex]:not([tabindex="-1"])') ?? [],
  ).filter((el) => !(el as HTMLButtonElement).disabled)
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Transition name="sheet">
    <div
      v-if="open"
      class="sheet-overlay"
      @click="discard"
    >
      <section
        ref="dialogRef"
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="type-filter-sheet-title"
        tabindex="-1"
        @keydown="onKeydown"
        @keydown.esc="discard"
        @click.stop
      >
        <header class="sheet__header">
          <h2
            id="type-filter-sheet-title"
            class="sheet__title"
          >
            Filtra por tus preferencias
          </h2>
          <p
            class="sheet__count"
            aria-live="polite"
          >
            {{ selectedCount }} seleccionado{{ selectedCount === 1 ? '' : 's' }}
          </p>
        </header>

        <div class="sheet__grid">
          <label
            v-for="meta in TYPE_META"
            :key="meta.name"
            class="sheet__option"
          >
            <input
              type="checkbox"
              class="sheet__checkbox"
              :checked="selected.includes(meta.name)"
              @change="toggleType(meta.name)"
            />
            <span
              class="sheet__option-dot"
              :style="{ backgroundColor: meta.color }"
            />
            <span class="sheet__option-label">{{ meta.esLabel }}</span>
          </label>
        </div>

        <p
          v-if="applyFailed"
          class="sheet__error"
          role="alert"
        >
          Algo salió mal...
        </p>

        <div class="sheet__actions">
          <button
            type="button"
            class="sheet__cta sheet__cta--secondary"
            @click="discard"
          >
            Cancelar
          </button>
          <button
            v-if="applyFailed"
            type="button"
            class="sheet__cta"
            @click="retry"
          >
            Reintentar
          </button>
          <button
            type="button"
            class="sheet__cta"
            :disabled="applyDisabled"
            @click="apply"
          >
            Aplicar
          </button>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.sheet__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sheet-gap);
}

.sheet__title {
  margin: 0;
  font-size: var(--font-screen-title);
  font-weight: 500;
  color: var(--title);
}

.sheet__count {
  margin: 0;
  font-size: var(--font-data-label);
  font-weight: 500;
  color: var(--subtitle);
}

.sheet__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sheet-gap);
}

.sheet__option {
  display: flex;
  align-items: center;
  gap: var(--space-info-gap);
  padding: var(--space-info-gap);
  border-radius: var(--radius-card);
  cursor: pointer;
}

.sheet__checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--primary);
}

.sheet__option-dot {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-icon-circle);
  flex-shrink: 0;
}

.sheet__option-label {
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
}

.sheet__error {
  margin: 0;
  font-size: var(--font-cta);
  font-weight: 600;
  color: var(--danger);
}

.sheet__actions {
  display: flex;
  gap: var(--space-sheet-gap);
}

.sheet__cta {
  flex: 1;
  padding: var(--space-card) var(--space-card);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--bg);
  font-size: var(--font-cta);
  font-weight: 600;
}

.sheet__cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sheet__cta--secondary {
  background: var(--progress-track);
  color: var(--title);
}

.sheet__cta:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}
</style>
