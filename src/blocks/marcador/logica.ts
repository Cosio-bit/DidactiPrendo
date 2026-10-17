// Marcador por equipos: puntos de 2 a 8 equipos, cada uno con nombre, color y figura.

export const MINIMO_EQUIPOS = 2
export const MAXIMO_EQUIPOS = 8
export const LARGO_MAXIMO_NOMBRE = 24

export interface Equipo {
  nombre: string
  /** Posición en COLORES_EQUIPO. */
  color: number
  puntos: number
}

export interface Marcador {
  equipos: Equipo[]
}

/**
 * Paleta de Okabe e Ito, pensada para que se distinga con daltonismo. Además del color, cada equipo
 * lleva una figura distinta: nunca se depende solo del color.
 */
export const COLORES_EQUIPO = [
  { valor: '#0072b2', figura: 'circulo' },
  { valor: '#e69f00', figura: 'triangulo' },
  { valor: '#009e73', figura: 'cuadrado' },
  { valor: '#cc79a7', figura: 'rombo' },
  { valor: '#f0e442', figura: 'estrella' },
  { valor: '#56b4e9', figura: 'cruz' },
  { valor: '#d55e00', figura: 'hexagono' },
  { valor: '#000000', figura: 'triangulo-abajo' },
] as const

export type Figura = (typeof COLORES_EQUIPO)[number]['figura']

function colorLibre(equipos: Equipo[], desde = 0): number {
  for (let paso = 0; paso < COLORES_EQUIPO.length; paso++) {
    const color = (desde + paso) % COLORES_EQUIPO.length
    if (!equipos.some((e) => e.color === color)) return color
  }
  return desde % COLORES_EQUIPO.length
}

/** Equipos nuevos: el nombre es el de su color ("Azul", "Naranjo"…), fácil de decir en la sala. */
export function nuevoMarcador(cantidad = MINIMO_EQUIPOS, nombreDeColor: (color: number) => string): Marcador {
  let equipos: Equipo[] = []
  for (let i = 0; i < cantidad; i++) {
    const color = colorLibre(equipos)
    equipos = [...equipos, { nombre: nombreDeColor(color), color, puntos: 0 }]
  }
  return { equipos }
}

function cambiarEquipo(m: Marcador, indice: number, cambio: (e: Equipo) => Equipo): Marcador {
  if (!m.equipos[indice]) return m
  return { ...m, equipos: m.equipos.map((e, i) => (i === indice ? cambio(e) : e)) }
}

/** Suma o resta puntos; nunca baja de cero. */
export function sumar(m: Marcador, indice: number, delta: number): Marcador {
  return cambiarEquipo(m, indice, (e) => ({ ...e, puntos: Math.max(0, e.puntos + delta) }))
}

export function agregarEquipo(m: Marcador, nombreDeColor: (color: number) => string): Marcador {
  if (m.equipos.length >= MAXIMO_EQUIPOS) return m
  const color = colorLibre(m.equipos)
  return { ...m, equipos: [...m.equipos, { nombre: nombreDeColor(color), color, puntos: 0 }] }
}

export function quitarEquipo(m: Marcador, indice: number): Marcador {
  if (m.equipos.length <= MINIMO_EQUIPOS || !m.equipos[indice]) return m
  return { ...m, equipos: m.equipos.filter((_, i) => i !== indice) }
}

export function renombrar(m: Marcador, indice: number, nombre: string): Marcador {
  return cambiarEquipo(m, indice, (e) => ({ ...e, nombre: nombre.slice(0, LARGO_MAXIMO_NOMBRE) }))
}

/**
 * Pasa al siguiente color que nadie más usa. Si el nombre era el de su color, cambia con él
 * (un equipo "Azul" que pasa a naranjo se llama "Naranjo").
 */
export function siguienteColor(m: Marcador, indice: number, nombreDeColor: (color: number) => string): Marcador {
  const otros = m.equipos.filter((_, i) => i !== indice)
  return cambiarEquipo(m, indice, (e) => {
    const color = colorLibre(otros, e.color + 1)
    const nombre = e.nombre.trim() === nombreDeColor(e.color) ? nombreDeColor(color) : e.nombre
    return { ...e, color, nombre }
  })
}

export function reiniciarPuntos(m: Marcador): Marcador {
  return { ...m, equipos: m.equipos.map((e) => ({ ...e, puntos: 0 })) }
}

/** Nombre para mostrar: si quedó en blanco, el de su color. */
export function nombreDeEquipo(equipo: Equipo, nombreDeColor: (color: number) => string): string {
  return equipo.nombre.trim() || nombreDeColor(equipo.color)
}

/** Lee un marcador guardado; si no sirve, devuelve undefined para partir de cero. */
export function leerMarcador(valor: unknown): Marcador | undefined {
  if (typeof valor !== 'object' || valor === null) return undefined
  const equipos = (valor as { equipos?: unknown }).equipos
  if (!Array.isArray(equipos)) return undefined
  const validos: Equipo[] = equipos
    .filter(
      (e): e is Equipo =>
        typeof e?.nombre === 'string' &&
        Number.isInteger(e?.color) &&
        e.color >= 0 &&
        e.color < COLORES_EQUIPO.length &&
        Number.isFinite(e?.puntos),
    )
    .map((e) => ({ nombre: e.nombre.slice(0, LARGO_MAXIMO_NOMBRE), color: e.color, puntos: Math.max(0, Math.round(e.puntos)) }))
    .slice(0, MAXIMO_EQUIPOS)
  return validos.length >= MINIMO_EQUIPOS ? { equipos: validos } : undefined
}
