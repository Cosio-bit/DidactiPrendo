import { expect, test } from '@playwright/test'

test('la pantalla de inicio saluda al profe y ofrece dos acciones grandes, crear con IA, las siete actividades y cargar material', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hola, profe' })).toBeVisible()

  await expect(page.locator('.inicio__acciones').getByRole('button')).toHaveText(['Crear actividad', 'Mis actividades'])
  const acciones = page.locator('main').getByRole('button')
  await expect(acciones).toHaveText([
    'Crear actividad',
    'Mis actividades',
    'Crear con IA',
    /^Ruleta/,
    /^Selección múltiple/,
    /^Parejas/,
    /^Términos pareados/,
    /^Verdadero o falso/,
    /^Ordenar/,
    /^Clasificar/,
    'Cargar material',
  ])
  for (const boton of await acciones.all()) {
    const caja = (await boton.boundingBox())!
    expect(caja.height).toBeGreaterThanOrEqual(48)
    expect(caja.width).toBeGreaterThanOrEqual(48)
  }
})

test('los pasos y el botón para crear se ven sin desplazarse en 1024×768', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Así funciona' })).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('button', { name: 'Crear actividad' })).toBeInViewport({ ratio: 1 })
})

test('tocar una actividad del inicio abre el editor con ella elegida y cómo escribirla', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Parejas/ }).click()
  await expect(page.getByRole('heading', { name: 'Tu actividad' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Parejas' })).toBeChecked()
  await expect(page.getByText('Una pareja por línea, separada por =.')).toBeVisible()
})

test('el logo completo va al pie del inicio, no entre los botones', async ({ page }) => {
  await page.goto('/')
  const pie = page.locator('main footer')
  await expect(pie).toContainText('Así de fácil, enseño y aprendo')
  const cargar = (await page.getByRole('button', { name: 'Cargar material' }).boundingBox())!
  const logo = (await pie.boundingBox())!
  expect(logo.y).toBeGreaterThan(cargar.y + cargar.height)
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
