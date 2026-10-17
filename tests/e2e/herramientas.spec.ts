import { expect, test, type Page } from '@playwright/test'

const nombres = Array.from({ length: 30 }, (_, i) => `Estudiante ${i + 1}`).join('\n')
const pregunta = '¿Cuánto es 1/2 + 1/4?\na) 2/6\n*b) 3/4\nc) 1/8\nd) 1/2'

async function proyectar(page: Page, texto: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
}

const marcador = (page: Page) => page.getByRole('region', { name: 'Marcador por equipos' })
const temporizador = (page: Page) => page.getByRole('region', { name: 'Temporizador' })
const equipo = (page: Page, nombre: string) => marcador(page).locator('.equipo').filter({ hasText: nombre })

test('marcador: +1 y −1 por equipo, nombres editables y queda guardado para la próxima actividad', async ({ page }) => {
  await proyectar(page, nombres)
  await expect(marcador(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Marcador' }).click()
  await expect(page.getByRole('button', { name: 'Marcador' })).toHaveAttribute('aria-pressed', 'true')

  // Dos equipos para empezar, con el nombre de su color.
  await expect(marcador(page).locator('.equipo')).toHaveCount(2)
  await page.getByRole('button', { name: 'Un punto más para Azul' }).click()
  await page.getByRole('button', { name: 'Un punto más para Azul' }).click()
  await page.getByRole('button', { name: 'Un punto más para Naranjo' }).click()
  await page.getByRole('button', { name: 'Un punto menos para Naranjo' }).click()
  await expect(equipo(page, 'Azul')).toContainText('2')
  await expect(equipo(page, 'Naranjo')).toContainText('0')
  // En 0 no se puede restar más.
  await expect(page.getByRole('button', { name: 'Un punto menos para Naranjo' })).toBeDisabled()

  // Cambiar el nombre: el espacio se escribe y no hace girar la ruleta.
  await page.getByRole('button', { name: 'Editar equipos' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Equipos' })
  await dialogo.getByLabel('Nombre del equipo 1').fill('')
  await dialogo.getByLabel('Nombre del equipo 1').pressSequentially('Los Pumas')
  await dialogo.getByRole('button', { name: 'Agregar equipo' }).click()
  await expect(dialogo.getByLabel('Nombre del equipo 3')).toHaveValue('Verde')
  // Esc cierra el diálogo, pero no sale de la proyección.
  await page.keyboard.press('Escape')
  await expect(dialogo).toBeHidden()
  await expect(page.locator('.proyeccion-ruleta')).toBeVisible()
  await expect(page.getByText('Presiona Girar')).toBeVisible()
  await expect(equipo(page, 'Los Pumas')).toContainText('2')
  await expect(marcador(page).locator('.equipo')).toHaveCount(3)

  // Otra actividad: el marcador sigue abierto, con los mismos equipos y puntos.
  await page.getByRole('button', { name: 'Volver a editar' }).click()
  await proyectar(page, pregunta)
  await expect(equipo(page, 'Los Pumas')).toContainText('2')
  await expect(marcador(page).locator('.equipo')).toHaveCount(3)

  // Dejar los puntos en 0 pide confirmación.
  await page.getByRole('button', { name: 'Editar equipos' }).click()
  await page.getByRole('button', { name: 'Dejar los puntos en 0' }).click()
  await page.getByRole('button', { name: 'No, mantener los puntos' }).click()
  await expect(equipo(page, 'Los Pumas')).toContainText('2')
  await page.getByRole('button', { name: 'Dejar los puntos en 0' }).click()
  await page.getByRole('button', { name: 'Sí, dejar en 0' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(equipo(page, 'Los Pumas')).toContainText('0')
  await expect(equipo(page, 'Los Pumas')).toContainText('Los Pumas')

  // Se cierra con el mismo botón.
  await page.getByRole('button', { name: 'Marcador' }).click()
  await expect(marcador(page)).toHaveCount(0)
})

test('temporizador: iniciar, pausar, un minuto más y aviso al terminar', async ({ page }) => {
  await page.clock.install()
  await proyectar(page, pregunta)
  await page.getByRole('button', { name: 'Temporizador' }).click()
  const tiempo = temporizador(page).getByRole('timer')
  await expect(tiempo).toHaveText('3:00')

  // Sin empezar, los minutos cambian la duración.
  await page.getByRole('button', { name: 'Un minuto menos' }).click()
  await page.getByRole('button', { name: 'Un minuto menos' }).click()
  await expect(tiempo).toHaveText('1:00')
  await expect(page.getByRole('button', { name: 'Un minuto menos' })).toBeDisabled()

  await temporizador(page).getByRole('button', { name: 'Iniciar', exact: true }).click()
  await page.clock.runFor(20_000)
  await expect(tiempo).toHaveText('0:40')
  await temporizador(page).getByRole('button', { name: 'Pausar' }).click()
  await page.clock.runFor(30_000)
  await expect(tiempo).toHaveText('0:40')
  await temporizador(page).getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Un minuto más' }).click()
  await expect(tiempo).toHaveText('1:40')
  await page.clock.runFor(101_000)

  // Se acabó: el número se pone rojo y toda la pantalla queda con borde rojo.
  await expect(tiempo).toHaveText('¡Tiempo!')
  await expect(page.locator('.proyeccion-marco')).toHaveAttribute('data-tiempo-acabado', 'true')
  await expect(temporizador(page).getByRole('button', { name: 'Iniciar', exact: true })).toBeVisible()

  // Reiniciar vuelve a la duración elegida y quita el aviso.
  await temporizador(page).getByRole('button', { name: 'Reiniciar' }).click()
  await expect(tiempo).toHaveText('1:00')
  await expect(page.locator('.proyeccion-marco')).toHaveAttribute('data-tiempo-acabado', 'false')

  // El temporizador es independiente: la pregunta sigue funcionando con el teclado.
  await page.keyboard.press('Space')
  await expect(page.getByText('✓ Correcta')).toBeVisible()
})

test('teclas M y T abren y cierran el marcador y el temporizador', async ({ page }) => {
  await proyectar(page, nombres)
  await expect(page.getByText('Presiona Girar')).toBeVisible()
  await page.keyboard.press('m')
  await expect(marcador(page)).toBeVisible()
  await page.keyboard.press('t')
  await expect(temporizador(page)).toBeVisible()
  await page.keyboard.press('m')
  await page.keyboard.press('t')
  await expect(marcador(page)).toHaveCount(0)
  await expect(temporizador(page)).toHaveCount(0)
})

test('con 8 equipos y el temporizador, la pregunta se sigue leyendo y nada se sale de la pantalla', async ({ page }) => {
  await proyectar(page, pregunta)
  await page.getByRole('button', { name: 'Temporizador' }).click()
  await page.getByRole('button', { name: 'Marcador' }).click()
  await page.getByRole('button', { name: 'Editar equipos' }).click()
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Agregar equipo' }).click()
  await expect(page.getByRole('button', { name: 'Agregar equipo' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Listo' })).toBeInViewport()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(marcador(page).locator('.equipo')).toHaveCount(8)

  const medidas = await page.evaluate(() => {
    const fuera = [...document.querySelectorAll<HTMLElement>('.proyeccion-marco button, .proyeccion-marco p')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        return r.right > innerWidth + 1 || r.bottom > innerHeight + 1
      })
      .map((e) => e.textContent)
    const contenido = document.querySelector<HTMLElement>('.proyeccion-preguntas__contenido')!
    const pisados = [...document.querySelectorAll<HTMLElement>('.equipo, .temporizador-panel')].some(
      (e) => e.getBoundingClientRect().top < contenido.getBoundingClientRect().bottom,
    )
    return {
      fuera,
      pisados,
      letra: parseFloat(getComputedStyle(document.querySelector('.proyeccion-preguntas__enunciado')!).fontSize),
      cortado: contenido.scrollHeight > contenido.clientHeight + 1,
    }
  })
  expect(medidas.fuera).toEqual([])
  expect(medidas.pisados).toBe(false)
  expect(medidas.cortado).toBe(false)
  expect(medidas.letra).toBeGreaterThanOrEqual(24)
})

test('abrir el marcador no cambia el tamaño de la letra mientras se juega', async ({ page }) => {
  await proyectar(page, pregunta)
  await page.getByRole('button', { name: 'Marcador' }).click()
  // Se lee después de dos cuadros, cuando la letra ya se ajustó al nuevo espacio.
  const letra = () =>
    page.evaluate(async () => {
      for (let i = 0; i < 2; i++) await new Promise(requestAnimationFrame)
      return getComputedStyle(document.querySelector('.proyeccion-preguntas__enunciado')!).fontSize
    })
  await expect(marcador(page)).toBeVisible()
  const antes = await letra()
  await page.getByRole('button', { name: 'Un punto más para Azul' }).click()
  expect(await letra()).toBe(antes)
  await page.keyboard.press('Space')
  await expect(page.getByText('✓ Correcta')).toBeVisible()
  expect(await letra()).toBe(antes)
})

test.describe('en el celular', () => {
  test.use({ viewport: { width: 360, height: 640 } })

  test('el marcador y el temporizador caben a lo ancho', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Crear actividad' }).click()
    await page.getByLabel('Pega tu texto aquí').fill(pregunta)
    await page.getByRole('button', { name: 'Siguiente →' }).click()
    await page.getByRole('button', { name: 'Siguiente →' }).click()
    await page.getByRole('button', { name: 'Proyectar' }).last().click()
    await page.getByRole('button', { name: 'Temporizador' }).click()
    await page.getByRole('button', { name: 'Marcador' }).click()
    await page.getByRole('button', { name: 'Editar equipos' }).click()
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Agregar equipo' }).click()
    await page.getByRole('button', { name: 'Listo' }).click()
    const derecha = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll('.proyeccion-marco *')].map((e) => e.getBoundingClientRect().right)),
    )
    expect(derecha).toBeLessThanOrEqual(360)
    // Los botones de +1 siguen siendo de 48 px o más, para tocarlos con el dedo.
    const boton = await page.getByRole('button', { name: 'Un punto más para Negro' }).boundingBox()
    expect(boton!.width).toBeGreaterThanOrEqual(48)
    expect(boton!.height).toBeGreaterThanOrEqual(48)
  })
})
