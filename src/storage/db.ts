import Dexie, { type EntityTable } from 'dexie'
import type { Block } from './modelo.ts'

export class BaseDeDatos extends Dexie {
  bloques!: EntityTable<Block, 'id'>

  constructor(nombre = 'didactiprendo') {
    super(nombre)
    // Al cambiar el formato: agregar this.version(2) con .upgrade() y subir SCHEMA_VERSION.
    this.version(1).stores({
      bloques: 'id, type, updatedAt, course, subject, oa',
    })
  }
}

export const db = new BaseDeDatos()

/**
 * Pide al navegador que no borre los datos cuando le falte espacio.
 * Si no lo permite, la app sigue funcionando igual.
 */
export async function pedirAlmacenamientoPersistente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
