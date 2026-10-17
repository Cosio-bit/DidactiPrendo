import { expect, test, type Page } from '@playwright/test'

/** Tamaño de letra del contenido proyectado: no debe cambiar mientras se juega. */
const letra = (page: Page, selector: string) =>
  page.locator(selector).evaluate((c) => getComputedStyle(c).fontSize)

async function proyectar(page: Page, texto: string, tipo?: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  if (tipo) await page.getByRole('radio', { name: tipo }).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
}

test('clasificar: la letra no cambia de tamaño al jugar y nada se corre', async ({ page }) => {
  await proyectar(page, 'Mamíferos: perro, ballena, murciélago\nAves: cóndor, pingüino de Humboldt, loica\nPeces: jurel')
  const contenido = '.proyeccion-ordenar__contenido'
  const inicial = await letra(page, contenido)
  const posicion = await page.locator('.proyeccion-ordenar__fichas button.ficha').last().boundingBox()

  await page.locator('.proyeccion-ordenar__fichas button.ficha').first().click()
  expect(await letra(page, contenido)).toBe(inicial)
  await page.getByRole('button', { name: '3: Peces' }).click()
  expect(await letra(page, contenido)).toBe(inicial)
  for (let i = 0; i < 4; i++) await page.keyboard.press('Space')
  expect(await letra(page, contenido)).toBe(inicial)
  // Las fichas que quedan no se corren de lugar.
  const ultima = page.locator('.proyeccion-ordenar__fichas li').last()
  if (await ultima.locator('button').count()) {
    expect(await ultima.locator('button').boundingBox()).toEqual(posicion)
  }
  for (let i = 0; i < 3; i++) await page.keyboard.press('Space')
  await expect(page.getByText('¡Todo clasificado!')).toBeVisible()
  expect(await letra(page, contenido)).toBe(inicial)
})

test('ordenar: la letra no cambia de tamaño al ir colocando', async ({ page }) => {
  await proyectar(page, 'Semilla\nGerminación de la semilla en la tierra húmeda\nPlanta\nFlor\nFruto', 'Ordenar')
  const contenido = '.proyeccion-ordenar__contenido'
  const inicial = await letra(page, contenido)
  await page.locator('.proyeccion-ordenar__fichas button.ficha').filter({ hasText: 'Fruto' }).click()
  expect(await letra(page, contenido)).toBe(inicial)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space')
    expect(await letra(page, contenido)).toBe(inicial)
  }
  await expect(page.getByText('¡Quedó ordenado!')).toBeVisible()
})

test('selección múltiple: revelar y comentar el error no cambian el tamaño de la letra', async ({ page }) => {
  await page.clock.install()
  await proyectar(page, '¿Cuál es la capital de la Región de Ñuble?\na) Concepción\n*b) Chillán\nc) Los Ángeles\nd) Talca')
  const contenido = '.proyeccion-preguntas__contenido'
  await expect(page.getByText('Pregunta 1 de 1')).toBeVisible()
  const inicial = await letra(page, contenido)
  await page.keyboard.press('c')
  expect(await letra(page, contenido)).toBe(inicial)
  await page.keyboard.press('Space')
  await expect(page.locator('.alternativa-proyectada--correcta')).toBeVisible()
  expect(await letra(page, contenido)).toBe(inicial)
})
