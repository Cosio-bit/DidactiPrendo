// Sonidos generados en el momento (sin archivos): funcionan sin internet y no pesan nada.

let contexto: AudioContext | null = null

function obtenerContexto(): AudioContext | null {
  try {
    contexto ??= new AudioContext()
    if (contexto.state === 'suspended') void contexto.resume()
    return contexto
  } catch {
    return null
  }
}

function tono(frecuencia: number, duracion: number, volumen: number, forma: OscillatorType = 'square') {
  const ctx = obtenerContexto()
  if (!ctx) return
  const oscilador = ctx.createOscillator()
  const ganancia = ctx.createGain()
  oscilador.type = forma
  oscilador.frequency.value = frecuencia
  ganancia.gain.setValueAtTime(volumen, ctx.currentTime)
  ganancia.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracion)
  oscilador.connect(ganancia).connect(ctx.destination)
  oscilador.start()
  oscilador.stop(ctx.currentTime + duracion)
}

/** Clic corto cada vez que pasa un segmento bajo el puntero. */
export function sonarTic() {
  tono(1400, 0.03, 0.05)
}

/** Aviso al terminar el giro. */
export function sonarFin() {
  tono(880, 0.25, 0.12, 'sine')
}

/** Se acabó el tiempo: tres pitidos claros. */
export function sonarAlarma() {
  const ctx = obtenerContexto()
  if (!ctx) return
  for (let i = 0; i < 3; i++) window.setTimeout(() => tono(988, 0.18, 0.15, 'square'), i * 280)
}

/** Debe llamarse en respuesta a una tecla o un toque para que el navegador permita el sonido. */
export function prepararSonido() {
  obtenerContexto()
}
