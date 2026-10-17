import { describe, expect, it } from 'vitest'
import {
  deshacer,
  esListaDeTextos,
  nuevoOrdenar,
  proponer,
  revelarSiguiente,
  terminado,
} from '../../src/blocks/ordenar/logica.ts'

const alReves = (l: number[]) => [...l].reverse()

describe('ordenar', () => {
  it('parte desordenado y sin nada colocado', () => {
    expect(nuevoOrdenar(3, alReves)).toEqual({ desorden: [2, 1, 0], colocados: 0, errado: null })
  })

  it('si la mezcla queda en orden, vuelve a mezclar', () => {
    let veces = 0
    const primeroEnOrden = (l: number[]) => (veces++ === 0 ? [...l] : alReves(l))
    expect(nuevoOrdenar(3, primeroEnOrden).desorden).toEqual([2, 1, 0])
  })

  it('proponer el que sigue lo coloca; otro queda marcado como error', () => {
    let o = nuevoOrdenar(3, alReves)
    o = proponer(o, 2)
    expect(o).toMatchObject({ colocados: 0, errado: 2 })
    o = proponer(o, 0)
    expect(o).toMatchObject({ colocados: 1, errado: null })
    expect(proponer(o, 0)).toBe(o)
  })

  it('revelar paso a paso hasta terminar, y deshacer', () => {
    let o = nuevoOrdenar(2, alReves)
    o = revelarSiguiente(revelarSiguiente(o))
    expect(terminado(o)).toBe(true)
    expect(revelarSiguiente(o)).toBe(o)
    o = deshacer(o)
    expect(o.colocados).toBe(1)
    expect(deshacer(deshacer(o)).colocados).toBe(0)
  })

  it('reconoce una lista de textos guardada', () => {
    expect(esListaDeTextos(['a', 'b'])).toBe(true)
    expect(esListaDeTextos([{ a: 1 }])).toBe(false)
  })
})
