import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

import SplashView from '@/views/SplashView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import PokedexListView from '@/views/PokedexListView.vue'
import PokemonDetailView from '@/views/PokemonDetailView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import ConstructionView from '@/views/ConstructionView.vue'

/**
 * Cold-load guard flag. Starts `false` on every app load (in-memory only —
 * never persisted, per the onboarding-flow spec) and flips after `Empecemos`.
 */
export const flowComplete = ref(false)

/**
 * Intended target stashed on the first guarded navigation, so deep links and
 * browser history survive the fixed Splash → Onboarding flow.
 */
export const pendingTarget = ref<string | null>(null)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/splash', name: 'splash', component: SplashView, meta: { public: true } },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView, meta: { public: true } },
    { path: '/', name: 'pokedex', component: PokedexListView },
    { path: '/regions', name: 'regions', component: ConstructionView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/profile', name: 'profile', component: ConstructionView },
    { path: '/pokemon/:name', name: 'pokemon-detail', component: PokemonDetailView },
  ],
})

router.beforeEach((to) => {
  if (flowComplete.value) return true
  if (to.meta.public) return true
  if (pendingTarget.value === null) pendingTarget.value = to.fullPath
  return { path: '/splash' }
})

/**
 * Called by the Onboarding `Empecemos` CTA: flip the guard and resume to the
 * stashed target (default `/`).
 */
export function completeOnboarding(): Promise<unknown> {
  flowComplete.value = true
  return router.push(pendingTarget.value ?? '/')
}

export default router
