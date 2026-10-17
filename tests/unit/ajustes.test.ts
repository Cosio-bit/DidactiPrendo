import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Dexie from 'dexie'
import { crearAjustes } from '../../src/storage/ajustes.ts'
import { crearAlmacen } from '../../src/storage/bloques.ts'
import { BaseDeDatos } from '../../src/storage/db.ts'

let db: BaseDeDatos
let n = 0

beforeEach(() => {
  db = new BaseDeDatos(`ajustes-${n++}`)
})

afterEach(async () => {
  await db.delete()
})

describe('ajustes guardados', () => {
  it('guarda y lee un ajuste; uno que no existe es undefined', async () => {
    const ajustes = crearAjustes(db)
    expect(await ajustes.leer('marcador')).toBeUndefined()
    await ajustes.guardar('marcador', { equipos: [] })
    expect(await ajustes.leer('marcador')).toEqual({ equipos: [] })
  })

  it('al pasar a la versión 2 de la base de datos, las actividades guardadas siguen ahí', async () => {
    const nombre = `migracion-${n++}`
    const antigua = new Dexie(nombre)
    antigua.version(1).stores({ bloques: 'id, type, updatedAt, course, subject, oa' })
    await antigua.table('bloques').add({ id: 'a', type: 'ruleta', title: 'Nombres', items: ['Ana', 'Beto'], config: {}, createdAt: 1, updatedAt: 1, schemaVersion: 1 })
    antigua.close()

    const nueva = new BaseDeDatos(nombre)
    expect((await crearAlmacen(nueva).obtener('a'))?.title).toBe('Nombres')
    await crearAjustes(nueva).guardar('temporizador', { totalMs: 60_000 })
    expect(await crearAjustes(nueva).leer('temporizador')).toEqual({ totalMs: 60_000 })
    await nueva.delete()
  })
})
