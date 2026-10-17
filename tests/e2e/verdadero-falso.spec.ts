import { expect, test, type Page } from '@playwright/test'

const afirmaciones = [
  'La ballena es un mamífero (V)',
  'El sol es un planeta (F)',
  'Chile tiene 16 regiones (V)',
  'Las arañas son insectos (F)',
].join('\n')

const pantalla = (page: Page) => page.locator('.proyeccion-preguntas')

async function crear(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(afirmaciones)
  await expect(page.getByRole('radio', { name: 'Verdadero o falso (sugerido)' })).toBeChecked()
  await expect(page.getByText('4 afirmaciones', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

test('verdadero o falso: se proyecta de principio a fin con el teclado', async ({ page }) => {
  await crear(page)
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(pantalla(page)).toContainText('Afirmación 1 de 4')
  await expect(pantalla(page)).toContainText('La ballena es un mamífero')
  await expect(page.getByRole('button', { name: 'Comentar el error' })).toHaveCount(0)

  const respuestas = ['V', 'F', 'V', 'F']
  for (let i = 0; i < 4; i++) {
    await expect(pantalla(page)).toContainText(`Afirmación ${i + 1} de 4`)
    await page.keyboard.press('Space')
    const correcta = page.locator('.alternativa-proyectada--correcta')
    await expect(correcta).toContainText(respuestas[i] === 'V' ? 'VVerdadero' : 'FFalso')
    await page.keyboard.press('ArrowRight')
  }
  await expect(page.getByText('¡Terminaron el repaso!')).toBeVisible()
})

test('verdadero o falso: imprimir tarjetas V y F y las afirmaciones con su pauta', async ({ page }) => {
  await crear(page)
  await page.getByRole('button', { name: 'Imprimir' }).click()
  await expect(page.getByRole('radio', { name: 'Tarjetas V y F' })).toBeChecked()
  await expect(page.locator('.tarjeta__letra')).toHaveText(['V', 'F', 'V', 'F'])

  await page.getByRole('radio', { name: 'Las afirmaciones en papel' }).check()
  await expect(page.locator('.hoja__pregunta')).toHaveCount(4)
  await expect(page.locator('.hoja--texto').first()).not.toContainText('(V)')
  await expect(page.locator('.hoja__respuestas li')).toHaveText(['V', 'F', 'V', 'F'])
})
