<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

import globeIcon from '@/assets/icons/tab/globe.svg'
import heartIcon from '@/assets/icons/tab/heart.svg'
import houseIcon from '@/assets/icons/tab/house.svg'
import userIcon from '@/assets/icons/tab/user.svg'

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

<style scoped>
.tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 77px;
  padding: var(--space-lg) var(--space-md);
  background: var(--tapbar-bg);
  border-top: 1px solid var(--tapbar-border-top);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  box-shadow: var(--shadow-top);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxs);
  width: 62px;
  height: 44px;
  text-decoration: none;
  color: var(--subtitle);
  font-family: var(--font-family);
  font-weight: 500;
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-xs);
  text-align: center;
}

.tab-item.active {
  color: var(--tab-active);
  font-weight: 700;
}

.tab-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 24px;
  gap: var(--space-none);
  padding: var(--space-xxs);
  border-radius: var(--radius-lg);
  background: currentColor;
  -webkit-mask: var(--tab-icon) center / contain no-repeat;
  mask: var(--tab-icon) center / contain no-repeat;
}

.tab-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}
</style>