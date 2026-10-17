import { useEffect, useState } from 'react'

const traeArchivos = (evento: DragEvent) => evento.dataTransfer?.types.includes('Files') ?? false

/**
 * Archivos arrastrados desde el computador y soltados en cualquier parte de la página.
 * Sin esto, el navegador abriría el archivo y el profe saldría de la app.
 * Con `alSoltar` en null, se ignoran (por ejemplo, durante la proyección).
 * Devuelve si hay un archivo encima de la página, para mostrar dónde soltarlo.
 */
export function useSoltarArchivos(alSoltar: ((archivos: File[]) => void) | null) {
  const [encima, setEncima] = useState(false)

  useEffect(() => {
    // dragenter y dragleave llegan por cada elemento que se cruza: se cuentan para saber cuándo sale de verdad.
    let profundidad = 0
    function entrar(evento: DragEvent) {
      if (!traeArchivos(evento) || !alSoltar) return
      profundidad++
      setEncima(true)
    }
    function sobre(evento: DragEvent) {
      if (!traeArchivos(evento)) return
      evento.preventDefault()
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = alSoltar ? 'copy' : 'none'
    }
    function salir(evento: DragEvent) {
      if (!traeArchivos(evento) || !alSoltar) return
      profundidad = Math.max(0, profundidad - 1)
      if (profundidad === 0) setEncima(false)
    }
    function soltar(evento: DragEvent) {
      if (!traeArchivos(evento)) return
      evento.preventDefault()
      profundidad = 0
      setEncima(false)
      const archivos = [...(evento.dataTransfer?.files ?? [])]
      if (alSoltar && archivos.length > 0) alSoltar(archivos)
    }
    window.addEventListener('dragenter', entrar)
    window.addEventListener('dragover', sobre)
    window.addEventListener('dragleave', salir)
    window.addEventListener('drop', soltar)
    return () => {
      window.removeEventListener('dragenter', entrar)
      window.removeEventListener('dragover', sobre)
      window.removeEventListener('dragleave', salir)
      window.removeEventListener('drop', soltar)
    }
  }, [alSoltar])

  return alSoltar ? encima : false
}
