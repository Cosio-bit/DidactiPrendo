// Todos los textos visibles de la aplicación. Nunca escribirlos directo en los componentes.

type TipoConTexto =
  | 'ruleta'
  | 'preguntas'
  | 'parejas'
  | 'terminos-pareados'
  | 'verdadero-falso'
  | 'ordenar'
  | 'clasificar'
  | 'tarjetas'
  | 'completar'
  | 'rosco'
  | 'quien-soy'

/** "a", "a y b", "a, b y c" */
function enumerar(cosas: string[]): string {
  if (cosas.length <= 1) return cosas.join('')
  return `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}`
}

/** «texto», recortado si es muy largo; muestra hasta 3 y cuenta el resto. */
function citar(textos: string[]): string {
  const recortar = (t: string) => (t.length > 50 ? `${t.slice(0, 49)}…` : t)
  const citas = textos.slice(0, 3).map((t) => `«${recortar(t)}»`)
  if (textos.length > 3) citas.push(`${textos.length - 3} más`)
  return enumerar(citas)
}

/** "La pregunta 2" / "Las preguntas 1 y 4", con el verbo en singular o plural. */
function preguntasN(numeros: number[], singular: string, plural: string): string {
  return numeros.length === 1
    ? `La pregunta ${numeros[0]} ${singular}`
    : `Las preguntas ${enumerar(numeros.map(String))} ${plural}`
}

export const textos = {
  app: {
    nombre: 'DidactiPrendo',
    eslogan: 'Así de fácil, enseño y aprendo',
    volverAlInicio: 'Volver al inicio',
    inicio: 'Inicio',
    altoContraste: 'Alto contraste',
  },
  inicio: {
    saludo: 'Hola, profe',
    /** El saludo en dos partes, para marcar "profe" con crayón. */
    saludoInicio: 'Hola, ',
    saludoDestacado: 'profe',
    descripcion: 'Convierte tus listas y preguntas en actividades para proyectar en la sala.',
    comoFunciona: 'Así funciona',
    /** Los mismos nombres de los pasos del editor, para que el profe los reconozca al crear. */
    pasos: [
      { titulo: 'Pega tu texto', detalle: 'De Word, Excel o ChatGPT' },
      { titulo: 'Elige la actividad', detalle: 'Ruleta, memorice y más' },
      { titulo: 'Proyecta', detalle: 'Y juega con el curso' },
    ],
    crearActividad: 'Crear actividad',
    misActividades: 'Mis actividades',
    queCrear: '¿Qué puedes crear?',
    queCrearAyuda: 'Toca una para empezar con ella.',
    /** Para qué sirve cada actividad, con lo que el profe ya tiene a mano. */
    usos: {
      ruleta: 'Sortea nombres de la lista del curso',
      preguntas: 'Las preguntas de tu prueba, con alternativas',
      parejas: 'Memorice: voltear cartas y encontrar parejas',
      'terminos-pareados': 'Unir cada concepto con su definición',
      'verdadero-falso': 'Afirmaciones para responder V o F',
      ordenar: 'Pasos o fechas para poner en orden',
      clasificar: 'Elementos para separar en grupos',
      tarjetas: 'Preguntas o palabras para voltear de a una',
      completar: 'Frases con las palabras que faltan',
      rosco: 'Una definición por cada letra',
      'quien-soy': 'Pistas de a una para adivinar',
    } satisfies Record<TipoConTexto, string>,
    iaTitulo: '¿No tienes el texto listo?',
    iaAyuda: 'Sube tu guía o cuéntale a la IA qué quieres repasar. Ella te propone juegos y los llena por ti.',
    crearConIA: 'Crear con IA',
    cargarTitulo: '¿Te pasaron un archivo de actividades?',
    cargarAyuda: 'Arrástralo a esta página o búscalo en tu computador.',
  },
  /** Pedirle a la IA que elija y llene la actividad. */
  crearConIA: {
    titulo: 'Crear con IA',
    explicacion:
      'Sube tu guía o material, o cuéntale a la IA qué quieres repasar. Ella entiende de qué se trata y te propone juegos para tu curso.',
    material: 'Tu guía o material (opcional)',
    subirMaterial: 'Subir guía o material',
    subirAyuda: 'Un PDF, Word, PowerPoint o una foto de la guía. También puedes arrastrar el archivo a esta página.',
    leyendoMaterial: 'Leyendo el archivo…',
    materialCargado: {
      pdf: 'PDF',
      imagen: 'Foto',
      texto: (palabras: number) => `Texto de ${palabras.toLocaleString('es-CL')} ${palabras === 1 ? 'palabra' : 'palabras'}`,
    },
    quitarMaterial: 'Quitar archivo',
    cambiarMaterial: 'Cambiar archivo',
    erroresMaterial: {
      formato: 'Ese tipo de archivo no se puede leer. Sube un PDF, un Word (.docx), un PowerPoint (.pptx) o una foto.',
      antiguo:
        'Ese archivo es de un formato antiguo. Ábrelo y guárdalo como PDF (Archivo → Guardar como → PDF), y súbelo de nuevo.',
      pesado:
        'El archivo es muy grande (más de 3 MB o unas 30 páginas de texto). Sube solo las páginas que necesitas o pega el texto de la guía.',
      vacio: 'El archivo no trae texto. Si es una guía escaneada, súbela como foto o PDF.',
      danado: 'No se pudo abrir el archivo. Puede estar dañado: ábrelo, guárdalo de nuevo y vuelve a subirlo.',
    },
    pegarGuia: 'O pega el texto de tu guía',
    agregarTexto: 'Agregar texto pegado',
    pedido: '¿Qué actividad quieres?',
    pedidoConGuia: '¿Qué quieres que practiquen? (opcional)',
    pedidoConGuiaAyuda: 'Si no escribes nada, la IA te propone juegos a partir de tu guía.',
    pedidoConGuiaEjemplo: 'Por ejemplo: que reconozcan cada parte de la noticia y para qué sirve. Es para 6° básico.',
    pedidoEjemplo:
      'Por ejemplo: términos pareados con los conceptos del género narrativo, para 6° básico. O: una actividad para recordar las partes de una noticia.',
    agregarGuia: 'Agregar el texto de una guía (opcional)',
    guia: 'Texto de tu guía o material',
    guiaAyuda: 'Copia el texto de tu guía (de Word, PDF o Docs) y pégalo aquí. La IA armará las actividades con ese contenido.',
    quitarGuia: 'Quitar la guía',
    codigo: 'Código de acceso',
    codigoAyuda: 'Lo encuentras en el mensaje con que te invitaron a probar la app.',
    crear: 'Crear con IA',
    proponer: 'Proponer actividades',
    esperando: 'Armando tu actividad… Puede tardar hasta un minuto.',
    esperandoGuia: 'Leyendo tu guía y armando actividades… Puede tardar hasta un minuto.',
    privacidad:
      'Tu pedido y tu guía o material se envían a Claude, la IA de Anthropic, para armar las actividades. No se guardan. No incluyas nombres de estudiantes.',
    entendido: 'Esto entendí de tu guía',
    revisa: 'La IA puede equivocarse: revisa el contenido antes de proyectar.',
    propuestas: (n: number) => (n === 1 ? 'La IA te propone esta actividad' : `La IA te propone ${n} actividades`),
    porQue: 'Por qué:',
    usar: 'Usar esta actividad',
    guardarTodas: (n: number) => `Guardar las ${n} en Mis actividades`,
    guardadas: (n: number) => (n === 1 ? 'Se guardó 1 actividad en Mis actividades' : `Se guardaron ${n} actividades en Mis actividades`),
    noSirve: 'Esta no quedó bien armada. Pide de nuevo o usa otra.',
    nada: 'La IA no armó ninguna actividad. Prueba escribiendo el pedido de otra forma.',
    ningunaSirve: '¿Ninguna te sirve?',
    ningunaSirveAyuda: 'Puedes pedir otras. Cuéntale a la IA a qué apuntas o qué tipo de actividad quieres, y no repetirá las que ya viste.',
    pedirOtras: 'Pedir otras propuestas',
    comentario: 'Cuéntale a la IA qué buscas',
    comentarioAyuda:
      'Di a qué apuntas o qué debe hacer el curso, con tus palabras. Mientras más claro, mejor resultado.',
    comentarioEjemplo:
      'Por ejemplo: quiero que identifiquen cada parte en una noticia de verdad. O: algo más fácil, para 5° básico.',
    tiposQueQuieres: '¿Qué tipo de actividad quieres? (opcional)',
    faltaComentario: 'Escribe qué buscas o elige al menos un tipo de actividad.',
    cancelar: 'Cancelar',
    intento: (n: number) => `Propuestas, intento ${n}`,
    errores: {
      pedido: 'Escribe qué actividad quieres o sube tu guía (el pedido, hasta 1.500 letras; la guía, unas 30 páginas).',
      pesado: 'El archivo es muy grande para enviarlo. Sube solo las páginas que necesitas o pega el texto de la guía.',
      codigo: 'El código de acceso no es correcto. Revísalo y vuelve a intentar.',
      'sin-configurar': 'La IA todavía no está configurada en esta página. Avísale a quien administra la app.',
      clave: 'La clave de la IA no está bien configurada. Avísale a quien administra la app.',
      'sin-creditos': 'Se acabó el saldo para usar la IA. Avísale a quien administra la app.',
      ocupado: 'La IA está ocupada. Espera un minuto y vuelve a intentar.',
      rechazo: 'La IA no pudo responder ese pedido. Prueba escribiéndolo de otra forma.',
      falla: 'No se pudo crear la actividad. Vuelve a intentar en un momento.',
      'sin-internet': 'Necesitas internet para crear con IA. Todo lo demás funciona sin conexión.',
      'no-disponible': 'Crear con IA no está disponible en esta versión de la página.',
    },
  },
  misActividades: {
    titulo: 'Mis actividades',
    cargando: 'Cargando tus actividades…',
    vacio: 'Todavía no tienes actividades guardadas.',
    editar: 'Editar',
    proyectar: 'Proyectar',
    borrar: 'Borrar',
    modificada: (fecha: string) => `Modificada ${fecha}`,
    hoy: 'hoy',
    ayer: 'ayer',
    elDia: (fecha: string) => `el ${fecha}`,
  },
  /** Compartir una actividad por enlace o archivo. */
  compartir: {
    boton: 'Compartir',
    titulo: (nombre: string) => `Compartir «${nombre}»`,
    explicacion: 'Copia el enlace y envíalo por WhatsApp o correo. Quien lo abra podrá guardar y proyectar la actividad, sin crear cuenta.',
    privacidad: 'La actividad va dentro del enlace, sin pasar por servidores de DidactiPrendo. Ojo si tiene nombres de estudiantes.',
    preparando: 'Preparando el enlace…',
    copiarEnlace: 'Copiar enlace',
    copiado: 'Enlace copiado. Ahora pégalo en el mensaje.',
    noSePudoCopiar: 'No se pudo copiar el enlace. Descarga el archivo y envíalo.',
    enviar: 'Enviar…',
    mensaje: (nombre: string) => `Te comparto la actividad «${nombre}» de DidactiPrendo:`,
    descargarArchivo: 'Descargar archivo',
    enlaceLargo: 'Este enlace es largo. Si al abrirlo no funciona, mejor envía el archivo.',
    cerrar: 'Cerrar',
  },
  /** Descargar las actividades en un archivo y traerlas de vuelta (o a otro computador). */
  respaldo: {
    descargarTodas: 'Descargar todas en un archivo',
    cargarMaterial: 'Cargar material',
    ayuda:
      'Para guardar una copia o pasar tus actividades a otro computador. Para cargarlas, también puedes arrastrar el archivo a esta página.',
    soltarAqui: 'Suelta el archivo aquí para cargar tus actividades',
    soltarGuia: 'Suelta aquí tu guía o material',
    nombreArchivoTodas: (fecha: string) => `actividades-didactiprendo-${fecha}.json`,
    nombreArchivo: (nombre: string) => `${nombre}.json`,
    descargado: 'Archivo descargado. Lo encuentras en la carpeta Descargas.',
    agregadas: (n: number, yaEstaban: number) =>
      (n === 1 ? 'Se agregó 1 actividad desde el archivo.' : `Se agregaron ${n} actividades desde el archivo.`) +
      (yaEstaban === 0 ? '' : yaEstaban === 1 ? ' 1 ya estaba.' : ` ${yaEstaban} ya estaban.`),
    yaEstaban: 'Esas actividades ya estaban en Mis actividades.',
    archivoVacio: 'Ese archivo no trae actividades.',
    archivoInvalido: 'Ese archivo no es de DidactiPrendo o está dañado.',
  },
  /** Pantalla que se abre con un enlace compartido. */
  recibir: {
    titulo: 'Te compartieron una actividad',
    cargando: 'Abriendo la actividad…',
    guardarYProyectar: 'Guardar y proyectar',
    guardar: 'Guardar en Mis actividades',
    noGuardar: 'No guardar',
    yaLaTienes: 'Ya tienes esta actividad en Mis actividades.',
    guardada: (nombre: string) => `Se guardó «${nombre}» en Mis actividades`,
    danado:
      'Este enlace no se pudo abrir. Puede que se haya cortado al copiarlo: pide que te lo envíen de nuevo o que te manden el archivo.',
    navegadorAntiguo: 'Este navegador es muy antiguo para abrir el enlace. Actualiza Chrome o pide que te manden el archivo.',
  },
  tipos: {
    ruleta: 'Ruleta',
    preguntas: 'Selección múltiple',
    parejas: 'Parejas',
    'terminos-pareados': 'Términos pareados',
    'verdadero-falso': 'Verdadero o falso',
    ordenar: 'Ordenar',
    clasificar: 'Clasificar',
    tarjetas: 'Tarjetas',
    completar: 'Completar la frase',
    rosco: 'Rosco de letras',
    'quien-soy': '¿Quién soy?',
    marcador: 'Marcador',
    temporizador: 'Temporizador',
  },
  editor: {
    titulo: 'Tu actividad',
    nombre: 'Nombre de la actividad',
    nombrePorDefecto: 'Actividad sin nombre',
    pegaTuTexto: 'Pega tu texto aquí',
    porEjemplo: (ejemplo: string) => `Por ejemplo:\n${ejemplo}`,
    pasos: {
      nombre: 'Pasos para crear la actividad',
      /** En los botones de arriba (cortos) y en el título del paso (largos). */
      cortos: ['Texto', 'Actividad', 'Proyectar'],
      largos: ['Pega tu texto', 'Elige la actividad', 'Proyecta'],
      titulo: (n: number, total: number, paso: string) => `Paso ${n} de ${total}: ${paso}`,
      siguiente: 'Siguiente →',
      atras: '← Atrás',
      escribeParaSeguir: 'Pega o escribe tu texto para seguir.',
    },
    comoEscribirlo: 'Cómo escribirlo',
    probarEjemplo: 'Probar con este ejemplo',
    ejemplos: {
      ruleta: 'Ana\nBenjamín\nCatalina\nDiego',
      preguntas: '¿Cuánto es 1/2 + 1/4?\na) 2/6\n*b) 3/4\nc) 1/8',
      parejas: 'perro = dog\ngato = cat\ncasa = house',
      'terminos-pareados':
        'Texto narrativo | Relata hechos reales o imaginarios\nTexto informativo | Entrega datos sobre un tema\nTexto argumentativo | Defiende una opinión con razones',
      'verdadero-falso': 'La ballena es un mamífero (V)\nEl Sol es un planeta (F)',
      ordenar: 'Semilla\nGerminación\nPlanta\nFlor\nFruto',
      clasificar: 'Mamíferos: perro, ballena, puma\nAves: cóndor, loica, pingüino',
      tarjetas: '¿Capital de Chile? = Santiago\nperro = dog\n7 × 8 = 56',
      completar: 'La [fotosíntesis] ocurre en las [hojas] de la planta.\nEl agua hierve a los [100] grados.',
      rosco: 'A: Insecto que hace miel = abeja\nB: Mamífero marino más grande = ballena\nC: Ave nacional de Chile = cóndor',
      'quien-soy':
        "Bernardo O'Higgins\nNací en Chillán.\nFui Director Supremo de Chile.\nMi padre fue virrey del Perú.\n\nGabriela Mistral\nFui profesora en el norte y en el sur.\nGané el Premio Nobel de Literatura.",
    },
    comoEscribir: {
      ruleta: 'Un elemento por línea: nombres del curso, temas, preguntas para conversar.',
      preguntas: 'La pregunta y debajo sus alternativas a), b), c). Pon un * antes de la correcta.',
      parejas: 'Una pareja por línea, separada por =. También sirven dos columnas copiadas de Word o Excel.',
      'terminos-pareados':
        'Un concepto y su definición por línea, separados por | o =. También sirve una tabla de dos columnas copiada de Docs, Word, Excel o ChatGPT.',
      'verdadero-falso': 'Una afirmación por línea, con (V) o (F) al final.',
      ordenar: 'Un elemento por línea, en el orden correcto. Al proyectar aparecen desordenados.',
      clasificar: 'Cada categoría con dos puntos y sus elementos separados por comas.',
      tarjetas: 'Una tarjeta por línea: lo de adelante, un signo =, y lo de atrás. Al proyectar se ven de a una y se voltean.',
      completar: 'Una frase por línea. Pon entre corchetes [ ] las palabras que el curso debe completar.',
      rosco: 'Una letra por línea: la letra con dos puntos, la definición, un signo = y la palabra.',
      'quien-soy':
        'La respuesta en la primera línea y debajo las pistas, de la más difícil a la más fácil. Deja una línea vacía entre una adivinanza y otra.',
    },
    listo: 'Listo',
    proyectar: 'Proyectar',
    imprimir: 'Imprimir',
    cargando: 'Abriendo la actividad…',
    noEncontrada: 'Esta actividad ya no existe. Puede que la hayas borrado.',
  },
  ruleta: {
    opciones: 'Opciones de la ruleta',
    eliminarAlSalir: 'Sacar de la ruleta lo que sale',
    sonido: 'Sonido al girar',
  },
  tarjetas: {
    opciones: 'Opciones de las tarjetas',
    mezclar: 'Mostrar las tarjetas en desorden',
  },
  completar: {
    opciones: 'Opciones de completar la frase',
    banco: 'Mostrar abajo las palabras que faltan',
  },
  imprimir: {
    titulo: 'Imprimir',
    volver: 'Volver a la actividad',
    imprimir: 'Imprimir',
    queImprimir: '¿Qué quieres imprimir?',
    tarjetas: 'Tarjetas A, B, C, D',
    tarjetasVF: 'Tarjetas V y F',
    preguntas: 'Las preguntas en papel',
    afirmaciones: 'Las afirmaciones en papel',
    explicacionTarjetasVF:
      'Dos juegos de tarjetas V y F por hoja para recortar. Cada estudiante (o equipo) levanta la que elige.',
    instruccionVF: 'Escribe V si la afirmación es verdadera o F si es falsa.',
    explicacionTarjetas:
      'Cuatro tarjetas por hoja para recortar. Cada estudiante (o equipo) levanta la letra que elige. Sirven para cualquier repaso.',
    explicacionPreguntas:
      'Sin las respuestas, por si no hay proyector. La pauta con las respuestas sale en una hoja aparte.',
    nombreYCurso: 'Nombre: ______________________________   Curso: ________',
    instruccion: 'Encierra en un círculo la letra de la alternativa correcta.',
    pauta: (titulo: string) => `Pauta: ${titulo}`,
    sinMarcar: '(sin respuesta marcada)',
  },
  preguntas: {
    opciones: 'Opciones de las preguntas',
    temporizador: 'Tiempo para responder',
    sinTiempo: 'Sin tiempo',
    segundos: (s: number) => (s < 60 ? `${s} segundos` : s === 60 ? '1 minuto' : s % 60 === 0 ? `${s / 60} minutos` : `${Math.floor(s / 60)} min ${s % 60} s`),
    sonido: 'Sonido al acabarse el tiempo',
  },
  proyeccion: {
    girar: 'Girar',
    pantallaCompleta: 'Pantalla completa',
    salirPantallaCompleta: 'Salir de pantalla completa',
    /** El botón de salir dice adónde lleva, para que nadie dude cómo volver. */
    volverA: {
      'mis-actividades': 'Volver a Mis actividades',
      editor: 'Volver a editar',
    },
    volverAEmpezar: 'Volver a empezar',
    ruletaInicio: 'Presiona Girar',
    ruletaDescripcion: (n: number) => `Ruleta con ${n} ${n === 1 ? 'elemento' : 'elementos'}`,
    salio: (elemento: string) => `Salió: ${elemento}`,
    quedan: (n: number, total: number) => `Quedan ${n} de ${total}`,
    enLaRuleta: (n: number) => `${n} en la ruleta`,
    todosSalieron: 'Ya salieron todos.',
    teclasRuleta: 'Espacio: girar · Esc: volver',
    ruletaPocosElementos: 'La ruleta necesita al menos 2 elementos. Sal y agrega más en tu actividad.',
    tipoNoDisponible: 'Este tipo de actividad todavía no se puede proyectar.',
    sinPreguntas: 'Esta actividad no tiene preguntas con alternativas. Sal y revisa el texto.',
    numeroPregunta: (n: number, total: number) => `Pregunta ${n} de ${total}`,
    numeroAfirmacion: (n: number, total: number) => `Afirmación ${n} de ${total}`,
    parejasEncontradas: (n: number, total: number) => `Parejas: ${n} de ${total}`,
    memoriceInicio: 'Elijan dos cartas',
    esPareja: '¡Son pareja!',
    noEsPareja: 'No son pareja',
    memoriceTerminado: '¡Encontraron todas!',
    cartaTapada: (n: number) => `Carta ${n}, tapada`,
    tapar: 'Tapar',
    mostrarTodas: 'Mostrar todas',
    teclasParejas: 'Flechas: moverse · Espacio o Enter: voltear · Esc: volver',
    sinParejas: 'Esta actividad no tiene parejas. Sal y revisa el texto.',
    enSuLugar: (n: number, total: number) => `${n} de ${total} en su lugar`,
    ordenTerminado: '¡Quedó ordenado!',
    ordenCorrecto: 'Orden',
    porOrdenar: 'Por ordenar',
    noVaEnLugar: (n: number) => `No va en el ${n}`,
    lugarBoton: (n: number) => `Lugar ${n}`,
    deshacerPaso: '← Deshacer',
    revelarSiguiente: 'Mostrar el que sigue',
    teclasOrdenar: 'Arrastra o toca cada elemento y luego su lugar · Espacio: el que sigue · ←: deshacer · Esc: volver',
    elegirLugar: 'Ahora toca su lugar en el orden (o presiona su número). Esc para soltarlo',
    sinElementosOrdenar: 'Esta actividad necesita al menos 2 elementos para ordenar. Sal y revisa el texto.',
    unidos: (n: number, total: number) => `${n} de ${total} unidos`,
    pareadosTerminado: '¡Todo unido!',
    noEsSuDefinicion: 'No es su definición',
    columnaConceptos: 'Conceptos',
    columnaDefiniciones: 'Definiciones',
    teclasPareados: 'Toca un concepto y luego su definición, o arrástralo · Espacio: el que sigue · ←: deshacer · Esc: volver',
    elegirDefinicion: 'Ahora toca su definición (o presiona Esc para soltarlo)',
    elegirConcepto: 'Ahora toca su concepto (o presiona Esc para soltarla)',
    sinTerminos: 'Esta actividad necesita al menos 2 conceptos con su definición. Sal y revisa el texto.',
    ubicados: (n: number, total: number) => `${n} de ${total} clasificados`,
    clasificacionTerminada: '¡Todo clasificado!',
    categoriaBoton: (n: number, nombre: string) => `${n}: ${nombre}`,
    noVaEn: (categoria: string) => `No va en «${categoria}»`,
    ubicarSiguiente: 'Mostrar dónde va',
    elegirCategoria: 'Ahora toca su categoría (o presiona su número). Esc para soltarlo',
    teclasClasificar: 'Arrastra o toca cada elemento y luego su categoría · Espacio: mostrar dónde va · ←: deshacer · Esc: volver',
    sinCategorias: 'Esta actividad necesita al menos 2 categorías con elementos. Sal y revisa el texto.',
    teclasVF: 'Espacio: revelar y avanzar · ←: anterior · Esc: volver',
    teclasVFConTiempo: 'Espacio: revelar y avanzar · ←: anterior · P: pausar · Esc: volver',
    sinAfirmaciones: 'Esta actividad no tiene afirmaciones. Sal y revisa el texto.',
    sinEnunciado: '(Pregunta sin enunciado)',
    correcta: 'Correcta',
    paraComentar: 'Para comentar',
    revelar: 'Revelar respuesta',
    siguiente: 'Siguiente →',
    anterior: '← Anterior',
    terminar: 'Terminar',
    comentarError: 'Comentar el error',
    quitarComentario: 'Quitar comentario',
    elegirError: 'Toca la alternativa incorrecta para comentarla, o presiona su letra.',
    sinRespuestaMarcada: 'Esta pregunta no tiene la respuesta correcta marcada.',
    pausar: 'Pausar',
    seguir: 'Seguir',
    seAcaboElTiempo: '¡Tiempo!',
    repasoTerminado: 'Fin del repaso',
    terminaste: '¡Terminaron el repaso!',
    teclasPreguntas: 'Espacio: revelar y avanzar · ←: anterior · A a E: comentar el error · Esc: volver',
    teclasPreguntasConTiempo:
      'Espacio: revelar y avanzar · ←: anterior · A a E: comentar el error · P: pausar · Esc: volver',
    numeroTarjeta: (n: number, total: number) => `Tarjeta ${n} de ${total}`,
    voltear: 'Voltear',
    tarjetaAdelante: (texto: string) => `Adelante: ${texto}. Toca para voltear`,
    tarjetaAtras: (texto: string) => `Atrás: ${texto}. Toca para voltear`,
    tarjetasTerminadas: '¡Terminaron las tarjetas!',
    teclasTarjetas: 'Espacio: voltear y avanzar · ←: anterior · Esc: volver',
    sinTarjetas: 'Esta actividad no tiene tarjetas. Sal y revisa el texto.',
    numeroFrase: (n: number, total: number) => `Frase ${n} de ${total}`,
    palabraOculta: (n: number) => `Palabra ${n}, oculta. Toca para mostrarla`,
    palabraVisible: (n: number, palabra: string) => `Palabra ${n}: ${palabra}. Toca para ocultarla`,
    palabrasQueFaltan: 'Palabras que faltan',
    mostrarPalabra: 'Mostrar la palabra que sigue',
    mostrarTodasLasPalabras: 'Mostrar todas',
    frasesTerminadas: '¡Completaron todas las frases!',
    teclasCompletar: 'Espacio: mostrar la palabra que sigue y avanzar · 1 a 9: mostrar esa palabra · ←: anterior · Esc: volver',
    sinFrases: 'Esta actividad no tiene palabras para completar. Sal y revisa el texto.',
    empiezaCon: (letra: string) => `Empieza con ${letra}`,
    contieneLa: (letra: string) => `Contiene la ${letra}`,
    aciertos: (n: number) => `${n} ${n === 1 ? 'acierto' : 'aciertos'}`,
    errores: (n: number) => `${n} ${n === 1 ? 'error' : 'errores'}`,
    porResponder: (n: number) => `${n} por responder`,
    correctaBoton: '✓ Correcta',
    incorrectaBoton: '✗ Incorrecta',
    pasar: 'Pasar',
    respuestaCorrecta: (palabra: string) => `✓ ${palabra}`,
    respuestaIncorrecta: (palabra: string) => `✗ Era: ${palabra}`,
    letraDelRosco: (letra: string, estado: 'pendiente' | 'acierto' | 'error') =>
      `${letra}: ${estado === 'acierto' ? 'acierto' : estado === 'error' ? 'error' : 'por responder'}`,
    rosco: 'Rosco',
    roscoTerminado: '¡Terminó el rosco!',
    teclasRosco: 'C: correcta · I: incorrecta · Espacio: pasar y avanzar · ←: deshacer · Esc: volver',
    sinDefiniciones: 'Esta actividad no tiene definiciones para el rosco. Sal y revisa el texto.',
    numeroAdivinanza: (n: number, total: number) => `Adivinanza ${n} de ${total}`,
    pistaDe: (n: number, total: number) => `Pista ${n} de ${total}`,
    otraPista: 'Mostrar otra pista',
    respuestaEra: 'La respuesta:',
    adivinanzasTerminadas: '¡Terminaron las adivinanzas!',
    teclasQuienSoy: 'Espacio: otra pista, revelar y avanzar · ←: anterior · Esc: volver',
    sinAdivinanzas: 'Esta actividad no tiene adivinanzas con pistas. Sal y revisa el texto.',
  },
  /** Marcador por equipos y temporizador: acompañan a cualquier actividad proyectada. */
  herramientas: {
    marcador: 'Marcador',
    temporizador: 'Temporizador',
    /** Nombre de cada color del marcador, en el orden de la paleta. Es también el nombre inicial del equipo. */
    colores: ['Azul', 'Naranjo', 'Verde', 'Rosado', 'Amarillo', 'Celeste', 'Rojo', 'Negro'],
    regionMarcador: 'Marcador por equipos',
    puntos: (n: number) => `${n} ${n === 1 ? 'punto' : 'puntos'}`,
    sumarPunto: (equipo: string) => `Un punto más para ${equipo}`,
    restarPunto: (equipo: string) => `Un punto menos para ${equipo}`,
    editarEquipos: 'Editar equipos',
    tituloEquipos: 'Equipos',
    ayudaEquipos: 'Los equipos y sus puntos quedan guardados en este computador para la próxima actividad.',
    nombreEquipo: (n: number) => `Nombre del equipo ${n}`,
    cambiarColor: (color: string) => `Cambiar color (ahora ${color.toLowerCase()})`,
    quitar: 'Quitar',
    quitarEquipo: (equipo: string) => `Quitar el equipo ${equipo}`,
    agregarEquipo: 'Agregar equipo',
    maximoEquipos: (n: number) => `Hasta ${n} equipos.`,
    reiniciarPuntos: 'Dejar los puntos en 0',
    confirmarReinicio: {
      titulo: '¿Dejar los puntos en 0?',
      mensaje: 'Todos los equipos vuelven a 0 puntos. Los nombres y colores se mantienen.',
      confirmar: 'Sí, dejar en 0',
      cancelar: 'No, mantener los puntos',
    },
    listo: 'Listo',
    regionTemporizador: 'Temporizador',
    menosMinuto: '−1 min',
    masMinuto: '+1 min',
    menosMinutoDescripcion: 'Un minuto menos',
    masMinutoDescripcion: 'Un minuto más',
    iniciar: 'Iniciar',
    pausar: 'Pausar',
    seguir: 'Seguir',
    reiniciar: 'Reiniciar',
    seAcabo: '¡Se acabó el tiempo!',
  },
  vistaPrevia: {
    titulo: 'Así quedará',
    tipo: 'Tipo de actividad',
    sugerido: 'sugerido',
    revisa: 'Revisa esto',
    correcta: 'correcta',
    cantidad: (tipo: TipoConTexto, n: number) => {
      const [singular, plural] = {
        ruleta: ['elemento', 'elementos'],
        ordenar: ['elemento', 'elementos'],
        preguntas: ['pregunta', 'preguntas'],
        parejas: ['pareja', 'parejas'],
        'terminos-pareados': ['concepto', 'conceptos'],
        'verdadero-falso': ['afirmación', 'afirmaciones'],
        clasificar: ['categoría', 'categorías'],
        tarjetas: ['tarjeta', 'tarjetas'],
        completar: ['frase', 'frases'],
        rosco: ['letra', 'letras'],
        'quien-soy': ['adivinanza', 'adivinanzas'],
      }[tipo]
      return `${n} ${n === 1 ? singular : plural}`
    },
    verdadero: 'Verdadero',
    falso: 'Falso',
    sinMarcar: 'sin marcar',
    respuesta: 'Respuesta',
    empiezaCon: (letra: string) => `Empieza con ${letra}`,
    contieneLa: (letra: string) => `Contiene la ${letra}`,
    paso: (n: number) => `${n}.`,
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
    cambioTexto: 'cambio de texto',
    cambioTipo: 'cambio de tipo de actividad',
    cambioOpciones: 'cambio de opciones',
    borrado: (nombre: string) => `borrado de «${nombre}»`,
    importacion: 'actividades traídas del archivo',
    creadasConIA: 'actividades creadas con IA',
  },
  lector: {
    sinElementos: 'No encontramos nada para usar. Escribe o pega un elemento por línea.',
    sinPreguntas:
      'No encontramos preguntas con alternativas. Escribe la pregunta y, debajo, sus alternativas a), b), c), con * antes de la correcta.',
    lineasIgnoradasLista: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque parece un título o un comentario: ${citar(lineas)}.`
        : `No usamos estas líneas porque parecen títulos o comentarios: ${citar(lineas)}.`,
    lineasIgnoradasPreguntas: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no es parte de una pregunta con alternativas: ${citar(lineas)}.`
        : `No usamos estas líneas porque no son parte de una pregunta con alternativas: ${citar(lineas)}.`,
    separadoPorComas: 'Separamos el texto en las comas. Si no era una lista, escribe un elemento por línea.',
    repetidos: (elementos: string[]) =>
      elementos.length === 1
        ? `${citar(elementos)} aparece más de una vez. No lo borramos, por si es a propósito.`
        : `${citar(elementos)} aparecen más de una vez. No los borramos, por si es a propósito.`,
    pocosElementos: 'La ruleta necesita al menos 2 elementos.',
    demasiadosElementos: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} elementos. La ruleta se lee bien con ${maximo} como máximo.`,
    sinEnunciado: (numeros: number[]) =>
      `${preguntasN(numeros, 'no tiene', 'no tienen')} enunciado. Escribe la pregunta en la línea de arriba de las alternativas.`,
    sinCorrecta: (numeros: number[]) =>
      `${preguntasN(numeros, 'no tiene', 'no tienen')} la respuesta correcta marcada. Pon un * antes de la correcta, por ejemplo: *b) 3/4`,
    variasCorrectas: (numeros: number[]) =>
      `${preguntasN(numeros, 'tiene', 'tienen')} más de una alternativa marcada como correcta.`,
    pocasAlternativas: (numeros: number[]) =>
      `${preguntasN(numeros, 'tiene', 'tienen')} una sola alternativa. Agrega al menos otra.`,
    lineasSinPareja: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no encontramos su pareja: ${citar(lineas)}. Escribe las dos partes separadas por =, por ejemplo: perro = dog.`
        : `No usamos estas líneas porque no encontramos su pareja: ${citar(lineas)}. Escribe las dos partes separadas por =, por ejemplo: perro = dog.`,
    sinParejas: 'Para el memorice se necesitan al menos 2 parejas. Escribe una por línea, separadas por =, por ejemplo: perro = dog.',
    demasiadasParejas: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} parejas. El memorice se lee bien con ${maximo} como máximo.`,
    sinTerminos:
      'Para unir conceptos se necesitan al menos 2. Escribe un concepto y su definición por línea, separados por |, por ejemplo: Sustantivo | Palabra que nombra.',
    demasiadosTerminos: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} conceptos. Para unirlos en la sala se leen bien ${maximo} como máximo.`,
    sinAfirmaciones: 'No encontramos afirmaciones. Escribe una por línea con (V) o (F) al final.',
    sinRespuesta: (numeros: number[]) =>
      numeros.length === 1
        ? `La afirmación ${numeros[0]} no dice si es verdadera o falsa. Agrega (V) o (F) al final.`
        : `Las afirmaciones ${enumerar(numeros.map(String))} no dicen si son verdaderas o falsas. Agrega (V) o (F) al final.`,
    ordenadoPorNumero: 'Los ordenamos según los números que traían.',
    pocosParaOrdenar: (minimo: number) => `Para ordenar se necesitan al menos ${minimo} elementos.`,
    demasiadosParaOrdenar: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} elementos. Para ordenar en la sala se leen bien ${maximo} como máximo.`,
    lineasSinCategoria: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no está bajo ninguna categoría: ${citar(lineas)}.`
        : `No usamos estas líneas porque no están bajo ninguna categoría: ${citar(lineas)}.`,
    pocasCategorias:
      'Para clasificar se necesitan al menos 2 categorías con elementos. Escribe cada categoría con dos puntos, por ejemplo: Mamíferos: perro, ballena.',
    categoriasVacias: (nombres: string[]) =>
      nombres.length === 1
        ? `La categoría ${citar(nombres)} no tiene elementos.`
        : `Las categorías ${citar(nombres)} no tienen elementos.`,
    enDosCategorias: (elementos: string[]) =>
      elementos.length === 1
        ? `${citar(elementos)} está en más de una categoría.`
        : `${citar(elementos)} están en más de una categoría.`,
    demasiadasCategorias: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} categorías. Se ven bien en la sala ${maximo} como máximo.`,
    textosLargos: (largos: string[]) =>
      largos.length === 1
        ? `Este texto es largo y en la sala se verá con letra más chica: ${citar(largos)}. Si puedes, acórtalo.`
        : `Estos textos son largos y en la sala se verán con letra más chica: ${citar(largos)}. Si puedes, acórtalos.`,
    lineasSinReverso: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no tiene lo de atrás: ${citar(lineas)}. Escribe las dos caras separadas por =, por ejemplo: perro = dog.`
        : `No usamos estas líneas porque no tienen lo de atrás: ${citar(lineas)}. Escribe las dos caras separadas por =, por ejemplo: perro = dog.`,
    sinTarjetas: 'Escribe una tarjeta por línea: lo de adelante, un signo = y lo de atrás. Por ejemplo: perro = dog.',
    lineasSinPalabras: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no tiene palabras entre corchetes: ${citar(lineas)}.`
        : `No usamos estas líneas porque no tienen palabras entre corchetes: ${citar(lineas)}.`,
    sinFrases:
      'No encontramos palabras para completar. Pon entre corchetes las que faltan, por ejemplo: La [fotosíntesis] ocurre en las [hojas].',
    lineasSinDefinicion: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no encontramos la definición y la palabra: ${citar(lineas)}. Sepáralas con =, por ejemplo: A: Insecto que hace miel = abeja.`
        : `No usamos estas líneas porque no encontramos la definición y la palabra: ${citar(lineas)}. Sepáralas con =, por ejemplo: A: Insecto que hace miel = abeja.`,
    sinDefiniciones:
      'No encontramos definiciones para el rosco. Escribe una por línea: la letra, la definición, un signo = y la palabra. Por ejemplo: A: Insecto que hace miel = abeja.',
    letraNoCalza: (casos: string[]) =>
      casos.length === 1
        ? `La palabra no tiene su letra: ${citar(casos)}. Revisa la letra o la palabra.`
        : `Estas palabras no tienen su letra: ${citar(casos)}. Revisa la letra o la palabra.`,
    letrasRepetidas: (letras: string[]) =>
      letras.length === 1
        ? `La letra ${letras[0]} tiene más de una palabra. En el rosco aparecerá dos veces.`
        : `Las letras ${enumerar(letras)} tienen más de una palabra. En el rosco aparecerán repetidas.`,
    demasiadasDefiniciones: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} definiciones. En el rosco se leen bien ${maximo} como máximo.`,
    sinAdivinanzas:
      'No encontramos adivinanzas. Escribe la respuesta en la primera línea y debajo sus pistas. Deja una línea vacía entre una adivinanza y otra.',
    sinPistas: (respuestas: string[]) =>
      respuestas.length === 1
        ? `${citar(respuestas)} no tiene pistas. Escríbelas arriba de la respuesta.`
        : `${citar(respuestas)} no tienen pistas. Escríbelas arriba de la respuesta.`,
    demasiadasPistas: (respuestas: string[], maximo: number) =>
      `${citar(respuestas)} ${respuestas.length === 1 ? 'tiene' : 'tienen'} más de ${maximo} pistas. En la sala se leen bien ${maximo} como máximo.`,
    preguntasRepetidas: (numeros: number[]) =>
      `${preguntasN(numeros, 'aparece', 'aparecen')} más de una vez. No las borramos, por si es a propósito.`,
  },
} as const
