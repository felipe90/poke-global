import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

import TabBar from '@/components/TabBar.vue'

const Stub = { template: '<div />' }

function makeRouter(initialPath: string): Router {
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
  const router = makeRouter(initialPath)
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

  it('styles active #0d47a1 and inactive #424242', async () => {
    const { wrapper } = await mountTabBar('/favorites')
    const items = wrapper.findAll('a')
    expect(items[2]?.attributes('style')).toContain('rgb(13, 71, 161)')
    items.forEach((item, index) => {
      if (index !== 2) expect(item.attributes('style')).toContain('rgb(66, 66, 66)')
    })
  })

  it('rounds the top corners 16px and applies the top shadow', async () => {
    const { wrapper } = await mountTabBar()
    const style = wrapper.get('nav').attributes('style') ?? ''
    expect(style).toContain('16px')
    expect(style).toContain('0 -1px 3px rgba(0,0,0,0.12)')
  })

  it('moves focus with arrow keys and activates the route', async () => {
    const router = makeRouter('/')
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
})
