import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Pareja } from '../../parser/tipos.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import { avanzar, nuevoMazo, retroceder, voltear, type ConfigTarjetas, type Mazo } from './logica.ts'

const t = textos.proyeccion

/** Una cara de la tarjeta: su letra se agranda hasta llenarla. */
function Cara({ texto, atras }: { texto: string; atras: boolean }) {
  const ref = useTextoAjustado<HTMLSpanElement>(texto, 120)
  return (
    <span ref={ref} className={atras ? 'tarjeta-grande__cara tarjeta-grande__cara--atras' : 'tarjeta-grande__cara'}>
      {texto}
    </span>
  )
}

interface Props {
  tarjetas: Pareja[]
  config: ConfigTarjetas
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionTarjetas({ tarjetas, config, onSalir, textoVolver }: Props) {
  const [mazo, setMazo] = useState<Mazo>(() => nuevoMazo(tarjetas.length, config.mezclarTarjetas))
  const pantallaCompleta = usePantallaCompleta()

  useAtajos({
    avanzar: () => setMazo(avanzar),
    retroceder: () => setMazo(retroceder),
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
  })

  const tarjeta = tarjetas[mazo.orden[mazo.actual]]
  const esUltima = mazo.actual === tarjetas.length - 1

  return (
    <div className="proyeccion proyeccion-preguntas proyeccion-tarjetas">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {mazo.terminado ? t.tarjetasTerminadas : t.numeroTarjeta(mazo.actual + 1, tarjetas.length)}
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

      {mazo.terminado ? (
        <div className="proyeccion-preguntas__cierre">
          <p className="proyeccion-preguntas__cierre-titulo">{t.tarjetasTerminadas}</p>
          <p>{textos.vistaPrevia.cantidad('tarjetas', tarjetas.length)}</p>
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={() => setMazo(retroceder)}>{t.anterior}</Boton>
            <Boton variante="principal" onClick={() => setMazo(nuevoMazo(tarjetas.length, config.mezclarTarjetas))}>
              {t.volverAEmpezar}
            </Boton>
          </div>
        </div>
      ) : (
        <button
          // Una tarjeta nueva parte por adelante, sin animación de volteo.
          key={mazo.actual}
          type="button"
          className={mazo.volteada ? 'tarjeta-grande tarjeta-grande--volteada' : 'tarjeta-grande'}
          onClick={() => setMazo(voltear)}
          aria-label={mazo.volteada ? t.tarjetaAtras(tarjeta.b) : t.tarjetaAdelante(tarjeta.a)}
        >
          <span className="tarjeta-grande__interior" aria-hidden="true">
            <Cara texto={tarjeta.a} atras={false} />
            <Cara texto={tarjeta.b} atras />
          </span>
        </button>
      )}

      {!mazo.terminado && (
        <div className="proyeccion-preguntas__controles">
          <Boton variante="navegacion" onClick={() => setMazo(retroceder)} disabled={mazo.actual === 0}>
            {t.anterior}
          </Boton>
          <Boton variante="principal" className="proyeccion-preguntas__avanzar" onClick={() => setMazo(avanzar)}>
            {!mazo.volteada ? t.voltear : esUltima ? t.terminar : t.siguiente}
          </Boton>
        </div>
      )}
      <AyudaTeclas>{t.teclasTarjetas}</AyudaTeclas>
    </div>
  )
}
