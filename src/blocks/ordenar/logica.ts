// Ordenar sin interfaz: el curso propone cuál va después y se comprueba.
import { barajar } from '../azar.ts'

export interface Ordenar {
  /** Índices (en el orden correcto) tal como se muestran, desordenados. */
  desorden: number[]
  /** Cuántos ya están en su lugar: siempre los primeros del orden correcto. */
  colocados: number
  /** El último que se propuso y no iba ahí. */
  errado: number | null
}

export function esListaDeTextos(items: unknown): items is string[] {
  return Array.isArray(items) && items.every((i) => typeof i === 'string')
}

/** Desordena; si por azar queda en orden, lo vuelve a intentar para que haya algo que ordenar. */
export function nuevoOrdenar(total: number, mezclar: (l: number[]) => number[] = barajar): Ordenar {
  const indices = Array.from({ length: total }, (_, i) => i)
  let desorden = mezclar(indices)
  for (let intento = 0; total > 1 && intento < 10 && desorden.every((v, i) => v === i); intento++) {
    desorden = mezclar(indices)
  }
  return { desorden, colocados: 0, errado: null }
}

export function terminado(o: Ordenar): boolean {
  return o.colocados === o.desorden.length
}

/** El curso propone que `indice` (del orden correcto) va a continuación. */
export function proponer(o: Ordenar, indice: number): Ordenar {
  if (indice < o.colocados || indice >= o.desorden.length) return o
  if (indice === o.colocados) return { ...o, colocados: o.colocados + 1, errado: null }
  return { ...o, errado: indice }
}

/** Espacio: el profe muestra cuál va a continuación. */
export function revelarSiguiente(o: Ordenar): Ordenar {
  return terminado(o) ? o : { ...o, colocados: o.colocados + 1, errado: null }
}

/** Flecha izquierda: devuelve el último colocado. */
export function deshacer(o: Ordenar): Ordenar {
  return o.colocados === 0 ? { ...o, errado: null } : { ...o, colocados: o.colocados - 1, errado: null }
}
