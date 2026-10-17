import { describe, expect, it } from 'vitest'
import {
  azar,
  frenado,
  leerConfigRuleta,
  nuevoSorteo,
  prepararGiro,
  quedan,
  rotacionFinal,
  segmentoBajoPuntero,
  terminarGiro,
} from '../../src/blocks/ruleta/logica.ts'

describe('ruleta: opciones', () => {
  it('sin opciones guardadas usa las iniciales', () => {
    expect(leerConfigRuleta(undefined)).toEqual({ eliminarAlSalir: true, sonido: true })
    expect(leerConfigRuleta({})).toEqual({ eliminarAlSalir: true, sonido: true })
  })

  it('respeta lo guardado e ignora valores raros', () => {
    expect(leerConfigRuleta({ eliminarAlSalir: false, sonido: 'no' })).toEqual({ eliminarAlSalir: false, sonido: true })
  })
})

describe('ruleta: sorteo', () => {
  it('sacando lo que sale, nunca repite y termina con todos', () => {
    let sorteo = nuevoSorteo(5)
    const salieron: number[] = []
    while (quedan(sorteo) > 0) {
      sorteo = prepararGiro(sorteo)
      const ganador = sorteo.enRueda[azar(sorteo.enRueda.length)]
      sorteo = terminarGiro(sorteo, ganador, true)
      salieron.push(ganador)
    }
    expect([...salieron].sort()).toEqual([0, 1, 2, 3, 4])
  })

  it('lo que sale sigue en la rueda hasta el siguiente giro', () => {
    let sorteo = terminarGiro(nuevoSorteo(3), 1, true)
    expect(sorteo.enRueda).toEqual([0, 1, 2])
    expect(quedan(sorteo)).toBe(2)
    sorteo = prepararGiro(sorteo)
    expect(sorteo.enRueda).toEqual([0, 2])
    expect(quedan(sorteo)).toBe(2)
  })

  it('sin sacar, la rueda queda completa', () => {
    const sorteo = prepararGiro(terminarGiro(nuevoSorteo(3), 1, false))
    expect(sorteo.enRueda).toEqual([0, 1, 2])
    expect(quedan(sorteo)).toBe(3)
  })

  it('azar siempre da un índice válido', () => {
    for (let i = 0; i < 1000; i++) {
      const n = azar(7)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(7)
    }
  })
})

describe('ruleta: giro', () => {
  it('el segmento bajo el puntero sin girar es el primero', () => {
    expect(segmentoBajoPuntero(0, 4)).toBe(0)
    // Girando 100° en sentido horario queda arriba el ángulo 260°, que es del segmento 2 de 4.
    expect(segmentoBajoPuntero(100, 4)).toBe(2)
  })

  it.each([
    [0, 0, 4],
    [37, 3, 4],
    [1234.5, 17, 30],
    [-90, 59, 60],
    [720, 1, 2],
  ])('desde %d° termina con el segmento %d de %d bajo el puntero', (actual, indice, n) => {
    for (const desfase of [-0.4, 0, 0.4]) {
      const final = rotacionFinal(actual, indice, n, 5, desfase)
      expect(segmentoBajoPuntero(final, n)).toBe(indice)
      expect(final - actual).toBeGreaterThanOrEqual(5 * 360)
      expect(final - actual).toBeLessThan(6 * 360)
    }
  })

  it('el frenado parte en 0, termina en 1 y nunca retrocede', () => {
    expect(frenado(0)).toBe(0)
    expect(frenado(1)).toBe(1)
    for (let t = 0; t < 1; t += 0.01) expect(frenado(t + 0.01)).toBeGreaterThanOrEqual(frenado(t))
  })
})
