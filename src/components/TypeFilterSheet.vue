<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import AppButton from '@/components/AppButton.vue'
import closeIcon from '@/assets/icons/tab/close.svg'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import Separator from '@/components/Separator.vue'
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
/** Accordion state: the type list starts expanded (main filter). */
const collapsed = ref(false)

function toggleCollapsed(): void {
  collapsed.value = !collapsed.value
}

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
          <button
            type="button"
            class="sheet__close"
            aria-label="Cerrar"
            @click="discard"
          >
            <img
              :src="closeIcon"
              alt=""
              aria-hidden="true"
            />
          </button>
          <h2
            id="type-filter-sheet-title"
            class="sheet__title"
          >
            Filtra por tus preferencias
          </h2>
        </header>

        <div class="sheet__accordion">
          <button
            type="button"
            class="sheet__accordion-head"
            :aria-expanded="!collapsed"
            @click="toggleCollapsed"
          >
            <span class="sheet__accordion-title">Tipo</span>
            <svg
              class="sheet__accordion-chevron"
              :class="{ 'sheet__accordion-chevron--open': !collapsed }"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>

          <div
            v-show="!collapsed"
            class="sheet__list"
          >
            <Separator class="sheet__list-separator" />
            <label
              v-for="meta in TYPE_META"
              :key="meta.name"
              class="sheet__option"
              :class="{ 'sheet__option--selected': selected.includes(meta.name) }"
            >
              <img
                class="sheet__option-icon"
                :src="meta.icon"
                alt=""
                aria-hidden="true"
              />
              <span class="sheet__option-label">{{ meta.esLabel }}</span>
              <CustomCheckbox
                :model-value="selected.includes(meta.name)"
                :label="`Filtrar por ${meta.esLabel}`"
                @change="toggleType(meta.name)"
              />
            </label>
            <Separator class="sheet__list-separator" />
          </div>
        </div>

        <p
          v-if="applyFailed"
          class="sheet__error"
          role="alert"
        >
          Algo salió mal...
        </p>

        <div class="sheet__actions">
          <AppButton
            :disabled="applyDisabled"
            @click="apply"
          >
            Aplicar
          </AppButton>
          <AppButton
            v-if="applyFailed"
            @click="retry"
          >
            Reintentar
          </AppButton>
          <AppButton
            variant="secondary"
            @click="discard"
          >
            Cancelar
          </AppButton>
        </div>

        <div
          class="sheet__indicator"
          aria-hidden="true"
        />
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.sheet {
  background: var(--bg);
  border-top-left-radius: var(--radius-sheet-top);
  border-top-right-radius: var(--radius-sheet-top);
  box-shadow: var(--shadow-top);
  padding: var(--space-sheet-tb) var(--space-sheet-lr) var(--space-sheet-bottom);
  display: flex;
  flex-direction: column;
  gap: var(--space-sheet-gap);
  /* Full width of the app frame (the overlay centers it); `vh` (not dvh)
     keeps the sheet stable in Chrome's responsive/device toolbar where dvh
     shrinks with the URL bar. */
  width: 100%;
  height: 70vh;
}

.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--layer-overlay);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.5);
  /* Match the app frame width so the sheet is centered on the app (360px),
     not stretched across the whole viewport. */
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.sheet__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--subtitle);
  cursor: pointer;
}

.sheet__close:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}

.sheet__title {
  margin: 0;
  font-family: var(--font-family);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--title);
  text-align: center;
}

.sheet__accordion {
  display: flex;
  flex-direction: column;
  gap: var(--space-sheet-gap);
  flex: 1;
  min-height: 0;
}

.sheet__accordion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sheet__accordion-head:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}

.sheet__accordion-title {
  font-family: var(--font-family-montserrat);
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--title);
}

.sheet__accordion-chevron {
  color: var(--subtitle);
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

.sheet__accordion-chevron--open {
  transform: rotate(0deg);
}

.sheet__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: var(--space-xxs);
  /* Mobile-first: hide the native scrollbar (the Figma has no visible bar). */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sheet__list::-webkit-scrollbar {
  display: none;
}

.sheet__list-separator {
  margin: var(--space-xxs) 0;
}

.sheet__option {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  height: 32px;
  padding: 0;
  border-radius: var(--radius-card);
  cursor: pointer;
}

.sheet__option-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  pointer-events: none;
}

.sheet__option-label {
  flex: 1;
  font-family: var(--font-family-montserrat);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--subtitle);
}

.sheet__error {
  margin: 0;
  font-size: var(--font-cta);
  font-weight: 600;
  color: var(--danger);
}

.sheet__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sheet-gap);
  /* Top shadow separates the button panel from the list above (Figma:
     box-shadow 0 -1px 3px 0 rgba(0,0,0,0.12)). */
  box-shadow: var(--shadow-top);
}

.sheet__actions :deep(.app-button) {
  width: 100%;
  max-width: none;
}

.sheet__indicator {
  width: 134px;
  height: 4px;
  margin: 0 auto;
  border-radius: 100px;
  background: var(--title);
  opacity: 0.8;
}

.visually-hidden {
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
</style>
