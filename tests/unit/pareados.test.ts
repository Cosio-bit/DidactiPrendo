import { describe, expect, it } from 'vitest'
import {
  agarrar,
  deshacer,
  nuevoPareados,
  revelarSiguiente,
  soltarElegido,
  soltarSobre,
  terminado,
  tocar,
  unir,
} from '../../src/blocks/pareados/logica.ts'

const parejas = [
  { a: 'Sustantivo', b: 'Palabra que nombra' },
  { a: 'Verbo', b: 'Palabra que indica una acción' },
  { a: 'Adjetivo', b: 'Palabra que describe' },
]
// Definiciones al revés, para que el orden sea conocido en las pruebas.
const alReves = (l: number[]) => [...l].reverse()
const concepto = (pareja: number) => ({ lado: 'concepto' as const, pareja })
const definicion = (pareja: number) => ({ lado: 'definicion' as const, pareja })

describe('términos pareados', () => {
  it('desordena las definiciones y nunca las deja todas frente a su concepto', () => {
    expect(nuevoPareados(parejas, alReves).orden).toEqual([2, 1, 0])
    expect(nuevoPareados(parejas, (l) => l).orden).not.toEqual([0, 1, 2])
  })

  it('tocar un concepto y luego su definición los une', () => {
    let p = tocar(nuevoPareados(parejas, alReves), concepto(1))
    expect(p.elegido).toEqual(concepto(1))
    p = tocar(p, definicion(1))
    expect(p.unidas).toEqual([1])
    expect(p.elegido).toBeNull()
  })

  it('también se puede empezar por la definición', () => {
    const p = tocar(tocar(nuevoPareados(parejas, alReves), definicion(2)), concepto(2))
    expect(p.unidas).toEqual([2])
  })

  it('una definición equivocada no se une y queda marcada', () => {
    const p = tocar(tocar(nuevoPareados(parejas, alReves), concepto(0)), definicion(1))
    expect(p.unidas).toEqual([])
    expect(p.errado).toEqual({ concepto: 0, definicion: 1 })
  })

  it('tocar otro concepto cambia la elección; tocar el mismo la suelta', () => {
    let p = tocar(nuevoPareados(parejas, alReves), concepto(0))
    p = tocar(p, concepto(2))
    expect(p.elegido).toEqual(concepto(2))
    expect(tocar(p, concepto(2)).elegido).toBeNull()
  })

  it('lo ya unido no se puede volver a tocar', () => {
    const p = unir(nuevoPareados(parejas, alReves), 0, 0)
    expect(tocar(p, concepto(0))).toBe(p)
    expect(tocar(p, definicion(0))).toBe(p)
  })

  it('arrastrar un concepto sobre su definición los une; soltarlo en su misma columna lo deja agarrado', () => {
    const inicio = nuevoPareados(parejas, alReves)
    expect(soltarSobre(inicio, concepto(1), definicion(1)).unidas).toEqual([1])
    expect(soltarSobre(inicio, concepto(1), concepto(2)).elegido).toEqual(concepto(1))
    expect(soltarElegido(agarrar(inicio, concepto(1))).elegido).toBeNull()
  })

  it('Espacio une el elegido o el primero que falta, y al final está todo unido', () => {
    let p = tocar(nuevoPareados(parejas, alReves), concepto(2))
    p = revelarSiguiente(p)
    expect(p.unidas).toEqual([2])
    p = revelarSiguiente(revelarSiguiente(p))
    expect(p.unidas).toEqual([2, 0, 1])
    expect(terminado(p)).toBe(true)
    expect(revelarSiguiente(p)).toBe(p)
  })

  it('deshacer separa la última pareja unida', () => {
    const p = deshacer(unir(unir(nuevoPareados(parejas, alReves), 0, 0), 2, 2))
    expect(p.unidas).toEqual([0])
  })
})
