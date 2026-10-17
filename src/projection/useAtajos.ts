import { useLayoutEffect, useRef } from 'react'

export interface Atajos {
  /** Espacio, Enter, flecha derecha o abajo, Avanzar página: lo que envían los controles de presentación. */
  avanzar?: () => void
  /** Flecha izquierda o arriba, Retroceder página. */
  retroceder?: () => void
  salir?: () => void
  pantallaCompleta?: () => void
  /** Otras teclas, por su letra en minúscula (ej. { a: …, p: … }). */
  otras?: Record<string, () => void>
}

const AVANZAR = new Set([' ', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown'])
const RETROCEDER = new Set(['ArrowLeft', 'ArrowUp', 'PageUp'])

function escribiendo(destino: EventTarget | null) {
  return (
    destino instanceof HTMLInputElement ||
    destino instanceof HTMLTextAreaElement ||
    destino instanceof HTMLSelectElement ||
    (destino instanceof HTMLElement && destino.isContentEditable)
  )
}

/** Atajos de teclado del modo proyección. */
export function useAtajos(atajos: Atajos) {
  const actuales = useRef(atajos)
  useLayoutEffect(() => {
    actuales.current = atajos
  })

  // Antes de dibujar: así, apenas se ve la proyección, el teclado ya responde.
  useLayoutEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.altKey || evento.metaKey || evento.repeat) return
      // Escribiendo (ej. el nombre de un equipo) o con un diálogo abierto, las teclas son de ese cuadro.
      if (escribiendo(evento.target) || document.querySelector('dialog[open]')) return
      const { avanzar, retroceder, salir, pantallaCompleta, otras } = actuales.current
      const enBoton = evento.target instanceof HTMLButtonElement

      // Enter sobre un botón lo activa como siempre. El espacio, en cambio, siempre avanza:
      // así un control de presentación no aprieta por error el botón que tenga el foco.
      if (evento.key === 'Enter' && enBoton) return

      let accion: (() => void) | undefined
      if (AVANZAR.has(evento.key)) accion = avanzar
      else if (RETROCEDER.has(evento.key)) accion = retroceder
      else if (evento.key === 'Escape') accion = salir
      else if (evento.key === 'f' || evento.key === 'F') accion = pantallaCompleta
      else accion = otras?.[evento.key.toLowerCase()]

      if (accion) {
        evento.preventDefault()
        accion()
      }
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [])
}
