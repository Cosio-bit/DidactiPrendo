import { expect, test, type Page } from '@playwright/test'

const actividad = (id: string, title: string, texto: string) => ({
  id,
  type: 'ruleta',
  title,
  texto,
  items: texto.split('\n'),
  config: {},
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  schemaVersion: 1,
})

/** Un archivo como el que descarga "Descargar todas en un archivo". */
const archivo = JSON.stringify({
  aplicacion: 'DidactiPrendo',
  formato: 1,
  exportado: '2026-10-17T12:00:00.000Z',
  actividades: [actividad('a1', 'Nombres 6°B', 'Ana\nBenjamín\nCatalina'), actividad('a2', 'Nombres 6°A', 'Diego\nElena')],
})

/** Simula arrastrar un archivo desde el computador y soltarlo sobre la página. */
async function soltarArchivo(page: Page, nombre: string, contenido: string, alSoltar = true) {
  const datos = await page.evaluateHandle(
    ([n, c]) => {
      const transferencia = new DataTransfer()
      transferencia.items.add(new File([c], n, { type: 'application/json' }))
      return transferencia
    },
    [nombre, contenido],
  )
  await page.dispatchEvent('body', 'dragenter', { dataTransfer: datos })
  await page.dispatchEvent('body', 'dragover', { dataTransfer: datos })
  if (alSoltar) await page.dispatchEvent('body', 'drop', { dataTransfer: datos })
}

test('en el inicio, "Cargar material" busca el archivo y lleva a Mis actividades', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('¿Te pasaron un archivo de actividades?')).toBeVisible()
  const selector = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Cargar material' }).click()
  await (await selector).setFiles({ name: 'actividades.json', mimeType: 'application/json', buffer: aBuffer(archivo) })
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nombres 6°B' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nombres 6°A' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Se agregaron 2 actividades desde el archivo.')
})

test('basta con arrastrar el archivo a la página de inicio', async ({ page }) => {
  await page.goto('/')
  await soltarArchivo(page, 'actividades.json', archivo, false)
  // Mientras se arrastra, toda la pantalla dice dónde soltarlo.
  await expect(page.getByText('Suelta el archivo aquí para cargar tus actividades')).toBeVisible()
  await page.dispatchEvent('body', 'dragleave', {
    dataTransfer: await page.evaluateHandle(() => {
      const t = new DataTransfer()
      t.items.add(new File(['x'], 'a.json'))
      return t
    }),
  })
  await expect(page.getByText('Suelta el archivo aquí para cargar tus actividades')).toBeHidden()

  await soltarArchivo(page, 'actividades.json', archivo)
  await expect(page.getByText('Suelta el archivo aquí para cargar tus actividades')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
  await expect(page.locator('.actividad')).toHaveCount(2)

  // Soltarlo de nuevo no duplica nada.
  await page.goto('/')
  await soltarArchivo(page, 'actividades.json', archivo)
  await expect(page.getByRole('status')).toHaveText('Esas actividades ya estaban en Mis actividades.')
  await expect(page.locator('.actividad')).toHaveCount(2)
})

test('un archivo que no es de la app avisa y no saca al profe de la página', async ({ page }) => {
  await page.goto('/')
  await soltarArchivo(page, 'foto.json', '{"hola": 1}')
  await expect(page.getByRole('status')).toHaveText('Ese archivo no es de DidactiPrendo o está dañado.')
  await expect(page.getByRole('heading', { name: 'Hola, profe' })).toBeVisible()
})

test('durante la proyección, un archivo soltado se ignora', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill('Ana\nBeto\nCata')
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.locator('.proyeccion-ruleta')).toBeVisible()
  await soltarArchivo(page, 'actividades.json', archivo)
  await expect(page.locator('.soltar-aqui')).toHaveCount(0)
  await expect(page.locator('.proyeccion-ruleta')).toBeVisible()
})

/** Buffer de Node (las pruebas corren en Node, pero sus tipos no están en el proyecto). */
function aBuffer(texto: string) {
  return (globalThis as unknown as { Buffer: { from: (t: string) => never } }).Buffer.from(texto)
}
