import { describe, it, expect } from 'vitest'

import { FALLBACK_TYPE_COLOR, TYPE_META, getTypeMeta, resolveEsLabel, resolveWeaknesses } from '@/data/types'
import type { TypeCatalogResponse, TypeName } from '@/types/pokemon'

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

describe('getTypeMeta + unmapped fallback', () => {
  it('returns the Figma metadata for the 18 mapped types', () => {
    for (const meta of TYPE_META) {
      expect(getTypeMeta(meta.name)?.color).toBe(meta.color)
    }
  })

  it('falls back to the neutral color for an unmapped type', () => {
    expect(FALLBACK_TYPE_COLOR).toBe('#9e9e9e')
    expect(getTypeMeta('stellar' as TypeName)).toBeUndefined()
  })
})

describe('resolveWeaknesses (API truth, catalog-derived)', () => {
  const electricCatalog: TypeCatalogResponse = {
    damage_relations: { double_damage_from: [{ name: 'ground' }] },
    names: [{ language: { name: 'es' }, name: 'Eléctrico' }],
    pokemon: [],
  }

  it('derives weaknesses from the catalog damage_relations', () => {
    expect(resolveWeaknesses('electric', electricCatalog)).toEqual(['ground'])
  })

  it('returns [] when no catalog is available yet', () => {
    expect(resolveWeaknesses('electric')).toEqual([])
  })
})

describe('resolveEsLabel (API-first, Figma fallback)', () => {
  const grassCatalog: TypeCatalogResponse = {
    damage_relations: { double_damage_from: [] },
    names: [{ language: { name: 'es' }, name: 'Planta' }],
    pokemon: [],
  }

  it('prefers the API Spanish name when the catalog is loaded', () => {
    expect(resolveEsLabel('grass', grassCatalog)).toBe('Planta')
  })

  it('falls back to the Figma label without a catalog', () => {
    expect(resolveEsLabel('grass')).toBe('Planta')
  })

  it('falls back to the canonical name for an unmapped type without a catalog', () => {
    expect(resolveEsLabel('stellar' as TypeName)).toBe('stellar')
  })
})
