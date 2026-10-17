import { useEffect, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Pregunta } from '../../parser/tipos.ts'
import { prepararSonido, sonarAlarma } from '../../projection/sonido.ts'
import { formatearTiempo } from '../../projection/tiempo.ts'
import { useAtajos } from '../../projection/useAtajos.ts'
import { useCuentaRegresiva } from '../../projection/useCuentaRegresiva.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  avanzar,
  comentar,
  letra,
  nuevoRepaso,
  retroceder,
  type ConfigPreguntas,
  type Repaso,
} from './logica.ts'

const t = textos.proyeccion

/** Alternativas cortas (como "3/4" o "Santiago") caben en dos columnas. */
function enDosColumnas(pregunta: Pregunta) {
  return pregunta.alternativas.length === 4 && pregunta.alternativas.every((a) => a.texto.length <= 24)
}

interface Props {
  preguntas: Pregunta[]
  config: ConfigPreguntas
  onSalir: () => void
}

export function ProyeccionPreguntas({ preguntas, config, onSalir }: Props) {
  const [repaso, setRepaso] = useState<Repaso>(() => nuevoRepaso(preguntas.length))
  const [eligiendoError, setEligiendoError] = useState(false)
  const pantallaCompleta = usePantallaCompleta()
  const conTiempo = config.segundosPorPregunta > 0
  const cuenta = useCuentaRegresiva(() => {
    if (config.sonido) sonarAlarma()
  })

  const { actual, terminado } = repaso
  const pregunta = preguntas[actual]
  const { revelada, comentada } = repaso.estados[actual]
  const esUltima = actual === preguntas.length - 1

  // Cada pregunta sin revelar parte con el tiempo completo; al revelar, el tiempo se detiene.
  const { iniciar, detener } = cuenta
  useEffect(() => {
    if (!conTiempo) return
    if (terminado || revelada) detener()
    else iniciar(config.segundosPorPregunta * 1000)
  }, [actual, terminado, revelada, conTiempo, config.segundosPorPregunta, iniciar, detener])

  function prepararAudio() {
    if (config.sonido && conTiempo) prepararSonido()
  }

  function siguiente() {
    prepararAudio()
    setEligiendoError(false)
    setRepaso(avanzar)
  }

  function anterior() {
    setEligiendoError(false)
    setRepaso(retroceder)
  }

  function marcarError(indice: number) {
    setEligiendoError(false)
    setRepaso((r) => comentar(r, preguntas[r.actual], indice))
  }

  function alternarComentar() {
    if (comentada !== null) marcarError(comentada)
    else setEligiendoError((e) => !e)
  }

  function alternarPausa() {
    if (!conTiempo || revelada || cuenta.terminada) return
    if (cuenta.corriendo) cuenta.pausar()
    else cuenta.seguir()
  }

  function volverAEmpezar() {
    setRepaso(nuevoRepaso(preguntas.length))
  }

  const letras = Object.fromEntries(
    ['a', 'b', 'c', 'd', 'e'].map((l, i) => [l, () => !terminado && marcarError(i)]),
  )
  useAtajos({
    avanzar: siguiente,
    retroceder: anterior,
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
    otras: { ...letras, p: alternarPausa },
  })

  const contenido = useTextoAjustado<HTMLDivElement>(`${actual}-${revelada}-${comentada}-${terminado}`, 64)
  const sinCorrecta = revelada && !pregunta.alternativas.some((a) => a.correcta)
  const tiempoAcabado = conTiempo && cuenta.terminada && !revelada && !terminado

  return (
    <div className="proyeccion proyeccion-preguntas" data-tiempo-acabado={tiempoAcabado}>
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {terminado ? t.repasoTerminado : t.numeroPregunta(actual + 1, preguntas.length)}
        </p>
        {conTiempo && !terminado && !revelada && (
          <p
            className={tiempoAcabado ? 'temporizador temporizador--fin' : 'temporizador'}
            role="timer"
            aria-live={tiempoAcabado ? 'assertive' : 'off'}
          >
            {tiempoAcabado ? t.seAcaboElTiempo : formatearTiempo(cuenta.restanteMs)}
          </p>
        )}
        <div className="proyeccion__secundarios">
          {conTiempo && !terminado && !revelada && !cuenta.terminada && (
            <Boton onClick={alternarPausa}>{cuenta.corriendo ? t.pausar : t.seguir}</Boton>
          )}
          <Boton onClick={pantallaCompleta.alternar} aria-pressed={pantallaCompleta.activa}>
            {t.pantallaCompleta}
          </Boton>
          <Boton onClick={onSalir}>{t.salir}</Boton>
        </div>
      </div>

      {terminado ? (
        <div className="proyeccion-preguntas__cierre">
          <p className="proyeccion-preguntas__cierre-titulo">{t.terminaste}</p>
          <p>{textos.vistaPrevia.cantidad('preguntas', preguntas.length)}</p>
          <div className="proyeccion__secundarios">
            <Boton onClick={anterior}>{t.anterior}</Boton>
            <Boton variante="principal" onClick={volverAEmpezar}>
              {t.volverAEmpezar}
            </Boton>
          </div>
        </div>
      ) : (
        <div ref={contenido} className="proyeccion-preguntas__contenido">
          <p className="proyeccion-preguntas__enunciado">{pregunta.enunciado || t.sinEnunciado}</p>
          <ol
            className="proyeccion-preguntas__alternativas"
            data-columnas={enDosColumnas(pregunta) ? 2 : 1}
            data-eligiendo={eligiendoError}
          >
            {pregunta.alternativas.map((alternativa, i) => {
              const esCorrecta = revelada && alternativa.correcta
              const esComentada = comentada === i
              const clases = ['alternativa-proyectada']
              if (esCorrecta) clases.push('alternativa-proyectada--correcta')
              if (esComentada) clases.push('alternativa-proyectada--comentada')
              if (revelada && !esCorrecta && !esComentada) clases.push('alternativa-proyectada--apagada')
              const elegible = eligiendoError && !alternativa.correcta
              return (
                <li
                  key={i}
                  className={clases.join(' ')}
                  role={elegible ? 'button' : undefined}
                  tabIndex={elegible ? 0 : undefined}
                  onClick={elegible ? () => marcarError(i) : undefined}
                >
                  <span className="alternativa-proyectada__letra">{letra(i)}</span>
                  <span className="alternativa-proyectada__texto">
                    {alternativa.texto}
                    {esCorrecta && <strong className="alternativa-proyectada__marca"> ✓ {t.correcta}</strong>}
                    {esComentada && <strong className="alternativa-proyectada__marca"> ✗ {t.paraComentar}</strong>}
                  </span>
                </li>
              )
            })}
          </ol>
          {sinCorrecta && <p className="proyeccion-preguntas__nota">{t.sinRespuestaMarcada}</p>}
        </div>
      )}

      {!terminado && (
        <div className="proyeccion-preguntas__controles">
          <Boton onClick={anterior} disabled={actual === 0}>
            {t.anterior}
          </Boton>
          <Boton onClick={alternarComentar} aria-pressed={eligiendoError || comentada !== null}>
            {comentada !== null ? t.quitarComentario : t.comentarError}
          </Boton>
          <Boton variante="principal" className="proyeccion-preguntas__avanzar" onClick={siguiente}>
            {!revelada ? t.revelar : esUltima ? t.terminar : t.siguiente}
          </Boton>
        </div>
      )}
      <p className="proyeccion__teclas">
        {eligiendoError ? t.elegirError : conTiempo ? t.teclasPreguntasConTiempo : t.teclasPreguntas}
      </p>
    </div>
  )
}
