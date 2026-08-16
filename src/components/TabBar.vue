<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Pokedex', path: '/', icon: 'pokedex' },
  { label: 'Regiones', path: '/regions', icon: 'regions' },
  { label: 'Favoritos', path: '/favorites', icon: 'favorites' },
  { label: 'Perfil', path: '/profile', icon: 'profile' },
] as const

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/' || route.path.startsWith('/pokemon/')
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
      <svg
        class="tab-item__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          v-if="tab.icon === 'pokedex'"
          d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <template v-else-if="tab.icon === 'regions'">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
        <path
          v-else-if="tab.icon === 'favorites'"
          d="M12 21s-8-5.3-8-11a4.6 4.6 0 0 1 8-2.7A4.6 4.6 0 0 1 20 10c0 5.7-8 11-8 11z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <template v-else-if="tab.icon === 'profile'">
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M4 21c0-4 4-6 8-6s8 2 8 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
      </svg>
      <span class="tab-item__label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
