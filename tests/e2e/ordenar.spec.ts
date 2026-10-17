import { expect, test, type Page } from '@playwright/test'

const ciclo = ['Semilla', 'Germinación', 'Planta', 'Flor', 'Fruto']

async function proyectarOrdenar(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Nombre de la actividad').fill('Ciclo de vida de una planta')
  await page.getByLabel('Pega tu texto aquí').fill(ciclo.join('\n'))
  // Ordenar nunca se sugiere: se elige.
  await expect(page.getByRole('radio', { name: 'Ruleta (sugerido)' })).toBeChecked()
  await page.getByRole('radio', { name: 'Ordenar' }).check()
  await expect(page.getByText('5 elementos', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByText('0 de 5 en su lugar')).toBeVisible()
}

const ficha = (page: Page, texto: string) => page.locator('.proyeccion-ordenar__fichas .ficha').filter({ hasText: texto })

test('ordenar: el curso propone, se comprueba y queda ordenado', async ({ page }) => {
  await proyectarOrdenar(page)
  await expect(page.locator('.ficha')).toHaveCount(5)

  // Una propuesta equivocada queda marcada y no se coloca.
  await ficha(page, 'Fruto').click()
  await expect(ficha(page, 'Fruto')).toContainText('No va aquí')
  await expect(page.getByText('0 de 5 en su lugar')).toBeVisible()

  for (const [i, paso] of ciclo.entries()) {
    await ficha(page, paso).click()
    if (i < ciclo.length - 1) await expect(page.getByText(`${i + 1} de 5 en su lugar`)).toBeVisible()
  }
  await expect(page.getByText('¡Quedó ordenado!')).toBeVisible()
  await expect(page.locator('.casilla--llena')).toHaveText(ciclo.map((p, i) => new RegExp(`^${i + 1}[A-E] ${p}$`)))
})

test('ordenar: solo con teclado, revelando paso a paso y deshaciendo', async ({ page }) => {
  await proyectarOrdenar(page)
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('2 de 5 en su lugar')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('1 de 5 en su lugar')).toBeVisible()

  // Con Tab se llega a una ficha y Enter la propone.
  await ficha(page, 'Germinación').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('2 de 5 en su lugar')).toBeVisible()

  for (let i = 0; i < 3; i++) await page.keyboard.press('Space')
  await expect(page.getByText('¡Quedó ordenado!')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()
})

test('ordenar con 12 elementos cabe en 1024×768', async ({ page }) => {
  const pasos = [
    'Lavarse las manos', 'Sacar los ingredientes', 'Medir la harina', 'Agregar los huevos',
    'Batir la mezcla', 'Engrasar el molde', 'Verter la mezcla', 'Precalentar el horno',
    'Hornear 30 minutos', 'Dejar enfriar', 'Desmoldar', 'Decorar el queque',
  ]
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(pasos.join('\n'))
  await page.getByRole('radio', { name: 'Ordenar' }).check()
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.locator('.ficha')).toHaveCount(12)
  const contenido = page.locator('.proyeccion-ordenar__contenido')
  expect(await contenido.evaluate((c) => c.scrollHeight - c.clientHeight)).toBeLessThanOrEqual(0)
  await expect(page.getByRole('button', { name: 'Mostrar el que sigue' })).toBeInViewport()
})
