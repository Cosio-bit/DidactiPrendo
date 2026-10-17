import { describe, expect, it } from 'vitest'
import {
  agarrar,
  deshacer,
  elegir,
  esListaDeCategorias,
  nuevoClasificar,
  revelarSiguiente,
  soltarElegido,
  soltarEn,
  terminado,
  ubicarEn,
} from '../../src/blocks/clasificar/logica.ts'

const categorias = [
  { nombre: 'Mamíferos', elementos: ['perro', 'ballena'] },
  { nombre: 'Aves', elementos: ['cóndor'] },
]
// Sin mezclar: perro (0), ballena (0), cóndor (1).
const enOrden = <T,>(l: T[]) => [...l]

describe('clasificar', () => {
  it('suelta todos los elementos con su categoría', () => {
    const c = nuevoClasificar(categorias, enOrden)
    expect(c.elementos).toEqual([
      { texto: 'perro', categoria: 0 },
      { texto: 'ballena', categoria: 0 },
      { texto: 'cóndor', categoria: 1 },
    ])
  })

  it('elegir y ubicar en la categoría correcta', () => {
    let c = elegir(nuevoClasificar(categorias, enOrden), 2)
    expect(c.elegido).toBe(2)
    c = ubicarEn(c, 1)
    expect(c).toMatchObject({ ubicados: [2], elegido: null, errado: null })
  })

  it('ubicar en la categoría equivocada marca el error y deja el elemento elegido', () => {
    const c = ubicarEn(elegir(nuevoClasificar(categorias, enOrden), 0), 1)
    expect(c).toMatchObject({ ubicados: [], elegido: 0, errado: { elemento: 0, categoria: 1 } })
  })

  it('arrastrar y soltar en la categoría correcta lo ubica; en otra, marca el error', () => {
    let c = soltarEn(nuevoClasificar(categorias, enOrden), 2, 1)
    expect(c).toMatchObject({ ubicados: [2], elegido: null, errado: null })
    c = soltarEn(c, 0, 1)
    expect(c).toMatchObject({ ubicados: [2], errado: { elemento: 0, categoria: 1 } })
    // Soltar uno ya elegido no lo deselecciona: igual se ubica.
    c = soltarEn(elegir(c, 1), 1, 0)
    expect(c.ubicados).toEqual([2, 1])
    expect(soltarEn(c, 2, 0)).toBe(c)
  })

  it('agarrar no alterna: volver a agarrar el mismo lo mantiene; Esc lo suelta', () => {
    let c = agarrar(agarrar(nuevoClasificar(categorias, enOrden), 1), 1)
    expect(c.elegido).toBe(1)
    c = soltarElegido(c)
    expect(c.elegido).toBeNull()
    expect(soltarElegido(c)).toBe(c)
  })

  it('sin elemento elegido, tocar una categoría no hace nada', () => {
    const c = nuevoClasificar(categorias, enOrden)
    expect(ubicarEn(c, 0)).toBe(c)
  })

  it('tocar de nuevo el elegido lo suelta; uno ya ubicado no se puede elegir', () => {
    let c = elegir(elegir(nuevoClasificar(categorias, enOrden), 1), 1)
    expect(c.elegido).toBeNull()
    c = ubicarEn(elegir(c, 1), 0)
    expect(elegir(c, 1)).toBe(c)
  })

  it('revelar ubica el elegido o el primero suelto; deshacer lo devuelve', () => {
    let c = revelarSiguiente(elegir(nuevoClasificar(categorias, enOrden), 2))
    expect(c.ubicados).toEqual([2])
    c = revelarSiguiente(revelarSiguiente(c))
    expect(c.ubicados).toEqual([2, 0, 1])
    expect(terminado(c)).toBe(true)
    expect(revelarSiguiente(c)).toBe(c)
    expect(deshacer(c).ubicados).toEqual([2, 0])
  })

  it('reconoce una lista de categorías guardada', () => {
    expect(esListaDeCategorias(categorias)).toBe(true)
    expect(esListaDeCategorias([{ nombre: 'x' }])).toBe(false)
  })
})
