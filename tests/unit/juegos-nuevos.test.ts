import { describe, expect, it } from 'vitest'
import * as completar from '../../src/blocks/completar/logica.ts'
import * as pasapalabra from '../../src/blocks/pasapalabra/logica.ts'
import * as quienSoy from '../../src/blocks/quien-soy/logica.ts'
import * as tarjetas from '../../src/blocks/tarjetas/logica.ts'
import type { Adivinanza, Frase } from '../../src/parser/tipos.ts'

const alReves = <T,>(lista: readonly T[]) => [...lista].reverse()

describe('tarjetas', () => {
  it('espacio voltea y después pasa a la siguiente; al final, cierre', () => {
    let m = tarjetas.nuevoMazo(2, false)
    expect(m).toMatchObject({ orden: [0, 1], actual: 0, volteada: false })
    m = tarjetas.avanzar(m)
    expect(m).toMatchObject({ actual: 0, volteada: true })
    m = tarjetas.avanzar(m)
    expect(m).toMatchObject({ actual: 1, volteada: false })
    m = tarjetas.avanzar(tarjetas.avanzar(m))
    expect(m.terminado).toBe(true)
  })

  it('volver muestra la anterior por atrás; tocar la tarjeta la da vuelta y vuelve', () => {
    let m = tarjetas.avanzar(tarjetas.avanzar(tarjetas.nuevoMazo(3, false)))
    m = tarjetas.retroceder(m)
    expect(m).toMatchObject({ actual: 0, volteada: true })
    m = tarjetas.voltear(tarjetas.voltear(m))
    expect(m.volteada).toBe(true)
  })

  it('en desorden si el profe lo eligió', () => {
    expect(tarjetas.nuevoMazo(3, true, alReves).orden).toEqual([2, 1, 0])
  })

  it('la opción parte desactivada y lee valores guardados', () => {
    expect(tarjetas.leerConfigTarjetas(undefined)).toEqual({ mezclarTarjetas: false })
    expect(tarjetas.leerConfigTarjetas({ mezclarTarjetas: true, otra: 1 })).toEqual({ mezclarTarjetas: true })
  })
})

describe('completar la frase', () => {
  const frases: Frase[] = [
    { partes: [{ texto: 'La ', oculta: false }, { texto: 'Tierra', oculta: true }, { texto: ' gira alrededor del ', oculta: false }, { texto: 'Sol', oculta: true }] },
    { partes: [{ texto: 'Dos', oculta: true }, { texto: ' más dos', oculta: false }] },
  ]

  it('espacio muestra las palabras en orden y después pasa a la frase siguiente', () => {
    let e = completar.nuevoCompletar(frases)
    e = completar.avanzar(e)
    expect(e.visibles[0]).toEqual([true, false])
    e = completar.avanzar(e)
    expect(e.visibles[0]).toEqual([true, true])
    e = completar.avanzar(e)
    expect(e.actual).toBe(1)
    e = completar.avanzar(completar.avanzar(e))
    expect(e.terminado).toBe(true)
  })

  it('tocar una palabra la muestra o la oculta, en cualquier orden', () => {
    let e = completar.alternarPalabra(completar.nuevoCompletar(frases), 1)
    expect(e.visibles[0]).toEqual([false, true])
    // Espacio muestra la primera que sigue oculta.
    e = completar.avanzar(e)
    expect(e.visibles[0]).toEqual([true, true])
    e = completar.alternarPalabra(e, 0)
    expect(e.visibles[0]).toEqual([false, true])
    expect(completar.alternarPalabra(e, 5)).toBe(e)
  })

  it('volver a la frase anterior la deja como quedó', () => {
    let e = completar.mostrarTodas(completar.nuevoCompletar(frases))
    e = completar.retroceder(completar.avanzar(e))
    expect(e).toMatchObject({ actual: 0, visibles: [[true, true], [false]] })
  })

  it('las palabras de abajo van en desorden', () => {
    expect(completar.nuevoCompletar(frases, alReves).bancos).toEqual([[1, 0], [0]])
    expect(completar.palabrasOcultas(frases[0])).toEqual(['Tierra', 'Sol'])
  })
})

describe('pasapalabra', () => {
  it('correcta o incorrecta marca la letra; espacio pasa a la siguiente', () => {
    let r = pasapalabra.nuevoRosco(3)
    r = pasapalabra.responder(r, 'acierto')
    expect(r).toMatchObject({ estados: ['acierto', 'pendiente', 'pendiente'], respondida: true, actual: 0 })
    // Ya respondida, no se puede volver a marcar.
    expect(pasapalabra.responder(r, 'error')).toBe(r)
    r = pasapalabra.avanzar(r)
    expect(r).toMatchObject({ actual: 1, respondida: false })
  })

  it('pasapalabra deja la letra para la próxima vuelta', () => {
    let r = pasapalabra.nuevoRosco(3)
    r = pasapalabra.avanzar(r) // pasa la A
    r = pasapalabra.avanzar(pasapalabra.responder(r, 'error')) // B incorrecta
    r = pasapalabra.avanzar(pasapalabra.responder(r, 'acierto')) // C correcta
    expect(r.actual).toBe(0)
    r = pasapalabra.avanzar(pasapalabra.responder(r, 'acierto'))
    expect(r.terminado).toBe(true)
    expect(pasapalabra.contar(r)).toEqual({ aciertos: 2, errores: 1, pendientes: 0 })
  })

  it('con una sola letra por responder, pasapalabra se queda en ella', () => {
    const r = pasapalabra.avanzar(pasapalabra.responder(pasapalabra.nuevoRosco(2), 'acierto'))
    expect(pasapalabra.avanzar(r).actual).toBe(1)
  })

  it('deshacer devuelve la última letra respondida, aunque el rosco haya terminado', () => {
    let r = pasapalabra.avanzar(pasapalabra.responder(pasapalabra.nuevoRosco(1), 'error'))
    expect(r.terminado).toBe(true)
    r = pasapalabra.deshacer(r)
    expect(r).toMatchObject({ estados: ['pendiente'], actual: 0, terminado: false, historial: [] })
    expect(pasapalabra.deshacer(r)).toBe(r)
  })
})

describe('¿quién soy?', () => {
  const adivinanzas: Adivinanza[] = [
    { respuesta: 'cóndor', pistas: ['Tengo plumas.', 'Vivo en la cordillera.', 'Soy el ave nacional.'] },
    { respuesta: 'ballena', pistas: ['Vivo en el mar.'] },
  ]

  it('parte con la primera pista; espacio muestra otra, después la respuesta y después la siguiente', () => {
    let j = quienSoy.nuevoJuego(adivinanzas)
    expect(j.estados[0]).toEqual({ pistas: 1, revelada: false })
    j = quienSoy.avanzar(quienSoy.avanzar(j, adivinanzas), adivinanzas)
    expect(j.estados[0]).toEqual({ pistas: 3, revelada: false })
    j = quienSoy.avanzar(j, adivinanzas)
    expect(j.estados[0].revelada).toBe(true)
    j = quienSoy.avanzar(j, adivinanzas)
    expect(j.actual).toBe(1)
    j = quienSoy.avanzar(quienSoy.avanzar(j, adivinanzas), adivinanzas)
    expect(j.terminado).toBe(true)
  })

  it('si adivinan antes, revelar muestra la respuesta y todas las pistas', () => {
    const j = quienSoy.revelar(quienSoy.nuevoJuego(adivinanzas), adivinanzas)
    expect(j.estados[0]).toEqual({ pistas: 3, revelada: true })
  })

  it('volver deja la adivinanza anterior como quedó', () => {
    let j = quienSoy.revelar(quienSoy.nuevoJuego(adivinanzas), adivinanzas)
    j = quienSoy.retroceder(quienSoy.avanzar(j, adivinanzas))
    expect(j).toMatchObject({ actual: 0, estados: [{ pistas: 3, revelada: true }, { pistas: 1, revelada: false }] })
  })
})
