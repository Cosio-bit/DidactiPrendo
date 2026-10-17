import { describe, expect, it } from 'vitest'
import {
  agarrar,
  deshacer,
  elegir,
  esListaDeTextos,
  nuevoOrdenar,
  ponerEn,
  revelarSiguiente,
  soltarElegido,
  soltarEn,
  terminado,
} from '../../src/blocks/ordenar/logica.ts'

const alReves = (l: number[]) => [...l].reverse()

describe('ordenar', () => {
  it('parte desordenado y sin nada colocado', () => {
    expect(nuevoOrdenar(3, alReves)).toEqual({ desorden: [2, 1, 0], colocados: [], elegido: null, errado: null })
  })

  it('si la mezcla queda en orden, vuelve a mezclar', () => {
    let veces = 0
    const primeroEnOrden = (l: number[]) => (veces++ === 0 ? [...l] : alReves(l))
    expect(nuevoOrdenar(3, primeroEnOrden).desorden).toEqual([2, 1, 0])
  })

  it('se elige un elemento y se toca su casilla; puede ir en cualquier orden', () => {
    let o = nuevoOrdenar(3, alReves)
    o = ponerEn(elegir(o, 2), 2)
    expect(o).toMatchObject({ colocados: [2], elegido: null, errado: null })
    o = ponerEn(elegir(o, 0), 0)
    expect(o.colocados).toEqual([2, 0])
    // Ni el elemento ni la casilla ya ocupados se pueden volver a usar.
    expect(elegir(o, 0)).toBe(o)
    expect(ponerEn(elegir(o, 1), 0).colocados).toEqual([2, 0])
  })

  it('en una casilla equivocada queda marcado el error y el elemento sigue elegido', () => {
    let o = elegir(nuevoOrdenar(3, alReves), 2)
    o = ponerEn(o, 0)
    expect(o).toMatchObject({ colocados: [], elegido: 2, errado: { elemento: 2, casilla: 0 } })
    o = ponerEn(o, 2)
    expect(o).toMatchObject({ colocados: [2], elegido: null, errado: null })
  })

  it('tocar de nuevo el elegido lo suelta; agarrar no alterna; Esc lo suelta', () => {
    const o = nuevoOrdenar(3, alReves)
    expect(elegir(elegir(o, 1), 1).elegido).toBeNull()
    expect(agarrar(agarrar(o, 1), 1).elegido).toBe(1)
    expect(soltarElegido(agarrar(o, 1)).elegido).toBeNull()
    expect(ponerEn(o, 0)).toBe(o)
  })

  it('arrastrar y soltar sobre una casilla es lo mismo que elegir y tocarla', () => {
    let o = nuevoOrdenar(3, alReves)
    o = soltarEn(o, 1, 2)
    expect(o).toMatchObject({ colocados: [], elegido: 1, errado: { elemento: 1, casilla: 2 } })
    o = soltarEn(o, 1, 1)
    expect(o.colocados).toEqual([1])
  })

  it('revelar llena la primera casilla vacía hasta terminar, y deshacer quita el último colocado', () => {
    let o = soltarEn(nuevoOrdenar(3, alReves), 1, 1)
    o = revelarSiguiente(o)
    expect(o.colocados).toEqual([1, 0])
    o = revelarSiguiente(o)
    expect(terminado(o)).toBe(true)
    expect(revelarSiguiente(o)).toBe(o)
    o = deshacer(o)
    expect(o.colocados).toEqual([1, 0])
    expect(deshacer(deshacer(deshacer(o))).colocados).toEqual([])
  })

  it('reconoce una lista de textos guardada', () => {
    expect(esListaDeTextos(['a', 'b'])).toBe(true)
    expect(esListaDeTextos([{ a: 1 }])).toBe(false)
  })
})
