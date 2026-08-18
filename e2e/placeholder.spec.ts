import { expect, test } from '@playwright/test'

import { completeOnboarding, mockApiSuccess } from './helpers/api'

test.describe('Path 5: Secciones no disponibles (placeholder)', () => {
  test('Regiones muestra la vista de "muy pronto"', async ({ page }) => {
    await mockApiSuccess(page)
    await completeOnboarding(page)
    await page.locator('.pokedex-list-view').waitFor()

    await page.locator('nav a[href="/regions"]').click()
    await expect(page.locator('.state__title').filter({ hasText: '¡Muy pronto disponible!' })).toBeVisible()
  })
})
