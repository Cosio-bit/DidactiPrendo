import { expect, test, type Page, type Route } from '@playwright/test'

// La app instala un service worker; se bloquea para poder simular la respuesta de la IA
// (las pruebas nunca llaman a Claude ni gastan saldo).
test.use({ serviceWorkers: 'block' })

const propuesta = {
  mensaje: '',
  actividades: [
    {
      tipo: 'ordenar',
      nombre: 'Partes de la noticia',
      motivo: 'Las partes de una noticia siguen un orden fijo.',
      texto: 'Epígrafe\nTitular\nBajada\nLead\nCuerpo',
    },
    {
      tipo: 'terminos-pareados',
      nombre: 'Para qué sirve cada parte',
      motivo: 'Une cada parte con su función.',
      texto:
        'Titular | Resume la noticia en pocas palabras\nBajada | Amplía la información del titular\nLead | Responde qué, quién, cuándo, dónde y por qué',
    },
  ],
}

async function pedir(page: Page, responder: (ruta: Route) => Promise<void>) {
  await page.route('**/api/crear-con-ia', responder)
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear con IA' }).click()
  await expect(page.getByRole('heading', { name: 'Crear con IA' })).toBeVisible()
  await page.getByLabel('¿Qué actividad quieres?').fill('una actividad para recordar las partes de una noticia')
  await page.getByRole('button', { name: 'Crear con IA' }).click()
}

test('crear con IA: la propuesta se ve con su vista previa y se usa en el editor', async ({ page }) => {
  let enviado: unknown
  await pedir(page, async (ruta) => {
    enviado = ruta.request().postDataJSON()
    await ruta.fulfill({ json: propuesta })
  })
  expect(enviado).toMatchObject({ pedido: 'una actividad para recordar las partes de una noticia', guia: '' })

  await expect(page.getByRole('heading', { name: 'La IA te propone 2 actividades' })).toBeFocused()
  await expect(page.getByText('La IA puede equivocarse: revisa el contenido antes de proyectar.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Partes de la noticia' })).toBeVisible()
  await expect(page.getByText('3 conceptos', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Usar esta actividad' }).nth(1).click()
  await expect(page.getByRole('heading', { name: 'Tu actividad' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^Términos pareados/ })).toBeChecked()
  await expect(page.getByLabel('Nombre de la actividad')).toHaveValue('Para qué sirve cada parte')
  await expect(page.getByLabel('Pega tu texto aquí')).toHaveValue(propuesta.actividades[1].texto)
})

test('crear con IA: guardar todas las propuestas, y deshacerlo', async ({ page }) => {
  await pedir(page, (ruta) => ruta.fulfill({ json: propuesta }))
  await page.getByRole('button', { name: 'Guardar las 2 en Mis actividades' }).click()
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
  await expect(page.getByText('Se guardaron 2 actividades en Mis actividades')).toBeVisible()
  await expect(page.getByText('Partes de la noticia')).toBeVisible()

  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()
})

test('crear con IA: con código del piloto, lo pide una vez y lo recuerda', async ({ page }) => {
  await pedir(page, async (ruta) => {
    const { codigo } = ruta.request().postDataJSON()
    if (codigo === 'profes') await ruta.fulfill({ json: propuesta })
    else await ruta.fulfill({ status: 401, json: { error: 'codigo' } })
  })
  await expect(page.getByText('El código de acceso no es correcto.')).toBeVisible()

  await page.getByLabel('Código de acceso').fill('profes')
  await page.getByRole('button', { name: 'Crear con IA' }).click()
  await expect(page.getByRole('heading', { name: 'La IA te propone 2 actividades' })).toBeVisible()

  // Queda guardado en este computador: al volver, el código ya está escrito.
  await page.reload()
  await expect(page.getByLabel('Código de acceso')).toHaveValue('profes')
})

test('crear con IA: los problemas se explican en español, sin perder el pedido', async ({ page }) => {
  await pedir(page, (ruta) => ruta.fulfill({ status: 402, json: { error: 'sin-creditos' } }))
  await expect(page.getByRole('alert')).toHaveText('Se acabó el saldo para usar la IA. Avísale a quien administra la app.')
  await expect(page.getByLabel('¿Qué actividad quieres?')).toHaveValue('una actividad para recordar las partes de una noticia')
})

test('crear con IA: si la IA no arma nada, muestra su explicación', async ({ page }) => {
  await pedir(page, (ruta) =>
    ruta.fulfill({ json: { actividades: [], mensaje: 'Para sortear a tu curso, pega tu lista en Crear actividad.' } }),
  )
  await expect(page.getByRole('alert')).toHaveText('Para sortear a tu curso, pega tu lista en Crear actividad.')
})

test('crear con IA: el formulario y su botón se ven sin desplazarse en 1024×768', async ({ page }) => {
  await page.goto('/#/crear-con-ia')
  await expect(page.getByRole('button', { name: 'Crear con IA' })).toBeInViewport({ ratio: 1 })
  // Sin escribir el pedido no se puede enviar.
  await expect(page.getByRole('button', { name: 'Crear con IA' })).toBeDisabled()
})
