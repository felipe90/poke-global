import { test, expect } from '@playwright/test'

test('cold load runs the fixed Splash → Onboarding flow', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.onboarding-view')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible()
})

test('completing onboarding reaches the Pokedex list', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Empecemos' }).click()
  await expect(page.locator('.pokedex-list-view')).toBeVisible()
})

test('deep-linking /favorites restores the target after the flow', async ({ page }) => {
  await page.goto('/favorites')
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Empecemos' }).click()
  await expect(page.locator('.favorites-view')).toBeVisible()
})
