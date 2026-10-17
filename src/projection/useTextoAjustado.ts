import { useLayoutEffect, useRef } from 'react'

const MINIMO_PX = 28

/**
 * Agranda el texto lo más posible sin que se salga de su caja.
 * Así un nombre corto se ve enorme y una frase larga se achica sin cortarse.
 */
export function useTextoAjustado<T extends HTMLElement>(texto: string, maximoPx: number) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const caja = ref.current
    if (!caja) return

    function seSale() {
      return caja!.scrollHeight > caja!.clientHeight || caja!.scrollWidth > caja!.clientWidth
    }

    function ajustar() {
      if (!caja) return
      // Primero se achica sin partir palabras; solo si ni así cabe, se permite partirlas.
      caja.style.overflowWrap = 'normal'
      let tamano = maximoPx
      caja.style.fontSize = `${tamano}px`
      while (tamano > MINIMO_PX && seSale()) {
        tamano = Math.max(MINIMO_PX, Math.floor(tamano * 0.9))
        caja.style.fontSize = `${tamano}px`
      }
      if (seSale()) caja.style.overflowWrap = 'anywhere'
    }

    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(caja)
    return () => observador.disconnect()
  }, [texto, maximoPx])

  return ref
}
