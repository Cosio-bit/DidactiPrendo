import { textos } from '../i18n/es-CL.ts'
import { Boton } from './Boton.tsx'
import { pilaDeshacer } from './deshacer.ts'
import { useEstadoGuardado } from './useDeshacer.ts'

/** Siempre visible: dice si está guardado y ofrece deshacer. */
export function BarraGuardado() {
  const { aviso, error, puedeDeshacer } = useEstadoGuardado()

  return (
    <footer className="barra-guardado">
      <p className={error ? 'barra-guardado__aviso barra-guardado__aviso--error' : 'barra-guardado__aviso'} role="status">
        {aviso ?? textos.avisos.inicial}
      </p>
      <Boton disabled={!puedeDeshacer} onClick={() => void pilaDeshacer.deshacer()}>
        {textos.avisos.deshacer}
      </Boton>
    </footer>
  )
}
