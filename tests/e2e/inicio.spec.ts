import { expect, test } from '@playwright/test'

test('la pantalla de inicio saluda al profe', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hola, profe' })).toBeVisible()
})
