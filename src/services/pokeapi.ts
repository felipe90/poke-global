/**
 * PokeAPI service — the ONLY module allowed to call the 4 whitelisted endpoints:
 *   GET /pokemon?limit=24&offset=N
 *   GET /pokemon/{name}
 *   GET /pokemon-species/{id}
 *   GET /type/{type}
 * Each entity has an in-memory session cache; cache hits skip the network and
 * failed/404 requests are never cached.
 */
import { PAGE_SIZE } from '@/types/pokemon'
import type {
  PokemonDetail,
  PokemonListResponse,
  PokemonSpecies,
  PokemonStats,
  TypeCatalogResponse,
  TypeName,
} from '@/types/pokemon'

const BASE_URL = 'https://pokeapi.co/api/v2'

const detailCache = new Map<string, PokemonDetail>()
const speciesCache = new Map<number, PokemonSpecies>()
const typeCatalogCache = new Map<TypeName, TypeCatalogResponse>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status} ${url}`)
  }
  return (await response.json()) as T
}

/** Fetch one catalog page: `GET /pokemon?limit=24&offset={offset}`. */
export async function fetchPokemonPage(offset: number): Promise<PokemonListResponse> {
  return fetchJson<PokemonListResponse>(`${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`)
}

/** Fetch a pokémon detail by name (cached in memory by name). */
export async function fetchPokemonDetail(name: string): Promise<PokemonDetail> {
  const cached = detailCache.get(name)
  if (cached) return cached

  const detail = await fetchJson<PokemonDetail>(`${BASE_URL}/pokemon/${name}`)
  detailCache.set(name, detail)
  return detail
}

/** Fetch species info by id (cached in memory by id). */
export async function fetchPokemonSpecies(id: number): Promise<PokemonSpecies> {
  const cached = speciesCache.get(id)
  if (cached) return cached

  const species = await fetchJson<PokemonSpecies>(`${BASE_URL}/pokemon-species/${id}`)
  speciesCache.set(id, species)
  return species
}

/** Fetch a full type catalog (cached in memory by type). */
export async function fetchTypeCatalog(type: TypeName): Promise<TypeCatalogResponse> {
  const cached = typeCatalogCache.get(type)
  if (cached) return cached

  const catalog = await fetchJson<TypeCatalogResponse>(`${BASE_URL}/type/${type}`)
  typeCatalogCache.set(type, catalog)
  return catalog
}

/** Extract the six base stats from a detail's raw `stats` array. */
export function statsToPokemonStats(stats: PokemonDetail['stats']): PokemonStats {
  const result: PokemonStats = {
    hp: 0,
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0,
  }
  for (const entry of stats) {
    const name = entry.stat.name
    if (name in result) {
      result[name as keyof PokemonStats] = entry.base_stat
    }
  }
  return result
}

/** Official artwork URL (or null when absent). */
export function getOfficialArtwork(detail: PokemonDetail): string | null {
  return detail.sprites.other['official-artwork'].front_default
}

/**
 * Fixed share format — never includes species-derived fields:
 * `{name}, {types, slot order}, HP {hp}, Attack {attack}, Defense {defense}, Speed {speed}`
 */
export function buildShareText(detail: PokemonDetail): string {
  const types = detail.types.map((entry) => entry.type.name).join(', ')
  const stats = statsToPokemonStats(detail.stats)
  return `${detail.name}, ${types}, HP ${stats.hp}, Attack ${stats.attack}, Defense ${stats.defense}, Speed ${stats.speed}`
}
