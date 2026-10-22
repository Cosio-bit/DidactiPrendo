import type { Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, t, type Resultado } from './comun.ts'
import type { Frase, ParteFrase } from './tipos.ts'

/** "[fotosíntesis]": la palabra que el curso debe completar. Unos corchetes vacíos no cuentan. */
const PALABRA_OCULTA = /\[([^[\]]*[^\s[\]][^[\]]*)\]/g

/** Parte la línea en texto a la vista y palabras ocultas, o null si no tiene palabras entre corchetes. */
export function leerFrase(texto: string): Frase | null {
  const partes: ParteFrase[] = []
  let desde = 0
  for (const m of texto.matchAll(PALABRA_OCULTA)) {
    if (m.index > desde) partes.push({ texto: texto.slice(desde, m.index), oculta: false })
    partes.push({ texto: m[1].trim(), oculta: true })
    desde = m.index + m[0].length
  }
  if (desde === 0) return null
  if (desde < texto.length) partes.push({ texto: texto.slice(desde), oculta: false })
  return { partes }
}

/** Una frase (o un párrafo) por línea, con las palabras que faltan entre corchetes. */
export function leerCompletar(lineas: Linea[], hayTexto: boolean): Resultado<Frase> & { conPalabras: number } {
  const { contenido, descartadas } = recortarBordes(
    conContenido(lineas),
    (l) => !leerFrase(l.texto) && (l.titulo || l.texto.endsWith(':')),
  )
  const elementos: Frase[] = []
  for (const linea of contenido) {
    const frase = leerFrase(linea.texto)
    if (frase) elementos.push(frase)
    else descartadas.push(linea)
  }

  const advertencias = ignoradas(descartadas, t.lineasSinPalabras)
  if (elementos.length === 0 && hayTexto) advertencias.push(advertencia('sin-frases', t.sinFrases))
  return { elementos, advertencias, conPalabras: elementos.length }
}

/** La frase completa, con las palabras ocultas en su lugar. */
export function textoDeFrase(frase: Frase): string {
  return frase.partes.map((p) => p.texto).join('')
}
