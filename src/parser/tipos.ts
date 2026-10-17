export type TipoLectura = 'ruleta' | 'preguntas' | 'parejas' | 'verdadero-falso' | 'ordenar' | 'clasificar'

export interface Alternativa {
  texto: string
  correcta: boolean
}

export interface Pregunta {
  enunciado: string
  alternativas: Alternativa[]
}

export interface Pareja {
  a: string
  b: string
}

export interface Afirmacion {
  texto: string
  /** null: el texto no dice si es verdadera o falsa. */
  verdadera: boolean | null
}

export interface Categoria {
  nombre: string
  elementos: string[]
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
  | 'sin-parejas'
  | 'demasiadas-parejas'
  | 'sin-afirmaciones'
  | 'sin-respuesta'
  | 'ordenado-por-numero'
  | 'pocos-para-ordenar'
  | 'demasiados-para-ordenar'
  | 'pocas-categorias'
  | 'categoria-vacia'
  | 'demasiadas-categorias'

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
  | (LecturaBase & { tipo: 'parejas'; elementos: Pareja[] })
  | (LecturaBase & { tipo: 'verdadero-falso'; elementos: Afirmacion[] })
  | (LecturaBase & { tipo: 'ordenar'; elementos: string[] })
  | (LecturaBase & { tipo: 'clasificar'; elementos: Categoria[] })
