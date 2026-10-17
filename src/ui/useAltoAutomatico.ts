import { useLayoutEffect, useRef } from 'react'

/**
 * El cuadro de texto crece con lo que tiene escrito, para que todo se lea sin
 * desplazarse dentro de él (un cuadro con su propia barra confunde a quien no
 * se maneja con la tecnología). Si el texto es muy largo, se desplaza la página.
 */
export function useAltoAutomatico(valor: string) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const cuadro = ref.current
    if (!cuadro) return
    function ajustar() {
      if (!cuadro) return
      cuadro.style.height = 'auto'
      // El borde no cuenta en scrollHeight; se suma para que no aparezca barra.
      const borde = cuadro.offsetHeight - cuadro.clientHeight
      cuadro.style.height = `${cuadro.scrollHeight + borde}px`
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [valor])

  return ref
}
