import { expect, test } from '@playwright/test'

test('la pantalla de inicio saluda al profe y ofrece dos acciones grandes, y cargar material', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hola, profe' })).toBeVisible()

  await expect(page.locator('.inicio__acciones').getByRole('button')).toHaveText(['Crear actividad', 'Mis actividades'])
  const acciones = page.locator('main').getByRole('button')
  await expect(acciones).toHaveText(['Crear actividad', 'Mis actividades', 'Cargar material'])
  for (const boton of await acciones.all()) {
    const caja = (await boton.boundingBox())!
    expect(caja.height).toBeGreaterThanOrEqual(48)
    expect(caja.width).toBeGreaterThanOrEqual(48)
  }
})

test('todo cabe en 1024×768 sin barra horizontal', async ({ page }) => {
  await page.goto('/')
  const anchoContenido = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(anchoContenido).toBeLessThanOrEqual(1024)
})

test('el tema de alto contraste se activa y se recuerda', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Alto contraste' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'alto-contraste')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'alto-contraste')
  await expect(page.getByRole('button', { name: 'Alto contraste' })).toHaveAttribute('aria-pressed', 'true')
})
