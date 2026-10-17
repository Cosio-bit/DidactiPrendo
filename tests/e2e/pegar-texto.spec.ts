import { expect, test } from '@playwright/test'

const nombres = Array.from({ length: 30 }, (_, i) => `Estudiante ${i + 1}`)

const preguntasDeChatGPT = `¡Claro! Aquí tienes 2 preguntas:

**1. ¿Cuánto es 1/2 + 1/4?**
a) 2/6
*b) 3/4
c) 1/8

**2. ¿Cuál es la capital de Chile?**
a) Valparaíso
b) Santiago
c) Concepción`

test('pegar una lista de nombres arma una ruleta con vista previa', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(nombres.map((n) => `•\t${n}`).join('\r\n'))

  const vista = page.getByRole('region', { name: 'Así quedará' })
  await expect(vista.getByRole('radio', { name: 'Ruleta (sugerido)' })).toBeChecked()
  await expect(vista.getByText('30 elementos', { exact: true })).toBeVisible()
  await expect(vista.getByRole('listitem').first()).toHaveText('Estudiante 1')

  await page.getByLabel('Nombre de la actividad').fill('6°B')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Ruleta · 30 elementos')).toBeVisible()
})

test('pegar preguntas de ChatGPT sugiere preguntas y explica lo que no entendió', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(preguntasDeChatGPT)

  const vista = page.getByRole('region', { name: 'Así quedará' })
  await expect(vista.getByRole('radio', { name: 'Preguntas con alternativas (sugerido)' })).toBeChecked()
  await expect(vista.getByText('2 preguntas', { exact: true })).toBeVisible()
  await expect(vista.getByText('b) 3/4 ✓ correcta')).toBeVisible()
  await expect(vista.getByText('Revisa esto')).toBeVisible()
  await expect(vista).toContainText('La pregunta 2 no tiene la respuesta correcta marcada')
  await expect(vista).toContainText('«¡Claro! Aquí tienes 2 preguntas:»')
})

test('el profe puede cambiar el tipo sugerido, se guarda y se puede deshacer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(preguntasDeChatGPT)
  const vista = page.getByRole('region', { name: 'Así quedará' })

  await vista.getByRole('radio', { name: /^Ruleta/ }).check()
  await expect(vista.getByText('8 elementos', { exact: true })).toBeVisible()

  await page.reload()
  await expect(vista.getByRole('radio', { name: /^Ruleta/ })).toBeChecked()

  // Tras recargar no queda historial: Deshacer está desactivado.
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeDisabled()

  await vista.getByRole('radio', { name: /^Preguntas/ }).check()
  await expect(vista.getByText('2 preguntas', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(vista.getByRole('radio', { name: /^Ruleta/ })).toBeChecked()
})

test('la pantalla de pegar texto cabe en 1024×768', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(nombres.join('\n'))

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(768)
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeInViewport()
})
