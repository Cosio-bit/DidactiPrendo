import { useRef } from 'react'
import { TIPOS_DE_MATERIAL } from '../ai-bridge/material.ts'
import { textos } from '../i18n/es-CL.ts'
import { Boton } from '../ui/Boton.tsx'
import { cargarMaterial } from './cargarMaterial.ts'

/** "Cargar material": busca en el computador el archivo de actividades descargado antes, o una guía para crear con IA. */
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
        accept={`.json,application/json,${TIPOS_DE_MATERIAL}`}
        onChange={(evento) => {
          const archivos = [...(evento.target.files ?? [])]
          evento.target.value = ''
          if (archivos.length > 0) void cargarMaterial(archivos)
        }}
      />
    </>
  )
}
