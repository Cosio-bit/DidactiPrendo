import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearAlmacen, esVacio, type Almacen } from '../../src/storage/bloques.ts'
import { BaseDeDatos } from '../../src/storage/db.ts'
import { SCHEMA_VERSION, type NuevoBloque } from '../../src/storage/modelo.ts'

const ruleta: NuevoBloque = {
  type: 'ruleta',
  title: 'Nombres 6°B',
  items: ['Ana', 'Benjamín', 'Catalina'],
  config: { eliminarAlSalir: true },
  course: '6° básico',
}

let db: BaseDeDatos
let almacen: Almacen
let n = 0

beforeEach(() => {
  db = new BaseDeDatos(`prueba-${n++}`)
  almacen = crearAlmacen(db)
})

afterEach(async () => {
  vi.useRealTimers()
  await db.delete()
})

describe('almacenamiento de bloques', () => {
  it('guarda un bloque con id, fechas y versión de formato', async () => {
    const bloque = await almacen.crear(ruleta)

    expect(bloque.id).toBeTruthy()
    expect(bloque.schemaVersion).toBe(SCHEMA_VERSION)
    expect(bloque.createdAt).toBe(bloque.updatedAt)
    expect(await almacen.obtener(bloque.id)).toEqual(bloque)
  })

  it('da un id distinto a cada bloque', async () => {
    const a = await almacen.crear(ruleta)
    const b = await almacen.crear(ruleta)
    expect(a.id).not.toBe(b.id)
  })

  it('lista los bloques del más reciente al más antiguo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1000)
    const viejo = await almacen.crear({ ...ruleta, title: 'Viejo' })
    vi.setSystemTime(2000)
    const nuevo = await almacen.crear({ ...ruleta, title: 'Nuevo' })

    expect((await almacen.listar()).map((b) => b.id)).toEqual([nuevo.id, viejo.id])

    vi.setSystemTime(3000)
    await almacen.actualizar(viejo.id, { title: 'Viejo editado' })
    expect((await almacen.listar()).map((b) => b.id)).toEqual([viejo.id, nuevo.id])
  })

  it('lista vacía cuando no hay bloques', async () => {
    expect(await almacen.listar()).toEqual([])
  })

  it('actualiza solo los campos indicados y la fecha de modificación', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1000)
    const bloque = await almacen.crear(ruleta)
    vi.setSystemTime(5000)

    const actualizado = await almacen.actualizar(bloque.id, { title: 'Nombres 6°A' })

    expect(actualizado).toEqual({ ...bloque, title: 'Nombres 6°A', updatedAt: 5000 })
    expect(await almacen.obtener(bloque.id)).toEqual(actualizado)
  })

  it('no crea nada al actualizar un bloque que no existe', async () => {
    expect(await almacen.actualizar('no-existe', { title: 'X' })).toBeUndefined()
    expect(await almacen.listar()).toEqual([])
  })

  it('borra un bloque y lo devuelve para poder deshacer', async () => {
    const bloque = await almacen.crear(ruleta)
    const otro = await almacen.crear({ ...ruleta, title: 'Otro' })

    expect(await almacen.borrar(bloque.id)).toEqual(bloque)
    expect(await almacen.obtener(bloque.id)).toBeUndefined()
    expect(await almacen.listar()).toEqual([otro])
  })

  it('borrar un bloque que no existe no falla', async () => {
    expect(await almacen.borrar('no-existe')).toBeUndefined()
  })

  it('restaura un bloque borrado tal como estaba', async () => {
    const bloque = await almacen.crear(ruleta)
    const borrado = await almacen.borrar(bloque.id)

    await almacen.restaurar(borrado!)

    expect(await almacen.obtener(bloque.id)).toEqual(bloque)
  })

  it('los datos siguen ahí al abrir la base de nuevo', async () => {
    const bloque = await almacen.crear(ruleta)
    db.close()

    const reabierta = new BaseDeDatos(db.name)
    expect(await crearAlmacen(reabierta).obtener(bloque.id)).toEqual(bloque)
    reabierta.close()
  })

  it('borra solo las actividades vacías con más de 10 minutos', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    const vaciaVieja = await almacen.crear({ ...ruleta, title: ' ', texto: '' })
    const conNombre = await almacen.crear({ ...ruleta, title: 'Con nombre' })
    const conTexto = await almacen.crear({ ...ruleta, title: '', texto: 'Ana' })
    vi.setSystemTime(11 * 60 * 1000)
    const vaciaNueva = await almacen.crear({ ...ruleta, title: '' })

    expect(esVacio(vaciaVieja)).toBe(true)
    expect(await almacen.borrarVacios()).toBe(1)
    expect((await almacen.listar()).map((b) => b.id).sort()).toEqual(
      [conNombre.id, conTexto.id, vaciaNueva.id].sort(),
    )
  })
})
