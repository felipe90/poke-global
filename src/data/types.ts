/**
 * Static type metadata.
 * TYPE_META drives card backgrounds, chips, and the filter sheet (18 types).
 * esLabel/color/icon come from the Figma; weaknesses are derived at runtime
 * from each type catalog's `damage_relations` (see the store preload).
 */
import type { TypeCatalogResponse, TypeMeta, TypeName } from '@/types/pokemon'

import iconBug from '@/assets/icons/type-bug.png'
import iconDark from '@/assets/icons/type-dark.png'
import iconDragon from '@/assets/icons/type-dragon.png'
import iconElectric from '@/assets/icons/type-electric.png'
import iconFairy from '@/assets/icons/type-fairy.png'
import iconFighting from '@/assets/icons/type-fighting.png'
import iconFire from '@/assets/icons/type-fire.png'
import iconFlying from '@/assets/icons/type-flying.png'
import iconGhost from '@/assets/icons/type-ghost.png'
import iconGrass from '@/assets/icons/type-grass.png'
import iconGround from '@/assets/icons/type-ground.png'
import iconIce from '@/assets/icons/type-ice.png'
import iconNormal from '@/assets/icons/type-normal.png'
import iconPoison from '@/assets/icons/type-poison.png'
import iconPsychic from '@/assets/icons/type-psychic.png'
import iconRock from '@/assets/icons/type-rock.png'
import iconSteel from '@/assets/icons/type-steel.png'
import iconWater from '@/assets/icons/type-water.png'

/** 18-entry metadata: canonical name, Spanish label, card color, icon asset. */
export const TYPE_META: TypeMeta[] = [
  { name: 'grass', esLabel: 'Planta', color: '#8bc34a', icon: iconGrass },
  { name: 'fire', esLabel: 'Fuego', color: '#ff9800', icon: iconFire },
  { name: 'water', esLabel: 'Agua', color: '#6390f0', icon: iconWater },
  { name: 'electric', esLabel: 'Eléctrico', color: '#f7d02c', icon: iconElectric },
  { name: 'psychic', esLabel: 'Psíquico', color: '#9c27b0', icon: iconPsychic },
  { name: 'poison', esLabel: 'Veneno', color: '#9c27b0', icon: iconPoison },
  { name: 'normal', esLabel: 'Normal', color: '#a8a77a', icon: iconNormal },
  { name: 'bug', esLabel: 'Bicho', color: '#a6b91a', icon: iconBug },
  { name: 'fighting', esLabel: 'Lucha', color: '#c22e28', icon: iconFighting },
  { name: 'ground', esLabel: 'Tierra', color: '#e2bf65', icon: iconGround },
  { name: 'rock', esLabel: 'Roca', color: '#b6a136', icon: iconRock },
  { name: 'ice', esLabel: 'Hielo', color: '#96d9d6', icon: iconIce },
  { name: 'fairy', esLabel: 'Hada', color: '#d685ad', icon: iconFairy },
  { name: 'ghost', esLabel: 'Fantasma', color: '#735797', icon: iconGhost },
  { name: 'dragon', esLabel: 'Dragón', color: '#6f35fc', icon: iconDragon },
  { name: 'dark', esLabel: 'Siniestro', color: '#705746', icon: iconDark },
  { name: 'steel', esLabel: 'Acero', color: '#b7b7ce', icon: iconSteel },
  { name: 'flying', esLabel: 'Volador', color: '#a98ff3', icon: iconFlying },
]

/** Neutral background used when a type has no Figma color (unmapped/unknown). */
export const FALLBACK_TYPE_COLOR = '#9e9e9e'

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
