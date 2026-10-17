import { db as dbPorDefecto, type BaseDeDatos } from './db.ts'
import { SCHEMA_VERSION, type Block, type CambiosBloque, type NuevoBloque } from './modelo.ts'

function nuevoId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Chrome anterior a la versión 92 no tiene randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Sin nombre ni texto: se creó y se abandonó sin escribir nada. */
export function esVacio(bloque: Block): boolean {
  return !bloque.title.trim() && !(bloque.texto ?? '').trim()
}

/** Las vacías más nuevas que esto se respetan: pueden estar abiertas en otra pestaña. */
const ANTIGUEDAD_VACIAS_MS = 10 * 60 * 1000

export function crearAlmacen(db: BaseDeDatos = dbPorDefecto) {
  return {
    async crear(datos: NuevoBloque): Promise<Block> {
      const ahora = Date.now()
      const bloque: Block = {
        ...datos,
        id: nuevoId(),
        createdAt: ahora,
        updatedAt: ahora,
        schemaVersion: SCHEMA_VERSION,
      }
      await db.bloques.add(bloque)
      return bloque
    },

    obtener(id: string): Promise<Block | undefined> {
      return db.bloques.get(id)
    },

    /** Del más reciente al más antiguo. */
    listar(): Promise<Block[]> {
      return db.bloques.orderBy('updatedAt').reverse().toArray()
    },

    /** Devuelve el bloque como quedó, o undefined si ya no existe. */
    async actualizar(id: string, cambios: CambiosBloque): Promise<Block | undefined> {
      return db.transaction('rw', db.bloques, async () => {
        const actual = await db.bloques.get(id)
        if (!actual) return undefined
        const actualizado: Block = { ...actual, ...cambios, updatedAt: Date.now() }
        await db.bloques.put(actualizado)
        return actualizado
      })
    },

    /** Devuelve el bloque borrado para poder deshacer, o undefined si no existía. */
    async borrar(id: string): Promise<Block | undefined> {
      return db.transaction('rw', db.bloques, async () => {
        const bloque = await db.bloques.get(id)
        if (bloque) await db.bloques.delete(id)
        return bloque
      })
    },

    /** Borra las actividades vacías con más de 10 minutos. No hay nada que perder en ellas. */
    borrarVacios(): Promise<number> {
      const limite = Date.now() - ANTIGUEDAD_VACIAS_MS
      return db.bloques.filter((b) => esVacio(b) && b.updatedAt < limite).delete()
    },

    /** Vuelve a guardar un bloque tal como estaba (para deshacer un borrado). */
    async restaurar(bloque: Block): Promise<void> {
      await db.bloques.put(bloque)
    },
  }
}

export type Almacen = ReturnType<typeof crearAlmacen>

export const almacen = crearAlmacen()
