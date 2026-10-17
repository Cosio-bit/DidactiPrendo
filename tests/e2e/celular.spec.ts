import { expect, test, type Page } from '@playwright/test'

/** Nada debe salirse por el lado: en el celular nunca hay que desplazarse horizontalmente. */
async function nadaSeSalePorElLado(page: Page) {
  const fuera = await page.evaluate(() => {
    const ancho = document.documentElement.clientWidth
    const elementos = [...document.querySelectorAll<HTMLElement>('body *')].filter((e) => {
      const caja = e.getBoundingClientRect()
      return caja.width > 0 && (caja.right > ancho + 1 || caja.left < -1) && !e.closest('svg, .solo-lector')
    })
    return {
      ancho: document.documentElement.scrollWidth - ancho,
      elementos: elementos.slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.className}`),
    }
  })
  expect(fuera).toEqual({ ancho: 0, elementos: [] })
}

for (const [ancho, alto] of [
  [375, 740],
  [360, 640],
  [740, 360],
]) {
  test.describe(`celular ${ancho}×${alto}`, () => {
    test.use({ viewport: { width: ancho, height: alto }, hasTouch: true, isMobile: true })

    test('crear y proyectar paso a paso, sin desplazarse hacia el lado', async ({ page }) => {
      await page.goto('/')
      await nadaSeSalePorElLado(page)
      await page.getByRole('button', { name: 'Crear actividad' }).click()

      // Paso 1: el texto. Sin texto no se puede seguir.
      await expect(page.getByRole('heading', { name: 'Paso 1 de 3: Pega tu texto' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Siguiente →' })).toBeDisabled()
      await nadaSeSalePorElLado(page)
      await page.getByLabel('Pega tu texto aquí').fill('perro = dog\ngato = cat\ncasa = house')
      await expect(page.getByRole('status')).toHaveText('Guardado')
      await page.getByRole('button', { name: 'Siguiente →' }).click()

      // Paso 2: la actividad, con la vista previa.
      await expect(page.getByRole('heading', { name: 'Paso 2 de 3: Elige la actividad' })).toBeFocused()
      await expect(page.getByRole('radio', { name: 'Parejas (sugerido)' })).toBeChecked()
      await expect(page.getByText('3 parejas', { exact: true })).toBeVisible()
      await nadaSeSalePorElLado(page)
      await page.getByRole('button', { name: 'Siguiente →' }).click()

      // Paso 3: proyectar.
      await expect(page.getByRole('heading', { name: 'Paso 3 de 3: Proyecta' })).toBeVisible()
      await nadaSeSalePorElLado(page)
      await page.getByRole('button', { name: 'Proyectar' }).last().click()
      await expect(page.locator('.carta')).toHaveCount(6)
      await nadaSeSalePorElLado(page)
      for (const carta of await page.locator('.carta').all()) await expect(carta).toBeInViewport()

      await page.getByRole('button', { name: 'Volver a editar' }).click()
      await expect(page.getByRole('heading', { name: /^Paso \d de 3/ })).toBeVisible()
    })

    test('las proyecciones y la lista caben a lo ancho', async ({ page }) => {
      const casos: [string, string?][] = [
        ['Ana\nBenjamín\nCatalina\nDiego'],
        ['¿Cuánto es 2 + 2?\na) 3\n*b) 4\nc) 5'],
        ['Semilla\nGerminación\nPlanta\nFlor\nFruto', 'Ordenar'],
        ['Mamíferos: perro, ballena\nAves: cóndor, loica\nPeces: jurel, congrio'],
      ]
      for (const [texto, tipo] of casos) {
        await page.goto('/')
        await page.getByRole('button', { name: 'Crear actividad' }).click()
        await page.getByLabel('Pega tu texto aquí').fill(texto)
        await expect(page.getByRole('status')).toHaveText('Guardado')
        await page.getByRole('button', { name: 'Siguiente →' }).click()
        if (tipo) await page.getByRole('radio', { name: tipo }).check()
        await page.getByRole('button', { name: 'Siguiente →' }).click()
        await page.getByRole('button', { name: 'Proyectar' }).last().click()
        await expect(page.locator('.proyeccion')).toBeVisible()
        await nadaSeSalePorElLado(page)
      }
      await page.goto('/#/actividades')
      await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
      await nadaSeSalePorElLado(page)
    })
  })
}
