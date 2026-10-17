import { expect, test, type Page } from '@playwright/test'

/** 10 preguntas como las devolvería ChatGPT, con la correcta marcada con *. */
const repaso = Array.from({ length: 10 }, (_, i) => {
  const n = i + 2
  return [`${i + 1}. ¿Cuánto es ${n} × 3?`, `a) ${n * 3 - 1}`, `*b) ${n * 3}`, `c) ${n * 3 + 1}`, `d) ${n * 3 + 3}`].join('\n')
}).join('\n\n')

const pantalla = (page: Page) => page.locator('.proyeccion-preguntas')

async function crearPreguntas(page: Page, texto = repaso) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  await expect(page.getByRole('radio', { name: 'Selección múltiple (sugerido)' })).toBeChecked()
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

test('repaso de 10 preguntas proyectado de principio a fin solo con el teclado', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Crear actividad' })).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Crear actividad' })).toBeFocused()
  await page.keyboard.press('Enter')

  // Pegar con el teclado en el cuadro, que ya tiene el foco.
  await expect(page.getByLabel('Pega tu texto aquí')).toBeFocused()
  await page.keyboard.insertText(repaso)
  await expect(page.getByText('10 preguntas', { exact: true })).toBeVisible()

  // Hacia atrás hasta "Proyectar": tiempo por pregunta, tipo de actividad, nombre y Proyectar.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Proyectar' })).toBeFocused()
  await page.keyboard.press('Enter')

  for (let i = 1; i <= 10; i++) {
    const n = i + 1
    await expect(pantalla(page)).toContainText(`Pregunta ${i} de 10`)
    await expect(pantalla(page)).toContainText(`¿Cuánto es ${n} × 3?`)
    await expect(pantalla(page)).not.toContainText('Correcta')

    await page.keyboard.press('Space')
    await expect(page.locator('.alternativa-proyectada--correcta')).toHaveText(`B${n * 3} ✓ Correcta`)
    await expect(page.locator('.alternativa-proyectada--apagada')).toHaveCount(3)

    // En la tercera, se deja marcado un error para comentarlo (letra C).
    if (i === 3) {
      await page.keyboard.press('c')
      await expect(page.locator('.alternativa-proyectada--comentada')).toContainText('Para comentar')
      await expect(page.locator('.alternativa-proyectada--apagada')).toHaveCount(2)
    }
    await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'PageDown')
  }

  await expect(page.getByText('¡Terminaron el repaso!')).toBeVisible()

  // Volver atrás muestra la última pregunta tal como quedó.
  await page.keyboard.press('ArrowLeft')
  await expect(pantalla(page)).toContainText('Pregunta 10 de 10')
  await expect(page.locator('.alternativa-proyectada--correcta')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()
})

test('comentar el error antes de revelar, con el botón y un toque', async ({ page }) => {
  await crearPreguntas(page)
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await page.getByRole('button', { name: 'Comentar el error' }).click()
  await expect(page.getByText('Toca la alternativa incorrecta que quieres comentar')).toBeVisible()

  // La correcta (B) no se puede marcar como error; la A sí.
  await expect(page.getByRole('button', { name: 'B 6' })).toHaveCount(0)
  await page.getByRole('button', { name: 'A 5' }).click()
  await expect(page.locator('.alternativa-proyectada--comentada')).toContainText('A5 ✗ Para comentar')
  await expect(page.locator('.alternativa-proyectada--correcta')).toHaveCount(0)

  await page.getByRole('button', { name: 'Quitar comentario' }).click()
  await expect(page.locator('.alternativa-proyectada--comentada')).toHaveCount(0)
})

test('temporizador por pregunta: cuenta, avisa al terminar y se detiene al revelar', async ({ page }) => {
  await page.clock.install()
  await crearPreguntas(page)
  await page.getByLabel('Tiempo para responder').selectOption('15')
  await expect(page.getByLabel('Sonido al acabarse el tiempo')).toBeChecked()
  await page.getByLabel('Sonido al acabarse el tiempo').uncheck()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()

  const reloj = page.getByRole('timer')
  await expect(reloj).toHaveText('0:15')
  await page.clock.runFor(5_000)
  await expect(reloj).toHaveText('0:10')

  // Pausa con la tecla P.
  await page.keyboard.press('p')
  await page.clock.runFor(5_000)
  await expect(reloj).toHaveText('0:10')
  await page.getByRole('button', { name: 'Seguir' }).click()

  await page.clock.runFor(11_000)
  await expect(reloj).toHaveText('¡Tiempo!')
  await expect(pantalla(page)).toHaveAttribute('data-tiempo-acabado', 'true')

  await page.keyboard.press('Space')
  await expect(reloj).toBeHidden()

  // La siguiente pregunta parte con el tiempo completo.
  await page.keyboard.press('Space')
  await expect(reloj).toHaveText('0:15')
})

test('una pregunta larga se achica para caber en 1024×768', async ({ page }) => {
  const larga = [
    'Lee el siguiente fragmento: "En la cuenca del río Biobío, la evaporación, la condensación y la precipitación forman parte del ciclo del agua que alimenta a los bosques y a las ciudades del sur de Chile durante todo el año." ¿Qué proceso ocurre cuando el vapor de agua se enfría en la atmósfera y forma las nubes?',
    'a) La evaporación del agua de los ríos y del mar por el calor del sol',
    '*b) La condensación del vapor de agua en pequeñas gotas que forman las nubes',
    'c) La precipitación del agua en forma de lluvia, nieve o granizo sobre la tierra',
    'd) La escorrentía del agua por la superficie del suelo hasta llegar a los ríos y al mar',
  ].join('\n')
  await crearPreguntas(page, larga)
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(pantalla(page)).toContainText('Pregunta 1 de 1')
  await page.keyboard.press('Space')
  await expect(page.locator('.alternativa-proyectada--correcta')).toBeVisible()

  const contenido = page.locator('.proyeccion-preguntas__contenido')
  const medidas = await contenido.evaluate((c) => ({
    desborde: c.scrollHeight - c.clientHeight,
    letra: parseFloat(getComputedStyle(c).fontSize),
  }))
  expect(medidas.desborde).toBeLessThanOrEqual(0)
  expect(medidas.letra).toBeGreaterThanOrEqual(24)
  await expect(page.getByRole('button', { name: 'Terminar' })).toBeInViewport()
})

test('imprimir tarjetas A, B, C, D y las preguntas con su pauta', async ({ page }) => {
  await crearPreguntas(page)
  await page.getByRole('button', { name: 'Imprimir' }).click()

  await expect(page.getByRole('radio', { name: 'Tarjetas A, B, C, D' })).toBeChecked()
  await expect(page.locator('.tarjeta__letra')).toHaveText(['A', 'B', 'C', 'D'])

  await page.getByRole('radio', { name: 'Las preguntas en papel' }).check()
  await expect(page.locator('.hoja__pregunta')).toHaveCount(10)
  await expect(page.locator('.hoja--texto').first()).not.toContainText('*')
  await expect(page.locator('.hoja__respuestas li')).toHaveText(Array(10).fill('B'))

  // Al imprimir no salen la cabecera, los botones ni la barra de guardado.
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.cabecera')).toBeHidden()
  await expect(page.locator('.barra-guardado')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden()
  await expect(page.locator('.hoja__pregunta').first()).toBeVisible()
})

test('se puede proyectar un repaso desde Mis actividades', async ({ page }) => {
  await crearPreguntas(page)
  await page.getByLabel('Nombre de la actividad').fill('Tablas')
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Selección múltiple · 10 preguntas')).toBeVisible()
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(pantalla(page)).toContainText('Pregunta 1 de 10')
})
