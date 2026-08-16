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

  it('shows the official artwork image derived from the id with a descriptive alt', () => {
    const wrapper = mountCard({ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' })
    const image = wrapper.get('img')
    expect(image.attributes('src')).toContain('/25.png')
    expect(image.attributes('alt')).toBe('pikachu')
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
