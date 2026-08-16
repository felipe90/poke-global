/**
 * Static type metadata and weakness chart.
 * TYPE_META drives card backgrounds, chips, and the filter sheet (18 types).
 * WEAKNESS_CHART mirrors each type's `double_damage_from` locally — zero API calls.
 */
import type { TypeMeta, TypeName, WeaknessChart } from '@/types/pokemon'

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

/** Local mirror of PokeAPI `double_damage_from`, in chart order. */
export const WEAKNESS_CHART: WeaknessChart = {
  grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
  fire: ['water', 'ground', 'rock'],
  water: ['electric', 'grass'],
  electric: ['ground'],
  psychic: ['bug', 'ghost', 'dark'],
  poison: ['ground', 'psychic'],
  normal: ['fighting'],
  bug: ['fire', 'flying', 'rock'],
  fighting: ['flying', 'psychic', 'fairy'],
  ground: ['water', 'grass', 'ice'],
  rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
  ice: ['fire', 'fighting', 'rock', 'steel'],
  fairy: ['poison', 'steel'],
  ghost: ['ghost', 'dark'],
  dragon: ['ice', 'fairy', 'dragon'],
  dark: ['fighting', 'bug', 'fairy'],
  steel: ['fire', 'fighting', 'ground'],
  flying: ['electric', 'ice', 'rock'],
}

/** Lookup helper: TypeMeta by canonical name. */
export function getTypeMeta(name: TypeName): TypeMeta | undefined {
  return TYPE_META.find((meta) => meta.name === name)
}
