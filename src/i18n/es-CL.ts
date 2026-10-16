// Todos los textos visibles de la aplicación. Nunca escribirlos directo en los componentes.
export const textos = {
  app: {
    nombre: 'DidactiPrendo',
    volverAlInicio: 'Volver al inicio',
    altoContraste: 'Alto contraste',
  },
  inicio: {
    saludo: 'Hola, profe',
    crearActividad: 'Crear actividad',
    misActividades: 'Mis actividades',
  },
  misActividades: {
    titulo: 'Mis actividades',
    cargando: 'Cargando tus actividades…',
    vacio: 'Todavía no tienes actividades guardadas.',
    abrir: 'Abrir',
    borrar: 'Borrar',
    modificada: (fecha: string) => `Modificada el ${fecha}`,
  },
  editor: {
    titulo: 'Tu actividad',
    nombre: 'Nombre de la actividad',
    nombrePorDefecto: 'Actividad sin nombre',
    proximamente: 'Pronto podrás pegar aquí tu lista o tus preguntas.',
    listo: 'Listo',
    cargando: 'Abriendo la actividad…',
    noEncontrada: 'Esta actividad ya no existe. Puede que la hayas borrado.',
  },
  confirmarBorrado: {
    titulo: '¿Borrar esta actividad?',
    mensaje: (nombre: string) =>
      `Se borrará «${nombre}». Si te equivocas, puedes recuperarla con «Deshacer» mientras no cierres la página.`,
    confirmar: 'Sí, borrar',
    cancelar: 'Cancelar',
  },
  avisos: {
    inicial: 'Todo se guarda solo, en este computador.',
    guardado: 'Guardado',
    borrada: (nombre: string) => `Se borró «${nombre}»`,
    deshacer: 'Deshacer',
    deshecho: (descripcion: string) => `Se deshizo: ${descripcion}`,
    errorGuardar: 'No se pudo guardar. No cierres la página e inténtalo de nuevo.',
    errorDeshacer: 'No se pudo deshacer. Inténtalo de nuevo.',
  },
  acciones: {
    cambioNombre: 'cambio de nombre',
    borrado: (nombre: string) => `borrado de «${nombre}»`,
  },
} as const
