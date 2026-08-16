<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

import globeIcon from '@/assets/icons/globe.svg'
import heartIcon from '@/assets/icons/heart.svg'
import houseIcon from '@/assets/icons/house.svg'
import userIcon from '@/assets/icons/user.svg'

const route = useRoute()

const tabs = [
  { label: 'Pokedex', path: '/', icon: houseIcon },
  { label: 'Regiones', path: '/regions', icon: globeIcon },
  { label: 'Favoritos', path: '/favorites', icon: heartIcon },
  { label: 'Perfil', path: '/profile', icon: userIcon },
] as const

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/' || route.path.startsWith('/pokemon/')
  return route.path === path
}

/** CSS custom property per item: the icon as a mask data URI. */
function tabStyle(icon: string): Record<string, string> {
  return { '--tab-icon': `url("${icon}")` }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  const links = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a'))
  const index = links.indexOf(document.activeElement as HTMLElement)
  if (index === -1) return
  event.preventDefault()
  const delta = event.key === 'ArrowRight' ? 1 : -1
  const next = (index + delta + links.length) % links.length
  links[next]?.focus()
}
</script>

<template>
  <nav
    class="tab-bar"
    aria-label="Navegación principal"
    @keydown="onKeydown"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="tab-item"
      :class="{ active: isActive(tab.path) }"
      :aria-current="isActive(tab.path) ? 'page' : undefined"
      :style="tabStyle(tab.icon)"
    >
      <span
        class="tab-item__icon"
        aria-hidden="true"
      />
      <span class="tab-item__label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>