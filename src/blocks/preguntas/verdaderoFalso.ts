// Verdadero o falso se proyecta e imprime como una pregunta con dos alternativas: V y F.
import { textos } from '../../i18n/es-CL.ts'
import type { Afirmacion, Pregunta } from '../../parser/tipos.ts'

export const LETRAS_VF = ['V', 'F']

export function esListaDeAfirmaciones(items: unknown): items is Afirmacion[] {
  return (
    Array.isArray(items) &&
    items.every(
      (a) =>
        typeof a === 'object' &&
        a !== null &&
        typeof a.texto === 'string' &&
        (a.verdadera === null || typeof a.verdadera === 'boolean'),
    )
  )
}

export function comoPreguntas(afirmaciones: Afirmacion[]): Pregunta[] {
  return afirmaciones.map((a) => ({
    enunciado: a.texto,
    alternativas: [
      { texto: textos.vistaPrevia.verdadero, correcta: a.verdadera === true },
      { texto: textos.vistaPrevia.falso, correcta: a.verdadera === false },
    ],
  }))
}
