import { useEffect, useRef } from 'react'

export interface Atajos {
  /** Espacio, Enter, flecha derecha o abajo, Avanzar página: lo que envían los controles de presentación. */
  avanzar?: () => void
  /** Flecha izquierda o arriba, Retroceder página. */
  retroceder?: () => void
  salir?: () => void
  pantallaCompleta?: () => void
}

const AVANZAR = new Set([' ', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown'])
const RETROCEDER = new Set(['ArrowLeft', 'ArrowUp', 'PageUp'])

/** Atajos de teclado del modo proyección. */
export function useAtajos(atajos: Atajos) {
  const actuales = useRef(atajos)
  useEffect(() => {
    actuales.current = atajos
  })

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.altKey || evento.metaKey || evento.repeat) return
      const { avanzar, retroceder, salir, pantallaCompleta } = actuales.current
      const enBoton = evento.target instanceof HTMLButtonElement

      // Enter sobre un botón lo activa como siempre. El espacio, en cambio, siempre avanza:
      // así un control de presentación no aprieta por error el botón que tenga el foco.
      if (evento.key === 'Enter' && enBoton) return

      let accion: (() => void) | undefined
      if (AVANZAR.has(evento.key)) accion = avanzar
      else if (RETROCEDER.has(evento.key)) accion = retroceder
      else if (evento.key === 'Escape') accion = salir
      else if (evento.key === 'f' || evento.key === 'F') accion = pantallaCompleta

      if (accion) {
        evento.preventDefault()
        accion()
      }
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [])
}
