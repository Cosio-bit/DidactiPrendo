import { useLayoutEffect, useRef, useState } from 'react'

/** Ancho y alto de un elemento, actualizados si cambia la ventana o se pasa a pantalla completa. */
export function useTamano<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [tamano, setTamano] = useState({ ancho: 0, alto: 0 })

  useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const medir = () => setTamano({ ancho: elemento.clientWidth, alto: elemento.clientHeight })
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return [ref, tamano] as const
}
