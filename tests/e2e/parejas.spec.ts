import { expect, test, type Page } from '@playwright/test'

const parejas = { perro: 'dog', gato: 'cat', casa: 'house', sol: 'sun' }
const texto = Object.entries(parejas)
  .map(([a, b]) => `${a} = ${b}`)
  .join('\n')

async function proyectarMemorice(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  await expect(page.getByRole('radio', { name: 'Parejas (sugerido)' })).toBeChecked()
  await expect(page.getByText('4 parejas', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByText('Parejas: 0 de 4')).toBeVisible()
}

/** Lo que dice cada carta por dentro (en el orden en que quedaron mezcladas). */
async function caras(page: Page) {
  return page.locator('.carta__cara').allTextContents()
}

function companera(texto: string) {
  const entrada = Object.entries(parejas).find(([a, b]) => a === texto || b === texto)!
  return entrada[0] === texto ? entrada[1] : entrada[0]
}

test('memorice: las cartas parten tapadas, se voltean y se encuentran todas las parejas', async ({ page }) => {
  await proyectarMemorice(page)
  const cartas = page.locator('.carta')
  await expect(cartas).toHaveCount(8)
  await expect(page.locator('.carta--visible')).toHaveCount(0)
  // Tapadas, solo se lee el número.
  await expect(cartas.first()).toHaveAccessibleName('Carta 1, tapada')

  const textos = await caras(page)

  // Un par equivocado: quedan a la vista hasta "Tapar".
  const primera = 0
  const equivocada = textos.findIndex((t, i) => i !== primera && t !== companera(textos[primera]))
  await cartas.nth(primera).click()
  await cartas.nth(equivocada).click()
  await expect(page.getByText('No son pareja')).toBeVisible()
  await expect(page.locator('.carta--visible')).toHaveCount(2)
  await page.getByRole('button', { name: 'Tapar' }).click()
  await expect(page.locator('.carta--visible')).toHaveCount(0)

  // Encontrar todas.
  const usadas = new Set<number>()
  for (let i = 0; i < textos.length; i++) {
    if (usadas.has(i)) continue
    const j = textos.findIndex((t, k) => k !== i && t === companera(textos[i]))
    usadas.add(i).add(j)
    await cartas.nth(i).click()
    await cartas.nth(j).click()
    await expect(page.getByText('¡Son pareja!').or(page.getByText('¡Encontraron todas!'))).toBeVisible()
  }
  await expect(page.getByText('¡Encontraron todas!')).toBeVisible()
  await expect(page.getByText('Parejas: 4 de 4')).toBeVisible()
  await expect(page.locator('.carta--encontrada')).toHaveCount(8)
})

test('memorice: se juega solo con el teclado', async ({ page }) => {
  await proyectarMemorice(page)
  const cartas = page.locator('.carta')
  await expect(cartas.first()).toBeFocused()

  await page.keyboard.press('ArrowRight')
  await expect(cartas.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(cartas.nth(1)).toHaveClass(/carta--visible/)

  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  await expect(page.locator('.carta--visible')).toHaveCount(2)

  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()
})

test('memorice: "Mostrar todas" descubre las cartas para repasar', async ({ page }) => {
  await proyectarMemorice(page)
  await page.getByRole('button', { name: 'Mostrar todas' }).click()
  await expect(page.locator('.carta--visible')).toHaveCount(8)
  await page.getByRole('button', { name: 'Mostrar todas' }).click()
  await expect(page.locator('.carta--visible')).toHaveCount(0)
})

test('memorice con 12 parejas cabe en 1024×768', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  const muchas = Array.from({ length: 12 }, (_, i) => `palabra ${i + 1} = definición número ${i + 1}`).join('\n')
  await page.getByLabel('Pega tu texto aquí').fill(muchas)
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.locator('.carta')).toHaveCount(24)
  for (const carta of await page.locator('.carta').all()) await expect(carta).toBeInViewport()
  const caja = (await page.locator('.carta').first().boundingBox())!
  expect(caja.width).toBeGreaterThanOrEqual(100)
  expect(caja.height).toBeGreaterThanOrEqual(80)
})
