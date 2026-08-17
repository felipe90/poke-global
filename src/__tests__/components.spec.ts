import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import TabBar from '@/components/TabBar.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import SearchBar from '@/components/SearchBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import ConstructionState from '@/components/ConstructionState.vue'
import PokeballLoader from '@/components/PokeballLoader.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import ShareButton from '@/components/ShareButton.vue'
import { usePokemonStore } from '@/stores/pokemon'
import type { PokemonDetail } from '@/types/pokemon'

const Stub = { template: '<div />' }

function makeRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'pokedex', component: Stub },
      { path: '/regions', name: 'regions', component: Stub },
      { path: '/favorites', name: 'favorites', component: Stub },
      { path: '/profile', name: 'profile', component: Stub },
      { path: '/pokemon/:name', name: 'pokemon-detail', component: Stub },
    ],
  })
  return router
}

async function mountTabBar(initialPath = '/') {
  const router = makeRouter()
  await router.push(initialPath)
  await router.isReady()
  const wrapper = mount(TabBar, { global: { plugins: [router] } })
  await router.isReady()
  return { router, wrapper }
}

describe('TabBar (3.2)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders exactly 4 items in order (Pokedex, Regiones, Favoritos, Perfil)', async () => {
    const { wrapper } = await mountTabBar()
    const labels = wrapper.findAll('a').map((el) => el.text())
    expect(labels).toEqual(['Pokedex', 'Regiones', 'Favoritos', 'Perfil'])
  })

  it('renders a <nav> landmark', async () => {
    const { wrapper } = await mountTabBar()
    expect(wrapper.get('nav').attributes('aria-label')).toBeTruthy()
  })

  it('marks the active item with aria-current="page"', async () => {
    const { wrapper } = await mountTabBar('/favorites')
    const active = wrapper.findAll('a').find((el) => el.attributes('aria-current') === 'page')
    expect(active?.text()).toBe('Favoritos')
  })

  it('styles active #0d47a1 and inactive #424242 via the active class', async () => {
    const { wrapper } = await mountTabBar('/favorites')
    const items = wrapper.findAll('a')
    expect(items[2]?.classes()).toContain('active')
    const inactive = items.filter((_, index) => index !== 2)
    for (const item of inactive) {
      expect(item.classes()).not.toContain('active')
    }
  })

  it('moves focus with arrow keys and activates the route', async () => {
    const router = makeRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(TabBar, { attachTo: document.body, global: { plugins: [router] } })
    await router.isReady()
    const links = wrapper.findAll('a')
    links[0]?.element.focus()
    await wrapper.get('nav').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(links[1]?.element)
    await links[1]?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/regions')
    wrapper.unmount()
  })

  it('binds each item to its route', async () => {
    const { wrapper } = await mountTabBar()
    const hrefs = wrapper.findAll('a').map((el) => el.attributes('href'))
    expect(hrefs).toEqual(['/', '/regions', '/favorites', '/profile'])
  })

  it('uses the icon assets as masked decorative icons (no inline SVG, no <img>)', async () => {
    const { wrapper } = await mountTabBar()
    const links = wrapper.findAll('nav a')
    for (const link of links) {
      const icon = link.find('.tab-item__icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-hidden')).toBe('true')
      expect(link.attributes('style')).toContain('--tab-icon')
      expect(link.find('svg').exists()).toBe(false)
      expect(link.find('img').exists()).toBe(false)
    }
  })

  it('maps four distinct Figma icons in order (house, globe, heart, user)', async () => {
    const { wrapper } = await mountTabBar()
    const links = wrapper.findAll('nav a')
    const sources = links.map((link) => link.attributes('style') ?? '')
    expect(sources).toHaveLength(4)
    // Each icon inlines as its own data URI; the four must differ and be non-empty.
    const unique = new Set(sources)
    expect(unique.size).toBe(4)
    for (const source of sources) {
      expect(source).toContain('--tab-icon: url("data:image/svg+xml')
    }
  })

  it('renders icon + label on every item', async () => {
    const { wrapper } = await mountTabBar()
    const links = wrapper.findAll('nav a')
    for (const link of links) {
      expect(link.find('.tab-item__icon').exists()).toBe(true)
      expect(link.find('.tab-item__label').exists()).toBe(true)
    }
  })
})

describe('TypeBadge (5.2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the Spanish label for a type from TYPE_META', () => {
    const wrapper = mount(TypeBadge, { props: { type: 'grass' } })
    expect(wrapper.text()).toContain('Planta')
  })

  it('applies the type color as the chip background', () => {
    const wrapper = mount(TypeBadge, { props: { type: 'fire' } })
    expect(wrapper.attributes('style')).toContain('rgb(255, 152, 0)')
  })

  it('shows the type icon in a white circle, decorative', () => {
    const wrapper = mount(TypeBadge, { props: { type: 'electric' } })
    const circle = wrapper.find('.type-badge__icon')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('style')).toContain('var(--surface-default)')
    const icon = circle.find('img')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('renders the API Spanish label and neutral background for an unmapped type', () => {
    const store = usePokemonStore()
    vi.spyOn(store, 'typeCatalog').mockReturnValue({
      damage_relations: { double_damage_from: [] },
      names: [{ language: { name: 'es' }, name: 'Stelar' }],
      pokemon: [],
    })
    const wrapper = mount(TypeBadge, { props: { type: 'stellar' as never } })
    expect(wrapper.text()).toContain('Stelar')
    expect(wrapper.attributes('style')).toContain('rgb(158, 158, 158)')
    expect(wrapper.find('img').exists()).toBe(false)
  })
})

describe('SearchBar (5.4)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an input with the exact placeholder and no visible label', () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('Buscar Pokémon...')
    expect(input.attributes('aria-label')).toBe('Buscar Pokémon')
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('renders a circular filter button with a search icon, emitting open-filter', async () => {
    const wrapper = mount(SearchBar)
    const button = wrapper.get('.search-bar__filter')
    expect(button.attributes('aria-label')).toBe('Abrir filtros')
    expect(button.find('img').exists()).toBe(true)
    await button.trigger('click')
    expect(wrapper.emitted('open-filter')).toHaveLength(1)
  })

  it('emits the query to store.searchFilter after the 300 ms debounce', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    const wrapper = mount(SearchBar)
    await wrapper.get('input').setValue('pika')
    expect(store.searchFilter).toBe('')
    await vi.advanceTimersByTime(300)
    await nextTick()
    expect(store.searchFilter).toBe('pika')
  })

  it('issues no API calls while searching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const wrapper = mount(SearchBar)
    await wrapper.get('input').setValue('bulbasaur')
    await vi.advanceTimersByTime(300)
    await nextTick()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('EmptyState (5.5)', () => {
  it('renders the exact Figma empty copy', () => {
    const wrapper = mount(EmptyState)
    expect(wrapper.text()).toContain('No has marcado ningún Pokémon como favorito')
    expect(wrapper.text()).toContain(
      'Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí.',
    )
  })

  it('renders the shared Magikarp illustration as decorative, without a CTA', () => {
    const wrapper = mount(EmptyState)
    expect(wrapper.find('img.state__illustration[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

describe('ErrorState (5.6)', () => {
  it('renders the exact error copy and a Reintentar CTA', () => {
    const wrapper = mount(ErrorState)
    expect(wrapper.text()).toContain('Algo salió mal...')
    expect(wrapper.text()).toContain(
      'No pudimos cargar la información en este momento. Verifica tu conexión o intenta nuevamente más tarde.',
    )
    expect(wrapper.text()).toContain('Reintentar')
  })

  it('is announced as an alert role', () => {
    const wrapper = mount(ErrorState)
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('renders the Magikarp illustration as decorative', () => {
    const wrapper = mount(ErrorState)
    expect(wrapper.find('img.state__illustration[aria-hidden="true"]').exists()).toBe(true)
  })

  it('emits retry when Reintentar is activated', async () => {
    const wrapper = mount(ErrorState)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('ConstructionState (5.7)', () => {
  it('renders the exact construction copy with Magikarp', () => {
    const wrapper = mount(ConstructionState)
    expect(wrapper.text()).toContain('¡Muy pronto disponible!')
    expect(wrapper.text()).toContain(
      'Estamos trabajando para traerte esta sección. Vuelve más adelante para descubrir todas las novedades.',
    )
    expect(wrapper.find('img.state__illustration').exists()).toBe(true)
  })

  it('renders no CTA button', () => {
    const wrapper = mount(ConstructionState)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('issues no network requests', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    mount(ConstructionState)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('PokeballLoader (5.9)', () => {
  it('renders the Loader.svg inlined as a data URI (no extra request)', () => {
    const wrapper = mount(PokeballLoader)
    const img = wrapper.get('img.pokeball-loader')
    expect(img.attributes('src')).toMatch(/^data:image\/svg\+xml/)
    expect(img.attributes('src')).toContain('viewBox')
  })

  it('is decorative (aria-hidden)', () => {
    const wrapper = mount(PokeballLoader)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})

describe('FavoriteButton (5.11)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function mountFavorite() {
    return mount(FavoriteButton, {
      props: {
        name: 'pikachu',
        id: 25,
        imageUrl: 'https://example.com/pikachu.png',
        types: ['electric'],
      },
    })
  }

  it('reflects the store favorite state in aria-pressed', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    const wrapper = mountFavorite()
    expect(wrapper.attributes('aria-pressed')).toBe('false')

    store.toggleFavorite({ name: 'pikachu', id: 25, imageUrl: 'https://example.com/pikachu.png', types: ['electric'] })
    await nextTick()
    expect(wrapper.attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('toggles favorites on activation', async () => {
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    const wrapper = mountFavorite()
    await wrapper.trigger('click')
    expect(store.isFavorite('pikachu')).toBe(true)
    expect(wrapper.attributes('aria-pressed')).toBe('true')
    await wrapper.trigger('click')
    expect(store.isFavorite('pikachu')).toBe(false)
    expect(wrapper.attributes('aria-pressed')).toBe('false')
  })

  it('swaps the heart mask and tints red when favorited', async () => {
    const wrapper = mountFavorite()
    const outline = wrapper.attributes('style') ?? ''
    const { usePokemonStore } = await import('@/stores/pokemon')
    const store = usePokemonStore()
    await store.toggleFavorite({ name: 'pikachu', id: 25, imageUrl: 'https://example.com/pikachu.png', types: ['electric'] })
    await nextTick()
    const solid = wrapper.attributes('style') ?? ''
    expect(solid).not.toBe(outline)
    expect(solid).toContain('--favorite-icon: url("data:image/svg+xml')
    expect(solid).toContain('var(--favorite-active)')
  })
})

describe('ShareButton (5.12)', () => {
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copies the exact fixed share text and shows success feedback', async () => {
    const writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const wrapper = mount(ShareButton, { props: { detail: pikachuDetail } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90')
    expect(wrapper.text()).toContain('Copiado')
  })

  it('shows a visible error when both copy strategies fail', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn<(data: string) => Promise<void>>().mockRejectedValue(new Error('denied')) },
    })
    document.execCommand = vi.fn<() => boolean>(() => false)
    const wrapper = mount(ShareButton, { props: { detail: pikachuDetail } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('No se pudo copiar')
    expect(wrapper.text()).not.toContain('Copiado')
  })

  it('never includes species-derived fields in the copied text', async () => {
    const writeText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const wrapper = mount(ShareButton, { props: { detail: pikachuDetail } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    const copied = writeText.mock.calls[0]?.[0] as string
    expect(copied).not.toMatch(/descripcion|categoria|genero|debilidades/i)
    expect(copied).toBe('pikachu, electric, HP 35, Attack 55, Defense 40, Speed 90')
  })
})
