import { useRef } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { Boton } from '../ui/Boton.tsx'
import { cargarMaterial } from './cargarMaterial.ts'

/** "Cargar material": busca en el computador el archivo de actividades descargado antes. */
export function BotonCargarMaterial() {
  const selector = useRef<HTMLInputElement>(null)
  return (
    <>
      <Boton variante="herramienta" onClick={() => selector.current?.click()}>
        {textos.respaldo.cargarMaterial}
      </Boton>
      <input
        ref={selector}
        // Oculto: se abre con el botón.
        hidden
        type="file"
        multiple
        accept=".json,application/json"
        onChange={(evento) => {
          const archivos = [...(evento.target.files ?? [])]
          evento.target.value = ''
          if (archivos.length > 0) void cargarMaterial(archivos)
        }}
      />
    </>
  )
}
