/**
 * PokeAPI contracts and app constants.
 * Single source of truth for the API shapes consumed by services, store, and views.
 */

/** The 18 Pokémon types supported by the app (PokeAPI canonical names). */
export type TypeName =
  | 'grass'
  | 'fire'
  | 'water'
  | 'electric'
  | 'psychic'
  | 'poison'
  | 'normal'
  | 'bug'
  | 'fighting'
  | 'ground'
  | 'rock'
  | 'ice'
  | 'fairy'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'flying'

/** Minimal pokémon entry as returned by the list endpoint. */
export interface PokemonSummary {
  name: string
  url: string
}

/** Response of `GET /api/v2/pokemon` (paginated list). */
export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonSummary[]
}

/** Base stats extracted from a pokémon detail by `stat.name`. */
export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  'special-attack': number
  'special-defense': number
  speed: number
}

/** Full response of `GET /api/v2/pokemon/{name}`. */
export interface PokemonDetail {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: { name: TypeName } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { slot: number; ability: { name: string } }[]
  sprites: {
    front_default: string | null
    other: { 'official-artwork': { front_default: string | null } }
  }
  species: { url: string }
}

/** Response of `GET /api/v2/pokemon-species/{id}` (fields used by the app). */
export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string
    language: { name: string }
    version: { name: string }
  }[]
  genera: { genus: string; language: { name: string } }[]
  gender_rate: number
}

/** Snapshot of a favorite pokémon, persisted under `STORAGE_KEY`. */
export interface FavoritePokemon {
  name: string
  id: number
  imageUrl: string
  types: TypeName[]
  /** ISO 8601 timestamp of when it was added. */
  addedAt: string
}

/** Local metadata for a type: Spanish label, card color, icon asset, and the
 *  decorative Figma element drawn behind the card's pokémon sprite. */
export interface TypeMeta {
  name: TypeName
  esLabel: string
  color: string
  icon: string
  /** Decorative vector graphic (Figma Components > Elements) behind the sprite. */
  element: string
}

/** Response of `GET /api/v2/type/{type}` — full catalog, unpaginated. */
export interface TypeCatalogResponse {
  damage_relations: { double_damage_from: { name: string }[] }
  names: { language: { name: string }; name: string }[]
  pokemon: { slot: number; pokemon: PokemonSummary }[]
}

/** Fixed catalog page size (confirmed 20–30 range). */
export const PAGE_SIZE = 24

/** localStorage key for the favorites snapshot. */
export const STORAGE_KEY = 'pokemon-favorites'
