/** Descarga un archivo de texto creado en el momento (funciona sin internet). */
export function descargar(nombre: string, contenido: string, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  // Se libera después: algunos navegadores leen el archivo un poco más tarde.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Un nombre de archivo seguro a partir del nombre de la actividad ("Fracciones 6°B" → "Fracciones 6°B"). */
export function nombreDeArchivo(nombre: string): string {
  const limpio = nombre.replace(/[\\/:*?"<>|\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  return limpio || 'actividad'
}

/** "2026-10-17": la fecha de hoy para el nombre del archivo. */
export function fechaParaArchivo(fecha = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}
