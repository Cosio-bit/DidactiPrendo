import { useEffect, useId, useRef } from 'react'
import { Boton } from './Boton.tsx'

interface Props {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar: string
  textoCancelar: string
  onConfirmar: () => void
  onCancelar: () => void
}

/** Pide confirmación antes de una acción delicada. Esc o "Cancelar" lo cierran sin hacer nada. */
export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar,
  onConfirmar,
  onCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idMensaje = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      aria-describedby={idMensaje}
      onCancel={(evento) => {
        evento.preventDefault()
        onCancelar()
      }}
    >
      <h2 id={idTitulo}>{titulo}</h2>
      <p id={idMensaje}>{mensaje}</p>
      <div className="dialogo__acciones">
        {/* Cancelar recibe el foco: un Enter apurado no borra nada. */}
        <Boton autoFocus onClick={onCancelar}>
          {textoCancelar}
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar}>
          {textoConfirmar}
        </Boton>
      </div>
    </dialog>
  )
}
