import type { ReactNode } from 'react'
import { TIPOS_CON_TEXTO } from '../blocks/catalogo.ts'
import { IconoTipo } from '../blocks/IconoTipo.tsx'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { Boton } from '../ui/Boton.tsx'
import { BotonCargarMaterial } from './BotonCargarMaterial.tsx'
import { crearActividad } from './crearActividad.ts'

/** Dibujos de 24×24 de los tres pasos, en dos tonos como los de cada tipo de actividad. */
const DIBUJOS_PASOS: { relleno: ReactNode; trazo: ReactNode }[] = [
  // Una hoja con texto.
  {
    relleno: <rect x="4" y="4" width="16" height="18" rx="2" />,
    trazo: (
      <>
        <rect x="4" y="4" width="16" height="18" rx="2" />
        <rect x="8.5" y="2" width="7" height="4" rx="1" fill="currentColor" />
        <path d="M8 11h8M8 15h8M8 19h5" />
      </>
    ),
  },
  // Cuatro opciones, una elegida.
  {
    relleno: <rect x="13" y="13" width="8" height="8" rx="1.5" />,
    trazo: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
        <path d="M15 17l1.5 1.5 3-3" />
      </>
    ),
  },
  // Un telón de proyección.
  {
    relleno: <rect x="2" y="3" width="20" height="13" rx="1.5" />,
    trazo: (
      <>
        <rect x="2" y="3" width="20" height="13" rx="1.5" />
        <path d="M12 16v4M8 21h8" />
        <path d="M10 7v5l4.5-2.5z" fill="currentColor" />
      </>
    ),
  },
]

function DibujoPaso({ n }: { n: number }) {
  const { relleno, trazo } = DIBUJOS_PASOS[n]
  return (
    <svg className="inicio__paso-dibujo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="currentColor" fillOpacity="0.22">
        {relleno}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {trazo}
      </g>
    </svg>
  )
}

export function Inicio() {
  return (
    <section className="inicio">
      <div className="inicio__presentacion">
        <h1 tabIndex={-1}>
          {textos.inicio.saludoInicio}
          <span className="crayon">{textos.inicio.saludoDestacado}</span>
        </h1>
        <p className="inicio__descripcion">{textos.inicio.descripcion}</p>
      </div>
      {/* Antes de los botones: en pocos segundos se entiende qué se hace y en qué orden. */}
      <section className="inicio__pasos" aria-labelledby="como-funciona">
        <h2 id="como-funciona">{textos.inicio.comoFunciona}</h2>
        <ol>
          {textos.inicio.pasos.map((paso, i) => (
            <li key={paso.titulo} className={`inicio__paso inicio__paso--${i + 1}`}>
              <DibujoPaso n={i} />
              <span>
                <strong className="inicio__paso-titulo">
                  <span className="inicio__paso-numero">{i + 1}</span> {paso.titulo}
                </strong>
                <span className="inicio__paso-detalle">{paso.detalle}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <div className="inicio__acciones">
        <Boton variante="principal" grande onClick={() => void crearActividad()}>
          {textos.inicio.crearActividad}
        </Boton>
        <Boton variante="navegacion" grande onClick={() => irA({ pantalla: 'mis-actividades' })}>
          {textos.inicio.misActividades}
        </Boton>
      </div>
      {/* Para quien no tiene el texto escrito: la IA elige la actividad y la llena. */}
      <section className="zona-ia" aria-labelledby="crear-con-ia">
        <div>
          <h2 id="crear-con-ia" className="zona-cargar__titulo">
            {textos.inicio.iaTitulo}
          </h2>
          <p className="zona-cargar__ayuda">{textos.inicio.iaAyuda}</p>
        </div>
        <Boton variante="navegacion" onClick={() => irA({ pantalla: 'crear-con-ia' })}>
          {textos.inicio.crearConIA}
        </Boton>
      </section>
      {/* Las siete actividades con su dibujo y para qué sirven; cada una abre el editor con ella elegida. */}
      <section className="inicio__tipos" aria-labelledby="que-crear">
        <div>
          <h2 id="que-crear">{textos.inicio.queCrear}</h2>
          <p className="inicio__descripcion">{textos.inicio.queCrearAyuda}</p>
        </div>
        <ul>
          {TIPOS_CON_TEXTO.map((tipo) => (
            <li key={tipo}>
              <button
                type="button"
                className="tipo-inicio"
                style={{ borderColor: `var(--tipo-${tipo})` }}
                onClick={() => void crearActividad(tipo)}
              >
                <IconoTipo tipo={tipo} className="tipo-inicio__icono" />
                <span>
                  <span className="tipo-inicio__nombre">{textos.tipos[tipo]}</span>
                  <span className="tipo-inicio__uso">{textos.inicio.usos[tipo]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {/* Para quien recibió o descargó un archivo de actividades: arrastrarlo o buscarlo. */}
      <section className="zona-cargar" aria-labelledby="cargar-material">
        <div>
          <h2 id="cargar-material" className="zona-cargar__titulo">
            {textos.inicio.cargarTitulo}
          </h2>
          <p className="zona-cargar__ayuda">{textos.inicio.cargarAyuda}</p>
        </div>
        <BotonCargarMaterial />
      </section>
      {/* El logo completo, con el eslogan, al pie: arriba ya está en la cabecera. */}
      <footer className="marca-completa">
        <img src="/logo-grande.png" alt="" width={96} height={96} />
        <span className="marca-completa__nombre">{textos.app.nombre}</span>
        <span className="marca-completa__eslogan">{textos.app.eslogan}</span>
      </footer>
    </section>
  )
}
