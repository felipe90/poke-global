<script setup lang="ts">
import { ref } from 'vue'

import { completeOnboarding } from '@/router'

const currentStep = ref(0)
</script>

<template>
  <section class="onboarding-view">
    <Transition name="fade" mode="out-in">
      <div v-if="currentStep === 0" key="step-1" class="onboarding__step">
        <h1 class="onboarding__title">Todos los Pokémon en un solo lugar</h1>
        <p class="onboarding__subtitle">
          Accede a una amplia lista de Pokémon de todas las generaciones creadas por Nintendo
        </p>
        <button
          class="onboarding__cta"
          type="button"
          @click="currentStep = 1"
        >
          Continuar
        </button>
      </div>
      <div v-else key="step-2" class="onboarding__step">
        <h1 class="onboarding__title">Mantén tu Pokédex actualizada</h1>
        <p class="onboarding__subtitle">
          Regístrate y guarda tu perfil, Pokémon favoritos, configuraciones y mucho más
        </p>
        <button
          class="onboarding__cta"
          type="button"
          @click="() => void completeOnboarding()"
        >
          Empecemos
        </button>
      </div>
    </Transition>
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
  </section>
</template>

<style scoped>
.onboarding-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-card);
  background: var(--bg);
  text-align: center;
}

.onboarding__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-card);
  max-width: 420px;
}

.onboarding__title {
  margin: 0;
  font-size: var(--font-screen-title);
  font-weight: 500;
  color: var(--title);
}

.onboarding__subtitle {
  margin: 0;
  font-size: var(--font-data-value);
  font-weight: 400;
  color: var(--subtitle);
}

.onboarding__cta {
  min-width: 200px;
  padding: var(--space-card);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--bg);
  font-size: var(--font-cta);
  font-weight: 600;
}

.onboarding__cta:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: 2px;
}

.onboarding__dots {
  display: flex;
  gap: var(--space-info-gap);
  margin-top: var(--space-card);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--onboarding-dot-inactive);
}

.dot[aria-current='step'] {
  background: var(--onboarding-dot);
}
</style>
