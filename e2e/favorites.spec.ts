import { expect, test } from '@playwright/test'

import { completeOnboarding, gotoList, mockApiSuccess } from './helpers/api'

test.describe('Path 3: Pestaña Favoritos', () => {
  test('3.1 estado vacío — sin favoritos muestra el mensaje', async ({ page }) => {
    await mockApiSuccess(page)
    await completeOnboarding(page)
    await page.locator('.pokedex-list-view').waitFor()

    // Navega a Favoritos sin marcar ninguno.
    await page.locator('nav a[href="/favorites"]').click()
    await expect(page.locator('.favorites-view')).toBeVisible()
    await expect(page.locator('.state__title').filter({ hasText: 'No has marcado ningún Pokémon como favorito' })).toBeVisible()
  })

  test('3.2 swipe-to-delete — marca favorito, desliza y elimina', async ({ page }) => {
    await mockApiSuccess(page)
    await gotoList(page)

    // Marca el primer pokémon (bulbasaur) como favorito.
    const firstCard = page.locator('.pokemon-card').first()
    await firstCard.locator('.favorite-button').click()
    await expect(firstCard.locator('.favorite-button')).toHaveAttribute('aria-pressed', 'true')

    // Navega a Favoritos.
    await page.locator('nav a[href="/favorites"]').click()
    await expect(page.locator('.favorites-view')).toBeVisible()
    const favCards = page.locator('.favorites-list__item')
    await expect(favCards.first()).toBeVisible()
    const before = await favCards.count()
    expect(before).toBeGreaterThan(0)

    // Swipe izquierdo sobre la primera tarjeta para revelar la acción.
    const card = favCards.first().locator('.card-layer')
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 80, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()

    // La capa de acción (papelera) queda revelada.
    const actionLayer = page.locator('.action-layer').first()
    await expect(actionLayer).toBeVisible()
    // Espera la transición CSS (0.35s) del card-layer antes de pulsar la
    // papelera — no hay un estado observable que esperar, solo el tiempo.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500)

    // Click en la papelera → elimina el favorito.
    await actionLayer.click()
    await expect(page.locator('.favorites-list__item')).toHaveCount(before - 1)
  })
})
