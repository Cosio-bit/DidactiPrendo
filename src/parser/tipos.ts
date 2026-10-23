export type TipoLectura =
  | 'ruleta'
  | 'preguntas'
  | 'parejas'
  | 'terminos-pareados'
  | 'verdadero-falso'
  | 'ordenar'
  | 'clasificar'
  | 'tarjetas'
  | 'completar'
  | 'rosco'
  | 'quien-soy'

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

/** Un trozo de una frase para completar: texto a la vista o una palabra que el curso debe adivinar. */
export interface ParteFrase {
  texto: string
  oculta: boolean
}

export interface Frase {
  partes: ParteFrase[]
}

/** Una letra del rosco de letras. */
export interface Definicion {
  /** En mayúscula; la Ñ es una letra aparte. */
  letra: string
  /** "Contiene la X" en vez de "Empieza con X". */
  contiene: boolean
  definicion: string
  respuesta: string
}

/** Un personaje (o cosa) de ¿Quién soy?, con sus pistas de la más difícil a la más fácil. */
export interface Adivinanza {
  respuesta: string
  pistas: string[]
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
  | 'texto-largo'
  | 'sin-tarjetas'
  | 'sin-frases'
  | 'sin-definiciones'
  | 'letra-repetida'
  | 'letra-no-calza'
  | 'demasiadas-definiciones'
  | 'sin-adivinanzas'
  | 'sin-pistas'
  | 'demasiadas-pistas'

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
  | (LecturaBase & { tipo: 'terminos-pareados'; elementos: Pareja[] })
  | (LecturaBase & { tipo: 'verdadero-falso'; elementos: Afirmacion[] })
  | (LecturaBase & { tipo: 'ordenar'; elementos: string[] })
  | (LecturaBase & { tipo: 'clasificar'; elementos: Categoria[] })
  | (LecturaBase & { tipo: 'tarjetas'; elementos: Pareja[] })
  | (LecturaBase & { tipo: 'completar'; elementos: Frase[] })
  | (LecturaBase & { tipo: 'rosco'; elementos: Definicion[] })
  | (LecturaBase & { tipo: 'quien-soy'; elementos: Adivinanza[] })
