import { expect, test, type Page } from '@playwright/test'

/** Pega el texto, elige el tipo (si no es el sugerido) y espera a que quede guardado. */
async function crear(page: Page, texto: string, tipo?: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Pega tu texto aquí').fill(texto)
  if (tipo) await page.getByRole('radio', { name: new RegExp(`^${tipo}`) }).check()
  await expect(page.getByRole('status')).toHaveText('Guardado')
}

async function proyectar(page: Page) {
  await page.getByRole('button', { name: 'Proyectar', exact: true }).click()
  await expect(page.locator('.proyeccion')).toBeVisible()
}

test('tarjetas: se voltean y avanzan con el teclado, y tocar la tarjeta la da vuelta', async ({ page }) => {
  await crear(page, '¿Capital de Chile? = Santiago\nperro = dog', 'Tarjetas')
  await expect(page.getByText('2 tarjetas', { exact: true })).toBeVisible()
  await proyectar(page)

  const tarjeta = page.locator('.tarjeta-grande')
  await expect(page.getByText('Tarjeta 1 de 2')).toBeVisible()
  await expect(tarjeta).toHaveAccessibleName(/Adelante: ¿Capital de Chile\?/)
  await page.keyboard.press('Space')
  await expect(tarjeta).toHaveAccessibleName(/Atrás: Santiago/)
  await tarjeta.click()
  await expect(tarjeta).toHaveAccessibleName(/Adelante/)
  await tarjeta.click()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Tarjeta 2 de 2')).toBeVisible()
  await expect(tarjeta).toHaveAccessibleName(/Adelante: perro/)
  await page.keyboard.press('Space')
  await page.keyboard.press('Space')
  await expect(page.getByText('¡Terminaron las tarjetas!').first()).toBeVisible()
})

test('completar la frase: las palabras aparecen con espacio, con su número o con un toque', async ({ page }) => {
  await crear(page, 'La [fotosíntesis] ocurre en las [hojas].\nEl agua hierve a los [100] grados.')
  await expect(page.getByRole('radio', { name: 'Completar la frase (sugerido)' })).toBeChecked()
  await page.getByLabel('Mostrar abajo las palabras que faltan').check()
  await proyectar(page)

  const huecos = page.locator('.hueco')
  await expect(page.getByText('Frase 1 de 2')).toBeVisible()
  await expect(huecos).toHaveCount(2)
  await expect(page.locator('.hueco--visible')).toHaveCount(0)
  await expect(page.locator('.banco__palabra')).toHaveCount(2)

  await page.keyboard.press('2')
  await expect(huecos.nth(1)).toHaveAccessibleName(/Palabra 2: hojas/)
  await expect(page.locator('.banco__palabra--usada')).toHaveText(['hojas'])
  await page.keyboard.press('Space')
  await expect(huecos.nth(0)).toHaveAccessibleName(/Palabra 1: fotosíntesis/)
  // Tocar una palabra visible la vuelve a ocultar.
  await huecos.nth(0).click()
  await expect(huecos.nth(0)).toHaveAccessibleName(/Palabra 1, oculta/)

  await page.keyboard.press('Space')
  await page.keyboard.press('Space')
  await expect(page.getByText('Frase 2 de 2')).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.locator('.hueco--visible')).toHaveText('100')
  await page.keyboard.press('Space')
  await expect(page.getByText('¡Completaron todas las frases!').first()).toBeVisible()
})

test('pasapalabra: correcta, incorrecta, pasar, deshacer y terminar el rosco', async ({ page }) => {
  await crear(page, 'A: Insecto que hace miel = abeja\nB: Mamífero marino más grande = ballena\nC: Ave nacional de Chile = cóndor')
  await expect(page.getByRole('radio', { name: 'Pasapalabra (sugerido)' })).toBeChecked()
  await proyectar(page)

  const cuenta = page.locator('.proyeccion-pasapalabra__cuenta')
  const texto = page.locator('.proyeccion-pasapalabra__texto')
  await expect(texto).toContainText('Empieza con A')
  await expect(texto).toContainText('Insecto que hace miel')

  await page.keyboard.press('c')
  await expect(page.locator('.proyeccion-pasapalabra__respuesta')).toHaveText('✓ abeja')
  await expect(cuenta).toHaveText('1 acierto · 0 errores · 2 por responder')
  await page.keyboard.press('Space')

  // B: pasapalabra; queda para la próxima vuelta.
  await expect(texto).toContainText('Empieza con B')
  await page.keyboard.press('Space')
  await expect(texto).toContainText('Empieza con C')
  await page.keyboard.press('i')
  await expect(page.locator('.proyeccion-pasapalabra__respuesta')).toHaveText('✗ Era: cóndor')

  // Deshacer vuelve a preguntar la C.
  await page.keyboard.press('ArrowLeft')
  await expect(cuenta).toHaveText('1 acierto · 0 errores · 2 por responder')
  await page.getByRole('button', { name: '✗ Incorrecta' }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()

  await expect(texto).toContainText('Empieza con B')
  await page.keyboard.press('c')
  await page.keyboard.press('Space')
  await expect(page.getByText('¡Terminó el rosco!')).toBeVisible()
  await expect(cuenta).toHaveText('2 aciertos · 1 error · 0 por responder')
})

test('¿quién soy?: las pistas aparecen de a una y después la respuesta', async ({ page }) => {
  await crear(
    page,
    "Bernardo O'Higgins\nNací en Chillán.\nFui Director Supremo.\n\nGabriela Mistral\nFui profesora.\nGané el Nobel.",
    '¿Quién soy',
  )
  await expect(page.getByText('2 adivinanzas', { exact: true })).toBeVisible()
  await proyectar(page)

  const visibles = page.locator('.pista:not(.pista--oculta) .pista__texto')
  const respuesta = page.locator('.proyeccion-quien-soy__respuesta')
  await expect(page.getByText('Adivinanza 1 de 2')).toBeVisible()
  await expect(visibles).toHaveText(['Nací en Chillán.'])
  await expect(respuesta).toHaveAttribute('aria-hidden', 'true')

  await page.keyboard.press('Space')
  await expect(visibles).toHaveText(['Nací en Chillán.', 'Fui Director Supremo.'])
  await page.keyboard.press('Space')
  await expect(respuesta).toHaveAttribute('aria-hidden', 'false')
  await expect(respuesta).toContainText("Bernardo O'Higgins")

  await page.keyboard.press('Space')
  await expect(page.getByText('Adivinanza 2 de 2')).toBeVisible()
  // Si el curso adivina antes, se revela de una vez con todas las pistas.
  await page.getByRole('button', { name: 'Revelar respuesta' }).click()
  await expect(visibles).toHaveText(['Fui profesora.', 'Gané el Nobel.'])
  await expect(respuesta).toContainText('Gabriela Mistral')
  await page.keyboard.press('Space')
  await expect(page.getByText('¡Terminaron las adivinanzas!').first()).toBeVisible()
})
