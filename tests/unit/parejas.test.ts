import { describe, expect, it } from 'vitest'
import { barajar } from '../../src/blocks/azar.ts'
import {
  columnasParaGrilla,
  esListaDeParejas,
  estaVisible,
  nuevoMemorice,
  tapar,
  terminado,
  voltear,
} from '../../src/blocks/parejas/logica.ts'

const parejas = [
  { a: 'perro', b: 'dog' },
  { a: 'gato', b: 'cat' },
]
// Sin mezclar, para saber dónde está cada carta: perro, dog, gato, cat.
const enOrden = <T,>(l: readonly T[]) => [...l]

describe('memorice', () => {
  it('arma dos cartas por pareja', () => {
    const m = nuevoMemorice(parejas, enOrden)
    expect(m.cartas.map((c) => c.texto)).toEqual(['perro', 'dog', 'gato', 'cat'])
    expect(m.cartas.map((c) => c.pareja)).toEqual([0, 0, 1, 1])
  })

  it('dos cartas de la misma pareja quedan descubiertas', () => {
    let m = voltear(nuevoMemorice(parejas, enOrden), 0)
    expect(m.abiertas).toEqual([0])
    m = voltear(m, 1)
    expect(m).toMatchObject({ abiertas: [], encontradas: [0], ultimo: 'pareja' })
    expect(estaVisible(m, 0) && estaVisible(m, 1)).toBe(true)
  })

  it('si no son pareja, quedan a la vista hasta que se voltea otra o se tapan', () => {
    let m = voltear(voltear(nuevoMemorice(parejas, enOrden), 0), 2)
    expect(m).toMatchObject({ abiertas: [0, 2], ultimo: 'no-pareja' })
    expect(voltear(m, 3).abiertas).toEqual([3])
    m = tapar(m)
    expect(m.abiertas).toEqual([])
  })

  it('ignora cartas ya encontradas o ya abiertas', () => {
    const m = voltear(voltear(nuevoMemorice(parejas, enOrden), 0), 1)
    expect(voltear(m, 0)).toBe(m)
    const abierta = voltear(m, 2)
    expect(voltear(abierta, 2)).toBe(abierta)
  })

  it('termina al encontrar todas', () => {
    let m = nuevoMemorice(parejas, enOrden)
    for (const i of [0, 1, 2, 3]) m = voltear(m, i)
    expect(terminado(m)).toBe(true)
  })

  it('reconoce una lista de parejas guardada', () => {
    expect(esListaDeParejas(parejas)).toBe(true)
    expect(esListaDeParejas(['perro'])).toBe(false)
  })
})

describe('barajar', () => {
  it('no pierde ni repite elementos', () => {
    const lista = Array.from({ length: 24 }, (_, i) => i)
    expect([...barajar(lista)].sort((a, b) => a - b)).toEqual(lista)
  })
})

describe('grilla del memorice', () => {
  it.each([
    [24, 976, 560, 6],
    [8, 976, 560, 4],
    [24, 1600, 560, 8],
    [6, 400, 800, 2],
  ])('%d cartas en %d×%d: %d columnas', (n, ancho, alto, columnas) => {
    expect(columnasParaGrilla(n, ancho, alto)).toBe(columnas)
  })
})
