/**
 * Static type metadata.
 * TYPE_META drives card backgrounds, chips, and the filter sheet (18 types).
 * esLabel/color/icon come from the Figma; weaknesses are derived at runtime
 * from each type catalog's `damage_relations` (see the store preload).
 */
import type { TypeCatalogResponse, TypeMeta, TypeName } from '@/types/pokemon'

import iconBug from '@/assets/types/badges/type-bug.png'
import iconDark from '@/assets/types/badges/type-dark.png'
import iconDragon from '@/assets/types/badges/type-dragon.png'
import iconElectric from '@/assets/types/badges/type-electric.png'
import iconFairy from '@/assets/types/badges/type-fairy.png'
import iconFighting from '@/assets/types/badges/type-fighting.png'
import iconFire from '@/assets/types/badges/type-fire.png'
import iconFlying from '@/assets/types/badges/type-flying.png'
import iconGhost from '@/assets/types/badges/type-ghost.png'
import iconGrass from '@/assets/types/badges/type-grass.png'
import iconGround from '@/assets/types/badges/type-ground.png'
import iconIce from '@/assets/types/badges/type-ice.png'
import iconNormal from '@/assets/types/badges/type-normal.png'
import iconPoison from '@/assets/types/badges/type-poison.png'
import iconPsychic from '@/assets/types/badges/type-psychic.png'
import iconRock from '@/assets/types/badges/type-rock.png'
import iconSteel from '@/assets/types/badges/type-steel.png'
import iconWater from '@/assets/types/badges/type-water.png'

import elementBug from '@/assets/types/badges/type-bug.png'
import elementDark from '@/assets/types/badges/type-dark.png'
import elementDragon from '@/assets/types/badges/type-dragon.png'
import elementElectric from '@/assets/types/badges/type-electric.png'
import elementFairy from '@/assets/types/badges/type-fairy.png'
import elementFighting from '@/assets/types/badges/type-fighting.png'
import elementFire from '@/assets/types/badges/type-fire.png'
import elementFlying from '@/assets/types/badges/type-flying.png'
import elementGhost from '@/assets/types/badges/type-ghost.png'
import elementGrass from '@/assets/types/badges/type-grass.png'
import elementGround from '@/assets/types/badges/type-ground.png'
import elementIce from '@/assets/types/badges/type-ice.png'
import elementNormal from '@/assets/types/badges/type-normal.png'
import elementPoison from '@/assets/types/badges/type-poison.png'
import elementPsychic from '@/assets/types/badges/type-psychic.png'
import elementRock from '@/assets/types/badges/type-rock.png'
import elementSteel from '@/assets/types/badges/type-steel.png'
import elementWater from '@/assets/types/badges/type-water.png'

/** 18-entry metadata: canonical name, Spanish label, card color, icon asset,
 *  and the decorative element graphic behind the card sprite. */
export const TYPE_META: TypeMeta[] = [
  { name: 'grass', esLabel: 'Planta', color: '#8bc34a', icon: iconGrass, element: elementGrass },
  { name: 'fire', esLabel: 'Fuego', color: '#ff9800', icon: iconFire, element: elementFire },
  { name: 'water', esLabel: 'Agua', color: '#6390f0', icon: iconWater, element: elementWater },
  { name: 'electric', esLabel: 'Eléctrico', color: '#f7d02c', icon: iconElectric, element: elementElectric },
  { name: 'psychic', esLabel: 'Psíquico', color: '#9c27b0', icon: iconPsychic, element: elementPsychic },
  { name: 'poison', esLabel: 'Veneno', color: '#9c27b0', icon: iconPoison, element: elementPoison },
  { name: 'normal', esLabel: 'Normal', color: '#a8a77a', icon: iconNormal, element: elementNormal },
  { name: 'bug', esLabel: 'Bicho', color: '#a6b91a', icon: iconBug, element: elementBug },
  { name: 'fighting', esLabel: 'Lucha', color: '#c22e28', icon: iconFighting, element: elementFighting },
  { name: 'ground', esLabel: 'Tierra', color: '#e2bf65', icon: iconGround, element: elementGround },
  { name: 'rock', esLabel: 'Roca', color: '#b6a136', icon: iconRock, element: elementRock },
  { name: 'ice', esLabel: 'Hielo', color: '#96d9d6', icon: iconIce, element: elementIce },
  { name: 'fairy', esLabel: 'Hada', color: '#d685ad', icon: iconFairy, element: elementFairy },
  { name: 'ghost', esLabel: 'Fantasma', color: '#735797', icon: iconGhost, element: elementGhost },
  { name: 'dragon', esLabel: 'Dragón', color: '#6f35fc', icon: iconDragon, element: elementDragon },
  { name: 'dark', esLabel: 'Siniestro', color: '#705746', icon: iconDark, element: elementDark },
  { name: 'steel', esLabel: 'Acero', color: '#b7b7ce', icon: iconSteel, element: elementSteel },
  { name: 'flying', esLabel: 'Volador', color: '#a98ff3', icon: iconFlying, element: elementFlying },
]

/** Neutral background used when a type has no Figma color (unmapped/unknown). */
export const FALLBACK_TYPE_COLOR = '#9e9e9e'

/** Mix a hex color toward white (amount 0..1) — used for the card's light tint. */
export function lightenColor(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const mix = (channel: number): number => Math.round(channel + (255 - channel) * amount)
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Mix a hex color toward black (amount 0..1) — used for the media-section tint. */
export function darkenColor(hex: string, amount: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const mix = (channel: number): number => Math.round(channel * (1 - amount))
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Lookup helper: TypeMeta by canonical name.
 * Returns `undefined` for unmapped types so callers can fall back to the
 * neutral color and the API-provided Spanish label.
 */
export function getTypeMeta(name: TypeName): TypeMeta | undefined {
  return TYPE_META.find((meta) => meta.name === name)
}

/** Resolve the Spanish label for a type, preferring the API names table. */
export function resolveEsLabel(name: TypeName, catalog?: TypeCatalogResponse): string {
  const fromApi = catalog?.names.find((entry) => entry.language.name === 'es')?.name
  if (fromApi) return fromApi
  return getTypeMeta(name)?.esLabel ?? name
}

/** Derive a type's weaknesses from its catalog `double_damage_from` (API truth). */
export function resolveWeaknesses(
  name: TypeName,
  catalog?: TypeCatalogResponse,
): TypeName[] {
  const fromApi = catalog?.damage_relations.double_damage_from.map((entry) => entry.name as TypeName) ?? []
  return fromApi.length > 0 ? fromApi : (getTypeMeta(name) ? [] : [])
}
