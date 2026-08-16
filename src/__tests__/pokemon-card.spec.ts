import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import { mount } from '@vue/test-utils'

import PokemonCard from '@/components/PokemonCard.vue'
import type { PokemonSummary } from '@/types/pokemon'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  localStorage.clear()
})

function mountCard(summary: PokemonSummary, context?: string[]) {
  return mount(PokemonCard, {
    props: { summary, context },
    global: { plugins: [pinia] },
  })
}

describe('PokemonCard (5.1)', () => {
  it('renders Nº as a 3-digit padded id extracted from the summary URL', () => {
    const wrapper = mountCard({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
    expect(wrapper.text()).toContain('Nº001')
  })

  it('pads ids that already have two digits and keeps three+ digits intact', () => {
    const two = mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })
    const three = mountCard({ name: 'mew', url: 'https://pokeapi.co/api/v2/pokemon/151/' })
    expect(two.text()).toContain('Nº025')
    expect(three.text()).toContain('Nº151')
  })

  it('renders the pokémon name capitalized', () => {
    const wrapper = mountCard({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
    expect(wrapper.text()).toContain('Bulbasaur')
  })

  it('reads the type badges synchronously from the store nameToTypes map', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    store.nameToTypes = new Map([['bulbasaur', ['grass', 'poison']]])

    const wrapper = mountCard({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
    expect(wrapper.text()).toContain('Planta')
    expect(wrapper.text()).toContain('Veneno')
    expect(wrapper.findAll('.type-badge')).toHaveLength(2)
  })

  it('applies the type color as the card background from the map', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    store.nameToTypes = new Map([['bulbasaur', ['grass', 'poison']]])

    const wrapper = mountCard({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
    expect(wrapper.attributes('style')).toContain('rgb(139, 195, 74)')
  })

  it('renders Nº + name without chips when the type map has no entry (preload error)', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    store.nameToTypes = new Map()

    const wrapper = mountCard({ name: 'missingmon', url: 'https://pokeapi.co/api/v2/pokemon/999/' })
    expect(wrapper.text()).toContain('Nº999')
    expect(wrapper.text()).toContain('Missingmon')
    expect(wrapper.findAll('.type-badge')).toHaveLength(0)
  })

  it('issues zero network requests when rendering a card from the preloaded map', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    store.nameToTypes = new Map([['pikachu', ['electric']]])

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('shows the front_default sprite image derived from the id with a descriptive alt', () => {
    const wrapper = mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })
    const image = wrapper.get('.pokemon-card__image')
    expect(image.attributes('src')).toContain('/25.png')
    expect(image.attributes('alt')).toBe('pikachu')
  })

  it('renders a favorite control whose aria-pressed reflects the store state', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    const wrapper = mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })

    const button = wrapper.get('.favorite-button')
    expect(button.attributes('aria-pressed')).toBe('false')

    store.toggleFavorite({ name: 'pikachu', id: 25, imageUrl: 'https://example.com/25.png', types: ['electric'] })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.favorite-button').attributes('aria-pressed')).toBe('true')
  })

  it('toggles a snapshot favorite from the card without navigating to detail', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    store.nameToTypes = new Map([['bulbasaur', ['grass', 'poison']]])

    const wrapper = mountCard({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
    await wrapper.get('.favorite-button').trigger('click')

    expect(store.isFavorite('bulbasaur')).toBe(true)
    const favorite = store.favorites[0]
    expect(favorite).toMatchObject({
      name: 'bulbasaur',
      id: 1,
      types: ['grass', 'poison'],
    })
    expect(favorite?.imageUrl).toContain('/1.png')
    expect(typeof favorite?.addedAt).toBe('string')
    expect(wrapper.emitted('navigate')).toBeUndefined()

    await wrapper.get('.favorite-button').trigger('click')
    expect(store.isFavorite('bulbasaur')).toBe(false)
  })

  it('sets the nav context and emits navigate + activate on activation', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()

    const wrapper = mountCard(
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      ['bulbasaur', 'ivysaur', 'venusaur'],
    )
    await wrapper.trigger('click')

    expect(store.contextNames).toEqual(['bulbasaur', 'ivysaur', 'venusaur'])
    expect(wrapper.emitted('navigate')).toHaveLength(1)
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['bulbasaur'])
    expect(wrapper.emitted('activate')?.[0]).toEqual(['bulbasaur'])
  })

  it('emits navigate without a context prop (deep-link / no list context)', async () => {
    const wrapper = mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('navigate')).toHaveLength(1)
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['pikachu'])
  })
})
