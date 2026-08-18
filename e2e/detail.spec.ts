import { expect, test } from '@playwright/test'

import { gotoList, mockApiSuccess } from './helpers/api'

test.describe('Path 4: Vista de detalle de Pokémon', () => {
  test('abre el detalle de Bulbasaur y valida los elementos clave', async ({ page }) => {
    await mockApiSuccess(page)
    await gotoList(page)

    // Click en la tarjeta de Bulbasaur.
    await page.locator('.pokemon-card', { hasText: 'Bulbasaur' }).click()
    await expect(page).toHaveURL(/\/pokemon\/bulbasaur$/)
    await expect(page.locator('.detail-panel')).toBeVisible()

    // Header hero con artwork (sprite) del tipo.
    const artwork = page.locator('.detail-header__artwork')
    await expect(artwork).toBeVisible()
    await expect(artwork).toHaveAttribute('src', /\.gif$/)

    // Nombre, ID, badges de tipo, descripción.
    await expect(page.locator('.detail-heading__name')).toHaveText('Bulbasaur')
    await expect(page.locator('.detail-heading__number')).toHaveText('Nº001')
    const typeBadges = page.locator('.detail-elements .type-badge')
    expect(await typeBadges.count()).toBeGreaterThan(0)
    await expect(page.locator('.detail-description')).not.toBeEmpty()

    // Grid de especificaciones (PropertyBox): Peso, Altura, Categoría, Habilidad.
    await expect(page.locator('.property-box__label')).toHaveText(['Peso', 'Altura', 'Categoría', 'Habilidad'])
    await expect(page.locator('.property-box__value')).toHaveCount(4)

    // Barra de género y debilidades.
    await expect(page.locator('.gender-bar')).toBeVisible()
    await expect(page.locator('.gender-bar__segment')).toBeVisible()
    await expect(page.locator('.detail-weaknesses')).toBeVisible()
    expect(await page.locator('.detail-weaknesses .type-badge').count()).toBeGreaterThan(0)

    // Botón de regreso → vuelve a la lista.
    await page.getByRole('button', { name: 'Volver' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('.pokedex-list-view')).toBeVisible()
  })
})
