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

const ficha = (page: Page, texto: string) => page.locator('.proyeccion-ordenar__fichas button.ficha').filter({ hasText: texto })

const lugar = (page: Page, n: number) => page.getByRole('button', { name: `Lugar ${n}`, exact: true })

test('ordenar: se toma un elemento, se toca su lugar y se comprueba, en cualquier orden', async ({ page }) => {
  await proyectarOrdenar(page)
  await expect(page.locator('button.ficha')).toHaveCount(5)

  // En un lugar equivocado queda marcado y sigue tomado, para probar en otro.
  await ficha(page, 'Fruto').click()
  await expect(ficha(page, 'Fruto')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Ahora toca su lugar en el orden')).toBeVisible()
  await lugar(page, 1).click()
  await expect(ficha(page, 'Fruto')).toContainText('No va en el 1')
  await expect(page.getByText('0 de 5 en su lugar')).toBeVisible()

  // Se puede empezar por el final.
  await lugar(page, 5).click()
  await expect(page.getByText('1 de 5 en su lugar')).toBeVisible()
  await expect(lugar(page, 5)).toHaveCount(0)

  for (const [i, paso] of ciclo.slice(0, 4).entries()) {
    await ficha(page, paso).click()
    await lugar(page, i + 1).click()
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

  // Con Tab se llega a una ficha, Enter la toma y su número la lleva a ese lugar.
  await ficha(page, 'Flor').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('4')
  await expect(page.getByText('2 de 5 en su lugar')).toBeVisible()
  await expect(page.locator('.casilla--llena')).toHaveText([/^1[A-E] Semilla$/, /^4[A-E] Flor$/])

  // Esc suelta la ficha tomada sin salir de la proyección.
  await ficha(page, 'Fruto').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(ficha(page, 'Fruto')).toHaveAttribute('aria-pressed', 'false')

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
  await expect(page.locator('button.ficha')).toHaveCount(12)
  const contenido = page.locator('.proyeccion-ordenar__contenido')
  expect(await contenido.evaluate((c) => c.scrollHeight - c.clientHeight)).toBeLessThanOrEqual(0)
  await expect(page.getByRole('button', { name: 'Mostrar el que sigue' })).toBeInViewport()
})
