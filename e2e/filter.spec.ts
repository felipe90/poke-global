import { expect, test } from '@playwright/test'

import { gotoList, mockApiSuccess } from './helpers/api'

test.describe('Path 2: Filtrado por preferencias (bottom sheet)', () => {
  test('abre el sheet, filtra por Fuego y actualiza la lista', async ({ page }) => {
    await mockApiSuccess(page)
    await gotoList(page)

    // Abre el bottom sheet de filtros.
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    await expect(page.locator('.sheet')).toBeVisible()
    await expect(page.locator('.sheet__title')).toContainText('Filtra por tus preferencias')

    // La lista de tipos muestra opciones con checkboxes.
    const options = page.locator('.sheet__option')
    await expect(options.first()).toBeVisible()
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThan(0)

    // Selecciona "Fuego" clickeando el label de la opción (activa el checkbox).
    const fireOption = page.locator('.sheet__option', { hasText: 'Fuego' })
    await fireOption.click()
    await expect(fireOption).toHaveClass(/sheet__option--selected/)

    // Aplicar.
    await page.getByRole('button', { name: 'Aplicar' }).click()

    // El sheet se cierra y la lista queda solo con los de tipo Fuego (charmander).
    await expect(page.locator('.sheet')).toBeHidden()
    await expect(page.locator('.pokemon-card__name')).toHaveText(['Charmander'])
  })
})
