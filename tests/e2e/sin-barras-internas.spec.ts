import { expect, test, type Page } from '@playwright/test'

/**
 * Un cuadro con su propia barra para desplazarse confunde a quien no se maneja con la tecnología:
 * no se nota que hay más contenido. Todo debe leerse de una vez; a lo más se desplaza la página.
 */
async function cuadrosConBarra(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((e) => !e.matches('main.principal'))
      .filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)
      .filter((e) => {
        const estilo = getComputedStyle(e)
        return [estilo.overflowY, estilo.overflowX].some((o) => o === 'auto' || o === 'scroll') || e.tagName === 'TEXTAREA'
      })
      .map((e) => `${e.tagName.toLowerCase()}.${e.className}`),
  )
}

/** Cajas de texto de la proyección cuyo contenido no cabe (quedaría cortado). */
async function textosCortados(page: Page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '.carta__cara, .proyeccion-ruleta__resultado, .proyeccion-preguntas__contenido, .proyeccion-ordenar__contenido, .proyeccion-pareados__contenido, .tarjeta-grande__cara, .proyeccion-rosco__texto',
      ),
    ]
      .filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)
      .map((e) => `${e.className}: ${e.textContent?.slice(0, 30)}`),
  )
}

const nombres = Array.from({ length: 30 }, (_, i) => `Estudiante número ${i + 1}`).join('\n')
const preguntas = Array.from(
  { length: 10 },
  (_, i) => `${i + 1}. ¿Cuál es la respuesta a la pregunta número ${i + 1}?\na) Primera\n*b) Segunda\nc) Tercera`,
).join('\n\n')

async function pegar(page: Page, texto: string, tipo?: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  if (tipo) await page.getByRole('radio', { name: new RegExp(`^${tipo}`) }).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

test('editor: con mucho texto, el cuadro y la vista previa se ven completos, sin barras propias', async ({ page }) => {
  for (const texto of [nombres, preguntas]) {
    await pegar(page, texto)
    expect(await cuadrosConBarra(page)).toEqual([])
    // La barra de guardado y Deshacer sigue a la vista aunque la página se desplace.
    await expect(page.getByRole('button', { name: 'Deshacer' })).toBeInViewport()
  }
})

test('proyección: nada se desplaza dentro de la pantalla, ni con textos largos', async ({ page }) => {
  const largo = 'una explicación bastante larga que ocupa varias líneas en la tarjeta proyectada en la sala'
  const casos: [string, string?][] = [
    [nombres],
    [preguntas],
    [Array.from({ length: 12 }, (_, i) => `concepto ${i + 1} = ${largo} ${i + 1}`).join('\n'), 'Parejas'],
    [Array.from({ length: 10 }, (_, i) => `concepto ${i + 1} | ${largo} ${i + 1}`).join('\n'), 'Términos pareados'],
    [Array.from({ length: 12 }, (_, i) => `Paso ${i + 1}: ${largo}`).join('\n'), 'Ordenar'],
    [`Grupo uno: ${Array.from({ length: 8 }, (_, i) => `elemento largo ${i}`).join(', ')}\nGrupo dos: ${Array.from({ length: 8 }, (_, i) => `otro elemento ${i}`).join(', ')}`, 'Clasificar'],
    [`concepto = ${largo} ${largo}`, 'Tarjetas'],
    [`La [primera] parte de ${largo}, y la [segunda] parte de ${largo}, y la [tercera] de ${largo}.`, 'Completar'],
    [Array.from({ length: 27 }, (_, i) => `${'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'[i]}: ${largo} = palabra`).join('\n'), 'Rosco de letras'],
    [`Respuesta larga\n${Array.from({ length: 8 }, (_, i) => `Pista ${i + 1}: ${largo}`).join('\n')}`, '¿Quién soy'],
  ]
  for (const [texto, tipo] of casos) {
    await pegar(page, texto, tipo)
    await page.getByRole('button', { name: 'Proyectar' }).click()
    await expect(page.locator('.proyeccion')).toBeVisible()
    if (tipo === 'Parejas') await page.getByRole('button', { name: 'Mostrar todas' }).click()
    if (tipo === 'Tarjetas') await page.keyboard.press('Space')
    if (tipo === 'Completar' || tipo === '¿Quién soy') await page.getByRole('button', { name: /Mostrar todas|Revelar respuesta/ }).click()
    if (tipo === 'Rosco de letras') await page.keyboard.press('i')
    await page.waitForTimeout(400)
    expect(await cuadrosConBarra(page), `${tipo ?? 'texto'}`).toEqual([])
    expect(await textosCortados(page), `${tipo ?? 'texto'}`).toEqual([])
    await page.keyboard.press('Escape')
  }
})
