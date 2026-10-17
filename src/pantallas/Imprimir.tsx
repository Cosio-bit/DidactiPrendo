import { useId, useState } from 'react'
import { esListaDePreguntas, letrasParaTarjetas } from '../blocks/preguntas/logica.ts'
import { PreguntasEnPapel, Tarjetas } from '../blocks/preguntas/Impresion.tsx'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { nombreVisible } from './nombreVisible.ts'

type QueImprimir = 'tarjetas' | 'preguntas'

const t = textos.imprimir

export function Imprimir({ id }: { id: string }) {
  const bloque = useConsulta(() => almacen.obtener(id), id)
  const [que, setQue] = useState<QueImprimir>('tarjetas')
  const grupo = useId()

  const encabezado = <h1 tabIndex={-1}>{t.titulo}</h1>
  if (!bloque.listo) return <section>{encabezado}</section>

  const b = bloque.valor
  if (!b || b.type !== 'preguntas' || !esListaDePreguntas(b.items) || b.items.length === 0) {
    return (
      <section className="imprimir">
        {encabezado}
        <p>{b ? textos.proyeccion.sinPreguntas : textos.editor.noEncontrada}</p>
      </section>
    )
  }
  const preguntas = b.items

  return (
    <section className="imprimir">
      <div className="imprimir__opciones no-imprimir">
        <div className="editor__cabecera">
          {encabezado}
          <div className="editor__acciones">
            <Boton onClick={() => irA({ pantalla: 'editor', id })}>{t.volver}</Boton>
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
              {opcion === 'tarjetas' ? t.tarjetas : t.preguntas}
            </label>
          ))}
        </fieldset>
        <p className="nota">{que === 'tarjetas' ? t.explicacionTarjetas : t.explicacionPreguntas}</p>
      </div>

      <div className="hojas">
        {que === 'tarjetas' ? (
          <Tarjetas letras={letrasParaTarjetas(preguntas)} />
        ) : (
          <PreguntasEnPapel titulo={nombreVisible(b)} preguntas={preguntas} />
        )}
      </div>
    </section>
  )
}
