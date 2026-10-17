import { expect, test } from '@playwright/test'

test('crear, nombrar, borrar con confirmación y deshacer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()

  await page.getByLabel('Nombre de la actividad').fill('Fracciones 6°B')
  await expect(page.getByRole('status')).toHaveText('Guardado')

  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fracciones 6°B' })).toBeVisible()

  // Cancelar no borra nada.
  await page.getByRole('button', { name: 'Borrar' }).click()
  const dialogo = page.getByRole('dialog', { name: '¿Borrar esta actividad?' })
  await expect(dialogo).toContainText('Fracciones 6°B')
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: 'Fracciones 6°B' })).toBeVisible()

  // Confirmar borra, y Deshacer la recupera.
  await page.getByRole('button', { name: 'Borrar' }).click()
  await dialogo.getByRole('button', { name: 'Sí, borrar' }).click()
  await expect(page.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Se borró «Fracciones 6°B»')

  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByRole('heading', { name: 'Fracciones 6°B' })).toBeVisible()
})

test('una actividad abierta y abandonada sin escribir no aparece en la lista', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await expect(page.getByLabel('Pega tu texto aquí')).toBeVisible()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByText('Todavía no tienes actividades guardadas.')).toBeVisible()
})

test('deshacer devuelve el nombre anterior de la actividad', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  const nombre = page.getByLabel('Nombre de la actividad')
  await expect(nombre).toHaveValue('')

  await nombre.fill('Repaso de verbos')
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await page.getByRole('button', { name: 'Deshacer' }).click()

  await expect(nombre).toHaveValue('')
  await expect(page.getByRole('status')).toHaveText('Se deshizo: cambio de nombre')
})

test('lo escrito sigue ahí después de recargar la página', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Nombre de la actividad').fill('Tabla del 7')
  await page.getByLabel('Pega tu texto aquí').fill('7 × 1\n7 × 2')
  await expect(page.getByRole('status')).toHaveText('Guardado')

  await page.reload()
  await expect(page.getByLabel('Nombre de la actividad')).toHaveValue('Tabla del 7')
  await expect(page.getByLabel('Pega tu texto aquí')).toHaveValue('7 × 1\n7 × 2')
})

test('se puede usar solo con teclado', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Crear actividad' })).toBeVisible()

  // Desde el inicio: Tab hasta "Crear actividad".
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Crear actividad' })).toBeFocused()
  await page.keyboard.press('Enter')

  // La actividad nueva abre con el cuadro de texto listo para pegar.
  await expect(page.getByLabel('Pega tu texto aquí')).toBeFocused()
  await page.keyboard.type('Sumas\nRestas')
  // Hacia atrás: opciones de la ruleta, tipo de actividad, nombre, Proyectar y Listo.
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByLabel('Sonido al girar')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByLabel('Sacar de la ruleta lo que sale')).toBeFocused()
  // El tipo de actividad es una sola parada: se cambia con las flechas.
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('radio', { name: /^Ruleta/ })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByLabel('Nombre de la actividad')).toBeFocused()
  await page.keyboard.type('Operaciones')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Proyectar' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Listo' })).toBeFocused()
  await page.keyboard.press('Enter')

  // Borrar con teclado: el foco empieza en "Cancelar" y Esc cierra sin borrar.
  await page.getByRole('button', { name: 'Borrar' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible()
})
