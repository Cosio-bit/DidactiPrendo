import { useId } from 'react'
import { TIPOS_CON_TEXTO } from '../blocks/catalogo.ts'
import { textos } from '../i18n/es-CL.ts'
import type { TipoLectura } from '../parser/tipos.ts'

interface Props {
  elegido: TipoLectura
  sugerido: TipoLectura | null
  onCambiar: (tipo: TipoLectura) => void
}

/** Los seis tipos de actividad, siempre a la vista para que el profe conozca el repertorio. */
export function SelectorTipo({ elegido, sugerido, onCambiar }: Props) {
  const grupo = useId()
  const idEtiqueta = useId()
  return (
    <div className="selector-tipo-fila">
      <span id={idEtiqueta} className="campo__etiqueta">
        {textos.vistaPrevia.tipo}
      </span>
      <div role="radiogroup" aria-labelledby={idEtiqueta} className="selector-tipo selector-tipo--fila-completa">
        {TIPOS_CON_TEXTO.map((tipo) => (
          <label
            key={tipo}
            className={
              elegido === tipo ? 'selector-tipo__opcion selector-tipo__opcion--elegida' : 'selector-tipo__opcion'
            }
          >
            <input type="radio" name={grupo} checked={elegido === tipo} onChange={() => onCambiar(tipo)} />
            <span>
              {textos.tipos[tipo]}
              {sugerido === tipo && <span className="etiqueta"> ({textos.vistaPrevia.sugerido})</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
