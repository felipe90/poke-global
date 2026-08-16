import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildShareText,
  fetchPokemonDetail,
  fetchPokemonPage,
  fetchPokemonSpecies,
  fetchTypeCatalog,
  getOfficialArtwork,
  statsToPokemonStats,
} from '@/services/pokeapi'
import { PAGE_SIZE } from '@/types/pokemon'
import type { PokemonDetail, PokemonListResponse, PokemonSpecies, TypeCatalogResponse } from '@/types/pokemon'

const BASE_URL = 'https://pokeapi.co/api/v2'

/** Minimal fetch response stub (avoids depending on the jsdom Response global). */
function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response
}

function makeDetail(name: string, id: number, types: PokemonDetail['types'], stats: PokemonDetail['stats']): PokemonDetail {
  return {
    id,
    name,
    height: 4,
    weight: 60,
    types,
    stats,
    abilities: [{ slot: 1, ability: { name: 'static' } }],
    sprites: {
      front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      other: {
        'official-artwork': {
          front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        },
      },
    },
    species: { url: `${BASE_URL}/pokemon-species/${id}/` },
  }
}

const pikachuDetail = makeDetail(
  'pikachu',
  25,
  [{ slot: 1, type: { name: 'electric' } }],
  [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 55, stat: { name: 'attack' } },
    { base_stat: 40, stat: { name: 'defense' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
    { base_stat: 50, stat: { name: 'special-defense' } },
    { base_stat: 90, stat: { name: 'speed' } },
  ],
)

const bulbasaurDetail = makeDetail(
  'bulbasaur',
  1,
  [
    { slot: 1, type: { name: 'grass' } },
    { slot: 2, type: { name: 'poison' } },
  ],
  [
    { base_stat: 45, stat: { name: 'hp' } },
    { base_stat: 49, stat: { name: 'attack' } },
    { base_stat: 49, stat: { name: 'defense' } },
    { base_stat: 65, stat: { name: 'special-attack' } },
    { base_stat: 65, stat: { name: 'special-defense' } },
    { base_stat: 45, stat: { name: 'speed' } },
  ],
)

const pikachuSpecies: PokemonSpecies = {
  flavor_text_entries: [
    {
      flavor_text: 'Pikachu, el Pokémon Ratón. Tiene bolsas en sus mejillas donde almacena electricidad.',
      language: { name: 'es' },
      version: { name: 'yellow' },
    },
  ],
  genera: [{ genus: 'Pokémon Ratón', language: { name: 'es' } }],
  gender_rate: 4,
}

const electricCatalog: TypeCatalogResponse = {
  damage_relations: { double_damage_from: [{ name: 'ground' }] },
  pokemon: [
    { slot: 1, pokemon: { name: 'pikachu', url: `${BASE_URL}/pokemon/25/` } },
    { slot: 1, pokemon: { name: 'raichu', url: `${BASE_URL}/pokemon/26/` } },
  ],
}

const pageFixture: PokemonListResponse = {
  count: 1351,
  next: `${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=${PAGE_SIZE}`,
  previous: null,
  results: [{ name: 'bulbasaur', url: `${BASE_URL}/pokemon/1/` }],
}

describe('pokeapi service', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  describe('fetchPokemonPage', () => {
    it('requests limit=24&offset=N and returns the mapped response', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pageFixture))
      const page = await fetchPokemonPage(0)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=0`)
      expect(page.count).toBe(1351)
      expect(page.next).toBe(`${BASE_URL}/pokemon?limit=24&offset=24`)
      expect(page.results).toEqual([{ name: 'bulbasaur', url: `${BASE_URL}/pokemon/1/` }])
    })

    it('uses the provided offset directly', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pageFixture))
      await fetchPokemonPage(24)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=24`)
    })
  })

  describe('fetchPokemonDetail', () => {
    it('requests /pokemon/{name} and returns the detail', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuDetail))
      const detail = await fetchPokemonDetail('pikachu')

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon/pikachu`)
      expect(detail.id).toBe(25)
      expect(detail.types).toEqual([{ slot: 1, type: { name: 'electric' } }])
      expect(detail.species.url).toBe(`${BASE_URL}/pokemon-species/25/`)
    })

    it('serves a cached detail by name without a second fetch', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuDetail))

      const first = await fetchPokemonDetail('charmander')
      const second = await fetchPokemonDetail('charmander')

      expect(first).toBe(second)
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon/charmander`)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('never caches a 404 detail', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 404))

      await expect(fetchPokemonDetail('missing')).rejects.toThrow()

      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuDetail))
      const retry = await fetchPokemonDetail('missing')

      expect(retry.id).toBe(25)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('never caches a failed fetch (network error)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))

      await expect(fetchPokemonDetail('eevee')).rejects.toThrow('network down')

      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuDetail))
      const retry = await fetchPokemonDetail('eevee')

      expect(retry.name).toBe('pikachu')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchPokemonSpecies', () => {
    it('requests /pokemon-species/{id} and returns the species', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuSpecies))
      const species = await fetchPokemonSpecies(25)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon-species/25`)
      expect(species.gender_rate).toBe(4)
      expect(species.genera[0]?.genus).toBe('Pokémon Ratón')
    })

    it('serves a cached species by id without a second fetch', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuSpecies))

      const first = await fetchPokemonSpecies(26)
      const second = await fetchPokemonSpecies(26)

      expect(first).toBe(second)
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/pokemon-species/26`)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('never caches a failed species fetch', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))

      await expect(fetchPokemonSpecies(27)).rejects.toThrow('network down')

      fetchMock.mockResolvedValueOnce(jsonResponse(pikachuSpecies))
      const retry = await fetchPokemonSpecies(27)

      expect(retry.gender_rate).toBe(4)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchTypeCatalog', () => {
    it('requests /type/{type} and returns the catalog', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(electricCatalog))
      const catalog = await fetchTypeCatalog('electric')

      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/type/electric`)
      expect(catalog.pokemon.map((entry) => entry.pokemon.name)).toEqual(['pikachu', 'raichu'])
      expect(catalog.damage_relations.double_damage_from).toEqual([{ name: 'ground' }])
    })

    it('serves a cached catalog by type without a second fetch', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(electricCatalog))

      const first = await fetchTypeCatalog('fire')
      const second = await fetchTypeCatalog('fire')

      expect(first).toBe(second)
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/type/fire`)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('never caches a failed catalog fetch', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))

      await expect(fetchTypeCatalog('water')).rejects.toThrow('network down')

      fetchMock.mockResolvedValueOnce(jsonResponse(electricCatalog))
      const retry = await fetchTypeCatalog('water')

      expect(retry.pokemon.length).toBe(2)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('statsToPokemonStats', () => {
    it('extracts the six stats by stat name', () => {
      const stats = statsToPokemonStats(pikachuDetail.stats)

      expect(stats).toEqual({
        hp: 35,
        attack: 55,
        defense: 40,
        'special-attack': 50,
        'special-defense': 50,
        speed: 90,
      })
    })

    it('defaults missing stats to 0', () => {
      const stats = statsToPokemonStats([{ base_stat: 35, stat: { name: 'hp' } }])

      expect(stats).toEqual({
        hp: 35,
        attack: 0,
        defense: 0,
        'special-attack': 0,
        'special-defense': 0,
        speed: 0,
      })
    })
  })

  describe('getOfficialArtwork', () => {
    it('returns the official-artwork URL', () => {
      expect(getOfficialArtwork(pikachuDetail)).toBe(
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
      )
    })
  })

  describe('buildShareText', () => {
    it('formats pikachu exactly', () => {
      expect(buildShareText(pikachuDetail)).toBe(
        'pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90',
      )
    })

    it('formats bulbasaur with both types exactly', () => {
      expect(buildShareText(bulbasaurDetail)).toBe(
        'bulbasaur, grass, poison, HP 45, Attack 49, Defense 49, Speed 45',
      )
    })
  })
})
