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
  abilities: [{ slot: 1, ability: { name: 'overgrow', url: 'https://pokeapi.co/api/v2/ability/1/' } }],
  sprites: {
    front_default: 'https://example.com/bulbasaur.png',
    other: {
      'official-artwork': { front_default: 'https://example.com/bulbasaur-art.png' },
      showdown: { front_default: 'https://example.com/bulbasaur.gif' },
    },
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
  abilities: [{ slot: 1, ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/1/' } }],
  sprites: {
    front_default: null,
    other: {
      'official-artwork': { front_default: null },
      showdown: { front_default: null },
    },
  },
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/25' },
}

function mountPanel(
  detail: PokemonDetail,
  species: PokemonSpecies | null = bulbasaurSpecies,
) {
  return mount(PokemonDetailPanel, {
    props: { detail, species },
    global: { plugins: [pinia] },
  })
}

describe('PokemonDetailPanel (5.10)', () => {
  it('renders Nº padded, name, and the animated showdown sprite (GIF)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.text()).toContain('Nº001')
    expect(wrapper.text()).toContain('Bulbasaur')
    const image = wrapper.get('img[alt="bulbasaur"]')
    expect(image.attributes('src')).toBe('https://example.com/bulbasaur.gif')
  })

  it('renders all derived fields: description, Peso, Altura, Categoría, Habilidad', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.text()).toContain('Una semilla está plantada en su espalda desde que nace.')
    expect(wrapper.text()).toContain('Peso')
    expect(wrapper.text()).toContain('6,9 kg')
    expect(wrapper.text()).toContain('Altura')
    expect(wrapper.text()).toContain('0,7 m')
    expect(wrapper.text()).toContain('Categoría')
    expect(wrapper.text()).toContain('SEMILLA')
    expect(wrapper.text()).toContain('Habilidad')
    expect(wrapper.text()).toContain('Overgrow')
    // Property icons come from the Figma assets (labels uppercase via CSS,
    // verified visually in the browser — jsdom does not apply scoped styles).
    const boxes = wrapper.findAll('.property-box')
    expect(boxes.map((b) => b.find('.property-box__label').text())).toEqual([
      'Peso',
      'Altura',
      'Categoría',
      'Habilidad',
    ])
    expect(boxes.map((b) => b.find('.property-box__icon').attributes('src'))).toEqual([
      expect.stringContaining('M8%202.5'),
      expect.stringContaining('M13.125%2013.0621'),
      expect.stringContaining('M2.66699%208.75195'),
      expect.stringContaining('M8.00016%2014.6667'),
    ])
  })

  it('renders the gender bar with male/female percentages', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.gender-bar').exists()).toBe(true)
    expect(wrapper.text()).toContain('87,5%')
    expect(wrapper.text()).toContain('12,5%')
    const segments = wrapper.findAll('.gender-bar__segment')
    expect(segments).toHaveLength(1)
    expect(segments[0]?.attributes('style')).toContain('87.5%')
    // Figma styling (colors/uppercase/radius verified visually in the
    // browser — jsdom does not apply scoped styles).
    const icons = wrapper.findAll('.gender-bar__icon')
    expect(icons).toHaveLength(2)
    // Vite inlines SVGs as data URIs; distinguish by path content.
    expect(icons[0]?.attributes('src')).toContain('M7.125%208.24963')
    expect(icons[1]?.attributes('src')).toContain('M13.1248%207.12512')
  })

  it('renders the gender bar as Sin género for genderless pokémon', () => {
    const genderlessSpecies: PokemonSpecies = {
      ...bulbasaurSpecies,
      gender_rate: -1,
    }
    const wrapper = mountPanel(bulbasaurDetail, genderlessSpecies)
    expect(wrapper.find('.gender-bar').exists()).toBe(true)
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

  it('renders no stats section (not part of the Figma detail)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.detail-stats').exists()).toBe(false)
  })

  it('renders no Próximo/Anterior nav buttons (not part of the Figma detail)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.detail-header__nav').exists()).toBe(false)
    expect(wrapper.find('.nav-button').exists()).toBe(false)
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

  it('renders the header background in the first type color (grass #8bc34a)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const background = wrapper.get('.detail-header__background')
    expect((background.element as HTMLElement).style.backgroundColor).toBe('rgb(139, 195, 74)')
  })

  it('renders the header background in the first type color for a different type (electric #f7d02c)', () => {
    const wrapper = mountPanel(pikachuDetail, null)
    const background = wrapper.get('.detail-header__background')
    expect((background.element as HTMLElement).style.backgroundColor).toBe('rgb(247, 208, 44)')
  })

  it('renders the type element with the white gradient mask inside its centered wrap', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const wrap = wrapper.get('.detail-header__element-wrap')
    const element = wrap.find('.detail-header__element')
    expect(element.exists()).toBe(true)
    expect(element.attributes('style')).toContain('--element-icon: url')
  })

  it('renders the sprite inside the header, independent of the background container', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const header = wrapper.find('.detail-header')
    expect(header.exists()).toBe(true)
    const artwork = header.find('.detail-header__artwork')
    expect(artwork.exists()).toBe(true)
    expect(artwork.attributes('src')).toBe('https://example.com/bulbasaur.gif')
    expect(header.find('.detail-header__background').exists()).toBe(true)
    // Independent: the artwork is a direct child of the header, not of the background.
    expect(artwork.element.parentElement?.className).toContain('detail-header')
    expect(artwork.element.parentElement?.className).not.toContain('detail-header__background')
  })

  it('falls back to the official artwork when the animated sprite is missing', () => {
    const noGif: PokemonDetail = {
      ...pikachuDetail,
      sprites: {
        front_default: null,
        other: {
          'official-artwork': { front_default: 'https://example.com/pikachu-art.png' },
          showdown: { front_default: null },
        },
      },
    }
    const wrapper = mountPanel(noGif)
    const artwork = wrapper.find('.detail-header__artwork')
    expect(artwork.attributes('src')).toBe('https://example.com/pikachu-art.png')
  })

  it('emits back when the header back arrow is activated', async () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const back = wrapper.get('.detail-header__back')
    expect(back.attributes('aria-label')).toBe('Volver')
    await back.trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('groups characteristics in the Figma 2-column rows (Peso|Altura, Categoría|Habilidad)', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    const rows = wrapper.findAll('.detail-characteristics__row')
    expect(rows.map((row) => row.findAll('.property-box__label').map((el) => el.text()))).toEqual([
      ['Peso', 'Altura'],
      ['Categoría', 'Habilidad'],
    ])
  })

  it('renders the gender bar after characteristics and before Debilidades', async () => {
    await preloadWith(
      {
        grass: ['fire'],
      },
      { grass: 'Planta' },
    )
    const wrapper = mountPanel(bulbasaurDetail)
    const body = wrapper.get('.detail-body')
    const children = Array.from(body.element.children)
    const names = children.map((el) => el.className)
    const cIndex = names.findIndex((n) => n.includes('detail-characteristics'))
    const gIndex = names.findIndex((n) => n.includes('gender-bar'))
    const wIndex = names.findIndex((n) => n.includes('detail-weaknesses'))
    expect(cIndex).toBeGreaterThanOrEqual(0)
    expect(gIndex).toBeGreaterThan(cIndex)
    expect(wIndex).toBeGreaterThan(gIndex)
  })

  it('renders the description above a separator line', () => {
    const wrapper = mountPanel(bulbasaurDetail)
    expect(wrapper.find('.detail-description').text()).toContain(
      'Una semilla está plantada en su espalda desde que nace.',
    )
    expect(wrapper.find('.separator').exists()).toBe(true)
  })
})
