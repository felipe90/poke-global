import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

type RouterModule = typeof import('@/router')

let mod: RouterModule

async function freshRouter(): Promise<RouterModule> {
  vi.resetModules()
  const m = await import('@/router')
  return m
}

describe('router — route table + cold-load guard (3.1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.history.replaceState({}, '', '/')
  })

  it('registers the exact route table', async () => {
    mod = await freshRouter()
    const paths = mod.default
      .getRoutes()
      .map((route) => route.path)
      .sort()
    expect(paths).toEqual(['/', '/favorites', '/onboarding', '/pokemon/:name', '/profile', '/regions', '/splash'])
  })

  it('starts with flowComplete false on module load', async () => {
    mod = await freshRouter()
    expect(mod.flowComplete.value).toBe(false)
  })

  it('redirects the first app navigation to /splash and stashes the target', async () => {
    mod = await freshRouter()
    await mod.default.push('/favorites')
    expect(mod.default.currentRoute.value.path).toBe('/splash')
    expect(mod.pendingTarget.value).toBe('/favorites')
    expect(mod.flowComplete.value).toBe(false)
  })

  it('allows splash and onboarding through before the flow completes', async () => {
    mod = await freshRouter()
    await mod.default.push('/splash')
    expect(mod.default.currentRoute.value.path).toBe('/splash')
    await mod.default.push('/onboarding')
    expect(mod.default.currentRoute.value.path).toBe('/onboarding')
    expect(mod.pendingTarget.value).toBeNull()
  })

  it('no app route is reachable before the flow completes', async () => {
    mod = await freshRouter()
    for (const path of ['/', '/regions', '/favorites', '/profile', '/pokemon/pikachu']) {
      await mod.default.push(path)
      expect(mod.default.currentRoute.value.path).toBe('/splash')
    }
    expect(mod.flowComplete.value).toBe(false)
  })

  it('after Empecemos the flag flips and the router resumes to the stashed target', async () => {
    mod = await freshRouter()
    await mod.default.push('/favorites')
    expect(mod.default.currentRoute.value.path).toBe('/splash')
    await mod.completeOnboarding()
    expect(mod.flowComplete.value).toBe(true)
    expect(mod.default.currentRoute.value.path).toBe('/favorites')
  })

  it('deep-link /favorites → splash → onboarding → /favorites', async () => {
    mod = await freshRouter()
    await mod.default.push('/favorites')
    expect(mod.default.currentRoute.value.path).toBe('/splash')
    await mod.default.push('/onboarding')
    expect(mod.default.currentRoute.value.path).toBe('/onboarding')
    await mod.completeOnboarding()
    expect(mod.default.currentRoute.value.path).toBe('/favorites')
  })

  it('resumes to / by default when no target was stashed', async () => {
    mod = await freshRouter()
    await mod.default.push('/onboarding')
    await mod.completeOnboarding()
    expect(mod.default.currentRoute.value.path).toBe('/')
  })
})
