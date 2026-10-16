import { expect, test } from '@playwright/test'

test('sin internet, la app abre y muestra las actividades guardadas', async ({ page, context }) => {
  await page.goto('/')
  // Esperar a que el service worker deje la app guardada en el navegador.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })

  await page.getByRole('button', { name: 'Crear actividad' }).click()
  await page.getByLabel('Nombre de la actividad').fill('Capitales de Sudamérica')
  await expect(page.getByRole('status')).toHaveText('Guardado')

  await context.setOffline(true)
  await page.goto('/#/actividades')
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Mis actividades' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Capitales de Sudamérica' })).toBeVisible()
})
