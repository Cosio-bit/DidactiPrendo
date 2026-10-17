import { useCallback, useEffect, useState } from 'react'

function enPantallaCompleta() {
  return document.fullscreenElement !== null && document.fullscreenElement !== undefined
}

export function entrarPantallaCompleta() {
  if (enPantallaCompleta() || !document.documentElement.requestFullscreen) return
  // Puede fallar si el navegador no lo permite en este momento; la proyección funciona igual.
  document.documentElement.requestFullscreen().catch(() => {})
}

export function salirPantallaCompleta() {
  if (enPantallaCompleta()) document.exitFullscreen().catch(() => {})
}

export function usePantallaCompleta() {
  const [activa, setActiva] = useState(enPantallaCompleta)

  useEffect(() => {
    const actualizar = () => setActiva(enPantallaCompleta())
    document.addEventListener('fullscreenchange', actualizar)
    return () => document.removeEventListener('fullscreenchange', actualizar)
  }, [])

  const alternar = useCallback(() => {
    if (enPantallaCompleta()) salirPantallaCompleta()
    else entrarPantallaCompleta()
  }, [])

  const disponible = typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function'
  return { activa, alternar, disponible }
}
