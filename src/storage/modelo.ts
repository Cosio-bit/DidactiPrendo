export type BlockType =
  | 'ruleta'
  | 'preguntas'
  | 'parejas'
  | 'verdadero-falso'
  | 'ordenar'
  | 'clasificar'
  | 'tarjetas'
  | 'completar'
  | 'rosco'
  | 'quien-soy'
  | 'marcador'
  | 'temporizador'

export const SCHEMA_VERSION = 1

export interface Block {
  id: string
  type: BlockType
  title: string
  items: unknown
  config: unknown
  /** Texto tal como lo pegó o escribió el profe; de aquí se leen los items. */
  texto?: string
  course?: string
  subject?: string
  oa?: string
  createdAt: number
  updatedAt: number
  schemaVersion: typeof SCHEMA_VERSION
}

/** Datos que entrega quien crea un bloque; el resto lo completa el almacenamiento. */
export type NuevoBloque = Pick<Block, 'type' | 'title' | 'items' | 'config'> &
  Partial<Pick<Block, 'texto' | 'course' | 'subject' | 'oa'>>

/** Campos que se pueden cambiar después de crear el bloque. */
export type CambiosBloque = Partial<Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>>

/** Un ajuste guardado en el computador, por ejemplo los equipos del marcador. */
export interface Ajuste {
  clave: string
  valor: unknown
}
