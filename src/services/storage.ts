/**
 * Favorites persistence under `STORAGE_KEY`.
 * Corrupt JSON is discarded; if localStorage is unavailable or throws,
 * the module keeps an in-memory mirror so toggles keep working without crashing.
 */
import { STORAGE_KEY } from '@/types/pokemon'
import type { FavoritePokemon } from '@/types/pokemon'

/** In-memory mirror used only while localStorage is unavailable. */
let memoryFavorites: FavoritePokemon[] | null = null

/** Access localStorage defensively — the getter itself can throw (private mode, disabled). */
function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Read the stored favorites; returns [] when nothing valid is stored. */
export function loadFavorites(): FavoritePokemon[] {
  const storage = getStorage()
  if (storage === null) {
    return memoryFavorites ? [...memoryFavorites] : []
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    memoryFavorites = null
    return parsed as FavoritePokemon[]
  } catch {
    // Corrupt JSON or a read error: fall back to the last known in-memory state.
    return memoryFavorites ? [...memoryFavorites] : []
  }
}

/** Persist the favorites snapshot (full-array write, last-write-wins). */
export function saveFavorites(favorites: FavoritePokemon[]): void {
  const storage = getStorage()
  if (storage === null) {
    memoryFavorites = [...favorites]
    return
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    memoryFavorites = null
  } catch {
    memoryFavorites = [...favorites]
  }
}
