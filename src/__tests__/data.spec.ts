import { describe, it, expect } from 'vitest'

import { TYPE_META, WEAKNESS_CHART } from '@/data/types'
import type { TypeName } from '@/types/pokemon'

const TYPE_NAMES: TypeName[] = [
  'grass',
  'fire',
  'water',
  'electric',
  'psychic',
  'poison',
  'normal',
  'bug',
  'fighting',
  'ground',
  'rock',
  'ice',
  'fairy',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'flying',
]

const EXPECTED_ES_LABELS: Record<TypeName, string> = {
  water: 'Agua',
  dragon: 'Dragón',
  electric: 'Eléctrico',
  fairy: 'Hada',
  ghost: 'Fantasma',
  fire: 'Fuego',
  ice: 'Hielo',
  grass: 'Planta',
  bug: 'Bicho',
  fighting: 'Lucha',
  normal: 'Normal',
  dark: 'Siniestro',
  steel: 'Acero',
  rock: 'Roca',
  psychic: 'Psíquico',
  ground: 'Tierra',
  poison: 'Veneno',
  flying: 'Volador',
}

describe('TYPE_META', () => {
  it('has exactly 18 entries covering every TypeName', () => {
    expect(TYPE_META).toHaveLength(18)
    const names = TYPE_META.map((meta) => meta.name).sort()
    expect(names).toEqual([...TYPE_NAMES].sort())
  })

  it('maps every type to its exact Spanish label', () => {
    const byName = Object.fromEntries(TYPE_META.map((meta) => [meta.name, meta.esLabel]))
    expect(byName).toEqual(EXPECTED_ES_LABELS)
  })

  it('gives every type a color and an icon asset path', () => {
    for (const meta of TYPE_META) {
      expect(meta.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(meta.icon).toContain(`type-${meta.name}.png`)
    }
  })
})

describe('WEAKNESS_CHART', () => {
  it('covers all 18 types', () => {
    const keys = Object.keys(WEAKNESS_CHART) as TypeName[]
    expect(keys.sort()).toEqual([...TYPE_NAMES].sort())
  })

  it('maps electric to ground as its only weakness', () => {
    expect(WEAKNESS_CHART.electric).toEqual(['ground'])
  })

  it('maps fire to water, ground, and rock', () => {
    expect(WEAKNESS_CHART.fire).toEqual(['water', 'ground', 'rock'])
  })

  it('maps normal to fighting as its only weakness', () => {
    expect(WEAKNESS_CHART.normal).toEqual(['fighting'])
  })
})
