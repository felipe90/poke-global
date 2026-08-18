import type { Page } from '@playwright/test'

/**
 * Deterministic PokeAPI fixtures + route interception for e2e tests.
 * Every test intercepts ALL /api/v2/** requests so the suite never depends
 * on the live PokeAPI (fast, reproducible, works offline/CI).
 */

const BASE = 'https://pokeapi.co/api/v2'

export interface FakePokemon {
  name: string
  id: number
  types: string[]
}

/** Small deterministic roster used across the e2e suite. */
export const ROSTER: FakePokemon[] = [
  { name: 'bulbasaur', id: 1, types: ['grass', 'poison'] },
  { name: 'charmander', id: 4, types: ['fire'] },
  { name: 'squirtle', id: 7, types: ['water'] },
  { name: 'pikachu', id: 25, types: ['electric'] },
]

function pageResponse(offset: number): Record<string, unknown> {
  const sliced = ROSTER.slice(offset, offset + 24)
  const count = ROSTER.length
  const next = offset + 24 < count ? `${BASE}/pokemon?limit=24&offset=${offset + 24}` : null
  return {
    count,
    next,
    previous: offset === 0 ? null : `${BASE}/pokemon?limit=24&offset=${offset - 24}`,
    results: sliced.map((p) => ({ name: p.name, url: `${BASE}/pokemon/${p.id}/` })),
  }
}

function detailResponse(p: FakePokemon): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    height: 7,
    weight: 69,
    types: p.types.map((t, i) => ({ slot: i + 1, type: { name: t } })),
    stats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } },
      { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } },
      { base_stat: 45, stat: { name: 'speed' } },
    ],
    abilities: [{ slot: 1, ability: { name: 'overgrow', url: `${BASE}/ability/65/` } }],
    sprites: {
      front_default: `https://example.com/${p.name}.png`,
      other: {
        'official-artwork': { front_default: `https://example.com/${p.name}-art.png` },
        showdown: { front_default: `https://example.com/${p.name}.gif` },
      },
    },
    species: { url: `${BASE}/pokemon-species/${p.id}/` },
  }
}

function speciesResponse(p: FakePokemon): Record<string, unknown> {
  return {
    flavor_text_entries: [
      { flavor_text: 'Una semilla\n\nestá plantada en su espalda.', language: { name: 'es' }, version: { name: 'red' } },
    ],
    genera: [{ genus: `Pokémon ${p.name}`, language: { name: 'es' } }],
    gender_rate: 1,
  }
}

function typeResponse(type: string): Record<string, unknown> {
  const pokemon = ROSTER.filter((p) => p.types.includes(type)).map((p) => ({
    pokemon: { name: p.name, url: `${BASE}/pokemon/${p.id}/` },
    slot: 1,
  }))
  return {
    damage_relations: {
      double_damage_from: [{ name: 'water' }],
    },
    names: [{ name: type, language: { name: 'es' } }],
    pokemon,
  }
}

function abilityResponse(): Record<string, unknown> {
  return {
    name: 'overgrow',
    names: [
      { name: 'Espesura', language: { name: 'es' } },
      { name: 'Overgrow', language: { name: 'en' } },
    ],
  }
}

function findByName(name: string): FakePokemon | undefined {
  return ROSTER.find((p) => p.name === name)
}

/** Intercept and fulfill every /api/v2/** request with the deterministic fixtures. */
export async function mockApiSuccess(page: Page): Promise<void> {
  await page.route('**/api/v2/**', (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname

    if (path === '/api/v2/pokemon') {
      const offset = Number(url.searchParams.get('offset') ?? '0')
      return route.fulfill({ json: pageResponse(offset) })
    }
    if (path.startsWith('/api/v2/pokemon/')) {
      const name = path.split('/')[4]
      const p = findByName(name)
      if (p) return route.fulfill({ json: detailResponse(p) })
      return route.fulfill({ status: 404, json: {} })
    }
    if (path.startsWith('/api/v2/pokemon-species/')) {
      const id = Number(path.split('/')[4])
      const p = ROSTER.find((r) => r.id === id)
      if (p) return route.fulfill({ json: speciesResponse(p) })
      return route.fulfill({ status: 404, json: {} })
    }
    if (path.startsWith('/api/v2/type/')) {
      const type = path.split('/')[4]
      return route.fulfill({ json: typeResponse(type) })
    }
    if (path.startsWith('/api/v2/ability/')) {
      return route.fulfill({ json: abilityResponse() })
    }
    return route.fulfill({ status: 200, json: {} })
  })
}

/** Intercept and fail every /api/v2/** request (network failure / 500). */
export async function mockApiFailure(page: Page): Promise<void> {
  await page.route('**/api/v2/**', (route) => route.fulfill({ status: 500, json: {} }))
}

/** Run the fixed Splash → Onboarding → Empecemos flow and land on the target route. */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar' }).waitFor({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Empecemos' }).click()
}

/** Onboarding then wait for the main list to render its pokémon cards. */
export async function gotoList(page: Page): Promise<void> {
  await completeOnboarding(page)
  await page.locator('.pokedex-list-view').waitFor()
  await page.locator('.pokemon-card').first().waitFor({ timeout: 10_000 })
}
