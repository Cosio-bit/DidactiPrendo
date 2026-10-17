import { expect, test, type Browser, type Page } from '@playwright/test'

const nombres = 'Ana\nBenjamín\nCatalina\nDiego'
const pregunta = '¿Cuánto es 1/2 + 1/4?\na) 2/6\n*b) 3/4\nc) 1/8'

async function crear(page: Page, titulo: string, texto: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Nombre de la actividad').fill(titulo)
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

/** Buffer de Node (las pruebas corren en Node, pero sus tipos no están en el proyecto). */
const aBuffer = (texto: string) => (globalThis as unknown as { Buffer: { from: (t: string) => never } }).Buffer.from(texto)

/** Otro computador: un navegador nuevo, sin nada guardado. */
async function otroComputador(browser: Browser) {
  const contexto = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  return contexto.newPage()
}

test('compartir por enlace: el colega lo abre, ve la actividad, la guarda y la proyecta', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await crear(page, 'Nombres 6°B', nombres)
  await page.getByRole('button', { name: 'Listo' }).click()

  await page.getByRole('button', { name: 'Compartir' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Compartir «Nombres 6°B»' })
  await expect(dialogo).toContainText('sin pasar por servidores de DidactiPrendo')
  await dialogo.getByRole('button', { name: 'Copiar enlace' }).click()
  await expect(dialogo.getByRole('status')).toHaveText('Enlace copiado. Ahora pégalo en el mensaje.')
  const enlace = await page.evaluate(() => navigator.clipboard.readText())
  expect(enlace).toMatch(/^http:\/\/localhost:\d+\/#\/recibir\/z[A-Za-z0-9_-]+$/)
  await dialogo.getByRole('button', { name: 'Cerrar' }).click()
  await expect(dialogo).toBeHidden()

  // En el otro computador, el contenido no viaja a ningún servidor: va después del #.
  const colega = await otroComputador(browser)
  const pedidos: string[] = []
  colega.on('request', (pedido) => pedidos.push(pedido.url()))
  await colega.goto(enlace)
  await expect(colega.getByRole('heading', { name: 'Te compartieron una actividad' })).toBeVisible()
  await expect(colega.getByText('Nombres 6°B')).toBeVisible()
  await expect(colega.getByText('Ruleta · 4 elementos')).toBeVisible()
  await expect(colega.locator('.vista-previa__lista li')).toHaveText(['Ana', 'Benjamín', 'Catalina', 'Diego'])
  expect(pedidos.filter((url) => url.includes('recibir') || url.includes('Benjam'))).toEqual([])

  await colega.getByRole('button', { name: 'Guardar y proyectar' }).click()
  await expect(colega.locator('.proyeccion-ruleta')).toBeVisible()
  await colega.keyboard.press('Escape')
  await colega.goto(new URL('/#/actividades', enlace).href)
  await expect(colega.getByRole('heading', { name: 'Nombres 6°B' })).toBeVisible()

  // Abrir el mismo enlace otra vez no la duplica.
  await colega.goto(enlace)
  await expect(colega.getByText('Ya tienes esta actividad en Mis actividades.')).toBeVisible()
  await colega.context().close()
})

test('compartir desde el editor, y un enlace cortado avisa en vez de fallar', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await crear(page, 'Fracciones', pregunta)
  await page.getByRole('button', { name: 'Compartir' }).click()
  await page.getByRole('button', { name: 'Copiar enlace' }).click()
  const enlace = await page.evaluate(() => navigator.clipboard.readText())
  await page.keyboard.press('Escape')

  await page.goto(enlace.slice(0, enlace.length - 15))
  await expect(page.getByText('Este enlace no se pudo abrir')).toBeVisible()

  await page.goto(enlace)
  await expect(page.getByText('Ya tienes esta actividad en Mis actividades.')).toBeVisible()
  await expect(page.getByText('Selección múltiple · 1 pregunta')).toBeVisible()
})

test('descargar todas en un archivo y abrirlo en otro computador, sin duplicar y con deshacer', async ({ page, browser }) => {
  await crear(page, 'Nombres 6°B', nombres)
  await crear(page, 'Fracciones', pregunta)
  await page.goto('/#/actividades')
  const descarga = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar todas en un archivo' }).click()
  const archivo = await descarga
  expect(archivo.suggestedFilename()).toMatch(/^actividades-didactiprendo-\d{4}-\d{2}-\d{2}\.json$/)
  const ruta = await archivo.path()

  const otro = await otroComputador(browser)
  await otro.goto(new URL('/#/actividades', page.url()).href)
  await expect(otro.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()

  async function abrir() {
    const selector = otro.waitForEvent('filechooser')
    await otro.getByRole('button', { name: 'Cargar material' }).click()
    await (await selector).setFiles(ruta)
  }

  await abrir()
  await expect(otro.getByRole('status')).toHaveText('Se agregaron 2 actividades desde el archivo.')
  await expect(otro.locator('.actividad__nombre')).toHaveText(['Fracciones', 'Nombres 6°B'])

  // Deshacer quita lo que se trajo.
  await otro.getByRole('button', { name: 'Deshacer' }).click()
  await expect(otro.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()

  await abrir()
  await expect(otro.locator('.actividad')).toHaveCount(2)
  await abrir()
  await expect(otro.getByRole('status')).toHaveText('Esas actividades ya estaban en Mis actividades.')
  await expect(otro.locator('.actividad')).toHaveCount(2)

  // Un archivo que no es de la app.
  const selector = otro.waitForEvent('filechooser')
  await otro.getByRole('button', { name: 'Cargar material' }).click()
  await (await selector).setFiles({ name: 'foto.json', mimeType: 'application/json', buffer: aBuffer('{"hola": 1}') })
  await expect(otro.getByRole('status')).toHaveText('Ese archivo no es de DidactiPrendo o está dañado.')
  await otro.context().close()
})

test('descargar una sola actividad desde Compartir', async ({ page }) => {
  await crear(page, 'Fracciones 6°B', pregunta)
  await page.getByRole('button', { name: 'Compartir' }).click()
  const descarga = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar archivo' }).click()
  expect((await descarga).suggestedFilename()).toBe('Fracciones 6°B.json')
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText(
    'Archivo descargado. Lo encuentras en la carpeta Descargas.',
  )
})

test.describe('en el celular', () => {
  test.use({ viewport: { width: 360, height: 640 } })

  test('el diálogo de compartir cabe completo, también con el botón Enviar', async ({ page }) => {
    // Los celulares tienen el menú de compartir del sistema.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: () => Promise.resolve(), configurable: true })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Crear actividad' }).click()
    await page.getByLabel('Nombre de la actividad').fill('Fracciones de sexto básico B')
    await page.getByLabel('Pega tu texto aquí').fill(pregunta)
    await expect(page.getByRole('status')).toHaveText('Guardado')
    await page.goto('/#/actividades')
    await page.getByRole('button', { name: 'Compartir' }).click()
    const dialogo = page.getByRole('dialog')
    await dialogo.getByRole('button', { name: 'Descargar archivo' }).click()
    await expect(dialogo.getByRole('button', { name: 'Enviar…' })).toBeVisible()
    const medidas = await dialogo.evaluate((d) => ({ sobra: d.scrollHeight - d.clientHeight, ancho: d.scrollWidth - d.clientWidth }))
    expect(medidas).toEqual({ sobra: 0, ancho: 0 })
    await expect(dialogo.getByRole('button', { name: 'Cerrar' })).toBeInViewport()
  })
})
