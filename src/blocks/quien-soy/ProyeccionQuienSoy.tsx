import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Adivinanza } from '../../parser/tipos.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import { avanzar, nuevoJuego, retroceder, revelar, type Juego } from './logica.ts'

const t = textos.proyeccion

interface Props {
  adivinanzas: Adivinanza[]
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionQuienSoy({ adivinanzas, onSalir, textoVolver }: Props) {
  const [juego, setJuego] = useState<Juego>(() => nuevoJuego(adivinanzas))
  const pantallaCompleta = usePantallaCompleta()

  useAtajos({
    avanzar: () => setJuego((j) => avanzar(j, adivinanzas)),
    retroceder: () => setJuego(retroceder),
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
  })

  const { actual, terminado } = juego
  const adivinanza = adivinanzas[actual]
  const { pistas, revelada } = juego.estados[actual]
  const quedanPistas = pistas < adivinanza.pistas.length
  const esUltima = actual === adivinanzas.length - 1
  // Las pistas que faltan y la respuesta ya tienen su lugar: al aparecer, la letra no cambia de tamaño.
  const contenido = useTextoAjustado<HTMLDivElement>(`${actual}-${terminado}`, 60)

  return (
    <div className="proyeccion proyeccion-preguntas proyeccion-quien-soy">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {terminado ? t.adivinanzasTerminadas : t.numeroAdivinanza(actual + 1, adivinanzas.length)}
        </p>
        {!terminado && (
          <p className="proyeccion-quien-soy__pistas" aria-live="polite">
            {t.pistaDe(pistas, adivinanza.pistas.length)}
          </p>
        )}
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
          <p className="proyeccion-preguntas__cierre-titulo">{t.adivinanzasTerminadas}</p>
          <p>{textos.vistaPrevia.cantidad('quien-soy', adivinanzas.length)}</p>
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={() => setJuego(retroceder)}>{t.anterior}</Boton>
            <Boton variante="principal" onClick={() => setJuego(nuevoJuego(adivinanzas))}>
              {t.volverAEmpezar}
            </Boton>
          </div>
        </div>
      ) : (
        <div ref={contenido} className="proyeccion-preguntas__contenido proyeccion-quien-soy__contenido">
          <ol className="proyeccion-quien-soy__lista">
            {adivinanza.pistas.map((pista, i) => {
              const visible = i < pistas
              return (
                <li
                  key={i}
                  className={visible ? 'pista' : 'pista pista--oculta'}
                  aria-hidden={!visible}
                >
                  <span className="pista__numero">{i + 1}</span>
                  <span className="pista__texto">{pista}</span>
                </li>
              )
            })}
          </ol>
          <p
            className={revelada ? 'proyeccion-quien-soy__respuesta' : 'proyeccion-quien-soy__respuesta respuesta--reservada'}
            aria-hidden={!revelada}
          >
            <span className="proyeccion-quien-soy__etiqueta">{t.respuestaEra}</span> {adivinanza.respuesta}
          </p>
        </div>
      )}

      {!terminado && (
        <div className="proyeccion-preguntas__controles">
          <Boton variante="navegacion" onClick={() => setJuego(retroceder)} disabled={actual === 0}>
            {t.anterior}
          </Boton>
          <Boton variante="herramienta" onClick={() => setJuego((j) => revelar(j, adivinanzas))} disabled={revelada}>
            {t.revelar}
          </Boton>
          <Boton
            variante="principal"
            className="proyeccion-preguntas__avanzar"
            onClick={() => setJuego((j) => avanzar(j, adivinanzas))}
          >
            {revelada ? (esUltima ? t.terminar : t.siguiente) : quedanPistas ? t.otraPista : t.revelar}
          </Boton>
        </div>
      )}
      <AyudaTeclas>{t.teclasQuienSoy}</AyudaTeclas>
    </div>
  )
}
