import { expect, test, type Locator, type Page } from '@playwright/test'

async function centro(locator: Locator) {
  const caja = (await locator.boundingBox())!
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 }
}

/** Arrastra con el mouse desde un elemento hasta un punto, pasando por varios puntos intermedios. */
async function arrastrar(page: Page, desde: Locator, hasta: { x: number; y: number }) {
  const inicio = await centro(desde)
  await page.mouse.move(inicio.x, inicio.y)
  await page.mouse.down()
  await page.mouse.move(inicio.x + 20, inicio.y + 20, { steps: 4 })
  await page.mouse.move(hasta.x, hasta.y, { steps: 12 })
}

async function proyectar(page: Page, texto: string, tipo?: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  if (tipo) await page.getByRole('radio', { name: tipo }).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
}

const ficha = (page: Page, texto: string) => page.locator('.proyeccion-ordenar__fichas button.ficha').filter({ hasText: texto })

test('clasificar: arrastrar con el mouse a la categoría, con la ficha siguiendo al puntero', async ({ page }) => {
  await proyectar(page, 'Mamíferos: perro, ballena\nAves: cóndor, loica')
  const aves = page.getByRole('button', { name: '2: Aves' })

  await arrastrar(page, ficha(page, 'cóndor'), await centro(aves))
  // Mientras se arrastra: la copia sigue al puntero y la categoría de destino se ilumina.
  await expect(page.locator('.ficha--fantasma')).toHaveText('cóndor')
  await expect(aves).toHaveClass(/categoria--destino/)
  await page.mouse.up()

  await expect(page.locator('.ficha--fantasma')).toHaveCount(0)
  await expect(aves).toContainText('cóndor')
  await expect(page.getByText('1 de 4 clasificados')).toBeVisible()

  // A la categoría equivocada: vuelve marcada.
  await arrastrar(page, ficha(page, 'perro'), await centro(aves))
  await page.mouse.up()
  await expect(ficha(page, 'perro')).toContainText('No va en «Aves»')
})

test('clasificar: si se suelta sin querer fuera de una categoría, la ficha sigue agarrada', async ({ page }) => {
  await proyectar(page, 'Mamíferos: perro, ballena\nAves: cóndor, loica')
  const mamiferos = page.getByRole('button', { name: '1: Mamíferos' })

  // Se suelta en la barra de abajo, lejos de las categorías.
  await arrastrar(page, ficha(page, 'ballena'), await centro(page.locator('.proyeccion__teclas')))
  await page.mouse.up()
  await expect(ficha(page, 'ballena')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Ahora toca su categoría')).toBeVisible()

  // Con el mouse, la copia sigue al cursor sin apretar el botón; un clic en la categoría la deja ahí.
  const destino = await centro(mamiferos)
  await page.mouse.move(destino.x, destino.y, { steps: 8 })
  await expect(page.locator('.ficha--fantasma')).toHaveText('ballena')
  await expect(mamiferos).toHaveClass(/categoria--destino/)
  await page.mouse.click(destino.x, destino.y)
  await expect(mamiferos).toContainText('ballena')

  // Esc suelta la ficha agarrada en vez de salir de la proyección.
  await arrastrar(page, ficha(page, 'loica'), await centro(page.locator('.proyeccion__teclas')))
  await page.mouse.up()
  await page.keyboard.press('Escape')
  await expect(ficha(page, 'loica')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.proyeccion')).toBeVisible()
})

test('ordenar: arrastrar a cualquier lugar; soltada fuera queda agarrada y un clic en un lugar la pone', async ({ page }) => {
  await proyectar(page, 'Semilla\nGerminación\nPlanta\nFlor', 'Ordenar')
  const lugar = (n: number) => page.getByRole('button', { name: `Lugar ${n}`, exact: true })

  // Directo al último lugar.
  await arrastrar(page, ficha(page, 'Flor'), await centro(lugar(4)))
  await expect(lugar(4)).toHaveClass(/casilla--destino/)
  await expect(page.locator('.casilla--destino')).toHaveCount(1)
  await page.mouse.up()
  await expect(page.getByText('1 de 4 en su lugar')).toBeVisible()

  // Equivocada: se marca "No va en el 1" y sigue agarrada.
  await arrastrar(page, ficha(page, 'Planta'), await centro(lugar(1)))
  await page.mouse.up()
  await expect(ficha(page, 'Planta')).toContainText('No va en el 1')
  await expect(ficha(page, 'Planta')).toHaveAttribute('aria-pressed', 'true')
  await lugar(3).click()
  await expect(page.getByText('2 de 4 en su lugar')).toBeVisible()

  // Soltada fuera: queda agarrada; un clic en su lugar la pone.
  await arrastrar(page, ficha(page, 'Germinación'), await centro(page.locator('.proyeccion__teclas')))
  await page.mouse.up()
  await expect(ficha(page, 'Germinación')).toHaveClass(/ficha--elegida/)
  await expect(page.getByText('Ahora toca su lugar en el orden')).toBeVisible()
  const destino = await centro(lugar(2))
  await page.mouse.click(destino.x, destino.y)
  await expect(page.getByText('3 de 4 en su lugar')).toBeVisible()

  // Un toque sin arrastrar la toma; otro toque en su lugar la pone.
  await ficha(page, 'Semilla').click()
  await lugar(1).click()
  await expect(page.getByText('¡Quedó ordenado!')).toBeVisible()
})
