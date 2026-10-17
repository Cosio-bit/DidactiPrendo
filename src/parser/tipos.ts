export type TipoLectura = 'ruleta' | 'preguntas'

export interface Alternativa {
  texto: string
  correcta: boolean
}

export interface Pregunta {
  enunciado: string
  alternativas: Alternativa[]
}

export type CodigoAdvertencia =
  | 'sin-elementos'
  | 'sin-preguntas'
  | 'lineas-ignoradas'
  | 'separado-por-comas'
  | 'repetidos'
  | 'pocos-elementos'
  | 'demasiados-elementos'
  | 'sin-correcta'
  | 'varias-correctas'
  | 'pocas-alternativas'
  | 'sin-enunciado'

export interface Advertencia {
  codigo: CodigoAdvertencia
  /** Explicación en español simple para el profe. */
  mensaje: string
  /** Líneas del texto original (desde 1) a las que se refiere, si aplica. */
  lineas: number[]
}

interface LecturaBase {
  /** El tipo que el lector cree que corresponde al texto. */
  tipoSugerido: TipoLectura
  advertencias: Advertencia[]
}

export type Lectura =
  | (LecturaBase & { tipo: 'ruleta'; elementos: string[] })
  | (LecturaBase & { tipo: 'preguntas'; elementos: Pregunta[] })
