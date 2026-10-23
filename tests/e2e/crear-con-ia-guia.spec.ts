import { expect, test, type Page } from '@playwright/test'

/* Subir una guía para crear con IA. La IA se simula: se revisa lo que se envía y cómo se muestra lo que vuelve. */

interface Enviado {
  pedido: string
  guia: string
  comentario?: string
  anteriores?: { tipo: string; nombre: string }[]
  tipos?: string[]
  archivo: { tipo: string; mediaType: string; datos: string; nombre: string } | null
}

/** Responde en orden las respuestas dadas y guarda lo que la app envió. */
async function simularIA(page: Page, respuestas: unknown[]) {
  const enviados: Enviado[] = []
  await page.route('**/api/crear-con-ia', async (ruta) => {
    enviados.push(ruta.request().postDataJSON() as Enviado)
    await ruta.fulfill({ json: respuestas[Math.min(enviados.length, respuestas.length) - 1] })
  })
  return enviados
}

const PRIMERA = {
  entendido: 'La guía enseña las partes de la noticia (titular, bajada, lead y cuerpo) y para qué sirve cada una.',
  mensaje: '',
  actividades: [
    {
      tipo: 'terminos-pareados',
      nombre: 'Cada parte y su función',
      motivo: 'Para que asocien cada parte con lo que hace.',
      texto: 'Titular | Resume lo más importante de la noticia\nBajada | Amplía la información del titular\nLead | Responde qué, quién, cuándo y dónde\nCuerpo | Desarrolla los detalles de la noticia',
    },
    {
      tipo: 'ordenar',
      nombre: 'La estructura de la noticia',
      motivo: 'Para que recuerden el orden de las partes.',
      texto: 'Titular\nBajada\nLead\nCuerpo',
    },
  ],
}

const SEGUNDA = {
  entendido: '',
  mensaje: '',
  actividades: [
    {
      tipo: 'preguntas',
      nombre: 'Reconoce la parte',
      motivo: 'Identifican cada parte en una noticia real.',
      texto:
        '¿Qué parte es «Chile gana la Copa América»?\n*a) Titular\nb) Cuerpo\nc) Lead\n\n¿Qué parte responde quién, qué, cuándo y dónde?\na) Bajada\n*b) Lead\nc) Titular',
    },
  ],
}

async function abrirCrearConIA(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear con IA' }).click()
  await expect(page.getByRole('heading', { name: 'Crear con IA', level: 1 })).toBeVisible()
}

test('primero se pide qué actividad quiere y debajo, opcional, la guía', async ({ page }) => {
  await abrirCrearConIA(page)
  const pedido = (await page.getByLabel('¿Qué actividad quieres?').boundingBox())!
  const guia = (await page.getByRole('heading', { name: 'Tu guía o material (opcional)' }).boundingBox())!
  expect(pedido.y).toBeLessThan(guia.y)
})

test('con una guía en PDF y sin pedido, la IA dice qué entendió, propone juegos y se le pueden pedir otros', async ({ page }) => {
  const enviados = await simularIA(page, [PRIMERA, SEGUNDA])
  await abrirCrearConIA(page)

  await page.locator('input[type=file]').setInputFiles('tests/fixtures/guia.pdf')
  await expect(page.locator('.material-cargado')).toContainText('guia.pdf')
  await expect(page.locator('.material-cargado')).toContainText('PDF')
  // Con guía, el pedido es opcional.
  await expect(page.getByText('Como subiste una guía, puedes dejarlo en blanco')).toBeVisible()
  await page.getByRole('button', { name: 'Proponer actividades' }).click()

  await expect(page.getByRole('heading', { name: 'Esto entendí de tu guía' })).toBeVisible()
  await expect(page.getByText('La guía enseña las partes de la noticia')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'La IA te propone 2 actividades' })).toBeVisible()
  expect(enviados[0]).toMatchObject({ pedido: '', guia: '', archivo: { tipo: 'pdf', mediaType: 'application/pdf', nombre: 'guia.pdf' } })
  expect(atob(enviados[0].archivo!.datos)).toContain('%PDF-1.4')

  // Ninguna sirve: se pide explicar qué busca (o elegir un tipo).
  await page.getByRole('button', { name: 'Pedir otras propuestas' }).click()
  await expect(page.getByLabel('Cuéntale a la IA qué buscas')).toBeFocused()
  await page.getByRole('button', { name: 'Pedir otras propuestas' }).click()
  await expect(page.getByText('Escribe qué buscas o elige al menos un tipo de actividad.')).toBeVisible()
  expect(enviados).toHaveLength(1)

  await page.getByLabel('Cuéntale a la IA qué buscas').fill('Que identifiquen cada parte en una noticia real')
  const seleccion = page.getByRole('button', { name: 'Selección múltiple', exact: true })
  await seleccion.click()
  await expect(seleccion).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Pedir otras propuestas' }).click()

  await expect(page.getByRole('heading', { name: /La IA te propone esta actividad/ })).toContainText('intento 2')
  // Lo que entendió de la guía se mantiene.
  await expect(page.getByText('La guía enseña las partes de la noticia')).toBeVisible()
  expect(enviados[1]).toMatchObject({
    comentario: 'Que identifiquen cada parte en una noticia real',
    tipos: ['preguntas'],
    anteriores: [
      { tipo: 'terminos-pareados', nombre: 'Cada parte y su función' },
      { tipo: 'ordenar', nombre: 'La estructura de la noticia' },
    ],
    archivo: { tipo: 'pdf' },
  })

  await page.getByRole('button', { name: 'Usar esta actividad' }).click()
  await expect(page.getByRole('heading', { name: 'Tu actividad' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^Selección múltiple/ })).toBeChecked()
  await expect(page.getByText('2 preguntas', { exact: true })).toBeVisible()
})

test('"Cargar material" en el inicio con un Word lleva a Crear con IA y envía su texto', async ({ page }) => {
  const enviados = await simularIA(page, [PRIMERA])
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/guia-noticia.docx')

  await expect(page.getByRole('heading', { name: 'Crear con IA', level: 1 })).toBeVisible()
  await expect(page.locator('.material-cargado')).toContainText('guia-noticia.docx')
  await expect(page.locator('.material-cargado')).toContainText(/Texto de \d+ palabras/)
  await page.getByLabel('¿Qué actividad quieres?').fill('Para 6° básico')
  await page.getByRole('button', { name: 'Proponer actividades' }).click()

  await expect(page.getByRole('heading', { name: 'La IA te propone 2 actividades' })).toBeVisible()
  expect(enviados[0].pedido).toBe('Para 6° básico')
  expect(enviados[0].archivo).toBeNull()
  expect(enviados[0].guia).toContain('El titular resume lo más importante')
})

test('una foto de la guía se achica y se envía como imagen', async ({ page }) => {
  const enviados = await simularIA(page, [PRIMERA])
  await abrirCrearConIA(page)
  // Una foto de 2000×1500 (más grande que lo que se envía).
  const foto = await page.evaluate(async () => {
    const lienzo = document.createElement('canvas')
    lienzo.width = 2000
    lienzo.height = 1500
    const c = lienzo.getContext('2d')!
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, 2000, 1500)
    c.fillStyle = '#000000'
    c.font = '120px sans-serif'
    c.fillText('Las partes de la noticia', 100, 300)
    const blob = await new Promise<Blob>((listo) => lienzo.toBlob((b) => listo(b!), 'image/png'))
    return [...new Uint8Array(await blob.arrayBuffer())]
  })
  await page.locator('input[type=file]').setInputFiles({ name: 'foto-guia.png', mimeType: 'image/png', buffer: Buffer.from(foto) })
  await expect(page.locator('.material-cargado')).toContainText('Foto')
  await page.getByRole('button', { name: 'Proponer actividades' }).click()
  await expect(page.getByRole('heading', { name: 'Esto entendí de tu guía' })).toBeVisible()

  expect(enviados[0].archivo).toMatchObject({ tipo: 'imagen', mediaType: 'image/jpeg', nombre: 'foto-guia.png' })
  const tamano = await page.evaluate(async (datos) => {
    const imagen = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${datos}`)).blob())
    return [imagen.width, imagen.height]
  }, enviados[0].archivo!.datos)
  expect(tamano).toEqual([1568, 1176])
})

test('un Word antiguo explica cómo guardarlo como PDF, y quitar el archivo vuelve a pedir el pedido', async ({ page }) => {
  await abrirCrearConIA(page)
  await expect(page.getByRole('button', { name: 'Crear con IA' })).toBeDisabled()
  await page.locator('input[type=file]').setInputFiles({ name: 'guia.doc', mimeType: 'application/msword', buffer: Buffer.from('x') })
  await expect(page.getByRole('alert')).toContainText('guárdalo como PDF')

  await page.locator('input[type=file]').setInputFiles('tests/fixtures/guia.pdf')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Quitar archivo' }).click()
  await expect(page.getByText('Como subiste una guía, puedes dejarlo en blanco')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Crear con IA' })).toBeDisabled()
})

test('en el celular, un nombre de archivo larguísimo no se sale hacia el lado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await abrirCrearConIA(page)
  await page.locator('input[type=file]').setInputFiles({
    name: `${'Guia_de_lenguaje_y_comunicacion_unidad_3_'.repeat(3)}.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  })
  await expect(page.locator('.material-cargado')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
