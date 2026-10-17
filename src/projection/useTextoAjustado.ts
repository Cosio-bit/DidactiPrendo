import { useLayoutEffect, useRef } from 'react'

/** Mínimo para leer desde el fondo de la sala (ver CLAUDE.md). */
const MINIMO_COMODO_PX = 24
/** Si el texto es tan largo que no cabe ni así, se sigue achicando hasta aquí, pero nunca se corta ni se desplaza. */
const MINIMO_ABSOLUTO_PX = 12

/**
 * Agranda el texto lo más posible sin que se salga de su caja.
 * Así un nombre corto se ve enorme y una frase larga se achica sin cortarse.
 * Todo se ve de una vez: la proyección nunca tiene barras para desplazarse.
 */
export function useTextoAjustado<T extends HTMLElement>(texto: string, maximoPx: number) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const caja = ref.current
    if (!caja) return

    function seSale() {
      return caja!.scrollHeight > caja!.clientHeight || caja!.scrollWidth > caja!.clientWidth
    }

    function achicarHasta(minimo: number, tamano: number) {
      while (tamano > minimo && seSale()) {
        tamano = Math.max(minimo, Math.floor(tamano * 0.9))
        caja!.style.fontSize = `${tamano}px`
      }
      return tamano
    }

    function ajustar() {
      if (!caja) return
      // Primero se achica sin partir palabras; si no basta, se permiten partir
      // y, como último recurso, se baja de la letra mínima cómoda.
      caja.style.overflowWrap = 'normal'
      caja.style.fontSize = `${maximoPx}px`
      let tamano = achicarHasta(MINIMO_COMODO_PX, maximoPx)
      if (seSale()) {
        caja.style.overflowWrap = 'anywhere'
        tamano = achicarHasta(MINIMO_ABSOLUTO_PX, tamano)
      }
    }

    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(caja)
    return () => observador.disconnect()
  }, [texto, maximoPx])

  return ref
}
