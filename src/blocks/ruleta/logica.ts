// Lógica de la ruleta sin interfaz: opciones, sorteo y ángulos del giro.

export interface ConfigRuleta {
  /** Lo que sale se saca de la ruleta antes del siguiente giro. */
  eliminarAlSalir: boolean
  sonido: boolean
}

export const CONFIG_RULETA_INICIAL: ConfigRuleta = { eliminarAlSalir: true, sonido: true }

/** Lee las opciones guardadas; lo que falte o venga mal toma el valor inicial. */
export function leerConfigRuleta(config: unknown): ConfigRuleta {
  const c = (typeof config === 'object' && config !== null ? config : {}) as Partial<Record<keyof ConfigRuleta, unknown>>
  return {
    eliminarAlSalir:
      typeof c.eliminarAlSalir === 'boolean' ? c.eliminarAlSalir : CONFIG_RULETA_INICIAL.eliminarAlSalir,
    sonido: typeof c.sonido === 'boolean' ? c.sonido : CONFIG_RULETA_INICIAL.sonido,
  }
}

export interface Sorteo {
  total: number
  /** Índices (en la lista completa) que siguen en la ruleta. */
  enRueda: number[]
  /** Lo que salió en el último giro. */
  ganador: number | null
  /** Si hay que sacar al ganador, se saca al empezar el siguiente giro para que se vea mientras tanto. */
  porSacar: number | null
}

export function nuevoSorteo(total: number): Sorteo {
  return { total, enRueda: Array.from({ length: total }, (_, i) => i), ganador: null, porSacar: null }
}

/** Cuántos quedan por salir. */
export function quedan(sorteo: Sorteo): number {
  return sorteo.enRueda.length - (sorteo.porSacar === null ? 0 : 1)
}

/** Antes de girar: saca lo que salió la vez anterior, si corresponde. */
export function prepararGiro(sorteo: Sorteo): Sorteo {
  if (sorteo.porSacar === null) return sorteo
  return { ...sorteo, enRueda: sorteo.enRueda.filter((i) => i !== sorteo.porSacar), porSacar: null }
}

export function terminarGiro(sorteo: Sorteo, ganador: number, eliminarAlSalir: boolean): Sorteo {
  return { ...sorteo, ganador, porSacar: eliminarAlSalir ? ganador : null }
}

export { azar } from '../azar.ts'

function modulo(a: number, n: number) {
  return ((a % n) + n) % n
}

/*
 * Geometría: el segmento i de n ocupa, en sentido horario desde arriba, de i·(360/n) a (i+1)·(360/n).
 * Girar la rueda R grados en sentido horario deja bajo el puntero (arriba) el ángulo -R de la rueda.
 */

/** Índice (en la rueda) del segmento que queda bajo el puntero. */
export function segmentoBajoPuntero(rotacion: number, n: number): number {
  return Math.floor(modulo(-rotacion, 360) / (360 / n)) % n
}

/**
 * Rotación final para que el segmento `indice` termine bajo el puntero, después de dar `vueltas` vueltas.
 * `desfase` (entre -0,4 y 0,4) mueve el punto de parada dentro del segmento para que no se vea siempre igual.
 */
export function rotacionFinal(rotacionActual: number, indice: number, n: number, vueltas: number, desfase = 0): number {
  const objetivo = (indice + 0.5 + desfase) * (360 / n)
  const base = rotacionActual + vueltas * 360
  return base + modulo(-objetivo - base, 360)
}

/** Desaceleración natural: parte rápido y frena al final. */
export function frenado(t: number): number {
  return 1 - (1 - t) ** 3
}

/*
 * Nombres en la rueda: cada uno se escribe a lo largo de su segmento, desde cerca del centro hacia
 * el borde. Si no cabe en una línea se reparte en dos o tres, y la letra se achica lo justo para
 * que se lea entero: nunca se corta con "…".
 */

/** Radio de la rueda en las unidades del dibujo. */
export const RADIO_RUEDA = 100
const LETRA_MAXIMA = 15
const MAXIMO_LINEAS = 3
const ALTO_LINEA = 1.15
/** Hasta dónde llega el texto: un poco antes del borde. */
const BORDE_EXTERIOR = 0.93 * RADIO_RUEDA
/** Desde dónde puede empezar: después del botón del centro. */
const BORDE_INTERIOR = 12
/** Parte del ancho del segmento que puede usar el texto (el resto queda de margen). */
const MARGEN_ANCHO = 0.82
/** Una línea más solo vale la pena si la letra queda claramente más grande. */
const VENTAJA_POR_LINEA = 1.08

export interface EtiquetaRueda {
  lineas: string[]
  /** Tamaño de la letra, en unidades del dibujo. */
  tamano: number
  /** Distancia del centro de la rueda al centro del texto. */
  distancia: number
}

/** Ancho del texto en negrita, medido en "em" (veces el tamaño de la letra). */
export type MedirTexto = (texto: string) => number

/** Reparte las palabras en `cantidad` líneas, dejando la más larga lo más corta posible. */
export function repartirEnLineas(texto: string, cantidad: number, medir: MedirTexto): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean)
  if (cantidad <= 1 || palabras.length <= 1) return [palabras.join(' ')]
  let mejor: string[] = [palabras.join(' ')]
  let mejorAncho = Infinity

  function probar(desde: number, quedan: number, lineas: string[]) {
    if (quedan === 1) {
      const todas = [...lineas, palabras.slice(desde).join(' ')]
      const ancho = Math.max(...todas.map(medir))
      if (ancho < mejorAncho) {
        mejorAncho = ancho
        mejor = todas
      }
      return
    }
    for (let corte = desde + 1; corte <= palabras.length - quedan + 1; corte++) {
      probar(corte, quedan - 1, [...lineas, palabras.slice(desde, corte).join(' ')])
    }
  }
  probar(0, Math.min(cantidad, palabras.length), [])
  return mejor
}

/** Cómo escribir un nombre en su segmento de una rueda de `segmentos` partes. */
export function acomodarEtiqueta(texto: string, segmentos: number, medir: MedirTexto): EtiquetaRueda {
  let mejor: EtiquetaRueda | null = null
  for (let cantidad = 1; cantidad <= MAXIMO_LINEAS; cantidad++) {
    const lineas = repartirEnLineas(texto, cantidad, medir)
    if (cantidad > 1 && lineas.length < cantidad) break
    const opcion = acomodarLineas(lineas, segmentos, medir)
    if (!mejor || opcion.tamano > mejor.tamano * VENTAJA_POR_LINEA) mejor = opcion
  }
  return mejor!
}

function acomodarLineas(lineas: string[], segmentos: number, medir: MedirTexto): EtiquetaRueda {
  const ancho = Math.max(0.01, ...lineas.map(medir))
  const alto = lineas.length * ALTO_LINEA

  // Una sola porción: la rueda entera, el texto horizontal al centro.
  if (segmentos <= 1) {
    const tamano = Math.min(LETRA_MAXIMA * 1.6, (1.6 * RADIO_RUEDA) / ancho, (1.2 * RADIO_RUEDA) / alto)
    return { lineas, tamano, distancia: 0 }
  }

  // El segmento es más angosto cerca del centro: a distancia r mide 2·r·sen(mitad del ángulo).
  // El texto va de r hasta el borde exterior; se busca el r donde la letra queda más grande.
  const mitad = Math.min(Math.PI / segmentos, Math.PI / 3)
  const k = (2 * Math.sin(mitad) * MARGEN_ANCHO) / alto
  let interior = Math.max(BORDE_INTERIOR, BORDE_EXTERIOR / (1 + k * ancho))
  let tamano = Math.min(LETRA_MAXIMA, k * interior, (BORDE_EXTERIOR - interior) / ancho)
  // Con la letra ya definida, el texto queda donde menos estorba: cerca del 60 % del radio.
  interior = (tamano * alto) / (2 * Math.sin(mitad) * MARGEN_ANCHO)
  const largo = tamano * ancho
  const distancia = Math.min(Math.max(0.6 * RADIO_RUEDA, interior + largo / 2), BORDE_EXTERIOR - largo / 2)
  tamano = Math.max(tamano, 0.1)
  return { lineas, tamano, distancia }
}
