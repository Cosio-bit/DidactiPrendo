import { expect, test, type Page } from '@playwright/test'

const nombres = [
  'Agustín', 'Amanda', 'Benjamín', 'Catalina', 'Diego', 'Emilia', 'Florencia', 'Gaspar', 'Isidora', 'Joaquín',
  'Josefa', 'Martín', 'Matilda', 'Maximiliano', 'Renata', 'Sofía', 'Tomás', 'Valentina', 'Vicente', 'Trinidad',
  'Antonia', 'Bastián', 'Camila', 'Fernanda', 'Ignacio', 'Javiera', 'Lucas', 'Mateo', 'Rafaela', 'Simón',
]

async function crearRuleta(page: Page, elementos: string[]) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(elementos.join('\n'))
  // Si el lector sugiere otro tipo (por ejemplo, Parejas por un ":"), se elige Ruleta.
  await page.getByRole('radio', { name: /^Ruleta/ }).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

async function proyectar(page: Page) {
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByRole('img', { name: /^Ruleta con/ })).toBeVisible()
}

const resultado = (page: Page) => page.locator('.proyeccion-ruleta__resultado')

/** Hace girar (con la acción indicada) y espera a que la rueda empiece y termine de girar. */
async function girar(page: Page, accion: () => Promise<void>) {
  await accion()
  await expect(resultado(page)).toHaveAttribute('data-girando', 'true')
  await expect(resultado(page)).toHaveAttribute('data-girando', 'false', { timeout: 10_000 })
}

const espacio = (page: Page) => () => page.keyboard.press('Space')

test('pegar 30 nombres, proyectar y girar solo con el teclado', async ({ page }) => {
  const inicio = Date.now()
  await crearRuleta(page, nombres)

  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByRole('img', { name: 'Ruleta con 30 elementos' })).toBeVisible()
  await expect(page.getByText('Quedan 30 de 30')).toBeVisible()

  // Primer giro con la barra espaciadora.
  await girar(page, espacio(page))
  const primero = (await resultado(page).textContent())!
  expect(nombres).toContain(primero)
  await expect(page.getByText('Quedan 29 de 30')).toBeVisible()
  await expect(page.getByText(`Salió: ${primero}`)).toBeAttached()

  // Segundo giro con la flecha derecha (como un control de presentación): sale otro y se saca el anterior.
  await girar(page, () => page.keyboard.press('ArrowRight'))
  const segundo = (await resultado(page).textContent())!
  expect(nombres).toContain(segundo)
  expect(segundo).not.toBe(primero)
  await expect(page.getByRole('img', { name: 'Ruleta con 29 elementos' })).toBeVisible()
  await expect(page.getByText('Quedan 28 de 30')).toBeVisible()

  // Esc vuelve a la actividad.
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()

  // Plan: el profe pega su curso y gira en menos de 1 minuto (aquí, con dos giros incluidos).
  expect(Date.now() - inicio).toBeLessThan(60_000)
})

test('con un toque en la rueda también gira, y sin sacar lo que sale la rueda queda igual', async ({ page }) => {
  await crearRuleta(page, ['Rojo', 'Azul', 'Verde'])
  await page.getByLabel('Sacar de la ruleta lo que sale').uncheck()
  await page.getByLabel('Sonido al girar').uncheck()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()

  await expect(page.getByText('3 en la ruleta')).toBeVisible()
  await girar(page, () => page.getByRole('img', { name: 'Ruleta con 3 elementos' }).click())
  await girar(page, () => page.getByRole('button', { name: 'Girar' }).click())
  await expect(page.getByRole('img', { name: 'Ruleta con 3 elementos' })).toBeVisible()
  await expect(page.getByText('3 en la ruleta')).toBeVisible()
})

test('cuando salen todos, ofrece volver a empezar', async ({ page }) => {
  await crearRuleta(page, ['Sí', 'No'])
  await proyectar(page)
  await girar(page, espacio(page))
  await girar(page, espacio(page))
  await expect(page.getByText('Ya salieron todos.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Girar' })).toBeHidden()

  await page.getByRole('button', { name: 'Volver a empezar' }).click()
  await expect(page.getByText('Quedan 2 de 2')).toBeVisible()
})

test('un texto largo se achica para caber completo, sin cortarse', async ({ page }) => {
  const largo = 'El ciclo del agua: evaporación, condensación, precipitación y escorrentía en la cuenca del río Biobío'
  await crearRuleta(page, [largo, largo + ' y sus afluentes'])
  await proyectar(page)
  await girar(page, espacio(page))

  const caja = resultado(page)
  const desborde = await caja.evaluate((c) => ({
    alto: c.scrollHeight - c.clientHeight,
    ancho: c.scrollWidth - c.clientWidth,
    letra: parseFloat(getComputedStyle(c).fontSize),
  }))
  expect(desborde.alto).toBeLessThanOrEqual(0)
  expect(desborde.ancho).toBeLessThanOrEqual(0)
  expect(desborde.letra).toBeGreaterThanOrEqual(28)
})

test('un nombre largo se achica sin partir palabras', async ({ page }) => {
  await crearRuleta(page, ['Valentina Sepúlveda', 'Maximiliano Fernández'])
  await proyectar(page)
  await girar(page, espacio(page))
  const caja = resultado(page)
  // Cada palabra queda en una sola línea: la altura de cada una cabe en una línea de texto.
  const palabrasPartidas = await caja.evaluate((c) => {
    const rango = document.createRange()
    const texto = c.firstChild!
    const partidas: string[] = []
    let inicio = 0
    for (const palabra of c.textContent!.split(' ')) {
      rango.setStart(texto, inicio)
      rango.setEnd(texto, inicio + palabra.length)
      if (rango.getClientRects().length > 1) partidas.push(palabra)
      inicio += palabra.length + 1
    }
    return partidas
  })
  expect(palabrasPartidas).toEqual([])
})

test('funciona con 60 elementos', async ({ page }) => {
  await crearRuleta(page, Array.from({ length: 60 }, (_, i) => `Grupo ${i + 1}`))
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByRole('img', { name: 'Ruleta con 60 elementos' })).toBeVisible()
  await girar(page, espacio(page))
  await expect(resultado(page)).toHaveText(/^Grupo \d+$/)
})

test('con menos de 2 elementos no se puede proyectar', async ({ page }) => {
  await crearRuleta(page, ['Solo uno'])
  await expect(page.getByRole('button', { name: 'Proyectar' })).toBeDisabled()
})

test('se puede proyectar directo desde Mis actividades', async ({ page }) => {
  await crearRuleta(page, nombres.slice(0, 5))
  await page.getByRole('button', { name: 'Listo' }).click()
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByRole('img', { name: 'Ruleta con 5 elementos' })).toBeVisible()
  await page.getByRole('button', { name: 'Volver a Mis actividades' }).click()
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
})

test('los nombres largos se leen enteros en la rueda, sin cortarse ni salirse de su segmento', async ({ page }) => {
  const largos = ['Texto narrativo', 'Texto informativo', 'Texto argumentativo', 'Afiche publicitario', 'Poema', 'Noticia']
  await crearRuleta(page, largos)
  await proyectar(page)

  const etiquetas = page.locator('svg.rueda text')
  await expect(etiquetas).toHaveCount(largos.length)
  // Cada nombre está completo (puede ir en varias líneas), sin "…".
  const escritos = await etiquetas.evaluateAll((textos) =>
    textos.map((t) => [...t.querySelectorAll('tspan')].map((l) => l.textContent).join(' ')),
  )
  expect(escritos).toEqual(largos)

  // Ningún texto se sale del círculo de la rueda: se miran las cuatro esquinas reales de cada
  // texto, ya girado (la caja recta que da el navegador es más grande que el texto inclinado).
  const fuera = await page.evaluate(() => {
    const borde = document.querySelector<SVGCircleElement>('svg.rueda circle[fill="none"]')!
    const aPantalla = (elemento: SVGGraphicsElement, x: number, y: number) =>
      new DOMPoint(x, y).matrixTransform(elemento.getScreenCTM()!)
    const centro = aPantalla(borde, 0, 0)
    const borde1 = aPantalla(borde, borde.r.baseVal.value, 0)
    const radio = Math.hypot(borde1.x - centro.x, borde1.y - centro.y)
    return [...document.querySelectorAll<SVGTextElement>('svg.rueda text')]
      .filter((texto) => {
        const { x, y, width, height } = texto.getBBox()
        const esquinas = [aPantalla(texto, x, y), aPantalla(texto, x + width, y), aPantalla(texto, x, y + height), aPantalla(texto, x + width, y + height)]
        return esquinas.some((p) => Math.hypot(p.x - centro.x, p.y - centro.y) > radio + 1)
      })
      .map((t) => t.textContent)
  })
  expect(fuera).toEqual([])
})
