<script setup lang="ts">
import { RouterView } from 'vue-router'

import TabBar from '@/components/TabBar.vue'
</script>

<template>
  <header class="app-header">
    <h1 class="app-title">Pokédex</h1>
  </header>
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <KeepAlive include="PokedexListView,FavoritesView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </main>
  <TabBar class="app-tab-bar" />
</template>
