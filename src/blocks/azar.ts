/** Entero al azar entre 0 y n - 1, con el generador seguro del navegador. */
export function azar(n: number): number {
  const valor = crypto.getRandomValues(new Uint32Array(1))[0]
  return Math.floor((valor / 2 ** 32) * n)
}

/** Copia desordenada de la lista (Fisher-Yates). */
export function barajar<T>(lista: readonly T[], elegir: (n: number) => number = azar): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = elegir(i + 1)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
