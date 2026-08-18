<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'

import TabBar from '@/components/TabBar.vue'

const route = useRoute()

/** Public cold-load views (splash, onboarding) don't show the tab bar. */
const showTabBar = computed(() => !route.meta.public)
</script>

<template>
  <Analytics />
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <KeepAlive include="PokedexListView,FavoritesView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </main>
  <TabBar
    v-if="showTabBar"
    class="app-tab-bar"
  />
</template>
