// Temporizador independiente: cuenta regresiva con inicio, pausa, reinicio y minutos de más o de menos.
// Se calcula con el reloj (no contando tics), así no se atrasa si el computador está lento.

export const MINUTO_MS = 60_000
export const MINIMO_MS = MINUTO_MS
export const MAXIMO_MS = 60 * MINUTO_MS

export interface Temporizador {
  /** Duración elegida; a esto vuelve al reiniciar. */
  totalMs: number
  /** Lo que queda cuando está detenido. */
  restanteMs: number
  /** Hora (Date.now) en que llega a cero, si está corriendo. */
  finEn: number | null
}

const acotar = (ms: number) => Math.min(MAXIMO_MS, Math.max(MINIMO_MS, ms))

export function nuevoTemporizador(totalMs = 3 * MINUTO_MS): Temporizador {
  const total = acotar(totalMs)
  return { totalMs: total, restanteMs: total, finEn: null }
}

export function corriendo(t: Temporizador): boolean {
  return t.finEn !== null
}

export function restante(t: Temporizador, ahora: number): number {
  return t.finEn === null ? t.restanteMs : Math.max(0, t.finEn - ahora)
}

export function terminado(t: Temporizador, ahora: number): boolean {
  return restante(t, ahora) === 0
}

/** Detenido con el tiempo completo: todavía no se usa. */
export function sinEmpezar(t: Temporizador): boolean {
  return t.finEn === null && t.restanteMs === t.totalMs
}

/** Empieza o sigue. Si ya había terminado, parte de nuevo con el tiempo completo. */
export function iniciar(t: Temporizador, ahora: number): Temporizador {
  if (t.finEn !== null) return t
  const desde = t.restanteMs > 0 ? t.restanteMs : t.totalMs
  return { ...t, restanteMs: desde, finEn: ahora + desde }
}

export function pausar(t: Temporizador, ahora: number): Temporizador {
  if (t.finEn === null) return t
  return { ...t, restanteMs: restante(t, ahora), finEn: null }
}

export function reiniciar(t: Temporizador): Temporizador {
  return { ...t, restanteMs: t.totalMs, finEn: null }
}

/**
 * Un minuto más o menos.
 * - Sin empezar: cambia la duración (entre 1 y 60 minutos).
 * - Andando o en pausa: cambia lo que queda ("les doy un minuto más"), sin bajar de cero.
 * - Terminado: "un minuto más" vuelve a contar desde ese minuto.
 */
export function cambiarMinutos(t: Temporizador, minutos: number, ahora: number): Temporizador {
  const delta = minutos * MINUTO_MS
  if (sinEmpezar(t)) return nuevoTemporizador(t.totalMs + delta)
  const queda = restante(t, ahora)
  const nuevo = Math.min(MAXIMO_MS, Math.max(0, queda + delta))
  if (t.finEn === null) return { ...t, restanteMs: nuevo }
  return { ...t, finEn: ahora + nuevo }
}
