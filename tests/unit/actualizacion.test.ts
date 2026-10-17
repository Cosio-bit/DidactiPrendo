import { describe, expect, it, vi } from 'vitest'
import { crearActualizador } from '../../src/actualizacion.ts'
import type { Ruta } from '../../src/navegacion.ts'

function preparar(pantalla: Ruta['pantalla']) {
  const estado = { pantalla }
  const aplicar = vi.fn()
  const actualizador = crearActualizador(aplicar, () => estado.pantalla)
  return { estado, aplicar, actualizador }
}

describe('actualización de la app', () => {
  it.each(['inicio', 'mis-actividades'] as const)('en %s se aplica al tiro', (pantalla) => {
    const { aplicar, actualizador } = preparar(pantalla)
    actualizador.hayVersionNueva()
    expect(aplicar).toHaveBeenCalledOnce()
  })

  it.each(['proyectar', 'editor', 'imprimir'] as const)('en %s espera a que el profe salga', (pantalla) => {
    const { estado, aplicar, actualizador } = preparar(pantalla)
    actualizador.hayVersionNueva()
    expect(aplicar).not.toHaveBeenCalled()

    estado.pantalla = 'editor'
    actualizador.cambioDePantalla()
    expect(aplicar).not.toHaveBeenCalled()

    estado.pantalla = 'mis-actividades'
    actualizador.cambioDePantalla()
    expect(aplicar).toHaveBeenCalledOnce()
  })

  it('sin versión nueva, cambiar de pantalla no hace nada', () => {
    const { aplicar, actualizador } = preparar('inicio')
    actualizador.cambioDePantalla()
    expect(aplicar).not.toHaveBeenCalled()
  })

  it('se aplica una sola vez', () => {
    const { aplicar, actualizador } = preparar('inicio')
    actualizador.hayVersionNueva()
    actualizador.cambioDePantalla()
    expect(aplicar).toHaveBeenCalledOnce()
  })
})
