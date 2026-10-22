import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { leerMarcador, nuevoMarcador, type Marcador } from '../blocks/marcador/logica.ts'
import { nombreDeColor } from '../blocks/marcador/nombres.ts'
import { DialogoEquipos } from '../blocks/marcador/DialogoEquipos.tsx'
import { PanelMarcador } from '../blocks/marcador/PanelMarcador.tsx'
import { PanelTemporizador } from '../blocks/temporizador/PanelTemporizador.tsx'
import { MINUTO_MS } from '../blocks/temporizador/logica.ts'
import { textos } from '../i18n/es-CL.ts'
import { ajustes } from '../storage/ajustes.ts'
import { Boton } from '../ui/Boton.tsx'
import { RanuraTeclas } from './ranuraTeclas.ts'
import { useAtajos } from './useAtajos.ts'
import { EVENTO_NO_CABE } from './useTextoAjustado.ts'
import { useTamano } from './useTamano.ts'

const t = textos.herramientas

interface Guardado {
  marcadorVisible: boolean
  temporizadorVisible: boolean
  marcador: Marcador
  totalMs: number
}

/** Lo que el profe dejó la última vez: equipos, puntos, qué estaba abierto y la duración del temporizador. */
async function cargar(): Promise<Guardado> {
  const [visibles, marcador, temporizador] = await Promise.all([
    ajustes.leer('herramientas'),
    ajustes.leer('marcador'),
    ajustes.leer('temporizador'),
  ])
  const v = (visibles ?? {}) as { marcador?: unknown; temporizador?: unknown }
  const total = (temporizador as { totalMs?: unknown } | undefined)?.totalMs
  return {
    marcadorVisible: v.marcador === true,
    temporizadorVisible: v.temporizador === true,
    marcador: leerMarcador(marcador) ?? nuevoMarcador(2, nombreDeColor),
    totalMs: typeof total === 'number' && Number.isFinite(total) ? total : 3 * MINUTO_MS,
  }
}

/** Lo mínimo que se alarga la pantalla cada vez (en altos de pantalla), y hasta cuánto. */
const PASO_MINIMO = 0.25
const MAXIMO_ALARGAR = 6

/**
 * En el celular, si un texto no cabe ni con la letra mínima, la pantalla de la actividad se alarga
 * de a poco hasta que cabe, y se desplaza la página (nunca se corta el texto ni hay un cuadro con barra).
 * Si cambia el tamaño de la pantalla, se vuelve a partir sin alargar.
 */
function useAlargarSiNoCabe() {
  const raiz = useRef<HTMLDivElement>(null)
  const [extra, setExtra] = useState(0)
  useEffect(() => {
    const marco = raiz.current
    if (!marco) return
    let pedido = 0
    let falta = 0
    function alNoCaber(evento: Event) {
      // Varias cajas pueden avisar a la vez (las cartas del memorice): se alarga una vez por cuadro, lo que pida la que más necesita.
      falta = Math.max(falta, (evento as CustomEvent<number>).detail || 0)
      if (pedido) return
      pedido = requestAnimationFrame(() => {
        pedido = 0
        const paso = Math.ceil(Math.max(falta + 8, window.innerHeight * PASO_MINIMO))
        falta = 0
        setExtra((e) => Math.min(e + paso, window.innerHeight * MAXIMO_ALARGAR))
      })
    }
    const reiniciar = () => setExtra(0)
    marco.addEventListener(EVENTO_NO_CABE, alNoCaber)
    window.addEventListener('resize', reiniciar)
    return () => {
      cancelAnimationFrame(pedido)
      marco.removeEventListener(EVENTO_NO_CABE, alNoCaber)
      window.removeEventListener('resize', reiniciar)
    }
  }, [])
  return [raiz, extra] as const
}

function guardar(clave: string, valor: unknown) {
  // Si el navegador no deja guardar, la clase sigue igual.
  ajustes.guardar(clave, valor).catch(() => undefined)
}

interface Props {
  /** La actividad proyectada. */
  children: ReactNode
}

/**
 * Marco de toda proyección: la actividad arriba y, abajo, el marcador por equipos y el temporizador
 * cuando el profe los abre. Acompañan a cualquier actividad y recuerdan cómo quedaron.
 */
export function MarcoProyeccion({ children }: Props) {
  const [guardado, setGuardado] = useState<Guardado | null>(null)
  useEffect(() => {
    let vigente = true
    cargar().then((g) => vigente && setGuardado(g))
    return () => {
      vigente = false
    }
  }, [])
  // Hasta leer lo guardado no se muestra nada: así la actividad no cambia de tamaño al aparecer el marcador.
  if (!guardado) return <div className="proyeccion" />
  return <Marco guardado={guardado}>{children}</Marco>
}

function Marco({ guardado, children }: Props & { guardado: Guardado }) {
  const [marcadorVisible, setMarcadorVisible] = useState(guardado.marcadorVisible)
  const [temporizadorVisible, setTemporizadorVisible] = useState(guardado.temporizadorVisible)
  const [marcador, setMarcador] = useState<Marcador>(guardado.marcador)
  const [tiempoAcabado, setTiempoAcabado] = useState(false)
  const [editandoEquipos, setEditandoEquipos] = useState(false)
  /** Dónde va la ayuda de teclas de la actividad (en el pie). */
  const [ranura, setRanura] = useState<HTMLElement | null>(null)
  const [abajo, { alto }] = useTamano<HTMLDivElement>()
  const [raiz, extra] = useAlargarSiNoCabe()

  // Cada cambio queda guardado para la próxima actividad.
  useEffect(() => {
    guardar('herramientas', { marcador: marcadorVisible, temporizador: temporizadorVisible })
  }, [marcadorVisible, temporizadorVisible])
  useEffect(() => {
    guardar('marcador', marcador)
  }, [marcador])

  const cambiarMarcador = useCallback((cambio: (m: Marcador) => Marcador) => setMarcador(cambio), [])
  /** Última duración elegida: si se cierra y se vuelve a abrir el temporizador, parte con ella. */
  const [totalMs, setTotalMs] = useState(guardado.totalMs)
  const guardarTotal = useCallback((total: number) => {
    setTotalMs(total)
    guardar('temporizador', { totalMs: total })
  }, [])

  const alternarMarcador = () => setMarcadorVisible((v) => !v)
  const alternarTemporizador = () => setTemporizadorVisible((v) => !v)
  useAtajos({ otras: { m: alternarMarcador, t: alternarTemporizador } })

  const abiertas = marcadorVisible || temporizadorVisible

  return (
    <div
      ref={raiz}
      className={abiertas ? 'proyeccion-marco proyeccion-marco--con-herramientas' : 'proyeccion-marco'}
      data-tiempo-acabado={tiempoAcabado && temporizadorVisible}
      data-alargada={extra > 0 || undefined}
      style={{ '--alto-herramientas': `${alto}px`, '--alto-extra': `${extra}px` } as CSSProperties}
    >
      <RanuraTeclas.Provider value={ranura}>{children}</RanuraTeclas.Provider>
      <div ref={abajo} className="proyeccion-marco__abajo">
        {abiertas && (
          <div className="herramientas">
            {temporizadorVisible && (
              <PanelTemporizador totalInicialMs={totalMs} onCambioTotal={guardarTotal} onFin={setTiempoAcabado} />
            )}
            {marcadorVisible && <PanelMarcador marcador={marcador} onCambiar={cambiarMarcador} />}
          </div>
        )}
        {/* Pie: la ayuda de teclas de la actividad y los botones para abrir el marcador y el temporizador. */}
        <div className="proyeccion-marco__pie">
          <div ref={setRanura} className="proyeccion-marco__ayuda" />
          <div className="proyeccion-marco__botones">
            {marcadorVisible && (
              <Boton variante="herramienta" onClick={() => setEditandoEquipos(true)}>
                {t.editarEquipos}
              </Boton>
            )}
            <Boton variante="herramienta" aria-pressed={marcadorVisible} onClick={alternarMarcador}>
              {t.marcador}
            </Boton>
            <Boton variante="herramienta" aria-pressed={temporizadorVisible} onClick={alternarTemporizador}>
              {t.temporizador}
            </Boton>
          </div>
        </div>
      </div>
      <DialogoEquipos
        abierto={editandoEquipos}
        marcador={marcador}
        onCambiar={cambiarMarcador}
        onCerrar={() => setEditandoEquipos(false)}
      />
    </div>
  )
}
