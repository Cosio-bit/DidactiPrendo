import { describe, expect, it } from 'vitest'
import {
  acomodarEtiqueta,
  azar,
  frenado,
  leerConfigRuleta,
  nuevoSorteo,
  prepararGiro,
  quedan,
  RADIO_RUEDA,
  repartirEnLineas,
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

describe('ruleta: nombres largos en la rueda', () => {
  // Cada letra mide 0,6 veces el tamaño de la letra (aproximado, como sin pantalla).
  const medir = (texto: string) => texto.length * 0.6

  it('reparte las palabras dejando la línea más larga lo más corta posible', () => {
    expect(repartirEnLineas('Texto narrativo', 2, medir)).toEqual(['Texto', 'narrativo'])
    expect(repartirEnLineas('Pedro Pablo Fernández de la Cruz', 3, medir)).toEqual(['Pedro Pablo', 'Fernández', 'de la Cruz'])
    expect(repartirEnLineas('Poema', 3, medir)).toEqual(['Poema'])
  })

  it('nunca corta el texto: todas las palabras quedan escritas', () => {
    for (const texto of ['Texto narrativo', 'Texto argumentativo', 'Afiche publicitario', 'Electroencefalografista']) {
      for (const segmentos of [1, 2, 8, 16]) {
        const etiqueta = acomodarEtiqueta(texto, segmentos, medir)
        expect(etiqueta.lineas.join(' ')).toBe(texto)
      }
    }
  })

  it('el texto cabe dentro de su segmento, entre el centro y el borde', () => {
    for (const texto of ['Ana', 'Texto narrativo', 'Texto argumentativo', 'Mito griego antiguo']) {
      for (const segmentos of [2, 4, 8, 12, 16]) {
        const { lineas, tamano, distancia } = acomodarEtiqueta(texto, segmentos, medir)
        const largo = Math.max(...lineas.map(medir)) * tamano
        const alto = lineas.length * 1.15 * tamano
        const interior = distancia - largo / 2
        expect(distancia + largo / 2).toBeLessThanOrEqual(RADIO_RUEDA * 0.93 + 0.01)
        expect(interior).toBeGreaterThanOrEqual(11.99)
        // A esa distancia del centro, el segmento es más ancho que el texto.
        expect(alto).toBeLessThanOrEqual(2 * interior * Math.sin(Math.min(Math.PI / segmentos, Math.PI / 3)) + 0.01)
      }
    }
  })

  it('un nombre largo se parte en líneas en vez de achicarse tanto', () => {
    const etiqueta = acomodarEtiqueta('Texto narrativo', 8, medir)
    expect(etiqueta.lineas).toEqual(['Texto', 'narrativo'])
    expect(etiqueta.tamano).toBeGreaterThan(acomodarEtiqueta('Textonarrativo', 8, medir).tamano)
  })

  it('un nombre corto se ve tan grande como antes', () => {
    expect(acomodarEtiqueta('Ana', 8, medir).tamano).toBe(15)
  })
})
