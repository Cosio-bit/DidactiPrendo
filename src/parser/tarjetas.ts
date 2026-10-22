import { claveComparacion, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, repetidos, t, type Resultado } from './comun.ts'
import { leerPareja } from './parejas.ts'
import type { Pareja } from './tipos.ts'

/**
 * Tarjetas: lo de adelante y lo de atrás, en el mismo formato que las parejas ("perro = dog").
 * Por eso el lector nunca las sugiere: el profe las elige.
 */
export function leerTarjetas(lineas: Linea[], hayTexto: boolean): Resultado<Pareja> {
  const { contenido, descartadas } = recortarBordes(conContenido(lineas), (l) => l.titulo && !leerPareja(l))
  const elementos: Pareja[] = []
  for (const linea of contenido) {
    const tarjeta = linea.titulo ? null : leerPareja(linea)
    if (tarjeta) elementos.push(tarjeta)
    else descartadas.push(linea)
  }

  const advertencias = ignoradas(descartadas, t.lineasSinReverso)
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-tarjetas', t.sinTarjetas))
    return { elementos, advertencias }
  }
  const repetidas = repetidos(elementos, (p) => claveComparacion(p.a))
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas.map((p) => p.a))))
  return { elementos, advertencias }
}
