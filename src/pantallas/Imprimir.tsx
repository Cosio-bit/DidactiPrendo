import { useId, useState } from 'react'
import { esListaDePreguntas, letrasParaTarjetas } from '../blocks/preguntas/logica.ts'
import { PreguntasEnPapel, Tarjetas } from '../blocks/preguntas/Impresion.tsx'
import { comoPreguntas, esListaDeAfirmaciones, LETRAS_VF } from '../blocks/preguntas/verdaderoFalso.ts'
import type { Pregunta } from '../parser/tipos.ts'
import type { Block } from '../storage/modelo.ts'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { nombreVisible } from './nombreVisible.ts'

type QueImprimir = 'tarjetas' | 'preguntas'

const t = textos.imprimir

/** Lo imprimible de la actividad: Selección múltiple, o Verdadero o falso como preguntas de V y F. */
function imprimible(b: Block): { preguntas: Pregunta[]; letras: string[]; verdaderoFalso: boolean } | null {
  if (b.type === 'preguntas' && esListaDePreguntas(b.items) && b.items.length > 0) {
    return { preguntas: b.items, letras: letrasParaTarjetas(b.items), verdaderoFalso: false }
  }
  if (b.type === 'verdadero-falso' && esListaDeAfirmaciones(b.items) && b.items.length > 0) {
    // Dos juegos de V y F por hoja.
    return { preguntas: comoPreguntas(b.items), letras: [...LETRAS_VF, ...LETRAS_VF], verdaderoFalso: true }
  }
  return null
}

export function Imprimir({ id }: { id: string }) {
  const bloque = useConsulta(() => almacen.obtener(id), id)
  const [que, setQue] = useState<QueImprimir>('tarjetas')
  const grupo = useId()

  const encabezado = <h1 tabIndex={-1}>{t.titulo}</h1>
  if (!bloque.listo) return <section>{encabezado}</section>

  const b = bloque.valor
  const datos = b ? imprimible(b) : null
  if (!b || !datos) {
    return (
      <section className="imprimir">
        {encabezado}
        <p>{b ? textos.proyeccion.sinPreguntas : textos.editor.noEncontrada}</p>
      </section>
    )
  }
  const { preguntas, letras, verdaderoFalso } = datos

  return (
    <section className="imprimir">
      <div className="imprimir__opciones no-imprimir">
        <div className="editor__cabecera">
          {encabezado}
          <div className="editor__acciones">
            <Boton variante="navegacion" onClick={() => irA({ pantalla: 'editor', id })}>{t.volver}</Boton>
            <Boton variante="principal" onClick={() => window.print()}>
              {t.imprimir}
            </Boton>
          </div>
        </div>
        <fieldset className="selector-tipo selector-tipo--fila">
          <legend>{t.queImprimir}</legend>
          {(['tarjetas', 'preguntas'] as const).map((opcion) => (
            <label
              key={opcion}
              className={
                que === opcion ? 'selector-tipo__opcion selector-tipo__opcion--elegida' : 'selector-tipo__opcion'
              }
            >
              <input type="radio" name={grupo} checked={que === opcion} onChange={() => setQue(opcion)} />
              {opcion === 'tarjetas'
                ? verdaderoFalso
                  ? t.tarjetasVF
                  : t.tarjetas
                : verdaderoFalso
                  ? t.afirmaciones
                  : t.preguntas}
            </label>
          ))}
        </fieldset>
        <p className="nota">
          {que === 'tarjetas'
            ? verdaderoFalso
              ? t.explicacionTarjetasVF
              : t.explicacionTarjetas
            : t.explicacionPreguntas}
        </p>
      </div>

      <div className="hojas">
        {que === 'tarjetas' ? (
          <Tarjetas letras={letras} />
        ) : (
          <PreguntasEnPapel titulo={nombreVisible(b)} preguntas={preguntas} verdaderoFalso={verdaderoFalso} />
        )}
      </div>
    </section>
  )
}
