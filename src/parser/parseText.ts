import { textos } from '../i18n/es-CL.ts'
import { leerClasificar } from './clasificar.ts'
import { textosLargos } from './largos.ts'
import { leerLineas, normalizar } from './lineas.ts'
import { leerRuleta } from './lista.ts'
import { leerOrdenar } from './ordenar.ts'
import { leerParejas, pareceListaDeNombres, parecenDefiniciones } from './parejas.ts'
import { leerPreguntas } from './preguntas.ts'
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
    if (leerClasificar(lineas, hayTexto).claridad === 'clara') return 'clasificar'

    const lineasConTexto = lineas.filter((l) => l.texto !== '' && !l.separador && !l.titulo).length
    const suficiente = (n: number) => n >= 2 && n >= lineasConTexto * PROPORCION_MINIMA
    const vf = leerVerdaderoFalso(lineas, hayTexto)
    if (vf.marcadas >= 2 && vf.marcadas >= vf.elementos.length * PROPORCION_MINIMA) return 'verdadero-falso'
    const parejas = leerParejas(lineas, hayTexto)
    if (suficiente(parejas.conSeparador) && !pareceListaDeNombres(lineas)) {
      // Con definiciones largas, unir cada concepto con su definición se lee mejor que un memorice.
      return parecenDefiniciones(parejas.elementos) ? 'terminos-pareados' : 'parejas'
    }
    // Ordenar nunca se sugiere: una lista ordenada se ve igual que una lista para la ruleta.
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
    case 'terminos-pareados': {
      const { elementos, advertencias } = leerParejas(lineas, hayTexto, 'pareados')
      return { ...base, tipo: 'terminos-pareados', elementos, advertencias }
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
  }
}
