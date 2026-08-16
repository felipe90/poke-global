import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'

import PokemonDetailPanel from '@/components/PokemonDetailPanel.vue'
import { fetchTypeCatalog } from '@/services/pokeapi'
import { usePokemonStore } from '@/stores/pokemon'
import type { PokemonDetail, PokemonSpecies, TypeName } from '@/types/pokemon'

vi.mock('@/services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/pokeapi')>()
  return {
    ...actual,
    fetchTypeCatalog: vi.fn<typeof actual.fetchTypeCatalog>(),
  }
})

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.mocked(fetchTypeCatalog).mockReset()
})

/** Seed the store's type catalog cache through the preload path (API truth). */
async function preloadWith(
  weaknessByType: Record<string, string[]>,
  labelByType: Record<string, string> = {},
): Promise<void> {
  vi.mocked(fetchTypeCatalog).mockImplementation((type: TypeName) =>
    Promise.resolve({
      damage_relations: { double_damage_from: (weaknessByType[type] ?? []).map((name) => ({ name })) },
      names: [{ language: { name: 'es' }, name: labelByType[type] ?? type }],
      pokemon: [],
    }),
  )
  await usePokemonStore().preloadTypes()
}

const bulbasaurDetail: PokemonDetail = {
  id: 1,
  name: 'bulbasaur',
  height: 7,
  weight: 69,
  types: [
    { slot: 1, type: { name: 'grass' } },
    { slot: 2, type: { name: 'poison' } },
  ],
  stats: [
    { base_stat: 45, stat: { name: 'hp' } },
    { base_stat: 49, stat: { name: 'attack' } },
    { base_stat: 49, stat: { name: 'defense' } },
    { base_stat: 65, stat: { name: 'special-attack' } },
    { base_stat: 65, stat: { name: 'special-defense' } },
    { base_stat: 45, stat: { name: 'speed' } },
  ],
  abilities: [{ slot: 1, ability: { name: 'overgrow' } }],
  sprites: {
    front_default: 'https://example.com/bulbasaur.png',
    other: { 'official-artwork': { front_default: 'https://example.com/bulbasaur-art.png' } },
  },
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1' },
}

const bulbasaurSpecies: PokemonSpecies = {
  flavor_text_entries: [
    {
      flavor_text: 'Una semilla\n\nestá plantada en su espalda\fdesde que nace.',
      language: { name: 'es' },
      version: { name: 'red' },
    },
  ],
  genera: [
    { genus: 'Pokémon Semilla', language: { name: 'es' } },
    { genus: 'Seed Pokémon', language: { name: 'en' } },
  ],
  gender_rate: 1,
}

const pikachuDetail: PokemonDetail = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  types: [{ slot: 1, type: { name: 'electric' } }],
  stats: [
    { base_stat: 35, stat: { name: 'hp' } },
    { base_stat: 55, stat: { name: 'attack' } },
    { base_stat: 40, stat: { name: 'defense' } },
    { base_stat: 50, stat: { name: 'special-attack' } },
    { base_stat: 50, stat: { name: 'special-defense' } },
    { base_stat: 90, stat: { name: 'speed' } },
  ],
  abilities: [{ slot: 1, ability: { name: 'static' } }],
  sprites: {
    front_default: null,
    other: { 'official-artwork': { front_default: null } },
  },
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/25' },
}

function mountPanel(
  detail: PokemonDetail,
  species: PokemonSpecies | null = bulbasaurSpecies,
  nav: { prevName?: string | null; nextName?: string | null } = {},
) {
  return mount(PokemonDetailPanel, {
    props: { detail, species, ...nav },
    global: { plugins: [pinia] },
  })
}

function statValue(wrapper: ReturnType<typeof mount>, label: string): string {
  const row = wrapper
    .findAll('.detail-panel__stat-row')
    .find((el) => el.get('.detail-panel__stat-label').text() === label)
  expect(row, `stat row ${label} not found`).toBeTruthy()
  return row!.get('.detail-panel__stat-value').text()
}

describe('PokemonDetailPanel (5.10)', () => {
  it('renders Nº padded, name, and the front_default sprite', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.text()).toContain('Nº001')
    expect(wrapper.text()).toContain('Bulbasaur')
    const image = wrapper.get('img[alt="bulbasaur"]')
    expect(image.attributes('src')).toBe('https://example.com/bulbasaur.png')
  })

  it('renders all derived fields: description, Peso, Altura, Categoría, Habilidad, Género', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.text()).toContain('Una semilla está plantada en su espalda desde que nace.')
    expect(wrapper.text()).toContain('Peso')
    expect(wrapper.text()).toContain('6,9 kg')
    expect(wrapper.text()).toContain('Altura')
    expect(wrapper.text()).toContain('0,7 m')
    expect(wrapper.text()).toContain('Categoría')
    expect(wrapper.text()).toContain('Pokémon Semilla')
    expect(wrapper.text()).toContain('Habilidad')
    expect(wrapper.text()).toContain('Overgrow')
    expect(wrapper.text()).toContain('Género')
    expect(wrapper.text()).toContain('87,5% / 12,5%')
  })

  it('renders genderless pokémon as Sin género', () => {
    const genderlessSpecies: PokemonSpecies = {
      ...bulbasaurSpecies,
      gender_rate: -1,
    }
    const wrapper = mountPanel(bulbasaurDetail, genderlessSpecies)
    expect(wrapper.text()).toContain('Sin género')
  })

  it('renders Debilidades chips from the API catalog union in chart order', async () => {
    await preloadWith(
      {
        grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
        poison: ['ground', 'psychic'],
      },
      { grass: 'Planta', poison: 'Veneno', fire: 'Fuego', ice: 'Hielo', flying: 'Volador', bug: 'Bicho', ground: 'Tierra', psychic: 'Psíquico' },
    )
    const wrapper = mountPanel(bulbasaurDetail)
    const chips = wrapper.findAll('.type-badge').map((el) => el.text())
    expect(chips).toEqual(['Planta', 'Veneno', 'Fuego', 'Hielo', 'Veneno', 'Volador', 'Bicho', 'Tierra', 'Psíquico'])
  })

  it('renders types ordered by slot (Planta before Veneno)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const badges = wrapper.findAll('.type-badge').map((el) => el.text())
    expect(badges.slice(0, 2)).toEqual(['Planta', 'Veneno'])
  })

  it('renders all six base stats with their API values', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(statValue(wrapper, 'HP')).toBe('45')
    expect(statValue(wrapper, 'Attack')).toBe('49')
    expect(statValue(wrapper, 'Defense')).toBe('49')
    expect(statValue(wrapper, 'Sp. Atk')).toBe('65')
    expect(statValue(wrapper, 'Sp. Def')).toBe('65')
    expect(statValue(wrapper, 'Speed')).toBe('45')
  })

  it('renders pikachu stat values from the API base_stat', () => {
    const wrapper = mountPanel(pikachuDetail, null)
    expect(statValue(wrapper, 'HP')).toBe('35')
    expect(statValue(wrapper, 'Attack')).toBe('55')
    expect(statValue(wrapper, 'Defense')).toBe('40')
    expect(statValue(wrapper, 'Speed')).toBe('90')
  })

  it('degrades species-derived fields to — when species is unavailable', () => {
    const wrapper = mountPanel(pikachuDetail, null)
    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).toContain('Peso')
    expect(wrapper.text()).toContain('6,0 kg')
  })

  it('hosts FavoriteButton and ShareButton', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.favorite-button').exists()).toBe(true)
    expect(wrapper.find('.share-button .app-button').exists()).toBe(true)
  })

  it('emits toggleFavorite and share when those buttons are activated', async () => {
    const wrapper = mountPanel(bulbasaurDetail)
    await wrapper.find('.favorite-button').trigger('click')
    await wrapper.find('.share-button .app-button').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('toggleFavorite')).toHaveLength(1)
    expect(wrapper.emitted('share')).toHaveLength(1)
  })

  it('renders the header circle in the first type color (grass #8bc34a)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const circle = wrapper.get('.detail-header__circle')
    expect((circle.element as HTMLElement).style.backgroundColor).toBe('rgb(139, 195, 74)')
  })

  it('renders the header circle in the first type color for a different type (electric #f7d02c)', () => {
    const wrapper = mountPanel(pikachuDetail, null)
    const circle = wrapper.get('.detail-header__circle')
    expect((circle.element as HTMLElement).style.backgroundColor).toBe('rgb(247, 208, 44)')
  })

  it('renders the sprite inside the header, on top of the circle', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const header = wrapper.find('.detail-header')
    expect(header.exists()).toBe(true)
    const artwork = header.find('.detail-header__artwork')
    expect(artwork.exists()).toBe(true)
    expect(artwork.attributes('src')).toBe('https://example.com/bulbasaur.png')
    expect(header.find('.detail-header__circle').exists()).toBe(true)
  })

  it('emits back when the header back arrow is activated', async () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const back = wrapper.get('.detail-header__back')
    expect(back.attributes('aria-label')).toBe('Volver')
    await back.trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('renders circular Próximo/Anterior nav buttons that emit prev and next', async () => {
    const wrapper = mountPanel(bulbasaurDetail, bulbasaurSpecies, { prevName: 'charmander', nextName: 'ivysaur' })
    const prev = wrapper.get('.nav-prev')
    const next = wrapper.get('.nav-next')
    expect(prev.attributes('disabled')).toBeUndefined()
    expect(next.attributes('disabled')).toBeUndefined()
    await prev.trigger('click')
    await next.trigger('click')
    expect(wrapper.emitted('prev')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('disables the nav buttons at the bounds (no prev / no next)', () => {
    const atStart = mountPanel(bulbasaurDetail, bulbasaurSpecies, { prevName: null, nextName: 'ivysaur' })
    expect(atStart.get('.nav-prev').attributes('disabled')).toBeDefined()
    expect(atStart.get('.nav-next').attributes('disabled')).toBeUndefined()

    const atEnd = mountPanel(bulbasaurDetail, bulbasaurSpecies, { prevName: 'charmander', nextName: null })
    expect(atEnd.get('.nav-prev').attributes('disabled')).toBeUndefined()
    expect(atEnd.get('.nav-next').attributes('disabled')).toBeDefined()
  })

  it('groups characteristics in the Figma 2-column rows (Peso|Altura, Categoría|Habilidad, Género)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const rows = wrapper.findAll('.detail-characteristics__row')
    expect(rows.map((row) => row.findAll('dt').map((el) => el.text()))).toEqual([
      ['Peso', 'Altura'],
      ['Categoría', 'Habilidad'],
      ['Género'],
    ])
  })

  it('renders the description above a separator line', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.detail-description').text()).toContain(
      'Una semilla está plantada en su espalda desde que nace.',
    )
    expect(wrapper.find('.detail-divider').exists()).toBe(true)
  })
})
