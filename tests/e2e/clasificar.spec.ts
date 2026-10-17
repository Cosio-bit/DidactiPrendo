import { expect, test, type Page } from '@playwright/test'

const texto = 'Mamíferos: perro, ballena, murciélago\nAves: cóndor, pingüino, loica\nReptiles: lagarto, tortuga'
const categoriaDe: Record<string, string> = {
  perro: '1: Mamíferos',
  ballena: '1: Mamíferos',
  murciélago: '1: Mamíferos',
  cóndor: '2: Aves',
  pingüino: '2: Aves',
  loica: '2: Aves',
  lagarto: '3: Reptiles',
  tortuga: '3: Reptiles',
}

async function proyectarClasificar(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Nombre de la actividad').fill('Vertebrados')
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  await expect(page.getByRole('radio', { name: 'Clasificar (sugerido)' })).toBeChecked()
  await expect(page.getByText('3 categorías', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByText('0 de 8 clasificados')).toBeVisible()
}

const ficha = (page: Page, nombre: string) => page.locator('.ficha').filter({ hasText: nombre })

test('clasificar: se elige un elemento, se toca su categoría y se comprueba', async ({ page }) => {
  await proyectarClasificar(page)
  await expect(page.locator('.ficha')).toHaveCount(8)

  // Equivocado: queda marcado y sigue suelto.
  await ficha(page, 'perro').click()
  await page.getByRole('button', { name: '2: Aves' }).click()
  await expect(ficha(page, 'perro')).toContainText('No va en «Aves»')
  await expect(page.getByText('0 de 8 clasificados')).toBeVisible()

  // Con el mismo elegido, a la categoría correcta.
  await page.getByRole('button', { name: '1: Mamíferos' }).click()
  await expect(page.getByText('1 de 8 clasificados')).toBeVisible()
  await expect(page.getByRole('button', { name: '1: Mamíferos' })).toContainText('perro')

  for (const [elemento, categoria] of Object.entries(categoriaDe)) {
    if (elemento === 'perro') continue
    await ficha(page, elemento).click()
    await page.getByRole('button', { name: categoria }).click()
  }
  await expect(page.getByText('¡Todo clasificado!')).toBeVisible()
  await expect(page.locator('.ficha')).toHaveCount(0)
})

test('clasificar: solo con teclado', async ({ page }) => {
  await proyectarClasificar(page)

  // Tab hasta una ficha, Enter para elegirla y su número para ubicarla.
  await ficha(page, 'cóndor').focus()
  await page.keyboard.press('Enter')
  await expect(ficha(page, 'cóndor')).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('2')
  await expect(page.getByText('1 de 8 clasificados')).toBeVisible()

  // Espacio muestra dónde va el siguiente; la flecha izquierda deshace.
  await page.keyboard.press('Space')
  await expect(page.getByText('2 de 8 clasificados')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('1 de 8 clasificados')).toBeVisible()
  for (let i = 0; i < 7; i++) await page.keyboard.press('Space')
  await expect(page.getByText('¡Todo clasificado!')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()
})

test('clasificar con 4 categorías y 16 elementos cabe en 1024×768', async ({ page }) => {
  const tabla = [
    'Sólido\tLíquido\tGaseoso\tPlasma',
    'hielo\tagua\tvapor\trayo',
    'piedra\tleche\taire\tsol',
    'madera\taceite\toxígeno\tauroras',
    'arena\tjugo\thumo\tfuego',
  ].join('\n')
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(tabla)
  await expect(page.getByRole('radio', { name: 'Clasificar (sugerido)' })).toBeChecked()
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.locator('.ficha')).toHaveCount(16)
  for (let i = 0; i < 16; i++) await page.keyboard.press('Space')
  await expect(page.getByText('¡Todo clasificado!')).toBeVisible()
  const contenido = page.locator('.proyeccion-ordenar__contenido')
  expect(await contenido.evaluate((c) => c.scrollHeight - c.clientHeight)).toBeLessThanOrEqual(0)
})
