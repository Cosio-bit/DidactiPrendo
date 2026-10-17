import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { crearAlmacen, type Almacen } from '../../src/storage/bloques.ts'
import { BaseDeDatos } from '../../src/storage/db.ts'
import { codificar, decodificar, importar, leerArchivo, paraArchivo } from '../../src/storage/intercambio.ts'
import type { Block } from '../../src/storage/modelo.ts'

const ruleta: Block = {
  id: 'a1',
  type: 'ruleta',
  title: 'Nombres 6°B',
  texto: 'Ana\nBenjamín\nCatalina',
  items: ['Ana', 'Benjamín', 'Catalina'],
  config: { eliminarAlSalir: true },
  createdAt: 1000,
  updatedAt: 2000,
  schemaVersion: 1,
}

let db: BaseDeDatos
let almacen: Almacen
let n = 0

beforeEach(() => {
  db = new BaseDeDatos(`intercambio-${n++}`)
  almacen = crearAlmacen(db)
})

afterEach(async () => {
  await db.delete()
})

describe('archivo de respaldo', () => {
  it('guarda y vuelve a leer las actividades tal como estaban', () => {
    const texto = paraArchivo([ruleta], new Date('2026-10-17T12:00:00Z'))
    expect(JSON.parse(texto)).toMatchObject({ aplicacion: 'DidactiPrendo', formato: 1, exportado: '2026-10-17T12:00:00.000Z' })
    expect(leerArchivo(texto)).toEqual([ruleta])
  })

  it('rechaza archivos que no son de la app o vienen dañados', () => {
    expect(leerArchivo('hola')).toBeNull()
    expect(leerArchivo('{"actividades": []}')).toBeNull()
    expect(leerArchivo(JSON.stringify({ aplicacion: 'DidactiPrendo', actividades: [{ ...ruleta, type: 'otro' }] }))).toBeNull()
    expect(leerArchivo(paraArchivo([ruleta]).slice(0, 80))).toBeNull()
  })

  it('al importar agrega lo nuevo, no repite lo que ya está y nunca reemplaza', async () => {
    await almacen.restaurar({ ...ruleta, id: 'igual' })
    await almacen.restaurar({ ...ruleta, id: 'distinta', title: 'Mi versión' })
    const resultado = await importar(almacen, [
      { ...ruleta, id: 'nueva' },
      { ...ruleta, id: 'igual' },
      { ...ruleta, id: 'distinta', title: 'Versión del archivo' },
    ])
    expect(resultado.yaEstaban).toBe(1)
    expect(resultado.agregadas.map((b) => b.title)).toEqual(['Nombres 6°B', 'Versión del archivo'])
    // La nueva conserva su identificador y fechas; la que chocaba entra como copia aparte.
    expect(await almacen.obtener('nueva')).toEqual({ ...ruleta, id: 'nueva' })
    expect((await almacen.obtener('distinta'))?.title).toBe('Mi versión')
    expect(resultado.agregadas[1].id).not.toBe('distinta')
    expect(await almacen.listar()).toHaveLength(4)
  })
})

describe('enlace para compartir', () => {
  it('lleva la actividad comprimida y se vuelve a leer igual, con tildes y emojis', async () => {
    const texto = '¿Cuánto es 1/2 + 1/4?\na) 2/6\n*b) 3/4 ✓\nc) 1/8 🍕'
    const enlace = await codificar({ type: 'preguntas', title: 'Fracciones 6°B', texto, config: { segundosPorPregunta: 30 } })
    expect(enlace).toMatch(/^z[A-Za-z0-9_-]+$/)
    expect(await decodificar(enlace)).toEqual({
      ok: true,
      actividad: { type: 'preguntas', title: 'Fracciones 6°B', texto, config: { segundosPorPregunta: 30 } },
    })
  })

  it('comprimido es bastante más corto que el texto, para que quepa en un mensaje', async () => {
    const nombres = Array.from({ length: 40 }, (_, i) => `Estudiante número ${i + 1}`).join('\n')
    const enlace = await codificar({ ...ruleta, texto: nombres })
    expect(enlace.length).toBeLessThan(nombres.length / 2)
  })

  it('un enlace cortado o cambiado no se rompe: dice que está dañado', async () => {
    const enlace = await codificar(ruleta)
    expect(await decodificar(enlace.slice(0, 20))).toEqual({ ok: false, motivo: 'danado' })
    expect(await decodificar('x123')).toEqual({ ok: false, motivo: 'danado' })
    expect(await decodificar('')).toEqual({ ok: false, motivo: 'danado' })
    expect(await decodificar('j' + btoa('{"type":"nada"}'))).toEqual({ ok: false, motivo: 'danado' })
  })
})
