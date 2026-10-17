/** "1:05", "0:09": minutos y segundos, redondeando hacia arriba para no mostrar 0:00 antes de tiempo. */
export function formatearTiempo(ms: number): string {
  const segundos = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}
