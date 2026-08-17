<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import groupImage from '@/assets/screens/Group 28.png'
import frameImage from '@/assets/screens/Frame 1000002626.png'
import { completeOnboarding } from '@/router'

const currentStep = ref(0)
</script>

<template>
  <section class="onboarding-view">
    <!-- Both steps stay mounted (v-show) so both images load up front —
         switching steps never waits for a network fetch. The crossfade is a
         pure CSS transition on opacity (no <Transition> wrapper needed). -->
    <div class="onboarding__steps">
      <div
        class="onboarding__step"
        :class="{ 'onboarding__step--hidden': currentStep !== 0 }"
      >
        <img
          class="onboarding__image onboarding__image--step1"
          :src="groupImage"
          alt=""
          aria-hidden="true"
        />
        <h1 class="onboarding__title">Todos los Pokémon en un solo lugar</h1>
        <p class="onboarding__subtitle">
          Accede a una amplia lista de Pokémon de todas las generaciones creadas por Nintendo
        </p>
        <div class="onboarding__dots">
          <span
            v-for="index in 2"
            :key="index"
            class="dot"
            role="img"
            :aria-label="`paso ${index} de 2`"
            :aria-current="currentStep === index - 1 ? 'step' : undefined"
          />
        </div>
        <AppButton @click="currentStep = 1">
          Continuar
        </AppButton>
      </div>
      <div
        class="onboarding__step"
        :class="{ 'onboarding__step--hidden': currentStep !== 1 }"
      >
        <img
          class="onboarding__image onboarding__image--step2"
          :src="frameImage"
          alt=""
          aria-hidden="true"
        />
        <h1 class="onboarding__title">Mantén tu Pokédex actualizada</h1>
        <p class="onboarding__subtitle">
          Regístrate y guarda tu perfil, Pokémon favoritos, configuraciones y mucho más
        </p>
        <div class="onboarding__dots">
          <span
            v-for="index in 2"
            :key="index"
            class="dot"
            role="img"
            :aria-label="`paso ${index} de 2`"
            :aria-current="currentStep === index - 1 ? 'step' : undefined"
          />
        </div>
        <AppButton @click="() => void completeOnboarding()">
          Empecemos
        </AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.onboarding-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  flex: 1;
  padding: var(--space-card);
  background: var(--bg);
  text-align: center;
}

.onboarding__steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  /* Tallest step (measured: step 2 = 515px) — prevents layout shift. */
  min-height: 515px;
}

.onboarding__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-card);
  max-width: 420px;
  width: 100%;
  /* Crossfade between steps: both stay mounted (images preloaded), the
     hidden one fades out via opacity + visibility (display:none would be
     instant and cannot transition). */
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.onboarding__step--hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.onboarding__step :deep(.app-button) {
  max-width: none;
}

.onboarding__image {
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.onboarding__image--step1 {
  max-width: 342px;
}

.onboarding__image--step2 {
  max-width: 251px;
}

.onboarding__title {
  margin: 0;
  font-size: var(--font-screen-title);
  font-weight: 500;
  color: var(--title);
}

.onboarding__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--subtitle);
}

.onboarding__dots {
  display: flex;
  gap: var(--space-info-gap);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 11px;
  background: var(--onboarding-dot-inactive);
  opacity: 0.25;
}

.dot[aria-current='step'] {
  width: 28px;
  background: var(--onboarding-dot);
  opacity: 1;
}
</style>
