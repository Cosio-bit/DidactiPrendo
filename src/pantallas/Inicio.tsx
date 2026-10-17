import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { Boton } from '../ui/Boton.tsx'
import { crearActividad } from './crearActividad.ts'

export function Inicio() {
  return (
    <section className="inicio">
      <div className="inicio__cabecera">
        <div className="inicio__presentacion">
          <h1 tabIndex={-1}>
            {textos.inicio.saludoInicio}
            <span className="crayon">{textos.inicio.saludoDestacado}</span>
          </h1>
          <p className="inicio__descripcion">{textos.inicio.descripcion}</p>
        </div>
        <figure className="marca-completa">
          <img src="/logo-grande.png" alt="" width={120} height={120} />
          <figcaption>
            <span className="marca-completa__nombre">{textos.app.nombre}</span>
            <span className="marca-completa__eslogan">{textos.app.eslogan}</span>
          </figcaption>
        </figure>
      </div>
      <div className="inicio__acciones">
        <Boton variante="principal" grande onClick={() => void crearActividad()}>
          {textos.inicio.crearActividad}
        </Boton>
        <Boton variante="navegacion" grande onClick={() => irA({ pantalla: 'mis-actividades' })}>
          {textos.inicio.misActividades}
        </Boton>
      </div>
      <section className="inicio__pasos" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="ceja">
          {textos.inicio.comoFunciona}
        </h2>
        <ol>
          {textos.inicio.pasos.map((paso) => (
            <li key={paso}>{paso}</li>
          ))}
        </ol>
      </section>
    </section>
  )
}
