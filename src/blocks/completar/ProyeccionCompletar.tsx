import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Frase } from '../../parser/tipos.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  alternarPalabra,
  avanzar,
  mostrarTodas,
  nuevoCompletar,
  palabrasOcultas,
  retroceder,
  type Completar,
  type ConfigCompletar,
} from './logica.ts'

const t = textos.proyeccion

interface Props {
  frases: Frase[]
  config: ConfigCompletar
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionCompletar({ frases, config, onSalir, textoVolver }: Props) {
  const [estado, setEstado] = useState<Completar>(() => nuevoCompletar(frases))
  const pantallaCompleta = usePantallaCompleta()

  const { actual, terminado } = estado
  const frase = frases[actual]
  const visibles = estado.visibles[actual]
  const palabras = palabrasOcultas(frase)
  const todasVisibles = visibles.every(Boolean)
  const esUltima = actual === frases.length - 1

  // Del 1 al 9: muestra (u oculta) esa palabra.
  const numeros = Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [String(i + 1), () => setEstado((e) => alternarPalabra(e, i))]),
  )
  useAtajos({
    avanzar: () => setEstado(avanzar),
    retroceder: () => setEstado(retroceder),
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
    otras: numeros,
  })

  // La palabra oculta ocupa el mismo espacio que la visible: al mostrarla, la letra no cambia de tamaño.
  const contenido = useTextoAjustado<HTMLDivElement>(`${actual}-${terminado}-${config.bancoDePalabras}`, 72)

  let numeroPalabra = 0
  return (
    <div className="proyeccion proyeccion-preguntas proyeccion-completar">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {terminado ? t.frasesTerminadas : t.numeroFrase(actual + 1, frases.length)}
        </p>
        <div className="proyeccion__secundarios">
          <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
          {pantallaCompleta.disponible && (
            <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
              {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
            </Boton>
          )}
        </div>
      </div>

      {terminado ? (
        <div className="proyeccion-preguntas__cierre">
          <p className="proyeccion-preguntas__cierre-titulo">{t.frasesTerminadas}</p>
          <p>{textos.vistaPrevia.cantidad('completar', frases.length)}</p>
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={() => setEstado(retroceder)}>{t.anterior}</Boton>
            <Boton variante="principal" onClick={() => setEstado(nuevoCompletar(frases))}>
              {t.volverAEmpezar}
            </Boton>
          </div>
        </div>
      ) : (
        <div ref={contenido} className="proyeccion-preguntas__contenido proyeccion-completar__contenido">
          <p className="proyeccion-completar__frase">
            {frase.partes.map((parte, i) => {
              if (!parte.oculta) return <span key={i}>{parte.texto}</span>
              const indice = numeroPalabra++
              const visible = visibles[indice]
              return (
                <button
                  key={i}
                  type="button"
                  className={visible ? 'hueco hueco--visible' : 'hueco'}
                  onClick={() => setEstado((e) => alternarPalabra(e, indice))}
                  aria-label={visible ? t.palabraVisible(indice + 1, parte.texto) : t.palabraOculta(indice + 1)}
                >
                  <span className="hueco__palabra" aria-hidden="true">
                    {parte.texto}
                  </span>
                  {!visible && (
                    <span className="hueco__numero" aria-hidden="true">
                      {indice + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </p>
          {config.bancoDePalabras && palabras.length > 0 && (
            <div className="proyeccion-completar__banco">
              <p className="solo-lector">{t.palabrasQueFaltan}</p>
              <ul>
                {estado.bancos[actual].map((indice) => (
                  <li key={indice} className={visibles[indice] ? 'banco__palabra banco__palabra--usada' : 'banco__palabra'}>
                    {palabras[indice]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!terminado && (
        <div className="proyeccion-preguntas__controles">
          <Boton variante="navegacion" onClick={() => setEstado(retroceder)} disabled={actual === 0}>
            {t.anterior}
          </Boton>
          <Boton variante="herramienta" onClick={() => setEstado(mostrarTodas)} disabled={todasVisibles}>
            {t.mostrarTodasLasPalabras}
          </Boton>
          <Boton variante="principal" className="proyeccion-preguntas__avanzar" onClick={() => setEstado(avanzar)}>
            {!todasVisibles ? t.mostrarPalabra : esUltima ? t.terminar : t.siguiente}
          </Boton>
        </div>
      )}
      <AyudaTeclas>{t.teclasCompletar}</AyudaTeclas>
    </div>
  )
}
