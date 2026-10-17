// Clasificar sin interfaz: elegir un elemento y llevarlo a su categoría.
import type { Categoria } from '../../parser/tipos.ts'
import { barajar } from '../azar.ts'

export interface ElementoSuelto {
  texto: string
  /** Índice de la categoría a la que pertenece. */
  categoria: number
}

export interface Clasificar {
  /** Todos los elementos, desordenados. */
  elementos: ElementoSuelto[]
  /** Elementos ya ubicados, en el orden en que se ubicaron (para deshacer). */
  ubicados: number[]
  /** Elemento elegido, esperando que se toque su categoría. */
  elegido: number | null
  /** Último intento equivocado. */
  errado: { elemento: number; categoria: number } | null
}

export function esListaDeCategorias(items: unknown): items is Categoria[] {
  return (
    Array.isArray(items) &&
    items.every(
      (c) =>
        typeof c === 'object' &&
        c !== null &&
        typeof c.nombre === 'string' &&
        Array.isArray(c.elementos) &&
        c.elementos.every((e: unknown) => typeof e === 'string'),
    )
  )
}

export function nuevoClasificar(
  categorias: Categoria[],
  mezclar: (l: ElementoSuelto[]) => ElementoSuelto[] = barajar,
): Clasificar {
  const elementos = categorias.flatMap((c, i) => c.elementos.map((texto) => ({ texto, categoria: i })))
  return { elementos: mezclar(elementos), ubicados: [], elegido: null, errado: null }
}

export function terminado(c: Clasificar): boolean {
  return c.ubicados.length === c.elementos.length
}

/** Toca un elemento suelto: queda elegido (o deja de estarlo si se toca de nuevo). */
export function elegir(c: Clasificar, elemento: number): Clasificar {
  if (c.ubicados.includes(elemento) || !c.elementos[elemento]) return c
  return { ...c, elegido: c.elegido === elemento ? null : elemento, errado: null }
}

/** Toca una categoría con un elemento elegido: si va ahí se ubica; si no, queda marcado el error. */
export function ubicarEn(c: Clasificar, categoria: number): Clasificar {
  if (c.elegido === null) return c
  if (c.elementos[c.elegido].categoria === categoria) {
    return { ...c, ubicados: [...c.ubicados, c.elegido], elegido: null, errado: null }
  }
  return { ...c, errado: { elemento: c.elegido, categoria } }
}

/** Espacio: ubica el elegido o, si no hay, el primero que queda suelto. */
export function revelarSiguiente(c: Clasificar): Clasificar {
  const siguiente = c.elegido ?? c.elementos.findIndex((_, i) => !c.ubicados.includes(i))
  if (siguiente < 0) return c
  return { ...c, ubicados: [...c.ubicados, siguiente], elegido: null, errado: null }
}

/** Flecha izquierda: devuelve el último ubicado a los sueltos. */
export function deshacer(c: Clasificar): Clasificar {
  return { ...c, ubicados: c.ubicados.slice(0, -1), elegido: null, errado: null }
}
