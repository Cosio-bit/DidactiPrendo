import { useEffect, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { prepararSonido, sonarAlarma } from '../../projection/sonido.ts'
import { formatearTiempo } from '../../projection/tiempo.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  cambiarMinutos,
  corriendo,
  iniciar,
  MAXIMO_MS,
  MINIMO_MS,
  nuevoTemporizador,
  pausar,
  reiniciar,
  restante,
  sinEmpezar,
  type Temporizador,
} from './logica.ts'

const t = textos.herramientas

interface Props {
  /** Duración con que parte (la última que usó el profe). */
  totalInicialMs: number
  /** Cambió la duración: se guarda para la próxima vez. */
  onCambioTotal: (totalMs: number) => void
  /** Se acabó el tiempo (true) o se volvió a usar (false): la pantalla se marca en rojo. */
  onFin: (terminado: boolean) => void
}

/** Temporizador independiente: inicio, pausa, reinicio y un minuto más o menos. Al terminar suena y se pone rojo. */
export function PanelTemporizador({ totalInicialMs, onCambioTotal, onFin }: Props) {
  const [temporizador, setTemporizador] = useState<Temporizador>(() => nuevoTemporizador(totalInicialMs))
  const [ahora, setAhora] = useState(() => Date.now())
  const [terminado, setTerminado] = useState(false)
  const andando = corriendo(temporizador)
  const queda = restante(temporizador, ahora)

  // Al cerrar el temporizador, la pantalla deja de estar en rojo.
  useEffect(() => () => onFin(false), [onFin])

  // Mientras corre, se mira el reloj cinco veces por segundo. Al llegar a cero, se detiene, suena y avisa.
  const { finEn } = temporizador
  useEffect(() => {
    if (finEn === null) return
    const intervalo = window.setInterval(() => {
      const momento = Date.now()
      setAhora(momento)
      if (momento < finEn) return
      setTemporizador((tm) => ({ ...tm, restanteMs: 0, finEn: null }))
      setTerminado(true)
      onFin(true)
      sonarAlarma()
    }, 200)
    return () => window.clearInterval(intervalo)
  }, [finEn, onFin])

  function cambiar(cambio: (tm: Temporizador, ahora: number) => Temporizador) {
    const momento = Date.now()
    const nuevo = cambio(temporizador, momento)
    setAhora(momento)
    setTemporizador(nuevo)
    if (terminado) {
      setTerminado(false)
      onFin(false)
    }
    if (nuevo.totalMs !== temporizador.totalMs) onCambioTotal(nuevo.totalMs)
  }

  function alternar() {
    // El toque permite al navegador sonar la alarma después.
    prepararSonido()
    cambiar((tm, momento) => (corriendo(tm) ? pausar(tm, momento) : iniciar(tm, momento)))
  }

  const principal = andando ? t.pausar : sinEmpezar(temporizador) || terminado ? t.iniciar : t.seguir
  const sinEmpezarAun = sinEmpezar(temporizador)

  return (
    <section
      className={terminado ? 'temporizador-panel temporizador-panel--fin' : 'temporizador-panel'}
      aria-label={t.regionTemporizador}
    >
      <Boton
        variante="herramienta"
        onClick={() => cambiar((tm, momento) => cambiarMinutos(tm, -1, momento))}
        disabled={sinEmpezarAun ? temporizador.totalMs <= MINIMO_MS : queda === 0}
        aria-label={t.menosMinutoDescripcion}
      >
        {t.menosMinuto}
      </Boton>
      <p className="temporizador-panel__tiempo" role="timer">
        {terminado ? textos.proyeccion.seAcaboElTiempo : formatearTiempo(queda)}
      </p>
      <Boton
        variante="herramienta"
        onClick={() => cambiar((tm, momento) => cambiarMinutos(tm, 1, momento))}
        disabled={(sinEmpezarAun ? temporizador.totalMs : queda) >= MAXIMO_MS}
        aria-label={t.masMinutoDescripcion}
      >
        {t.masMinuto}
      </Boton>
      <div className="temporizador-panel__acciones">
        <Boton variante="principal" className="temporizador-panel__principal" onClick={alternar}>
          {principal}
        </Boton>
        <Boton variante="herramienta" onClick={() => cambiar((tm) => reiniciar(tm))} disabled={sinEmpezarAun && !terminado}>
          {t.reiniciar}
        </Boton>
      </div>
      <p className="solo-lector" aria-live="assertive">
        {terminado ? t.seAcabo : ''}
      </p>
    </section>
  )
}
