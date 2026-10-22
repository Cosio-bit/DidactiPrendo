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

test('completar la frase: mostrar las palabras no cambia la letra ni hace saltar la frase de línea', async ({ page }) => {
  await proyectar(
    page,
    'La [fotosíntesis] ocurre en las [hojas] de la planta, gracias a la luz del [Sol] y al agua que sube por el [tallo].',
  )
  const contenido = '.proyeccion-preguntas__contenido'
  const frase = page.locator('.proyeccion-completar__frase')
  await expect(page.getByText('Frase 1 de 1')).toBeVisible()
  const inicial = await letra(page, contenido)
  const alto = (await frase.boundingBox())!.height
  const posiciones = await page.locator('.hueco').evaluateAll((hs) => hs.map((h) => h.getBoundingClientRect().toJSON()))
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Space')
    expect(await letra(page, contenido)).toBe(inicial)
  }
  await expect(page.locator('.hueco--visible')).toHaveCount(4)
  expect((await frase.boundingBox())!.height).toBe(alto)
  expect(await page.locator('.hueco').evaluateAll((hs) => hs.map((h) => h.getBoundingClientRect().toJSON()))).toEqual(posiciones)
})

test('rosco de letras: responder no cambia el tamaño de la letra', async ({ page }) => {
  await proyectar(page, 'A: Insecto que hace miel = abeja\nB: Mamífero marino más grande del planeta = ballena')
  const texto = '.proyeccion-rosco__texto'
  const inicial = await letra(page, texto)
  await page.keyboard.press('i')
  await expect(page.locator('.proyeccion-rosco__respuesta')).toHaveText('✗ Era: abeja')
  expect(await letra(page, texto)).toBe(inicial)
})

test('¿quién soy?: las pistas y la respuesta aparecen sin cambiar el tamaño de la letra', async ({ page }) => {
  await proyectar(
    page,
    "Bernardo O'Higgins\nNací en Chillán.\nEstudié en Inglaterra y conocí a Francisco de Miranda.\nFui Director Supremo.",
    '¿Quién soy?',
  )
  const contenido = '.proyeccion-quien-soy__contenido'
  const inicial = await letra(page, contenido)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Space')
    expect(await letra(page, contenido)).toBe(inicial)
  }
  await expect(page.locator('.proyeccion-quien-soy__respuesta')).toHaveAttribute('aria-hidden', 'false')
})
