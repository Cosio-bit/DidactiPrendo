import { registerSW } from 'virtual:pwa-register'
import { crearActualizador } from './actualizacion.ts'
import { leerRuta } from './navegacion.ts'

/** Cada cuánto se revisa si hay versión nueva, para quien deja la pestaña abierta todo el día. */
const REVISAR_CADA_MS = 30 * 60 * 1000

export function registrarActualizaciones() {
  if (!('serviceWorker' in navigator)) return

  const actualizador = crearActualizador(
    // Activa la versión nueva y recarga la página. Los datos ya están guardados en el computador.
    () => void actualizarSW(true),
    () => leerRuta(location.hash).pantalla,
  )

  const actualizarSW = registerSW({
    immediate: true,
    onNeedRefresh: actualizador.hayVersionNueva,
    onRegisteredSW(_url, registro) {
      if (registro) window.setInterval(() => void registro.update().catch(() => {}), REVISAR_CADA_MS)
    },
  })

  window.addEventListener('hashchange', actualizador.cambioDePantalla)
}
