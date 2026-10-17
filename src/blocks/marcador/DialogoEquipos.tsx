import { useEffect, useId, useRef, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { Boton } from '../../ui/Boton.tsx'
import { DialogoConfirmacion } from '../../ui/DialogoConfirmacion.tsx'
import { Figura } from './Figura.tsx'
import { nombreDeColor } from './nombres.ts'
import {
  agregarEquipo,
  LARGO_MAXIMO_NOMBRE,
  MAXIMO_EQUIPOS,
  MINIMO_EQUIPOS,
  nombreDeEquipo,
  quitarEquipo,
  reiniciarPuntos,
  renombrar,
  siguienteColor,
  type Marcador,
} from './logica.ts'

const t = textos.herramientas

interface Props {
  abierto: boolean
  marcador: Marcador
  onCambiar: (cambio: (m: Marcador) => Marcador) => void
  onCerrar: () => void
}

/** Nombres, colores y cantidad de equipos. Cada cambio se guarda al tiro. */
export function DialogoEquipos({ abierto, marcador, onCambiar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idAyuda = useId()
  const [confirmando, setConfirmando] = useState(false)
  const lleno = marcador.equipos.length >= MAXIMO_EQUIPOS

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <>
      <dialog
        ref={ref}
        className="dialogo dialogo-equipos"
        aria-labelledby={idTitulo}
        aria-describedby={idAyuda}
        onCancel={(evento) => {
          evento.preventDefault()
          onCerrar()
        }}
      >
        <h2 id={idTitulo}>{t.tituloEquipos}</h2>
        <p id={idAyuda}>{t.ayudaEquipos}</p>
        <ol className="dialogo-equipos__lista" data-columnas={marcador.equipos.length > 4 ? 2 : 1}>
          {marcador.equipos.map((equipo, i) => (
            <li key={i} className="dialogo-equipos__equipo">
              <Boton
                variante="herramienta"
                className="dialogo-equipos__color"
                onClick={() => onCambiar((m) => siguienteColor(m, i, nombreDeColor))}
                aria-label={t.cambiarColor(nombreDeColor(equipo.color))}
              >
                <Figura color={equipo.color} />
              </Boton>
              <input
                className="campo__entrada"
                type="text"
                value={equipo.nombre}
                maxLength={LARGO_MAXIMO_NOMBRE}
                placeholder={nombreDeColor(equipo.color)}
                aria-label={t.nombreEquipo(i + 1)}
                onChange={(evento) => onCambiar((m) => renombrar(m, i, evento.target.value))}
              />
              <Boton
                variante="herramienta"
                onClick={() => onCambiar((m) => quitarEquipo(m, i))}
                disabled={marcador.equipos.length <= MINIMO_EQUIPOS}
                aria-label={t.quitarEquipo(nombreDeEquipo(equipo, nombreDeColor))}
              >
                {t.quitar}
              </Boton>
            </li>
          ))}
        </ol>
        <div className="dialogo__acciones dialogo-equipos__acciones">
          <Boton variante="herramienta" onClick={() => onCambiar((m) => agregarEquipo(m, nombreDeColor))} disabled={lleno}>
            {t.agregarEquipo}
          </Boton>
          {lleno && <span className="dialogo-equipos__nota">{t.maximoEquipos(MAXIMO_EQUIPOS)}</span>}
          <Boton
            variante="peligro"
            onClick={() => setConfirmando(true)}
            disabled={marcador.equipos.every((e) => e.puntos === 0)}
          >
            {t.reiniciarPuntos}
          </Boton>
          <Boton variante="principal" onClick={onCerrar}>
            {t.listo}
          </Boton>
        </div>
      </dialog>
      <DialogoConfirmacion
        abierto={confirmando}
        titulo={t.confirmarReinicio.titulo}
        mensaje={t.confirmarReinicio.mensaje}
        textoConfirmar={t.confirmarReinicio.confirmar}
        textoCancelar={t.confirmarReinicio.cancelar}
        onConfirmar={() => {
          onCambiar(reiniciarPuntos)
          setConfirmando(false)
        }}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  )
}
