import { useCallback, useEffect, useRef, useState } from 'react'

export interface CuentaRegresiva {
  restanteMs: number
  corriendo: boolean
  /** Llegó a cero. */
  terminada: boolean
  /** Parte de nuevo desde `ms` y empieza a correr. */
  iniciar: (ms: number) => void
  pausar: () => void
  seguir: () => void
  /** Se detiene sin llegar a cero (ej. al revelar la respuesta). */
  detener: () => void
}

/** Cuenta regresiva basada en el reloj, para no atrasarse si el computador está lento. */
export function useCuentaRegresiva(alTerminar?: () => void): CuentaRegresiva {
  const [restanteMs, setRestanteMs] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [terminada, setTerminada] = useState(false)
  const fin = useRef(0)
  const avisar = useRef(alTerminar)
  const corriendoRef = useRef(corriendo)
  const restanteRef = useRef(restanteMs)
  useEffect(() => {
    avisar.current = alTerminar
    corriendoRef.current = corriendo
    restanteRef.current = restanteMs
  })

  useEffect(() => {
    if (!corriendo) return
    const intervalo = window.setInterval(() => {
      const quedan = fin.current - Date.now()
      if (quedan > 0) {
        setRestanteMs(quedan)
        return
      }
      setRestanteMs(0)
      setCorriendo(false)
      setTerminada(true)
      avisar.current?.()
    }, 200)
    return () => window.clearInterval(intervalo)
  }, [corriendo])

  const iniciar = useCallback((ms: number) => {
    fin.current = Date.now() + ms
    setRestanteMs(ms)
    setTerminada(false)
    setCorriendo(ms > 0)
  }, [])

  const pausar = useCallback(() => {
    if (!corriendoRef.current) return
    setRestanteMs(Math.max(0, fin.current - Date.now()))
    setCorriendo(false)
  }, [])

  const seguir = useCallback(() => {
    if (corriendoRef.current || restanteRef.current <= 0) return
    fin.current = Date.now() + restanteRef.current
    setCorriendo(true)
  }, [])

  const detener = useCallback(() => setCorriendo(false), [])

  return { restanteMs, corriendo, terminada, iniciar, pausar, seguir, detener }
}
