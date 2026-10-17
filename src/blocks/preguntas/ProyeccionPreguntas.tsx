import { useEffect, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Pregunta } from '../../parser/tipos.ts'
import { prepararSonido, sonarAlarma } from '../../projection/sonido.ts'
import { formatearTiempo } from '../../projection/tiempo.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
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
import { LETRAS_VF } from './verdaderoFalso.ts'

const t = textos.proyeccion

/** Dos o cuatro alternativas cortas (como "3/4" o "Santiago") caben en dos columnas. */
function enDosColumnas(pregunta: Pregunta) {
  const n = pregunta.alternativas.length
  return (n === 2 || n === 4) && pregunta.alternativas.every((a) => a.texto.length <= 24)
}

interface Props {
  preguntas: Pregunta[]
  config: ConfigPreguntas
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
  /** Verdadero o falso: letras V y F, sin "comentar el error" (solo hay una incorrecta). */
  verdaderoFalso?: boolean
}

export function ProyeccionPreguntas({ preguntas, config, onSalir, textoVolver, verdaderoFalso = false }: Props) {
  const etiqueta = (i: number) => (verdaderoFalso ? LETRAS_VF[i] : letra(i))
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

  const letras = verdaderoFalso
    ? {}
    : Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map((l, i) => [l, () => !terminado && marcarError(i)]))
  useAtajos({
    avanzar: siguiente,
    retroceder: anterior,
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
    otras: { ...letras, p: alternarPausa },
  })

  // La letra se calcula al mostrar cada pregunta, con el espacio de las marcas ya reservado: al revelar
  // la respuesta o comentar un error, nada cambia de tamaño.
  const contenido = useTextoAjustado<HTMLDivElement>(`${actual}-${terminado}`, 64)
  const sinCorrecta = revelada && !pregunta.alternativas.some((a) => a.correcta)
  const tiempoAcabado = conTiempo && cuenta.terminada && !revelada && !terminado

  return (
    <div className="proyeccion proyeccion-preguntas" data-tiempo-acabado={tiempoAcabado}>
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {terminado
            ? t.repasoTerminado
            : verdaderoFalso
              ? t.numeroAfirmacion(actual + 1, preguntas.length)
              : t.numeroPregunta(actual + 1, preguntas.length)}
        </p>
        {conTiempo && !terminado && (
          <p
            className={[
              'temporizador',
              tiempoAcabado && 'temporizador--fin',
              // Al revelar se esconde pero conserva su lugar, para que nada cambie de tamaño.
              revelada && 'temporizador--oculto',
            ]
              .filter(Boolean)
              .join(' ')}
            role="timer"
            aria-live={tiempoAcabado ? 'assertive' : 'off'}
          >
            {tiempoAcabado ? t.seAcaboElTiempo : formatearTiempo(cuenta.restanteMs)}
          </p>
        )}
        <div className="proyeccion__secundarios">
          <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
          {conTiempo && !terminado && !revelada && !cuenta.terminada && (
            <Boton variante="herramienta" onClick={alternarPausa}>{cuenta.corriendo ? t.pausar : t.seguir}</Boton>
          )}
          {pantallaCompleta.disponible && (
            <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
              {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
            </Boton>
          )}
        </div>
      </div>

      {terminado ? (
        <div className="proyeccion-preguntas__cierre">
          <p className="proyeccion-preguntas__cierre-titulo">{t.terminaste}</p>
          <p>{textos.vistaPrevia.cantidad(verdaderoFalso ? 'verdadero-falso' : 'preguntas', preguntas.length)}</p>
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={anterior}>{t.anterior}</Boton>
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
                  <span className="alternativa-proyectada__letra">{etiqueta(i)}</span>
                  <span className="alternativa-proyectada__texto">
                    {alternativa.texto}
                    {esCorrecta ? (
                      <strong className="alternativa-proyectada__marca"> ✓ {t.correcta}</strong>
                    ) : esComentada ? (
                      <strong className="alternativa-proyectada__marca"> ✗ {t.paraComentar}</strong>
                    ) : (
                      // Espacio reservado para la marca, para que revelar no cambie el tamaño de la letra.
                      <strong className="alternativa-proyectada__marca alternativa-proyectada__marca--reservada" aria-hidden="true">
                        {verdaderoFalso ? `✓ ${t.correcta}` : `✗ ${t.paraComentar}`}
                      </strong>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
          {!pregunta.alternativas.some((a) => a.correcta) && (
            <p
              className={sinCorrecta ? 'proyeccion-preguntas__nota' : 'proyeccion-preguntas__nota proyeccion-preguntas__nota--reservada'}
              aria-hidden={!sinCorrecta}
            >
              {t.sinRespuestaMarcada}
            </p>
          )}
        </div>
      )}

      {!terminado && (
        <div className="proyeccion-preguntas__controles">
          <Boton variante="navegacion" onClick={anterior} disabled={actual === 0}>
            {t.anterior}
          </Boton>
          {!verdaderoFalso && (
            <Boton variante="herramienta" onClick={alternarComentar} aria-pressed={eligiendoError || comentada !== null}>
              {comentada !== null ? t.quitarComentario : t.comentarError}
            </Boton>
          )}
          <Boton variante="principal" className="proyeccion-preguntas__avanzar" onClick={siguiente}>
            {!revelada ? t.revelar : esUltima ? t.terminar : t.siguiente}
          </Boton>
        </div>
      )}
      <AyudaTeclas indicacion={eligiendoError}>
        {eligiendoError
          ? t.elegirError
          : verdaderoFalso
            ? conTiempo
              ? t.teclasVFConTiempo
              : t.teclasVF
            : conTiempo
              ? t.teclasPreguntasConTiempo
              : t.teclasPreguntas}
      </AyudaTeclas>
    </div>
  )
}
