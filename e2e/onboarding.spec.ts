import { expect, test } from '@playwright/test'

import { mockApiFailure, mockApiSuccess } from './helpers/api'

test.describe('Path 1: Onboarding y carga inicial', () => {
  test('1.1 carga exitosa — splash → onboarding → lista con tarjetas', async ({ page }) => {
    await mockApiSuccess(page)
    await page.goto('/')

    // Splash da paso al primer slide de onboarding.
    await expect(page.locator('.onboarding-view')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Todos los Pokémon en un solo lugar' })).toBeVisible()

    // Avanza al segundo slide.
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByRole('heading', { name: 'Mantén tu Pokédex actualizada' })).toBeVisible()

    // Empecemos → Pokédex principal con tarjetas.
    await page.getByRole('button', { name: 'Empecemos' }).click()
    await expect(page.locator('.pokedex-list-view')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.pokemon-card').first()).toBeVisible()
    const cardCount = await page.locator('.pokemon-card').count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('1.2 fallback — error de API muestra "Algo salió mal..." y Reintentar', async ({ page }) => {
    await mockApiFailure(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Continuar' }).waitFor({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Empecemos' }).click()

    // El primer fetch de la página falla → ErrorState.
    await expect(page.locator('.state__title').filter({ hasText: 'Algo salió mal...' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  })
})
