import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'principal' | 'secundario' | 'peligro'
  grande?: boolean
}

export function Boton({ variante = 'secundario', grande = false, className = '', ...props }: Props) {
  const clases = ['boton', `boton--${variante}`, grande && 'boton--grande', className]
  return <button type="button" className={clases.filter(Boolean).join(' ')} {...props} />
}
