import { useEffect, useId, useRef, useState } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { hashDe } from '../navegacion.ts'
import { codificar, paraArchivo } from '../storage/intercambio.ts'
import type { Block } from '../storage/modelo.ts'
import { Boton } from '../ui/Boton.tsx'
import { descargar, nombreDeArchivo } from '../ui/descargar.ts'
import { nombreVisible } from './nombreVisible.ts'

const t = textos.compartir

/** Sobre este largo, algunas aplicaciones de mensajes podrían cortar el enlace. */
const ENLACE_LARGO = 8000

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Navegadores antiguos: copiar desde un cuadro de texto temporal.
    const cuadro = document.createElement('textarea')
    cuadro.value = texto
    cuadro.setAttribute('readonly', '')
    cuadro.style.position = 'fixed'
    cuadro.style.opacity = '0'
    document.body.append(cuadro)
    cuadro.select()
    const copiado = document.execCommand('copy')
    cuadro.remove()
    return copiado
  }
}

interface Props {
  /** La actividad que se comparte, o null si el diálogo está cerrado. */
  bloque: Block | null
  onCerrar: () => void
}

/** Compartir una actividad: copiar un enlace que la lleva completa, o descargarla en un archivo. */
export function DialogoCompartir({ bloque, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const [enlace, setEnlace] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const abierto = bloque !== null

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // Lo que va en el enlace; el enlace se rehace solo si esto cambia.
  const contenido = bloque
    ? JSON.stringify({ type: bloque.type, title: bloque.title, texto: bloque.texto ?? '', config: bloque.config })
    : null
  useEffect(() => {
    if (!contenido) return
    let vigente = true
    codificar(JSON.parse(contenido)).then((datos) => {
      if (!vigente) return
      setEnlace(`${location.origin}${location.pathname}${hashDe({ pantalla: 'recibir', datos })}`)
      setAviso('')
    })
    return () => {
      vigente = false
      setEnlace(null)
    }
  }, [contenido])

  const nombre = bloque ? nombreVisible(bloque) : ''
  const puedeEnviar = typeof navigator.share === 'function'

  async function copiarEnlace() {
    if (!enlace) return
    setAviso((await copiar(enlace)) ? t.copiado : t.noSePudoCopiar)
  }

  function enviar() {
    if (!enlace) return
    navigator.share({ title: nombre, text: t.mensaje(nombre), url: enlace }).catch(() => undefined)
  }

  function descargarArchivo() {
    if (!bloque) return
    descargar(textos.respaldo.nombreArchivo(nombreDeArchivo(nombre)), paraArchivo([bloque]))
    setAviso(textos.respaldo.descargado)
  }

  return (
    <dialog
      ref={ref}
      className="dialogo dialogo-compartir"
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        onCerrar()
      }}
    >
      <h2 id={idTitulo}>{t.titulo(nombre)}</h2>
      <p>{t.explicacion}</p>
      <p className="dialogo-compartir__nota">{t.privacidad}</p>
      {enlace && enlace.length > ENLACE_LARGO && <p className="dialogo-compartir__nota">{t.enlaceLargo}</p>}
      <div className="dialogo__acciones dialogo-compartir__acciones">
        <Boton
          variante="principal"
          className="dialogo-compartir__ancho"
          onClick={() => void copiarEnlace()}
          disabled={!enlace}
          autoFocus
        >
          {enlace ? t.copiarEnlace : t.preparando}
        </Boton>
        {puedeEnviar && (
          <Boton variante="herramienta" className="dialogo-compartir__corto" onClick={enviar} disabled={!enlace}>
            {t.enviar}
          </Boton>
        )}
        <Boton variante="herramienta" className="dialogo-compartir__ancho" onClick={descargarArchivo}>
          {t.descargarArchivo}
        </Boton>
        <Boton variante="navegacion" className="dialogo-compartir__corto" onClick={onCerrar}>
          {t.cerrar}
        </Boton>
      </div>
      <p className="dialogo-compartir__aviso" role="status">
        {aviso}
      </p>
    </dialog>
  )
}
