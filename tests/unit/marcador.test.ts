import { describe, expect, it } from 'vitest'
import {
  agregarEquipo,
  COLORES_EQUIPO,
  leerMarcador,
  MAXIMO_EQUIPOS,
  nombreDeEquipo,
  nuevoMarcador,
  quitarEquipo,
  reiniciarPuntos,
  renombrar,
  siguienteColor,
  sumar,
} from '../../src/blocks/marcador/logica.ts'
import { nombreDeColor } from '../../src/blocks/marcador/nombres.ts'

describe('marcador por equipos', () => {
  it('parte con 2 equipos con el nombre de su color y 0 puntos', () => {
    const m = nuevoMarcador(2, nombreDeColor)
    expect(m.equipos).toEqual([
      { nombre: 'Azul', color: 0, puntos: 0 },
      { nombre: 'Naranjo', color: 1, puntos: 0 },
    ])
  })

  it('suma y resta puntos sin bajar de cero', () => {
    let m = nuevoMarcador(2, nombreDeColor)
    m = sumar(sumar(m, 1, 1), 1, 1)
    expect(m.equipos[1].puntos).toBe(2)
    m = sumar(m, 1, -1)
    m = sumar(m, 0, -1)
    expect(m.equipos.map((e) => e.puntos)).toEqual([0, 1])
  })

  it('acepta de 2 a 8 equipos, cada uno con un color y una figura distintos', () => {
    let m = nuevoMarcador(2, nombreDeColor)
    for (let i = 0; i < 10; i++) m = agregarEquipo(m, nombreDeColor)
    expect(m.equipos).toHaveLength(MAXIMO_EQUIPOS)
    expect(new Set(m.equipos.map((e) => e.color)).size).toBe(MAXIMO_EQUIPOS)
    expect(new Set(m.equipos.map((e) => COLORES_EQUIPO[e.color].figura)).size).toBe(MAXIMO_EQUIPOS)
    for (let i = 0; i < 10; i++) m = quitarEquipo(m, 0)
    expect(m.equipos).toHaveLength(2)
  })

  it('al agregar un equipo usa un color que nadie tiene', () => {
    let m = nuevoMarcador(3, nombreDeColor)
    m = quitarEquipo(m, 1)
    m = agregarEquipo(m, nombreDeColor)
    expect(m.equipos.map((e) => e.nombre)).toEqual(['Azul', 'Verde', 'Naranjo'])
  })

  it('cambiar el color pasa al siguiente libre y, si el nombre era el del color, cambia con él', () => {
    let m = nuevoMarcador(2, nombreDeColor)
    m = siguienteColor(m, 0, nombreDeColor)
    // El naranjo ya lo usa el otro equipo: salta al verde.
    expect(m.equipos[0]).toMatchObject({ color: 2, nombre: 'Verde' })
    m = renombrar(m, 0, 'Los Cóndores')
    m = siguienteColor(m, 0, nombreDeColor)
    expect(m.equipos[0]).toMatchObject({ color: 3, nombre: 'Los Cóndores' })
  })

  it('un nombre en blanco se muestra con el nombre de su color', () => {
    const m = renombrar(nuevoMarcador(2, nombreDeColor), 1, '  ')
    expect(nombreDeEquipo(m.equipos[1], nombreDeColor)).toBe('Naranjo')
  })

  it('reiniciar deja todos en 0 y conserva nombres y colores', () => {
    let m = renombrar(sumar(nuevoMarcador(3, nombreDeColor), 2, 5), 2, '6°B')
    m = reiniciarPuntos(m)
    expect(m.equipos[2]).toEqual({ nombre: '6°B', color: 2, puntos: 0 })
  })

  it('lee un marcador guardado y descarta lo que no sirve', () => {
    const m = sumar(nuevoMarcador(3, nombreDeColor), 0, 4)
    expect(leerMarcador(JSON.parse(JSON.stringify(m)))).toEqual(m)
    expect(leerMarcador(undefined)).toBeUndefined()
    expect(leerMarcador({ equipos: [{ nombre: 'Azul', color: 0, puntos: 1 }] })).toBeUndefined()
    expect(
      leerMarcador({
        equipos: [
          { nombre: 'Azul', color: 0, puntos: 1 },
          { nombre: 'Malo', color: 99, puntos: 1 },
          { nombre: 'Verde', color: 2, puntos: -3 },
        ],
      }),
    ).toEqual({
      equipos: [
        { nombre: 'Azul', color: 0, puntos: 1 },
        { nombre: 'Verde', color: 2, puntos: 0 },
      ],
    })
  })
})
