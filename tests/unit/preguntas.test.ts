import { describe, expect, it } from 'vitest'
import {
  avanzar,
  comentar,
  esListaDePreguntas,
  leerConfigPreguntas,
  letra,
  letrasParaTarjetas,
  nuevoRepaso,
  retroceder,
  revelar,
} from '../../src/blocks/preguntas/logica.ts'
import type { Pregunta } from '../../src/parser/tipos.ts'
import { formatearTiempo } from '../../src/projection/tiempo.ts'

const pregunta: Pregunta = {
  enunciado: '¿2 + 2?',
  alternativas: [
    { texto: '3', correcta: false },
    { texto: '4', correcta: true },
    { texto: '5', correcta: false },
  ],
}

describe('preguntas: opciones', () => {
  it('sin opciones guardadas: sin temporizador y con sonido', () => {
    expect(leerConfigPreguntas(undefined)).toEqual({ segundosPorPregunta: 0, sonido: true })
  })

  it('respeta lo guardado e ignora valores raros', () => {
    expect(leerConfigPreguntas({ segundosPorPregunta: 30, sonido: false })).toEqual({
      segundosPorPregunta: 30,
      sonido: false,
    })
    expect(leerConfigPreguntas({ segundosPorPregunta: -5 }).segundosPorPregunta).toBe(0)
    expect(leerConfigPreguntas({ segundosPorPregunta: '30' }).segundosPorPregunta).toBe(0)
  })

  it('reconoce una lista de preguntas guardada', () => {
    expect(esListaDePreguntas([pregunta])).toBe(true)
    expect(esListaDePreguntas(['Ana'])).toBe(false)
    expect(esListaDePreguntas([{ enunciado: 'x', alternativas: [{ texto: 'a' }] }])).toBe(false)
  })

  it('letras como en las tarjetas', () => {
    expect([0, 1, 2, 3].map(letra)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('tarjetas: siempre de la A a la D, y más si alguna pregunta tiene más alternativas', () => {
    expect(letrasParaTarjetas([pregunta])).toEqual(['A', 'B', 'C', 'D'])
    const cinco = { ...pregunta, alternativas: [...pregunta.alternativas, ...pregunta.alternativas.slice(0, 2)] }
    expect(letrasParaTarjetas([pregunta, cinco])).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})

describe('preguntas: avance del repaso', () => {
  it('cada pregunta: primero se revela y luego se pasa a la siguiente', () => {
    let r = nuevoRepaso(2)
    r = avanzar(r)
    expect(r).toMatchObject({ actual: 0, terminado: false })
    expect(r.estados[0].revelada).toBe(true)
    r = avanzar(r)
    expect(r.actual).toBe(1)
    expect(r.estados[1].revelada).toBe(false)
    r = avanzar(avanzar(r))
    expect(r.terminado).toBe(true)
    expect(avanzar(r)).toBe(r)
  })

  it('volver atrás muestra la pregunta anterior tal como quedó', () => {
    let r = avanzar(avanzar(avanzar(nuevoRepaso(3))))
    expect(r.actual).toBe(1)
    r = retroceder(r)
    expect(r.actual).toBe(0)
    expect(r.estados[0].revelada).toBe(true)
    expect(retroceder(r)).toBe(r)
  })

  it('desde el cierre, volver atrás regresa a la última pregunta', () => {
    const r = retroceder(avanzar(avanzar(nuevoRepaso(1))))
    expect(r).toMatchObject({ actual: 0, terminado: false })
  })

  it('revelar directamente', () => {
    expect(revelar(nuevoRepaso(1)).estados[0].revelada).toBe(true)
  })
})

describe('preguntas: comentar el error', () => {
  it('marca una alternativa incorrecta y la desmarca al repetir', () => {
    let r = comentar(nuevoRepaso(1), pregunta, 2)
    expect(r.estados[0].comentada).toBe(2)
    r = comentar(r, pregunta, 0)
    expect(r.estados[0].comentada).toBe(0)
    r = comentar(r, pregunta, 0)
    expect(r.estados[0].comentada).toBeNull()
  })

  it('no deja marcar la correcta ni una alternativa que no existe', () => {
    const r = nuevoRepaso(1)
    expect(comentar(r, pregunta, 1)).toBe(r)
    expect(comentar(r, pregunta, 7)).toBe(r)
  })
})

describe('tiempo', () => {
  it.each([
    [90_000, '1:30'],
    [9_000, '0:09'],
    [8_001, '0:09'],
    [0, '0:00'],
    [-500, '0:00'],
  ])('%d ms se muestra como %s', (ms, texto) => {
    expect(formatearTiempo(ms)).toBe(texto)
  })
})
