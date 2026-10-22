import { expect, test, type Page } from '@playwright/test'

// Una tabla tal como la entrega ChatGPT, con su fila de títulos.
const tabla = [
  '| Concepto | Definición |',
  '|---|---|',
  '| Sustantivo | Palabra que nombra personas, animales o cosas |',
  '| Verbo | Palabra que indica una acción o un estado |',
  '| Adjetivo | Palabra que describe o califica al sustantivo |',
].join('\n')

const concepto = (page: Page, nombre: string) => page.locator('.pareado--concepto').filter({ hasText: nombre })
const definicion = (page: Page, texto: string) => page.locator('.pareado--definicion').filter({ hasText: texto })

async function proyectarPareados(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(tabla)
  // La tabla con definiciones se reconoce sola, sin tomar los títulos como una pareja más.
  await expect(page.getByRole('radio', { name: 'Términos pareados (sugerido)' })).toBeChecked()
  await expect(page.getByText('3 conceptos', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Proyectar' }).click()
  await expect(page.getByText('0 de 3 unidos')).toBeVisible()
}

test('términos pareados: se toca un concepto y luego su definición', async ({ page }) => {
  await proyectarPareados(page)
  await expect(page.locator('.pareado--concepto')).toHaveText([/1\s*Sustantivo/, /2\s*Verbo/, /3\s*Adjetivo/])
  await expect(page.locator('.pareado--definicion')).toHaveCount(3)

  // Equivocado: no se une y se avisa.
  await concepto(page, 'Sustantivo').click()
  await definicion(page, 'indica una acción').click()
  await expect(definicion(page, 'indica una acción')).toContainText('No es su definición')
  await expect(page.locator('.proyeccion-pareados__lineas line')).toHaveCount(0)

  // Correcto: quedan unidos con una línea, y la definición muestra el número de su concepto.
  await concepto(page, 'Sustantivo').click()
  await definicion(page, 'nombra personas').click()
  await expect(page.getByText('1 de 3 unidos')).toBeVisible()
  await expect(definicion(page, 'nombra personas').locator('.pareado__casilla')).toHaveText('1')
  await expect(page.locator('.proyeccion-pareados__lineas line')).toHaveCount(1)

  // También se puede empezar por la definición.
  await definicion(page, 'describe o califica').click()
  await concepto(page, 'Adjetivo').click()
  await expect(page.getByText('2 de 3 unidos')).toBeVisible()
})

test('términos pareados con teclado: número, Espacio para el que sigue, flecha para deshacer y Esc', async ({ page }) => {
  await proyectarPareados(page)
  await page.keyboard.press('2')
  await expect(concepto(page, 'Verbo')).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Space')
  await expect(page.getByText('1 de 3 unidos')).toBeVisible()
  await expect(definicion(page, 'indica una acción').locator('.pareado__casilla')).toHaveText('2')

  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('0 de 3 unidos')).toBeVisible()

  for (let i = 0; i < 3; i++) await page.keyboard.press('Space')
  await expect(page.getByText('¡Todo unido!')).toBeVisible()
  await expect(page.locator('.proyeccion-pareados__lineas line')).toHaveCount(3)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Tu actividad' })).toBeVisible()
})

test('términos pareados: arrastrar un concepto hasta su definición', async ({ page }) => {
  await proyectarPareados(page)
  await concepto(page, 'Verbo').dragTo(definicion(page, 'indica una acción'))
  await expect(page.getByText('1 de 3 unidos')).toBeVisible()
})

test('desde el inicio, "Términos pareados" abre el editor con esa actividad y su ejemplo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Términos pareados/ }).click()
  await expect(page.getByRole('radio', { name: /^Términos pareados/ })).toBeChecked()
  await page.getByRole('button', { name: 'Probar con este ejemplo' }).click()
  await expect(page.getByText('3 conceptos', { exact: true })).toBeVisible()
})
