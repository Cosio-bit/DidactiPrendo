import { describe, expect, it, vi } from 'vitest'
import { textos } from '../../src/i18n/es-CL.ts'
import { crearPilaDeshacer } from '../../src/ui/deshacer.ts'

describe('pila de deshacer', () => {
  it('parte sin nada que deshacer', async () => {
    const pila = crearPilaDeshacer()
    expect(pila.obtenerEstado()).toEqual({ puedeDeshacer: false, aviso: null, error: false })
    expect(await pila.deshacer()).toBe(false)
  })

  it('deshace la última acción primero', async () => {
    const pila = crearPilaDeshacer()
    const orden: string[] = []
    pila.registrar({ descripcion: 'primera', deshacer: () => orden.push('primera') })
    pila.registrar({ descripcion: 'segunda', deshacer: () => orden.push('segunda') })

    await pila.deshacer()
    expect(pila.obtenerEstado().aviso).toBe(textos.avisos.deshecho('segunda'))
    await pila.deshacer()

    expect(orden).toEqual(['segunda', 'primera'])
    expect(pila.obtenerEstado().puedeDeshacer).toBe(false)
  })

  it('espera a que termine una acción asíncrona', async () => {
    const pila = crearPilaDeshacer()
    let hecho = false
    pila.registrar({
      descripcion: 'lenta',
      deshacer: () => new Promise<void>((r) => setTimeout(() => ((hecho = true), r()), 5)),
    })
    expect(await pila.deshacer()).toBe(true)
    expect(hecho).toBe(true)
  })

  it('si deshacer falla, avisa y deja la acción para reintentar', async () => {
    const pila = crearPilaDeshacer()
    pila.registrar({
      descripcion: 'falla',
      deshacer: () => Promise.reject(new Error('sin espacio')),
    })

    expect(await pila.deshacer()).toBe(false)
    expect(pila.obtenerEstado()).toEqual({
      puedeDeshacer: true,
      aviso: textos.avisos.errorDeshacer,
      error: true,
    })
  })

  it('guarda como máximo el límite indicado, descartando las más antiguas', async () => {
    const pila = crearPilaDeshacer(2)
    const deshechas: number[] = []
    for (const i of [1, 2, 3]) pila.registrar({ descripcion: `${i}`, deshacer: () => deshechas.push(i) })

    while (await pila.deshacer());
    expect(deshechas).toEqual([3, 2])
  })

  it('avisa a quienes escuchan y deja de avisar al desuscribirse', () => {
    const pila = crearPilaDeshacer()
    const oyente = vi.fn()
    const cancelar = pila.suscribir(oyente)

    pila.avisar(textos.avisos.guardado)
    expect(oyente).toHaveBeenCalledTimes(1)
    expect(pila.obtenerEstado().aviso).toBe(textos.avisos.guardado)

    cancelar()
    pila.avisar(textos.avisos.guardado)
    expect(oyente).toHaveBeenCalledTimes(1)
  })
})
