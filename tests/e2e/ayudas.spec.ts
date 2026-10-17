import { expect, test } from '@playwright/test'

test('el inicio explica en una frase qué hace la app y cómo se usa', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Convierte tus listas y preguntas en actividades')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Así funciona' }).getByRole('listitem')).toHaveCount(3)
})

test('con la lista vacía se puede crear una actividad ahí mismo', async ({ page }) => {
  await page.goto('/#/actividades')
  await expect(page.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await expect(page.getByLabel('Pega tu texto aquí')).toBeFocused()
})

test('cada tipo explica cómo escribirlo y trae un ejemplo para probar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  const cuadro = page.getByLabel('Pega tu texto aquí')

  for (const [tipo, explicacion, cantidad] of [
    ['Parejas', 'Una pareja por línea', '3 parejas'],
    ['Verdadero o falso', 'con (V) o (F) al final', '2 afirmaciones'],
    ['Clasificar', 'Cada categoría con dos puntos', '2 categorías'],
  ]) {
    await cuadro.fill('')
    await page.getByRole('radio', { name: new RegExp(`^${tipo}`) }).check()
    await expect(page.getByText(explicacion)).toBeVisible()
    await expect(cuadro).toHaveAttribute('placeholder', /^Por ejemplo:/)
    await page.getByRole('button', { name: 'Probar con este ejemplo' }).click()
    await expect(page.getByText(cantidad, { exact: true })).toBeVisible()
    await expect(page.getByRole('radio', { name: new RegExp(`^${tipo}`) })).toBeChecked()
  }
})

test('una actividad sin nombre se reconoce por su contenido', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill('Ana\nBenjamín\nCatalina')
  await expect(page.getByLabel('Nombre de la actividad')).toHaveAttribute('placeholder', 'Ana, Benjamín, Catalina')
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('heading', { name: 'Ana, Benjamín, Catalina' })).toBeVisible()
  await expect(page.getByText('Ruleta · 3 elementos · Modificada hoy')).toBeVisible()
})

test('en la ruleta ningún nombre queda de cabeza', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill('Ana\nBenjamín\nCatalina\nDiego\nEmilia\nFlorencia')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  const giros = await page.locator('.rueda text').evaluateAll((textos) =>
    textos.map((t) => {
      const m = (t as SVGTextElement).getCTM()!
      return (Math.atan2(m.b, m.a) * 180) / Math.PI
    }),
  )
  // Ningún texto girado más de 90° hacia cualquier lado (se leería al revés).
  for (const giro of giros) expect(Math.abs(giro)).toBeLessThanOrEqual(90)
})

test('el botón para salir de la proyección dice adónde vuelve', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill('Ana\nBenjamín\nCatalina')
  await expect(page.getByRole('status')).toHaveText('Guardado')

  // Desde el editor: vuelve a editar.
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByRole('button', { name: 'Salir' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Volver a editar' }).click()
  await expect(page.getByLabel('Pega tu texto aquí')).toHaveValue('Ana\nBenjamín\nCatalina')

  // Desde Mis actividades: vuelve a la lista.
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByText('Esc: volver')).toBeVisible()
  await page.getByRole('button', { name: 'Volver a Mis actividades' }).click()
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
})
