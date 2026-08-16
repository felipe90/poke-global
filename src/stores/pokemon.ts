/**
 * Single Pinia setup store for the Pokedex.
 * Slice order matches the PR 2 work units: catalog (2.1), type filter (2.2),
 * search + nav context (2.3), then detail, favorites, and preload in later slices.
 * All service calls live in `pokeapi.ts`; this store is the only orchestrator.
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { TYPE_META, resolveWeaknesses } from '@/data/types'
import {
  fetchPokemonDetail,
  fetchPokemonPage,
  fetchPokemonSpecies,
  fetchTypeCatalog,
} from '@/services/pokeapi'
import { loadFavorites, saveFavorites } from '@/services/storage'
import { PAGE_SIZE, STORAGE_KEY } from '@/types/pokemon'
import type {
  FavoritePokemon,
  PokemonDetail,
  PokemonSpecies,
  PokemonSummary,
  TypeCatalogResponse,
  TypeName,
} from '@/types/pokemon'

/** Derived species fields shown in the rich detail panel; degrade to `—`. */
export interface PokemonDerivedSpecies {
  peso: string
  altura: string
  categoria: string
  descripcion: string
  genero: string
  habilidad: string
  debilidades: TypeName[]
}

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

// ---- Pure derivation helpers (shared by the store and the detail panel) ----

function formatDecimal(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

function formatPercent(value: number): string {
  const fixed = value.toFixed(1).replace('.', ',')
  return fixed.endsWith(',0') ? fixed.slice(0, -2) : fixed
}

function resolveCategory(species: PokemonSpecies): string {
  const es = species.genera.find((genus) => genus.language.name === 'es')
  if (es) return es.genus
  const en = species.genera.find((genus) => genus.language.name === 'en')
  return en ? en.genus : '—'
}

function resolveDescription(species: PokemonSpecies): string {
  const es = species.flavor_text_entries.filter((entry) => entry.language.name === 'es')
  const chosen =
    es.length > 0 ? es[es.length - 1] : species.flavor_text_entries.find((entry) => entry.language.name === 'en')
  if (!chosen) return '—'
  return chosen.flavor_text.replace(/[\n\f]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function resolveGender(rate: number): string {
  if (rate === -1) return 'Sin género'
  const male = ((8 - rate) / 8) * 100
  const female = (rate / 8) * 100
  return `${formatPercent(male)}% / ${formatPercent(female)}%`
}

function resolveAbility(detail: PokemonDetail): string {
  const slot1 = detail.abilities.find((ability) => ability.slot === 1)
  if (!slot1) return '—'
  return slot1.ability.name.charAt(0).toUpperCase() + slot1.ability.name.slice(1)
}

/** Derive the rich-panel fields from a detail (+ optional species). Exported so
 *  the presentational detail panel reuses this logic instead of duplicating it.
 *  `resolveWeaknessesFor` supplies each type's catalog-derived weaknesses; when
 *  omitted (no preload yet) the panel degrades to an empty list. */
export function deriveSpecies(
  detail: PokemonDetail,
  species: PokemonSpecies | null,
  resolveWeaknessesFor?: (type: TypeName) => TypeName[],
): PokemonDerivedSpecies {
  return {
    peso: `${formatDecimal(detail.weight / 10)} kg`,
    altura: `${formatDecimal(detail.height / 10)} m`,
    categoria: species ? resolveCategory(species) : '—',
    descripcion: species ? resolveDescription(species) : '—',
    genero: species ? resolveGender(species.gender_rate) : '—',
    habilidad: resolveAbility(detail),
    debilidades: resolveWeaknessesFor
      ? detail.types.flatMap((entry) => resolveWeaknessesFor(entry.type.name))
      : [],
  }
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
  /** Session cache of full type catalogs — populated by the preload and by apply fetches. */
  const typeCatalogs = new Map<TypeName, TypeCatalogResponse>()

  /** Visible window of the filtered set: 24 items per client-side slice. */
  const visibleFiltered = computed(() =>
    filteredSet.value.slice(0, (filterSliceIndex.value + 1) * PAGE_SIZE),
  )

  async function applyTypeFilter(types: TypeName[]): Promise<void> {
    if (types.length === 0) return
    pendingTypes.value = [...types]
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
    const missing = pendingTypes.value.filter((type) => !typeCatalogs.has(type))
    await Promise.all(
      missing.map(async (type) => {
        try {
          const catalog = await fetchTypeCatalog(type)
          if (catalog) typeCatalogs.set(type, catalog)
        } catch {
          // keep missing so the union below stays atomic
        }
      }),
    )

    const failed = pendingTypes.value.filter((type) => !typeCatalogs.has(type))
    if (failed.length > 0) {
      filterError.value = { failedTypes: failed }
    } else {
      const union = new Map<string, PokemonSummary>()
      for (const type of pendingTypes.value) {
        const catalog = typeCatalogs.get(type)
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

  // ---------------------------------------------------------- Type preload
  const typePreloaded = ref(false)
  const typePreloadError = ref<TypeName[] | null>(null)
  const preloading = ref(false)
  const nameToTypes = ref(new Map<string, TypeName[]>())

  const PRELOAD_CONCURRENCY = 6

  function rebuildNameToTypes(): void {
    const map = new Map<string, TypeName[]>()
    for (const meta of TYPE_META) {
      const catalog = typeCatalogs.get(meta.name)
      if (!catalog) continue
      for (const entry of catalog.pokemon) {
        const list = map.get(entry.pokemon.name) ?? []
        if (!list.includes(meta.name)) list.push(meta.name)
        map.set(entry.pokemon.name, list)
      }
    }
    nameToTypes.value = map
  }

  /** Bounded fan-out over a list of types; resolves after every type settles. */
  async function fetchTypesBounded(types: TypeName[], failed: TypeName[]): Promise<void> {
    let index = 0
    const workers = Array.from({ length: Math.min(PRELOAD_CONCURRENCY, types.length) }, async () => {
      while (index < types.length) {
        const type = types[index]!
        index++
        try {
          const catalog = await fetchTypeCatalog(type)
          if (catalog) typeCatalogs.set(type, catalog)
          else failed.push(type)
        } catch {
          failed.push(type)
        }
      }
    })
    await Promise.all(workers)
  }

  /** Prefetch all 18 type catalogs once (shared cache, bounded fan-out). */
  async function preloadTypes(): Promise<void> {
    if (preloading.value || typePreloaded.value) return
    preloading.value = true
    typePreloadError.value = null
    const failed: TypeName[] = []
    const allTypes = TYPE_META.map((meta) => meta.name)
    await fetchTypesBounded(allTypes, failed)
    rebuildNameToTypes()
    typePreloaded.value = true
    if (failed.length > 0) typePreloadError.value = failed
    preloading.value = false
  }

  /** Re-issue only the types that failed the previous preload. */
  async function retryPreload(): Promise<void> {
    const failed = typePreloadError.value
    if (!failed || failed.length === 0 || preloading.value) return
    preloading.value = true
    typePreloadError.value = null
    const stillFailed: TypeName[] = []
    await fetchTypesBounded([...failed], stillFailed)
    rebuildNameToTypes()
    if (stillFailed.length > 0) typePreloadError.value = stillFailed
    preloading.value = false
  }

  /** Public lookup of a cached type catalog (populated by the preload/apply). */
  function typeCatalog(type: TypeName): TypeCatalogResponse | undefined {
    return typeCatalogs.get(type)
  }

  // ------------------------------------------------------ Detail + species
  const selectedDetail = ref<PokemonDetail | null>(null)
  const selectedSpecies = ref<PokemonDerivedSpecies | null>(null)
  const detailError = ref<string | null>(null)
  const detailNotFound = ref(false)
  const detailLoading = ref(false)
  const detailLoadingName = ref<string | null>(null)
  /** Store-level mirror of loaded entities so cached visits skip re-requests. */
  const detailByName = new Map<string, PokemonDetail>()
  const speciesById = new Map<number, PokemonSpecies>()

  /** Non-blocking species load; failure degrades the species-derived fields. */
  function hydrateSpecies(detail: PokemonDetail): void {
    const weaknessFor = (type: TypeName): TypeName[] => resolveWeaknesses(type, typeCatalogs.get(type))
    const cached = speciesById.get(detail.id)
    if (cached) {
      selectedSpecies.value = deriveSpecies(detail, cached, weaknessFor)
      return
    }
    void Promise.resolve(fetchPokemonSpecies(detail.id))
      .then((species) => {
        if (!species) return
        speciesById.set(detail.id, species)
        if (selectedDetail.value?.id === detail.id) {
          selectedSpecies.value = deriveSpecies(detail, species, weaknessFor)
        }
      })
      .catch(() => {
        if (selectedDetail.value?.id === detail.id) {
          selectedSpecies.value = deriveSpecies(detail, null, weaknessFor)
        }
      })
  }

  async function openDetail(name: string): Promise<void> {
    if (detailLoadingName.value === name) return
    const cached = detailByName.get(name)
    if (cached) {
      selectedDetail.value = cached
      detailError.value = null
      detailNotFound.value = false
      hydrateSpecies(cached)
      return
    }

    detailLoadingName.value = name
    detailLoading.value = true
    detailError.value = null
    detailNotFound.value = false
    selectedDetail.value = null
    selectedSpecies.value = null
    try {
      const detail = await fetchPokemonDetail(name)
      detailByName.set(name, detail)
      selectedDetail.value = detail
      hydrateSpecies(detail)
    } catch (error) {
      detailError.value = name
      detailNotFound.value = error instanceof Error && /\b404\b/.test(error.message)
    } finally {
      detailLoading.value = false
      detailLoadingName.value = null
    }
  }

  // -------------------------------------------------------------- Favorites
  const favorites = ref<FavoritePokemon[]>(loadFavorites())

  function isFavorite(name: string): boolean {
    return favorites.value.some((favorite) => favorite.name === name)
  }

  function toggleFavorite(pokemon: { name: string; id: number; imageUrl: string; types: TypeName[] }): void {
    if (isFavorite(pokemon.name)) {
      favorites.value = favorites.value.filter((favorite) => favorite.name !== pokemon.name)
    } else {
      favorites.value = [
        ...favorites.value,
        { name: pokemon.name, id: pokemon.id, imageUrl: pokemon.imageUrl, types: [...pokemon.types], addedAt: new Date().toISOString() },
      ]
    }
    saveFavorites(favorites.value)
  }

  function removeFavorite(name: string): void {
    favorites.value = favorites.value.filter((favorite) => favorite.name !== name)
    saveFavorites(favorites.value)
  }

  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    if (event.newValue === null) {
      favorites.value = []
      return
    }
    try {
      favorites.value = JSON.parse(event.newValue) as FavoritePokemon[]
    } catch {
      // corrupt cross-tab payload: keep the current list
    }
  })

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

    typePreloaded,
    typePreloadError,
    preloading,
    nameToTypes,
    preloadTypes,
    retryPreload,
    typeCatalog,

    selectedDetail,
    selectedSpecies,
    detailError,
    detailNotFound,
    detailLoading,
    openDetail,

    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  }
})
