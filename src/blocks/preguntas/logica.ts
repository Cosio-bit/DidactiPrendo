// Lógica del repaso de preguntas sin interfaz: opciones, avance y "comentar el error".
import type { Pregunta } from '../../parser/tipos.ts'

export interface ConfigPreguntas {
  /** Segundos para cada pregunta; 0 es sin temporizador. */
  segundosPorPregunta: number
  /** Aviso sonoro cuando se acaba el tiempo. */
  sonido: boolean
}

export const CONFIG_PREGUNTAS_INICIAL: ConfigPreguntas = { segundosPorPregunta: 0, sonido: true }

export const OPCIONES_DE_TIEMPO = [0, 15, 30, 45, 60, 90, 120]

export function leerConfigPreguntas(config: unknown): ConfigPreguntas {
  const c = (typeof config === 'object' && config !== null ? config : {}) as Record<string, unknown>
  const segundos = c.segundosPorPregunta
  return {
    segundosPorPregunta:
      typeof segundos === 'number' && Number.isFinite(segundos) && segundos >= 0
        ? Math.round(segundos)
        : CONFIG_PREGUNTAS_INICIAL.segundosPorPregunta,
    sonido: typeof c.sonido === 'boolean' ? c.sonido : CONFIG_PREGUNTAS_INICIAL.sonido,
  }
}

export function esListaDePreguntas(items: unknown): items is Pregunta[] {
  return (
    Array.isArray(items) &&
    items.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.enunciado === 'string' &&
        Array.isArray(p.alternativas) &&
        p.alternativas.every(
          (a: unknown) =>
            typeof a === 'object' &&
            a !== null &&
            typeof (a as { texto?: unknown }).texto === 'string' &&
            typeof (a as { correcta?: unknown }).correcta === 'boolean',
        ),
    )
  )
}

/** Letra que se proyecta y que va en las tarjetas: A, B, C… */
export function letra(indice: number): string {
  return String.fromCharCode(65 + indice)
}

/** Letras para las tarjetas: siempre A a D (sirven para cualquier repaso) y más si alguna pregunta las usa. */
export function letrasParaTarjetas(preguntas: Pregunta[]): string[] {
  const maximo = Math.max(4, ...preguntas.map((p) => p.alternativas.length))
  return Array.from({ length: Math.min(maximo, 8) }, (_, i) => letra(i))
}

export interface EstadoPregunta {
  revelada: boolean
  /** Alternativa incorrecta que el profe dejó marcada para comentar. */
  comentada: number | null
}

export interface Repaso {
  actual: number
  estados: EstadoPregunta[]
  /** Se pasó de la última pregunta: pantalla de cierre. */
  terminado: boolean
}

export function nuevoRepaso(total: number): Repaso {
  return {
    actual: 0,
    estados: Array.from({ length: total }, () => ({ revelada: false, comentada: null })),
    terminado: false,
  }
}

function cambiarActual(repaso: Repaso, cambio: Partial<EstadoPregunta>): Repaso {
  const estados = repaso.estados.map((e, i) => (i === repaso.actual ? { ...e, ...cambio } : e))
  return { ...repaso, estados }
}

/** Espacio o flecha derecha: primero revela la respuesta, después pasa a la siguiente. */
export function avanzar(repaso: Repaso): Repaso {
  if (repaso.terminado) return repaso
  if (!repaso.estados[repaso.actual].revelada) return cambiarActual(repaso, { revelada: true })
  if (repaso.actual < repaso.estados.length - 1) return { ...repaso, actual: repaso.actual + 1 }
  return { ...repaso, terminado: true }
}

/** Flecha izquierda: vuelve a la pregunta anterior tal como quedó. */
export function retroceder(repaso: Repaso): Repaso {
  if (repaso.terminado) return { ...repaso, terminado: false }
  if (repaso.actual > 0) return { ...repaso, actual: repaso.actual - 1 }
  return repaso
}

export function revelar(repaso: Repaso): Repaso {
  return repaso.terminado ? repaso : cambiarActual(repaso, { revelada: true })
}

/**
 * Marca (o desmarca) una alternativa incorrecta para comentarla en clase.
 * Las correctas no se pueden marcar como error.
 */
export function comentar(repaso: Repaso, pregunta: Pregunta, alternativa: number): Repaso {
  if (repaso.terminado) return repaso
  const elegida = pregunta.alternativas[alternativa]
  if (!elegida || elegida.correcta) return repaso
  const actual = repaso.estados[repaso.actual].comentada
  return cambiarActual(repaso, { comentada: actual === alternativa ? null : alternativa })
}
