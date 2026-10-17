import { claveComparacion, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, repetidos, t, type Resultado } from './comun.ts'
import type { Advertencia } from './tipos.ts'

/** La ruleta se lee bien proyectada hasta con esta cantidad de elementos. */
export const MAXIMO_RULETA = 60

/** Lista simple, un elemento por línea. */
export function leerElementos(lineas: Linea[], hayTexto: boolean): Resultado<string> & { usadas: Linea[] } {
  const { contenido, descartadas } = recortarBordes(conContenido(lineas), (l) => l.titulo || l.texto.endsWith(':'))
  const usadas = contenido.filter((l) => {
    if (l.titulo) descartadas.push(l)
    return !l.titulo
  })
  let elementos = usadas.map((l) => l.texto.replace(/\s*[,;]$/, ''))
  const advertencias: Advertencia[] = []

  // Todo en una sola línea separado por comas: "rojo, azul, verde".
  if (elementos.length === 1) {
    const separador = elementos[0].includes(';') ? ';' : ','
    const partes = elementos[0].split(separador).map((p) => p.trim()).filter(Boolean)
    if (partes.length >= 3 && partes.every((p) => p.length <= 40)) {
      elementos = partes
      advertencias.push(advertencia('separado-por-comas', t.separadoPorComas, [usadas[0].numero]))
    }
  }

  advertencias.unshift(...ignoradas(descartadas, t.lineasIgnoradasLista))
  if (elementos.length === 0 && hayTexto) advertencias.push(advertencia('sin-elementos', t.sinElementos))
  return { elementos, advertencias, usadas }
}

export function leerRuleta(lineas: Linea[], hayTexto: boolean): Resultado<string> {
  const { elementos, advertencias } = leerElementos(lineas, hayTexto)
  if (elementos.length === 0) return { elementos, advertencias }

  const repetidas = repetidos(elementos, claveComparacion)
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas)))
  if (elementos.length < 2) advertencias.push(advertencia('pocos-elementos', t.pocosElementos))
  if (elementos.length > MAXIMO_RULETA) {
    advertencias.push(advertencia('demasiados-elementos', t.demasiadosElementos(elementos.length, MAXIMO_RULETA)))
  }
  return { elementos, advertencias }
}
