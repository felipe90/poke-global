/**
 * Single Pinia setup store for the Pokedex.
 * Slice order matches the PR 2 work units: catalog (2.1), type filter (2.2),
 * search + nav context (2.3), then detail, favorites, and preload in later slices.
 * All service calls live in `pokeapi.ts`; this store is the only orchestrator.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { fetchPokemonPage, fetchTypeCatalog } from '@/services/pokeapi'
import { PAGE_SIZE } from '@/types/pokemon'
import type { PokemonSummary, TypeCatalogResponse, TypeName } from '@/types/pokemon'

/** Merge two summary lists deduplicated by name, preserving order. */
function mergeByName(base: PokemonSummary[], incoming: PokemonSummary[]): PokemonSummary[] {
  const seen = new Set(base.map((item) => item.name))
  const merged = [...base]
  for (const item of incoming) {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      merged.push(item)
    }
  }
  return merged
}

/** Read the next offset from a PokeAPI `next` URL (null when absent). */
function offsetFromUrl(url: string): number {
  const parsed = new URL(url)
  const offset = parsed.searchParams.get('offset')
  return offset === null ? 0 : Number(offset)
}

export const usePokemonStore = defineStore('pokemon', () => {
  // ---------------------------------------------------------------- Catalog
  const pokemonList = ref<PokemonSummary[]>([])
  const nextUrl = ref<string | null>(null)
  const loadingFirst = ref(false)
  const loadingMore = ref(false)
  const pageError = ref<{ offset: number } | null>(null)

  async function loadFirstPage(): Promise<void> {
    if (pokemonList.value.length > 0 || loadingFirst.value) return
    loadingFirst.value = true
    pageError.value = null
    try {
      const page = await fetchPokemonPage(0)
      pokemonList.value = mergeByName(pokemonList.value, page.results)
      nextUrl.value = page.next
    } catch {
      pageError.value = { offset: 0 }
    } finally {
      loadingFirst.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (loadingMore.value || loadingFirst.value || nextUrl.value === null) return
    loadingMore.value = true
    pageError.value = null
    const offset = offsetFromUrl(nextUrl.value)
    try {
      const page = await fetchPokemonPage(offset)
      pokemonList.value = mergeByName(pokemonList.value, page.results)
      nextUrl.value = page.next
    } catch {
      pageError.value = { offset }
    } finally {
      loadingMore.value = false
    }
  }

  /** Re-issue exactly one catalog page after a failure, keeping prior pages. */
  async function retryPage(offset: number): Promise<void> {
    if (loadingFirst.value || loadingMore.value) return
    const isFirst = offset === 0
    if (isFirst) loadingFirst.value = true
    else loadingMore.value = true
    pageError.value = null
    try {
      const page = await fetchPokemonPage(offset)
      pokemonList.value = mergeByName(pokemonList.value, page.results)
      nextUrl.value = page.next
    } catch {
      pageError.value = { offset }
    } finally {
      if (isFirst) loadingFirst.value = false
      else loadingMore.value = false
    }
  }

  // ------------------------------------------------------------- Type filter
  const appliedTypes = ref<TypeName[]>([])
  const filteredSet = ref<PokemonSummary[]>([])
  const filterSliceIndex = ref(0)
  const filterError = ref<{ failedTypes: TypeName[] } | null>(null)
  const applyingFilter = ref(false)

  const pendingTypes = ref<TypeName[]>([])
  const pendingCatalogs = new Map<TypeName, TypeCatalogResponse>()

  /** Visible window of the filtered set: 24 items per client-side slice. */
  const visibleFiltered = computed(() =>
    filteredSet.value.slice(0, (filterSliceIndex.value + 1) * PAGE_SIZE),
  )

  async function applyTypeFilter(types: TypeName[]): Promise<void> {
    if (types.length === 0) return
    pendingTypes.value = [...types]
    pendingCatalogs.clear()
    filterError.value = null
    await resolveFilter()
  }

  /** Re-issue only the types that failed in the previous apply. */
  async function retryFilter(): Promise<void> {
    if (pendingTypes.value.length === 0) return
    filterError.value = null
    await resolveFilter()
  }

  /** Atomic union: any failure leaves the applied filter untouched. */
  async function resolveFilter(): Promise<void> {
    applyingFilter.value = true
    const missing = pendingTypes.value.filter((type) => !pendingCatalogs.has(type))
    const attempts = await Promise.all(
      missing.map(async (type) => {
        try {
          return { type, catalog: await fetchTypeCatalog(type) }
        } catch {
          return { type, catalog: undefined }
        }
      }),
    )
    for (const attempt of attempts) {
      if (attempt.catalog) pendingCatalogs.set(attempt.type, attempt.catalog)
    }

    const failed = pendingTypes.value.filter((type) => !pendingCatalogs.has(type))
    if (failed.length > 0) {
      filterError.value = { failedTypes: failed }
    } else {
      const union = new Map<string, PokemonSummary>()
      for (const type of pendingTypes.value) {
        const catalog = pendingCatalogs.get(type)
        if (!catalog) continue
        for (const entry of catalog.pokemon) {
          if (!union.has(entry.pokemon.name)) union.set(entry.pokemon.name, entry.pokemon)
        }
      }
      appliedTypes.value = [...pendingTypes.value]
      filteredSet.value = [...union.values()]
      filterSliceIndex.value = 0
      filterError.value = null
    }
    applyingFilter.value = false
  }

  /** Client-side pagination over the filtered set — no API call. */
  function incrementFilterSlice(): void {
    if ((filterSliceIndex.value + 1) * PAGE_SIZE < filteredSet.value.length) {
      filterSliceIndex.value++
    }
  }

  /** Clear filter + search + pagination, restoring the catalog list. */
  function clearFilter(): void {
    appliedTypes.value = []
    filteredSet.value = []
    filterSliceIndex.value = 0
    filterError.value = null
    pendingTypes.value = []
    pendingCatalogs.clear()
    searchFilter.value = ''
  }

  // ------------------------------------------------------------------ Search
  const searchFilter = ref('')

  /** Local search over the active base list (loaded pages or visible slices). */
  const filteredList = computed(() => {
    const base =
      appliedTypes.value.length > 0 || filteredSet.value.length > 0
        ? visibleFiltered.value
        : pokemonList.value
    const query = searchFilter.value.trim().toLowerCase()
    if (query === '') return base
    return base.filter((item) => item.name.toLowerCase().includes(query))
  })

  // ------------------------------------------------------------ Nav context
  const contextNames = ref<string[]>([])

  /** Capture the ordered list (filtered-set order when active, else catalog). */
  function setNavContext(names: string[]): void {
    contextNames.value = [...names]
  }

  function navIndexOf(name: string): number {
    return contextNames.value.indexOf(name)
  }

  function prevName(name: string): string | null | undefined {
    if (contextNames.value.length === 0) return null
    const index = navIndexOf(name)
    if (index === -1) return null
    return index > 0 ? contextNames.value[index - 1] : undefined
  }

  function nextName(name: string): string | null | undefined {
    if (contextNames.value.length === 0) return null
    const index = navIndexOf(name)
    if (index === -1) return null
    return index < contextNames.value.length - 1 ? contextNames.value[index + 1] : undefined
  }

  return {
    pokemonList,
    nextUrl,
    loadingFirst,
    loadingMore,
    pageError,
    loadFirstPage,
    loadMore,
    retryPage,

    appliedTypes,
    filteredSet,
    filterSliceIndex,
    filterError,
    applyingFilter,
    visibleFiltered,
    applyTypeFilter,
    retryFilter,
    incrementFilterSlice,
    clearFilter,

    searchFilter,
    filteredList,

    contextNames,
    setNavContext,
    navIndexOf,
    prevName,
    nextName,
  }
})
