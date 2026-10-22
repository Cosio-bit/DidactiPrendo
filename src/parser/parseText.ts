import { textos } from '../i18n/es-CL.ts'
import { leerClasificar } from './clasificar.ts'
import { leerCompletar } from './completar.ts'
import { textosLargos } from './largos.ts'
import { leerLineas, normalizar } from './lineas.ts'
import { leerRuleta } from './lista.ts'
import { leerOrdenar } from './ordenar.ts'
import { leerParejas, pareceListaDeNombres } from './parejas.ts'
import { leerRosco } from './rosco.ts'
import { leerPreguntas } from './preguntas.ts'
import { leerQuienSoy } from './quienSoy.ts'
import { leerTarjetas } from './tarjetas.ts'
import type { Lectura, TipoLectura } from './tipos.ts'
import { leerVerdaderoFalso } from './verdaderoFalso.ts'

export { MAXIMO_RULETA } from './lista.ts'

/** Para sugerir un tipo, al menos esta parte de las líneas debe seguir su formato. */
const PROPORCION_MINIMA = 0.6

/**
 * Lee el texto que pegó el profe y lo convierte en elementos de un bloque.
 * Sugiere un tipo de bloque; con `tipo` se fuerza la lectura como ese tipo.
 * Nunca lanza errores: lo que no entiende lo explica en `advertencias`.
 */
export function parseText(texto: string, tipo?: TipoLectura): Lectura {
  const lectura = leer(texto, tipo)
  // Avisa lo que en la sala se verá con letra chica, para que el profe pueda acortarlo.
  const largos = textosLargos(lectura)
  if (largos.length > 0) {
    lectura.advertencias.push({ codigo: 'texto-largo', mensaje: textos.lector.textosLargos(largos), lineas: [] })
  }
  return lectura
}

function leer(texto: string, tipo?: TipoLectura): Lectura {
  const lineas = leerLineas(texto)
  // Si había algo escrito y no sale nada útil, hay que explicarlo.
  const hayTexto = normalizar(texto).trim() !== ''
  const tipoSugerido = sugerir()
  const elegido = tipo ?? tipoSugerido

  function sugerir(): TipoLectura {
    if (leerPreguntas(lineas, hayTexto).validas > 0) return 'preguntas'

    const lineasConTexto = lineas.filter((l) => l.texto !== '' && !l.separador && !l.titulo).length
    const suficiente = (n: number) => n >= 2 && n >= lineasConTexto * PROPORCION_MINIMA
    // Las palabras entre corchetes y "A: …" no se confunden con nada más.
    // Para completar basta la mitad, sin contar títulos como "Completa las frases:".
    const sinTitulos = lineas.filter((l) => l.texto !== '' && !l.separador && !l.titulo && !l.texto.endsWith(':')).length
    const conPalabras = leerCompletar(lineas, hayTexto).conPalabras
    if (conPalabras >= 1 && conPalabras >= sinTitulos / 2) return 'completar'
    if (suficiente(leerRosco(lineas, hayTexto).conLetra)) return 'rosco'
    // "Respuesta: …" debajo de las pistas; si no, el personaje con sus pistas se parece a una categoría.
    if (leerQuienSoy(lineas, hayTexto).conRespuesta > 0) return 'quien-soy'
    if (leerClasificar(lineas, hayTexto).claridad === 'clara') return 'clasificar'

    const vf = leerVerdaderoFalso(lineas, hayTexto)
    if (vf.marcadas >= 2 && vf.marcadas >= vf.elementos.length * PROPORCION_MINIMA) return 'verdadero-falso'
    if (suficiente(leerParejas(lineas, hayTexto).conSeparador) && !pareceListaDeNombres(lineas)) return 'parejas'
    // Ordenar y Tarjetas nunca se sugieren: se ven igual que una lista para la ruleta o que las parejas.
    return 'ruleta'
  }

  const base = { tipoSugerido }
  switch (elegido) {
    case 'preguntas': {
      const { preguntas, advertencias } = leerPreguntas(lineas, hayTexto)
      return { ...base, tipo: 'preguntas', elementos: preguntas, advertencias }
    }
    case 'parejas': {
      const { elementos, advertencias } = leerParejas(lineas, hayTexto)
      return { ...base, tipo: 'parejas', elementos, advertencias }
    }
    case 'verdadero-falso': {
      const { elementos, advertencias } = leerVerdaderoFalso(lineas, hayTexto)
      return { ...base, tipo: 'verdadero-falso', elementos, advertencias }
    }
    case 'ordenar':
      return { ...base, tipo: 'ordenar', ...leerOrdenar(lineas, hayTexto) }
    case 'clasificar': {
      const { elementos, advertencias } = leerClasificar(lineas, hayTexto)
      return { ...base, tipo: 'clasificar', elementos, advertencias }
    }
    case 'ruleta':
      return { ...base, tipo: 'ruleta', ...leerRuleta(lineas, hayTexto) }
    case 'tarjetas':
      return { ...base, tipo: 'tarjetas', ...leerTarjetas(lineas, hayTexto) }
    case 'completar': {
      const { elementos, advertencias } = leerCompletar(lineas, hayTexto)
      return { ...base, tipo: 'completar', elementos, advertencias }
    }
    case 'rosco': {
      const { elementos, advertencias } = leerRosco(lineas, hayTexto)
      return { ...base, tipo: 'rosco', elementos, advertencias }
    }
    case 'quien-soy': {
      const { elementos, advertencias } = leerQuienSoy(lineas, hayTexto)
      return { ...base, tipo: 'quien-soy', elementos, advertencias }
    }
  }
}
