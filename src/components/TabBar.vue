<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Pokedex', path: '/' },
  { label: 'Regiones', path: '/regions' },
  { label: 'Favoritos', path: '/favorites' },
  { label: 'Perfil', path: '/profile' },
] as const

function isActive(path: string): boolean {
  return route.path === path
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
    :style="{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px', boxShadow: '0 -1px 3px rgba(0,0,0,0.12)' }"
    @keydown="onKeydown"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="tab-item"
      :class="{ active: isActive(tab.path) }"
      :aria-current="isActive(tab.path) ? 'page' : undefined"
      :style="{ color: isActive(tab.path) ? '#0d47a1' : '#424242' }"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
