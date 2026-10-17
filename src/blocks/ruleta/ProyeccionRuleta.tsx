import { useEffect, useMemo, useRef, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { prepararSonido, sonarFin, sonarTic } from '../../projection/sonido.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  azar,
  frenado,
  nuevoSorteo,
  prepararGiro,
  quedan,
  rotacionFinal,
  segmentoBajoPuntero,
  terminarGiro,
  type ConfigRuleta,
  type Sorteo,
} from './logica.ts'
import { Rueda } from './Rueda.tsx'

const t = textos.proyeccion

function duracionGiro() {
  // Más corto si el sistema pide reducir movimiento.
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1200 : 3200
}

interface Props {
  elementos: string[]
  config: ConfigRuleta
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionRuleta({ elementos, config, onSalir, textoVolver }: Props) {
  const [sorteo, setSorteo] = useState<Sorteo>(() => nuevoSorteo(elementos.length))
  const [rotacion, setRotacion] = useState(0)
  const [bajoPuntero, setBajoPuntero] = useState<number | null>(null)
  const [girando, setGirando] = useState(false)
  const animacion = useRef<number | undefined>(undefined)
  const pantallaCompleta = usePantallaCompleta()

  useEffect(() => () => cancelAnimationFrame(animacion.current!), [])

  const enRueda = useMemo(() => sorteo.enRueda.map((i) => elementos[i]), [sorteo.enRueda, elementos])
  const restantes = quedan(sorteo)
  const terminado = restantes === 0 && !girando

  function girar() {
    if (girando || quedan(sorteo) === 0) return
    if (config.sonido) prepararSonido()

    const preparado = prepararGiro(sorteo)
    const n = preparado.enRueda.length
    const indice = azar(n)
    const reducido = duracionGiro() < 2000
    const inicio = rotacion
    const final = rotacionFinal(inicio, indice, n, reducido ? 1 : 5, (Math.random() - 0.5) * 0.8)
    const duracion = duracionGiro()
    const comienzo = performance.now()
    let ultimoSegmento = segmentoBajoPuntero(inicio, n)

    setSorteo(preparado)
    setGirando(true)
    setBajoPuntero(preparado.enRueda[ultimoSegmento])

    const cuadro = (ahora: number) => {
      const avance = Math.min(1, (ahora - comienzo) / duracion)
      const actual = inicio + (final - inicio) * frenado(avance)
      const segmento = segmentoBajoPuntero(actual, n)
      setRotacion(actual)
      if (segmento !== ultimoSegmento) {
        ultimoSegmento = segmento
        setBajoPuntero(preparado.enRueda[segmento])
        if (config.sonido) sonarTic()
      }
      if (avance < 1) {
        animacion.current = requestAnimationFrame(cuadro)
        return
      }
      const ganador = preparado.enRueda[indice]
      setBajoPuntero(ganador)
      setSorteo(terminarGiro(preparado, ganador, config.eliminarAlSalir))
      setGirando(false)
      if (config.sonido) sonarFin()
    }
    animacion.current = requestAnimationFrame(cuadro)
  }

  function volverAEmpezar() {
    if (girando) return
    setSorteo(nuevoSorteo(elementos.length))
    setBajoPuntero(null)
  }

  useAtajos({ avanzar: girar, salir: onSalir, pantallaCompleta: pantallaCompleta.alternar })

  const mostrado = girando
    ? bajoPuntero === null ? '' : elementos[bajoPuntero]
    : sorteo.ganador === null ? t.ruletaInicio : elementos[sorteo.ganador]
  const resultado = useTextoAjustado<HTMLParagraphElement>(mostrado, 160)

  return (
    <div className="proyeccion proyeccion-ruleta">
      <div className="proyeccion-ruleta__rueda">
        <Rueda elementos={enRueda} rotacion={rotacion} descripcion={t.ruletaDescripcion(enRueda.length)} onToque={girar} />
      </div>

      <div className="proyeccion-ruleta__panel">
        <p
          ref={resultado}
          className={
            sorteo.ganador === null && !girando
              ? 'proyeccion-ruleta__resultado proyeccion-ruleta__resultado--espera'
              : 'proyeccion-ruleta__resultado'
          }
          data-girando={girando}
        >
          {mostrado}
        </p>
        {/* Para lectores de pantalla: solo el resultado final, no cada nombre que pasa. */}
        <p className="solo-lector" aria-live="polite">
          {!girando && sorteo.ganador !== null ? t.salio(elementos[sorteo.ganador]) : ''}
        </p>

        <p className="proyeccion-ruleta__contador">
          {terminado
            ? t.todosSalieron
            : config.eliminarAlSalir
              ? t.quedan(restantes, elementos.length)
              : t.enLaRuleta(elementos.length)}
        </p>

        <div className="proyeccion__controles">
          {terminado ? (
            <Boton variante="principal" className="proyeccion__girar" onClick={volverAEmpezar}>
              {t.volverAEmpezar}
            </Boton>
          ) : (
            <Boton variante="principal" className="proyeccion__girar" onClick={girar} disabled={girando}>
              {t.girar}
            </Boton>
          )}
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
            {pantallaCompleta.disponible && (
              <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
                {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
              </Boton>
            )}
            {!terminado && config.eliminarAlSalir && (
              <Boton variante="herramienta" onClick={volverAEmpezar} disabled={girando || restantes === elementos.length}>
                {t.volverAEmpezar}
              </Boton>
            )}
          </div>
          <AyudaTeclas>{t.teclasRuleta}</AyudaTeclas>
        </div>
      </div>
    </div>
  )
}
