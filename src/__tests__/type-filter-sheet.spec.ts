import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import TypeFilterSheet from '@/components/TypeFilterSheet.vue'
import { TYPE_META } from '@/data/types'
import { fetchTypeCatalog } from '@/services/pokeapi'
import type { TypeCatalogResponse, TypeName } from '@/types/pokemon'

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

function mountSheet(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return mount(TypeFilterSheet, {
    props: {
      open: true,
      applied: [] as TypeName[],
      pending: [] as TypeName[],
      ...props,
    },
    global: { plugins: [pinia] },
    ...options,
  })
}

function catalogFor(type: TypeName): TypeCatalogResponse {
  return {
    damage_relations: { double_damage_from: [] },
    names: [{ language: { name: 'es' }, name: type }],
    pokemon: [{ slot: 1, pokemon: { name: `${type}-mon`, url: `https://pokeapi.co/api/v2/pokemon/${type}-mon/` } }],
  }
}

function checkboxByName(wrapper: ReturnType<typeof mount>, label: string) {
  const labels = wrapper.findAll('.sheet__option')
  const target = labels.find((el) => el.text().includes(label))
  expect(target, `checkbox ${label} not found`).toBeTruthy()
  return target!.get('input')
}

describe('TypeFilterSheet (5.3)', () => {
  it('opens as a dialog with aria-modal and the exact title', () => {
    const wrapper = mountSheet()
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(wrapper.text()).toContain('Filtra por tus preferencias')
  })

  it('renders 18 type options with all esLabels, icons and checkboxes', () => {
    const wrapper = mountSheet()
    const options = wrapper.findAll('.sheet__option')
    expect(options).toHaveLength(18)
    for (const meta of TYPE_META) {
      expect(wrapper.text()).toContain(meta.esLabel)
    }
    const grassOption = wrapper
      .findAll('.sheet__option')
      .find((el) => el.text().includes('Planta'))!
    expect(grassOption.find('.sheet__option-icon').exists()).toBe(true)
    expect(grassOption.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('supports multi-select and enables Aplicar', async () => {
    const wrapper = mountSheet()
    await checkboxByName(wrapper, 'Planta').setValue(true)
    await checkboxByName(wrapper, 'Veneno').setValue(true)
    const apply = wrapper.findAll('button').find((b) => b.text() === 'Aplicar')!
    expect(apply.attributes('disabled')).toBeUndefined()
    const selected = wrapper.findAll('.sheet__option--selected')
    expect(selected).toHaveLength(2)
  })

  it('disables Aplicar while no type is selected', () => {
    const wrapper = mountSheet()
    const apply = wrapper.findAll('button').find((b) => b.text() === 'Aplicar')!
    expect(apply.attributes('disabled')).toBeDefined()
  })

  it('slides up with a sheet transition', () => {
    const wrapper = mountSheet()
    const transition = wrapper.find('transition-stub')
    expect(transition.exists()).toBe(true)
    expect(transition.attributes('name')).toBe('sheet')
  })

  it('discards pending selection and reverts to the applied filter on Escape', async () => {
    const wrapper = mountSheet({ applied: ['grass'], pending: ['grass', 'poison'] })
    expect(wrapper.findAll('.sheet__option--selected')).toHaveLength(2)
    await wrapper.get('[role="dialog"]').trigger('keydown.esc')
    await nextTick()
    expect(wrapper.findAll('.sheet__option--selected')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('discards pending selection on Cancelar and via the backdrop', async () => {
    const wrapper = mountSheet({ applied: ['grass'], pending: ['grass', 'poison'] })
    await wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.findAll('.sheet__option--selected')).toHaveLength(1)

    const wrapper2 = mountSheet({ applied: ['grass'], pending: ['grass', 'poison'] })
    await wrapper2.get('.sheet-overlay').trigger('click')
    await nextTick()
    expect(wrapper2.findAll('.sheet__option--selected')).toHaveLength(1)
    expect(wrapper2.emitted('close')).toHaveLength(1)
  })

  it('restores focus to the trigger on close and traps focus while open', async () => {
    document.body.innerHTML = '<button id="trigger">Filtro</button>'
    const trigger = document.getElementById('trigger')!
    trigger.focus()
    const wrapper = mountSheet({}, { attachTo: document.body })

    await flushPromises()
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog).toBeTruthy()
    expect(document.activeElement).not.toBe(trigger)

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('input, button'),
    ).filter((el) => !(el as HTMLButtonElement).disabled)
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    first.focus()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(document.activeElement).toBe(last)
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)

    await wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!.trigger('click')
    await wrapper.setProps({ open: false })
    await nextTick()
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('stays open with an inline error and Reintentar when apply fails; retry re-issues only failed types', async () => {
    vi.mocked(fetchTypeCatalog)
      .mockImplementationOnce((type: TypeName) =>
        type === 'grass' ? Promise.reject(new Error('boom')) : Promise.resolve(catalogFor(type)),
      )
      .mockImplementation((type: TypeName) => Promise.resolve(catalogFor(type)))

    const wrapper = mountSheet()
    await checkboxByName(wrapper, 'Planta').setValue(true)
    await checkboxByName(wrapper, 'Veneno').setValue(true)
    await wrapper.findAll('button').find((b) => b.text() === 'Aplicar')!.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.text()).toContain('Algo salió mal...')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Reintentar')).toBe(true)
    expect(wrapper.findAll('button').some((b) => b.text() === 'Cancelar')).toBe(true)

    await wrapper.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click')
    await flushPromises()

    const calls = vi.mocked(fetchTypeCatalog).mock.calls.flat()
    expect(calls.filter((type) => type === 'grass')).toHaveLength(2)
    expect(calls.filter((type) => type === 'poison')).toHaveLength(1)
    expect(wrapper.emitted('apply')?.[0]?.[0]).toEqual(['grass', 'poison'])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits apply + close only after the union is ready (success path)', async () => {
    vi.mocked(fetchTypeCatalog).mockImplementation((type: TypeName) => Promise.resolve(catalogFor(type)))

    let resolveFirst!: () => void
    const gate = new Promise<void>((resolve) => {
      resolveFirst = resolve
    })
    vi.mocked(fetchTypeCatalog).mockImplementationOnce(() => gate.then(() => catalogFor('grass')))

    const wrapper = mountSheet()
    await checkboxByName(wrapper, 'Planta').setValue(true)
    await wrapper.findAll('button').find((b) => b.text() === 'Aplicar')!.trigger('click')
    await nextTick()

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.emitted('apply')).toBeUndefined()

    resolveFirst()
    await flushPromises()

    expect(wrapper.emitted('apply')?.[0]?.[0]).toEqual(['grass'])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
