import { describe, expect, it } from 'vitest'
import {
  cambiarMinutos,
  corriendo,
  iniciar,
  MAXIMO_MS,
  MINUTO_MS,
  nuevoTemporizador,
  pausar,
  reiniciar,
  restante,
  sinEmpezar,
  terminado,
} from '../../src/blocks/temporizador/logica.ts'

describe('temporizador', () => {
  it('parte detenido con 3 minutos', () => {
    const t = nuevoTemporizador()
    expect(restante(t, 0)).toBe(3 * MINUTO_MS)
    expect(corriendo(t)).toBe(false)
    expect(sinEmpezar(t)).toBe(true)
  })

  it('cuenta con el reloj, se pausa y sigue desde donde quedó', () => {
    let t = iniciar(nuevoTemporizador(MINUTO_MS), 1000)
    expect(restante(t, 21_000)).toBe(40_000)
    t = pausar(t, 21_000)
    // En pausa el tiempo no corre.
    expect(restante(t, 99_000)).toBe(40_000)
    t = iniciar(t, 100_000)
    expect(restante(t, 130_000)).toBe(10_000)
    expect(terminado(t, 140_000)).toBe(true)
    expect(restante(t, 200_000)).toBe(0)
  })

  it('sin empezar, ±1 minuto cambia la duración entre 1 y 60 minutos', () => {
    let t = nuevoTemporizador(MINUTO_MS)
    t = cambiarMinutos(t, -1, 0)
    expect(t.totalMs).toBe(MINUTO_MS)
    t = cambiarMinutos(t, 2, 0)
    expect(t.totalMs).toBe(3 * MINUTO_MS)
    expect(restante(t, 0)).toBe(3 * MINUTO_MS)
    expect(nuevoTemporizador(99 * MINUTO_MS).totalMs).toBe(MAXIMO_MS)
  })

  it('andando, "+1 min" da un minuto más sin cambiar la duración elegida', () => {
    let t = iniciar(nuevoTemporizador(2 * MINUTO_MS), 0)
    t = cambiarMinutos(t, 1, 30_000)
    expect(restante(t, 30_000)).toBe(150_000)
    expect(corriendo(t)).toBe(true)
    expect(t.totalMs).toBe(2 * MINUTO_MS)
    t = cambiarMinutos(t, -3, 30_000)
    expect(restante(t, 30_000)).toBe(0)
  })

  it('terminado, "+1 min" deja un minuto listo para seguir', () => {
    const fin = { ...nuevoTemporizador(2 * MINUTO_MS), restanteMs: 0 }
    const t = cambiarMinutos(fin, 1, 0)
    expect(restante(t, 0)).toBe(MINUTO_MS)
    expect(corriendo(t)).toBe(false)
  })

  it('iniciar después de terminar parte con el tiempo completo; reiniciar vuelve a la duración', () => {
    const fin = { ...nuevoTemporizador(2 * MINUTO_MS), restanteMs: 0 }
    expect(restante(iniciar(fin, 0), 0)).toBe(2 * MINUTO_MS)
    const enPausa = pausar(iniciar(nuevoTemporizador(2 * MINUTO_MS), 0), 50_000)
    expect(reiniciar(enPausa)).toEqual(nuevoTemporizador(2 * MINUTO_MS))
  })
})
