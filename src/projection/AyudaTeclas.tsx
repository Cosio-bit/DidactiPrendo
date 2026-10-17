import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { RanuraTeclas } from './ranuraTeclas.ts'

interface Props {
  children: ReactNode
  /**
   * Una indicación del momento (ej. "Ahora toca su categoría"), no la lista de teclas de siempre.
   * Se sigue mostrando aunque el marcador o el temporizador estén abiertos.
   */
  indicacion?: boolean
}

/** La ayuda de abajo: va en el pie de la proyección, junto a los botones del marcador y el temporizador. */
export function AyudaTeclas({ children, indicacion = false }: Props) {
  const ranura = useContext(RanuraTeclas)
  const ayuda = (
    <p className={indicacion ? 'proyeccion__teclas proyeccion__teclas--indicacion' : 'proyeccion__teclas'}>{children}</p>
  )
  return ranura ? createPortal(ayuda, ranura) : ayuda
}
