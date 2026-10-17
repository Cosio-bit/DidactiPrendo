import Dexie, { type EntityTable } from 'dexie'
import type { Ajuste, Block } from './modelo.ts'

export class BaseDeDatos extends Dexie {
  bloques!: EntityTable<Block, 'id'>
  /** Preferencias de la sala que no son de una actividad: equipos del marcador, temporizador… */
  ajustes!: EntityTable<Ajuste, 'clave'>

  constructor(nombre = 'didactiprendo') {
    super(nombre)
    // Al cambiar el formato: agregar this.version(2) con .upgrade() y subir SCHEMA_VERSION.
    this.version(1).stores({
      bloques: 'id, type, updatedAt, course, subject, oa',
    })
    // Versión 2: tabla de ajustes. Los bloques no cambian.
    this.version(2).stores({
      bloques: 'id, type, updatedAt, course, subject, oa',
      ajustes: 'clave',
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
