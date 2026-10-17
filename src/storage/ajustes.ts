import { db as dbPorDefecto, type BaseDeDatos } from './db.ts'

/** Ajustes que se guardan en el computador (no son de una actividad), como los equipos del marcador. */
export function crearAjustes(db: BaseDeDatos = dbPorDefecto) {
  return {
    async leer(clave: string): Promise<unknown> {
      try {
        return (await db.ajustes.get(clave))?.valor
      } catch {
        return undefined
      }
    },

    async guardar(clave: string, valor: unknown): Promise<void> {
      await db.ajustes.put({ clave, valor })
    },
  }
}

export type Ajustes = ReturnType<typeof crearAjustes>

export const ajustes = crearAjustes()
