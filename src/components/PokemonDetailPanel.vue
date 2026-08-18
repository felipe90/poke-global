<script setup lang="ts">
import { computed } from 'vue'

import chevronLeft from '@/assets/icons/nav/chevron-left.svg'
import abilityIcon from '@/assets/icons/properties/ability.svg'
import categoryIcon from '@/assets/icons/properties/category.svg'
import heightIcon from '@/assets/icons/properties/height.svg'
import weightIcon from '@/assets/icons/properties/weight.svg'
import { FALLBACK_TYPE_COLOR, getTypeMeta, resolveWeaknesses } from '@/data/types'
import { getAnimatedSprite, getStaticSprite } from '@/services/pokeapi'
import { deriveSpecies, usePokemonStore } from '@/stores/pokemon'
import type { PokemonDerivedSpecies } from '@/stores/pokemon'
import type { PokemonDetail, PokemonSpecies, TypeName } from '@/types/pokemon'

import FavoriteButton from './FavoriteButton.vue'
import GenderBar from './GenderBar.vue'
import PropertyBox from './PropertyBox.vue'
import Separator from './Separator.vue'
import ShareButton from './ShareButton.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  detail: PokemonDetail
  species?: PokemonSpecies | null
  derived?: PokemonDerivedSpecies | null
}>()

const store = usePokemonStore()

const emit = defineEmits<{
  back: []
  toggleFavorite: []
  share: []
}>()

const numero = computed(() => `Nº${String(props.detail.id).padStart(3, '0')}`)

const displayName = computed(() => props.detail.name.charAt(0).toUpperCase() + props.detail.name.slice(1))

const typesBySlot = computed(() => [...props.detail.types].sort((a, b) => a.slot - b.slot))

const fields = computed(() => {
  const resolveWeaknessesFor = (type: TypeName): TypeName[] => resolveWeaknesses(type, store.typeCatalog(type))
  return props.derived ?? deriveSpecies(props.detail, props.species ?? null, resolveWeaknessesFor)
})

const artwork = computed(() => getAnimatedSprite(props.detail))

/** Static sprite for the favorite snapshot — the header shows the GIF, but
 *  the favorites list must render the static image (same as the list card). */
const favoriteImage = computed(() => getStaticSprite(props.detail))

const favoriteTypes = computed(() => props.detail.types.map((entry) => entry.type.name))

/** Header circle background = the color of the pokémon's first (primary) type. */
const headerColor = computed(() => {
  const primary = props.detail.types[0]?.type.name
  return primary ? getTypeMeta(primary)?.color ?? FALLBACK_TYPE_COLOR : undefined
})

/** Decorative Figma element graphic behind the artwork (by primary type). */
const elementUrl = computed(() => {
  const primary = props.detail.types[0]?.type.name
  return primary ? getTypeMeta(primary)?.element ?? null : null
})

/** Element style: the mask URL needs url("...") with quotes — built in JS. */
function elementStyle(): Record<string, string> {
  return { '--element-icon': `url("${elementUrl.value ?? ''}")` }
}

const genderRate = computed(() => fields.value.genderRate)
</script>

<template>
  <article class="detail-panel">
    <header class="detail-header">
      <div
        class="detail-header__background"
        :style="headerColor ? { backgroundColor: headerColor } : {}"
        aria-hidden="true"
      ></div>

      <div
        class="detail-header__element-wrap"
        aria-hidden="true"
      >
        <span
          v-if="elementUrl"
          class="detail-header__element"
          :style="elementStyle()"
          aria-hidden="true"
        />
      </div>

      <div class="detail-header__top">
        <button
          type="button"
          class="detail-header__back"
          aria-label="Volver"
          @click="emit('back')"
        >
          <img
            class="detail-header__back-icon"
            :src="chevronLeft"
            alt=""
            aria-hidden="true"
          />
        </button>
        <FavoriteButton
          class="detail-header__favorite"
          :name="detail.name"
          :id="detail.id"
          :image-url="favoriteImage ?? ''"
          :types="favoriteTypes"
          :size="28"
          @click="emit('toggleFavorite')"
        />
      </div>

      <img
        v-if="artwork"
        class="detail-header__artwork"
        :src="artwork"
        :alt="detail.name"
      />
    </header>

    <section class="detail-body">
      <div class="detail-heading">
        <h2 class="detail-heading__name">{{ displayName }}</h2>
        <span class="detail-heading__number">{{ numero }}</span>
      </div>

      <div class="detail-elements">
        <TypeBadge
          v-for="entry in typesBySlot"
          :key="entry.slot"
          :type="entry.type.name"
        />
      </div>

      <div class="detail-description-block">
        <p class="detail-description">{{ fields.descripcion }}</p>
        <Separator />
      </div>

      <dl class="detail-characteristics">
        <div class="detail-characteristics__row">
          <PropertyBox
            label="Peso"
            :value="fields.peso"
            :icon-url="weightIcon"
          />
          <PropertyBox
            label="Altura"
            :value="fields.altura"
            :icon-url="heightIcon"
          />
        </div>
        <div class="detail-characteristics__row">
          <PropertyBox
            label="Categoría"
            :value="fields.categoria"
            :icon-url="categoryIcon"
          />
          <PropertyBox
            label="Habilidad"
            :value="fields.habilidad"
            :icon-url="abilityIcon"
          />
        </div>
      </dl>

      <GenderBar :gender-rate="genderRate" />

      <section
        v-if="fields.debilidades.length > 0"
        class="detail-weaknesses"
        aria-label="Debilidades"
      >
        <h3 class="detail-weaknesses__title">Debilidades</h3>
        <div class="detail-weaknesses__chips">
          <TypeBadge
            v-for="type in fields.debilidades"
            :key="type"
            :type="type"
          />
        </div>
      </section>

      <ShareButton
        class="detail-share"
        :detail="detail"
        @click="emit('share')"
      />
    </section>
  </article>
</template>

<style scoped>
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

/* ---------------------------------------------------------------- Header */

/* Card-like container structure: outer container, color background, and the
   type element behind the artwork (same pattern as the list card). */
.detail-header {
  position: relative;
  height: 307px;
}

.detail-header__background {
  position: absolute;
  top: -227px;
  left: 50%;
  width: 498px;
  height: 498px;
  border-radius: 50%;
  transform: translateX(-50%);
}

/* Figma "Elemento Outline": 204x204, horizontally centered (the Figma keeps
   it at 1px of the header center). The type vector lives inside at the
   exact Figma offset (top 4.16, left 9.64). */
.detail-header__element-wrap {
  position: absolute;
  top: 35px;
  left: 50%;
  width: 204px;
  height: 204px;
  transform: translateX(-50%);
  pointer-events: none;
}

.detail-header__element {
  position: absolute;
  top: 4.16px;
  left: 9.64px;
  width: 181.76px;
  height: 196.49px;
  /* White gradient + type icon (PNG alpha) as the mask shape — same as the
     list card's decorative element. */
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.15) 100%
  );
  -webkit-mask: var(--element-icon) center / contain no-repeat;
  mask: var(--element-icon) center / contain no-repeat;
  pointer-events: none;
}

.detail-header__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-card) 0;
  color: var(--bg);
}

.detail-header__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.detail-header__back-icon {
  width: 9px;
  height: 16px;
}

/* The heart icon is centered in a 28px button while the chevron sits in a
   38px button — push the heart inward so its icon is as far from the right
   edge as the chevron is from the left edge (Figma keeps them symmetric). */
.detail-header__favorite {
  margin-right: 7.5px;
}

.detail-header__back:focus-visible {
  outline: 2px solid var(--bg);
  outline-offset: 2px;
}

/* The artwork is independent of the background container — Figma geometry
   (142.23 x 154.87, top 143.2) but horizontally centered on the frame. */
.detail-header__artwork {
  position: absolute;
  top: 143.2px;
  left: 50%;
  width: 142.23px;
  height: 154.87px;
  object-fit: contain;
  transform: translateX(-50%);
}

/* ------------------------------------------------------------------ Body */

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

.detail-heading {
  display: flex;
  flex-direction: column;
}

.detail-heading__name {
  margin: 0;
  font-size: var(--font-detail-name);
  font-weight: 500;
  color: var(--title);
}

.detail-heading__number {
  margin: -4px 0 0;
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--subtitle);
}

.detail-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-description-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
}

.detail-description {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--subtitle);
}

.detail-characteristics {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  margin: 0;
}

.detail-characteristics__row {
  display: flex;
  gap: var(--space-card);
}

.detail-characteristics__row > .property-box {
  flex: 1 1 0;
}

/* Double the body gap (2 x 16px) between the properties and the gender bar. */
.gender-bar {
  margin-top: var(--space-card);
}

.detail-weaknesses {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Double the body gap (2 x 16px) between the gender bar and Debilidades. */
  margin-top: var(--space-card);
}

.detail-weaknesses__title {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 500;
  color: var(--title);
}

.detail-weaknesses__chips {
  display: flex;
  flex-wrap: wrap;
  /* Triple the info gap (3 x 4px) between the weakness badges. */
  gap: 12px;
}

/* Share sits apart from the weaknesses block and centers horizontally. The
   bottom margin mirrors the top separation (16px body gap + 32px margin =
   48px) so scrolling down leaves breathing room before the tab menu. */
.detail-share {
  align-items: center;
  margin-top: calc(2 * var(--space-card));
  margin-bottom: calc(3 * var(--space-card));
}
</style>
