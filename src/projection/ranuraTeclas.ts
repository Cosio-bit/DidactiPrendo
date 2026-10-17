import { createContext } from 'react'

/** Lugar del pie de la proyección donde va la ayuda de teclas (al lado de los botones del marcador y el temporizador). */
export const RanuraTeclas = createContext<HTMLElement | null>(null)
