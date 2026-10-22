import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/**
 * Oraciones largas, palabras larguísimas y direcciones sin espacios: ninguna actividad se debe romper.
 * Nada se sale de la pantalla, ningún texto queda cortado y la página no se desplaza hacia el lado,
 * en el proyector (4:3 y 16:9) y en el celular (vertical y horizontal).
 */

const FRASE =
  'El proceso mediante el cual las plantas verdes fabrican su propio alimento a partir de la luz del sol, el agua y el dióxido de carbono se llama fotosíntesis y ocurre en las hojas'
const PALABRA = 'Electroencefalografistas'
const DIRECCION = 'www.curriculumnacional.cl/portal/Educacion-General/Ciencias-Naturales/5-basico'

const PANTALLAS = [
  { nombre: 'proyector 4:3', width: 1024, height: 768 },
  { nombre: 'proyector 16:9', width: 1280, height: 720 },
  { nombre: 'celular vertical', width: 390, height: 844 },
  { nombre: 'celular horizontal', width: 740, height: 360 },
]

interface Caso {
  tipo: string
  texto: string
  opciones?: string[]
  /** Lo que se hace después de mirar la pantalla inicial (teclas o un botón), para revisar de nuevo. */
  jugar?: (page: Page) => Promise<void>
}

const n = (cantidad: number, linea: (i: number) => string) => Array.from({ length: cantidad }, (_, i) => linea(i)).join('\n')
const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'

const CASOS: Caso[] = [
  { tipo: 'Ruleta', texto: n(12, (i) => `${PALABRA} ${i + 1} ${FRASE.slice(0, 70)}`) + `\n${DIRECCION}` },
  {
    tipo: 'Selección múltiple',
    texto: n(3, (i) => `${i + 1}. ¿${FRASE}?\na) ${FRASE.slice(0, 90)}\n*b) ${DIRECCION}\nc) ${PALABRA}\nd) ${FRASE.slice(40, 130)}`).replace(/\n(?=\d\.)/g, '\n\n'),
    jugar: async (page) => {
      await page.keyboard.press('c')
      await page.keyboard.press('Space')
    },
  },
  { tipo: 'Verdadero o falso', texto: n(4, () => `${FRASE} ${DIRECCION} (V)`), jugar: (page) => page.keyboard.press('Space') },
  {
    tipo: 'Parejas',
    texto: n(12, (i) => `${PALABRA}${i} = ${FRASE.slice(0, 110)}`),
    jugar: (page) => page.getByRole('button', { name: 'Mostrar todas' }).click(),
  },
  { tipo: 'Ordenar', texto: n(12, (i) => `Paso ${i + 1}: ${FRASE.slice(0, 80)} ${PALABRA}`), jugar: espacios(12) },
  {
    tipo: 'Clasificar',
    texto: n(4, (c) => `Categoría ${PALABRA} ${c + 1}: ${n(6, (i) => `${PALABRA} ${c}${i}`).replace(/\n/g, ', ')}`),
    jugar: espacios(24),
  },
  { tipo: 'Tarjetas', texto: n(3, (i) => `${i + 1} ${FRASE} = ${FRASE} ${DIRECCION} ${PALABRA}`), jugar: espacios(1) },
  {
    tipo: 'Completar',
    texto: n(
      2,
      () =>
        `El [proceso] [mediante el cual las plantas verdes fabrican su propio alimento a partir de la luz del sol] se llama [fotosíntesis], lo explica [${PALABRA}] en [${DIRECCION}] y ocurre en las [hojas] de todas las [plantas verdes].`,
    ),
    opciones: ['Mostrar abajo las palabras que faltan'],
    jugar: (page) => page.getByRole('button', { name: 'Mostrar todas' }).click(),
  },
  {
    tipo: 'Rosco de letras',
    texto: n(27, (i) => `${letras[i]}: ${FRASE} = ${letras[i]}${PALABRA.toLowerCase()} de ${DIRECCION}`),
    jugar: (page) => page.keyboard.press('i'),
  },
  {
    tipo: '¿Quién soy',
    texto: `${PALABRA} y ${FRASE}\n${n(8, (i) => `Pista ${i + 1}: ${FRASE.slice(0, 120)} ${PALABRA}`)}`,
    jugar: (page) => page.getByRole('button', { name: 'Revelar respuesta' }).click(),
  },
]

function espacios(veces: number) {
  return async (page: Page) => {
    for (let i = 0; i < veces; i++) await page.keyboard.press('Space')
  }
}

/** Todo lo que está roto en la pantalla: cosas que se salen, textos cortados o desplazamiento hacia el lado. */
async function problemas(page: Page) {
  return page.evaluate(() => {
    const ancho = document.documentElement.clientWidth
    const alto = document.documentElement.clientHeight
    const nombre = (e: Element) =>
      `${e.tagName.toLowerCase()}.${String(e.getAttribute('class') ?? '').split(' ')[0]} «${(e.textContent ?? '').slice(0, 25)}»`
    const lista: string[] = []
    if (document.documentElement.scrollWidth > ancho + 1) lista.push('la página se desplaza hacia el lado')
    // En el celular la actividad puede alargarse y desplazarse hacia abajo (como una página), nunca hacia el lado.
    const marco = document.querySelector<HTMLElement>('.proyeccion-marco')!
    const altoTotal = marco.hasAttribute('data-alargada') ? marco.scrollHeight : alto
    if (marco.scrollWidth > marco.clientWidth + 1) lista.push('la proyección se desplaza hacia el lado')
    for (const e of document.querySelectorAll('.proyeccion-marco *')) {
      if (e.closest('.solo-lector')) continue
      const r = e.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const arriba = r.top + marco.scrollTop
      const abajo = r.bottom + marco.scrollTop
      if (r.left < -1 || arriba < -1 || r.right > ancho + 1 || abajo > altoTotal + 1) lista.push(`se sale: ${nombre(e)}`)
      const estilo = getComputedStyle(e)
      const recorta = [estilo.overflowX, estilo.overflowY].some((o) => o !== 'visible')
      // El nombre de la actividad se acorta con «…» a propósito.
      if (recorta && !e.matches('.proyeccion__titulo, .solo-lector') && e instanceof HTMLElement) {
        if (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1) lista.push(`cortado: ${nombre(e)}`)
      }
    }
    return lista
  })
}

/** El editor (con su vista previa) tampoco se puede desplazar hacia el lado. */
async function editorSeDesplaza(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

async function crear(page: Page, caso: Caso) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(caso.texto)
  await page.getByRole('radio', { name: new RegExp(`^${caso.tipo.replace('?', '\\?')}`) }).check()
  for (const opcion of caso.opciones ?? []) await page.getByLabel(opcion).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  expect(await editorSeDesplaza(page), 'editor').toBe(false)
  await expect(page.getByRole('button', { name: 'Proyectar', exact: true })).toBeEnabled()
  return page.url().replace('/actividad/', '/proyectar/')
}

async function revisar(direccion: string, caso: Caso, pantalla: (typeof PANTALLAS)[number], contexto: BrowserContext) {
  // Una página nueva por pantalla, del mismo tamaño desde el comienzo (como el proyector del profe).
  const page = await contexto.newPage()
  await page.setViewportSize({ width: pantalla.width, height: pantalla.height })
  await page.goto(direccion)
  // El marco aparece cuando ya leyó el marcador guardado; antes no hay nada que revisar.
  await expect(page.locator('.proyeccion-marco')).toBeVisible()
  // En el celular la pantalla puede tardar unos cuadros en alargarse hasta que todo cabe.
  await expect.poll(() => problemas(page), { message: `${caso.tipo}, ${pantalla.nombre}, al comenzar`, timeout: 5000 }).toEqual([])
  if (caso.jugar) {
    await caso.jugar(page)
    // Lo que se voltea o aparece termina su movimiento.
    await page.waitForTimeout(500)
    await expect.poll(() => problemas(page), { message: `${caso.tipo}, ${pantalla.nombre}, jugando`, timeout: 5000 }).toEqual([])
  }
  await page.close()
}

for (const caso of CASOS) {
  test(`${caso.tipo}: con oraciones largas nada se sale ni se corta`, async ({ page, context }) => {
    test.setTimeout(90_000)
    const direccion = await crear(page, caso)
    // El editor en el celular tampoco se desplaza hacia el lado.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(300)
    expect(await editorSeDesplaza(page), 'editor en el celular').toBe(false)
    for (const pantalla of PANTALLAS) await revisar(direccion, caso, pantalla, context)
  })
}

test('Mis actividades: un nombre larguísimo, sin espacios, no se sale de la tarjeta', async ({ page }) => {
  await crear(page, CASOS[0])
  await page.getByLabel('Nombre de la actividad').fill(`${PALABRA}${PALABRA}${PALABRA} ${DIRECCION}`)
  await expect(page.getByRole('status')).toHaveText('Guardado')
  for (const pantalla of PANTALLAS) {
    await page.setViewportSize({ width: pantalla.width, height: pantalla.height })
    await page.goto('/#/actividades')
    await expect(page.locator('.actividad').first()).toBeVisible()
    const sale = await page.evaluate(() => {
      const ancho = document.documentElement.clientWidth
      if (document.documentElement.scrollWidth > ancho + 1) return 'la página se desplaza hacia el lado'
      const tarjeta = document.querySelector('.actividad')!.getBoundingClientRect()
      const fuera = [...document.querySelectorAll('.actividad *:not(.marca-tipo):not(.marca-tipo *)')].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && (r.right > tarjeta.right + 1 || r.left < tarjeta.left - 1)
      })
      return fuera.map((e) => e.className).join(', ')
    })
    expect(sale, pantalla.nombre).toBe('')
  }
})
