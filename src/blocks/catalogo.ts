// Lo que cada tipo de bloque necesita para proyectarse o imprimirse.
import type { TipoLectura } from '../parser/tipos.ts'
import type { BlockType } from '../storage/modelo.ts'

/** Los tipos que se arman pegando texto, en el orden en que se ofrecen al profe. */
export const TIPOS_CON_TEXTO: TipoLectura[] = [
  'ruleta',
  'preguntas',
  'parejas',
  'terminos-pareados',
  'verdadero-falso',
  'ordenar',
  'clasificar',
  'tarjetas',
  'completar',
  'rosco',
  'quien-soy',
]

export function esTipoConTexto(tipo: BlockType): tipo is TipoLectura {
  return (TIPOS_CON_TEXTO as string[]).includes(tipo)
}

/** Tiene lo mínimo para que la proyección tenga sentido. */
export function sePuedeProyectar(tipo: BlockType, items: unknown): boolean {
  if (!Array.isArray(items)) return false
  switch (tipo) {
    case 'ruleta':
    case 'parejas':
    case 'terminos-pareados':
    case 'ordenar':
      return items.length >= 2
    case 'preguntas':
    case 'verdadero-falso':
    case 'tarjetas':
    case 'rosco':
      return items.length >= 1
    case 'completar':
      return items.some((f) => Array.isArray(f?.partes) && f.partes.some((p: { oculta?: unknown }) => p.oculta === true))
    case 'quien-soy':
      return items.some((a) => Array.isArray(a?.pistas) && a.pistas.length > 0)
    case 'clasificar':
      return items.filter((c) => Array.isArray(c?.elementos) && c.elementos.length > 0).length >= 2
    default:
      return false
  }
}

/** Tipos que se pueden imprimir (tarjetas para responder y la actividad en papel). */
export function sePuedeImprimir(tipo: BlockType): boolean {
  return tipo === 'preguntas' || tipo === 'verdadero-falso'
}

/** Usan las opciones de tiempo por pregunta. */
export function usaTemporizador(tipo: BlockType): boolean {
  return tipo === 'preguntas' || tipo === 'verdadero-falso'
}
