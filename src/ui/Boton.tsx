import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * El color dice qué hace el botón:
   * principal (celeste oscuro): la acción principal o avanzar;
   * navegacion (amarillo suave): ir a otra pantalla o volver;
   * herramienta (celeste suave): algo que actúa en la misma pantalla;
   * peligro (rojo): borrar.
   */
  variante?: 'principal' | 'secundario' | 'navegacion' | 'herramienta' | 'peligro'
  grande?: boolean
}

export function Boton({ variante = 'secundario', grande = false, className = '', ...props }: Props) {
  const clases = ['boton', `boton--${variante}`, grande && 'boton--grande', className]
  return <button type="button" className={clases.filter(Boolean).join(' ')} {...props} />
}
