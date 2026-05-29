/* =============================================================
 * PRECISSA INSTITUTE · Datos de los cursos
 * -------------------------------------------------------------
 * Este archivo es la "base de datos" de los cursos mientras
 * no haya backend. Para añadir o modificar un curso:
 *
 *   1. Genera tus slides con Claude Design Slides como HTML.
 *   2. Crea una carpeta en   assets/cursos/<id-del-curso>/
 *      Dentro, una subcarpeta por lección:
 *        leccion-1/index.html
 *        leccion-2/index.html
 *        ...
 *   3. Añade o edita el curso en el array PRECISSA_COURSES con
 *      sus lecciones apuntando a esos index.html, y su test
 *      (preguntas + respuesta correcta).
 *   4. Haz commit + push. GitHub Pages publica al momento.
 *
 * Campos de cada curso:
 *   id              identificador único (slug, sin espacios)
 *   title           título visible
 *   category        clave de categoría (ver PRECISSA_CATEGORIES)
 *   eyebrow         pequeña etiqueta superior (ej. "Electroestética · Nivel inicial")
 *   level           texto de nivel (opcional)
 *   duration        duración total estimada (opcional)
 *   cover           ruta a la imagen de portada (opcional)
 *   shortDescription una línea para la card
 *   description     descripción larga
 *   sourceDoc       (opcional) ruta al .md fuente del temario completo
 *   lessons[]       lista de lecciones; cada una:
 *                     - id, title, duration, slides (ruta al HTML)
 *   test            { questions: [{ q, options: [...], correct: idx }, ...] }
 *
 * Quién tiene acceso a qué curso se gestiona FUERA de este
 * archivo, en una Google Sheet (assets/js/enrollments.js sabe
 * la URL). Aquí solo defines los cursos y su contenido.
 * ============================================================= */

// ─── CATEGORÍAS ─────────────────────────────────────────
// El orden de este array es el orden visual en el catálogo.
window.PRECISSA_CATEGORIES = [
  {
    id: 'estetica-facial-avanzada',
    label: 'Estética Facial Avanzada',
    tagline: 'Dermocosmiatría, cosmetología y servicios de cabina facial.'
  },
  {
    id: 'electroestetica',
    label: 'Electroestética',
    tagline: 'Aparatología facial y corporal · luz, energía y mecánica controlada.'
  },
  {
    id: 'micropigmentacion',
    label: 'Micropigmentación',
    tagline: 'Pigmentación profesional de cejas, labios y eyeliner.'
  },
  {
    id: 'corporal-bienestar',
    label: 'Corporal y Bienestar',
    tagline: 'Técnicas manuales y combinadas de modelado, drenaje y relajación.'
  }
];

// ─── CURSOS ─────────────────────────────────────────────
window.PRECISSA_COURSES = [

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA · ESTÉTICA FACIAL AVANZADA
  // ═══════════════════════════════════════════════════════

  {
    id: 'higiene-facial-profunda',
    title: 'Higiene Facial Profunda',
    category: 'estetica-facial-avanzada',
    eyebrow: 'Dermocosmiatría · Grado profesional · 5 módulos',
    level: 'Inicial → Avanzado',
    duration: '80 h · grado completo',
    cover: 'assets/higiene-facial-profunda.jpg',
    shortDescription: 'Grado completo en higiene facial profunda. Cinco módulos: activos, peelings, antiacné, despigmentantes y rejuvenecimiento facial avanzado.',
    description: 'El grado bandera de PRECISSA en estética facial. Cubre la asignatura transversal PIEL y cinco módulos clínicos: dermocosmética y principios activos (vitamina C, niacinamida, péptidos, retinoides, AHA/BHA); peelings químicos por profundidad (superficiales, medios y derivación de profundos); tratamientos antiacné con el límite estética/dermatología bien dibujado; tratamientos despigmentantes con diagnóstico diferencial entre melasma, PIH, lentigos y nevus; y rejuvenecimiento facial avanzado por décadas. Cierra con tres casos clínicos integrados que combinan varios módulos y test final discriminativo.',
    sourceDoc: 'docs/cursos/14-higiene-facial-profunda.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'anatomia-fisiologia-cutanea',
    title: 'Anatomía y fisiología cutánea',
    category: 'estetica-facial-avanzada',
    eyebrow: 'Asignatura transversal · Acceso de muestra',
    level: 'Inicial',
    duration: '5 h',
    cover: 'assets/anatomia-fisiologia-cutanea.jpg',
    shortDescription: 'Cómo funciona la piel y por qué responde como responde a cada estímulo. Asignatura transversal y demostración visual de la metodología.',
    description: 'Curso base para entender la piel como órgano: estructura, capas, anejos cutáneos, biotipos y comportamiento ante los estímulos del tratamiento. Asignatura transversal a todos los cursos faciales del catálogo. Sirve también como muestra pública del estilo de docencia PRECISSA: parallax 3D, materia densa y visualización editorial.',
    lessons: [
      {
        id: 'leccion-1',
        title: 'La piel · Introducción',
        duration: '18 min',
        slides: 'leccion-integrada'
      }
    ],
    test: {
      questions: [
        { q: '¿Cuántas capas principales tiene la piel?',
          options: ['2', '3', '4', '5'],
          correct: 1 },
        { q: '¿Cuál es la capa más superficial de la piel?',
          options: ['Dermis', 'Hipodermis', 'Epidermis', 'Tejido subcutáneo'],
          correct: 2 },
        { q: 'El ciclo de renovación celular de la epidermis dura aproximadamente:',
          options: ['7 días', '28 días', '60 días', '90 días'],
          correct: 1 }
      ]
    }
  },
  {
    id: 'pestanas-lifting-tinte',
    title: 'Lifting + tinte de pestañas',
    category: 'estetica-facial-avanzada',
    eyebrow: 'Servicio rápido · Alta rentabilidad de cabina',
    level: 'Inicial',
    duration: '12 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Curvado permanente de pestañas naturales combinado con tinte profesional. Uno de los servicios más rentables de la cabina de cejas y pestañas.',
    description: 'Lifting de pestañas con química redox controlada (tioglicolato + neutralizador + queratina) y tinte específico para pestañas. Cubre ciclo folicular, selección de pad por morfología (S/M/L/XL), tiempos por tipo de pelo (pestaña asiática, rubia, gruesa), aftercare estricto y manejo de complicaciones (quemadura química, irritación ocular, alergia al tinte). Resultado: 6-8 semanas. Sin extensiones.',
    sourceDoc: 'docs/cursos/19-pestanas-lifting-tinte.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'pestanas-extensiones',
    title: 'Extensiones de pestañas',
    category: 'estetica-facial-avanzada',
    eyebrow: 'Pelo a pelo · Volumen ruso · Mega-volumen',
    level: 'Intermedio → Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Pelo a pelo, volumen ruso 2D-6D, mega-volumen e híbrido. Mapping por forma de ojo. Aviso clínico sobre alergia al cianoacrilato.',
    description: 'Formación técnica de cabina premium. Cubre las cuatro técnicas (clásica, volumen ruso, mega-volumen, híbrido), química del cianoacrilato y sus condiciones de fragüe, biomecánica del peso sobre la pestaña natural, mapping por morfología ocular (almendrado, redondo, caído, asiático monolid, ojos juntos/separados), aftercare estricto y manejo de complicaciones — sobre todo alergia al adhesivo, stickies y alopecia traccional.',
    sourceDoc: 'docs/cursos/20-pestanas-extensiones.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'cejas-diseno-visajismo',
    title: 'Diseño de cejas · Visajismo aplicado',
    category: 'estetica-facial-avanzada',
    eyebrow: 'De la depilación al diseño consciente',
    level: 'Inicial',
    duration: '16 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Análisis facial, regla de los 3 puntos, proporción áurea, ceja correctora por forma de rostro. Cinco técnicas físicas de modelado.',
    description: 'El curso que convierte la "depilación de cejas" en consulta estética premium. Cubre formas faciales clásicas (ovalada, redonda, cuadrada, rectangular, triángulo invertido, diamante, pera) con su tipo de ceja correctora; regla de los 3 puntos para mapeo universal; golden ratio para asimetrías; cinco técnicas de modelado (hilo, cera caliente, sugaring, pinzas, navaja). Casos prácticos sobre sobre-depilación de los 90s, cejas asimétricas y rostros cuadrados.',
    sourceDoc: 'docs/cursos/21-cejas-diseno-visajismo.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'cejas-laminado-henna',
    title: 'Laminado + henna de cejas',
    category: 'estetica-facial-avanzada',
    eyebrow: 'Servicio express · Efecto natural duradero',
    level: 'Inicial',
    duration: '12 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Brow lamination + henna de cejas. Efecto "Instagram brows" natural y duradero. Alternativa no permanente a la micropigmentación.',
    description: 'Servicio de cabina muy demandado. Cubre laminado (química del tioglicolato, doce fases del protocolo, tiempos por tipo de pelo, riesgo de quemadura química) y henna profesional con lawsona (pigmenta pelo y piel, alternativa natural a la micropigmentación, advertencia taxativa sobre la henna negra con PPD). Protocolo combinado laminado + henna + diseño. Manejo de cinco complicaciones.',
    sourceDoc: 'docs/cursos/22-cejas-laminado-henna.md',
    lessons: [],
    test: { questions: [] }
  },

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA · ELECTROESTÉTICA
  // ═══════════════════════════════════════════════════════

  {
    id: 'plasma-pen',
    title: 'Plasmapen',
    category: 'electroestetica',
    eyebrow: 'Sublimación con plasma frío atmosférico · Nivel profesional',
    level: 'Profesional / Avanzado',
    duration: '40 h · 18 h teoría + 22 h prácticas',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Sublimación epidérmica controlada con plasma frío atmosférico: indicaciones reales, riesgos honestos y protocolo profesional.',
    description: 'Formación completa en Plasmapen para la profesional de estética avanzada. Cubre fundamentos físicos del plasma frío, mecanismo histológico, indicaciones evidence-based, contraindicaciones por fototipo y comorbilidad, protocolo técnico paso a paso por zona anatómica, cosmetología pre y post (regeneradores, despigmentantes, fotoprotección), manejo de complicaciones —en especial hiperpigmentación post-inflamatoria— y diagnóstico diferencial de lesiones cutáneas. Incluye casos clínicos comentados, scripts de comunicación con la paciente y troubleshooting técnico.',
    sourceDoc: 'docs/cursos/01-plasma-pen.md',
    lessons: [
      {
        id: 'leccion-1',
        title: 'Plasmapen · Curso completo',
        duration: '~60 min de lectura',
        slides: 'assets/cursos/plasma-pen/leccion-1/index.html'
      }
    ],
    test: {
      questions: [
        { q: '¿Cuál es la profundidad habitual de la sublimación inducida por plasmapen en condiciones normales de uso?',
          options: ['5-10 µm, solo estrato córneo', '40-150 µm, epidermis hasta unión dermo-epidérmica', '500 µm, dermis reticular', '1-2 mm, hipodermis'],
          correct: 1 },
        { q: '¿Cuál de estos es el riesgo MÁS frecuente en piel Fitzpatrick V tratada con plasmapen?',
          options: ['Cicatriz queloidea', 'Infección bacteriana', 'Hiperpigmentación post-inflamatoria', 'Hipopigmentación permanente'],
          correct: 2 },
        { q: '¿Qué ingrediente está contraindicado las primeras 2-4 semanas post-tratamiento?',
          options: ['Pantenol al 5%', 'Tretinoína', 'Centella asiática', 'Ácido hialurónico libre'],
          correct: 1 },
        { q: '¿Cuál es el intervalo mínimo recomendado entre dos sesiones de plasmapen en la misma zona?',
          options: ['1 semana', '3-4 semanas', '8-12 semanas', '6 meses'],
          correct: 2 },
        { q: 'Ante un fibroma blando de 2 mm en cuello con base pediculada en una paciente Fitzpatrick III sin antecedentes relevantes, ¿qué procede?',
          options: ['Tratar en la misma consulta de valoración tras consentimiento verbal', 'Tratar tras consentimiento informado escrito, intensidad media-baja, sesión única', 'Derivar siempre a cirugía menor por riesgo de cicatriz', 'Aplicar 3 sesiones espaciadas para minimizar riesgo'],
          correct: 1 },
        { q: '¿Cuál de estas situaciones obliga a NO tratar o derivar al médico antes de cualquier intervención?',
          options: ['Paciente con Fitzpatrick II y arrugas periorbitarias estáticas', 'Paciente con fibroma blando estable de varios años', 'Lesión pigmentada de bordes irregulares, asimétrica, de aparición reciente', 'Paciente con dermatocalasia leve del párpado superior'],
          correct: 2 },
        { q: 'Una paciente acude al día 5 post-tratamiento con eritema que se extiende más allá de la zona tratada, dolor creciente y sensación de calor local. ¿Qué procede?',
          options: ['Aumentar la frecuencia de aplicación del regenerador y citar en 1 semana', 'Aplicar corticoide tópico de potencia media', 'Derivar al médico con sospecha de infección', 'Iniciar despigmentantes tópicos preventivos'],
          correct: 2 },
        { q: 'Durante una sesión sobre lentigos en dorso de mano de una paciente Fitzpatrick II, en uno de los puntos aparece sangrado puntiforme tras el impacto del arco. ¿Cuál es la conducta correcta?',
          options: ['Continuar la sesión con la misma intensidad para mantener la uniformidad del patrón', 'Repasar inmediatamente el punto sangrante para coagularlo', 'Detener la pasada en esa zona, limpiar con suero, documentar la incidencia y reducir intensidad en la próxima sesión', 'Aplicar corticoide tópico en ese punto y continuar el resto del tratamiento'],
          correct: 2 }
      ]
    }
  },
  {
    id: 'hyaluron-pen',
    title: 'Hyaluron Pen',
    category: 'electroestetica',
    eyebrow: 'Hialurónico sin aguja · Nivel avanzado',
    level: 'Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Inyección de ácido hialurónico sin aguja mediante presión hidráulica. Indicaciones realistas y advertencias clínicas honestas.',
    description: 'Técnica polémica que requiere formación rigurosa. Cubre fundamentos físicos de la presión hidráulica, profundidad de deposición real, evidencia disponible y sus límites, marco regulatorio en la UE (categoría aparatológica vs acto sanitario), indicaciones cosméticas legítimas y las que NO deben hacerse desde estética (rellenos profundos faciales, surcos nasogenianos, ojeras). Manejo de complicaciones —granuloma, embolia accidental, asimetría— y derivación.',
    sourceDoc: 'docs/cursos/02-hyaluron-pen.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'dermapen-microneedling',
    title: 'Dermapen · Microneedling profesional',
    category: 'electroestetica',
    eyebrow: 'Inducción de colágeno · Nivel intermedio',
    level: 'Intermedio',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Microagujas motorizadas para inducción de colágeno: cicatrices, textura, poros, rejuvenecimiento. Profundidad por zona e indicación.',
    description: 'Microneedling con dermógrafo motorizado. Cubre fisiología de la inducción de colágeno por trauma controlado, profundidad por zona y objetivo (0.25 mm cosmético, 0.5-1 mm rejuvenecimiento, 1.5-2.5 mm cicatrices), asepsia rigurosa y materiales single-use, fototipos altos con cautela, combinación con activos topical (NUNCA vitamina C alta o retinoides el día del tratamiento), aftercare estricto y manejo de complicaciones (PIH, granuloma por penetración de cosméticos no aptos, infección).',
    sourceDoc: 'docs/cursos/03-dermapen-microneedling.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'vacuum-cavitacion-radiofrecuencia',
    title: 'Vacuum · Cavitación · Radiofrecuencia corporal',
    category: 'electroestetica',
    eyebrow: 'Trío aparatológico corporal · Nivel intermedio',
    level: 'Intermedio',
    duration: '40 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Tres tecnologías combinadas en un mismo protocolo corporal: drenaje mecánico (vacuum), cavitación ultrasónica y radiofrecuencia.',
    description: 'El trío aparatológico más demandado en cabinas corporales. Cubre fundamentos físicos de cada tecnología (presión negativa controlada en vacuum, cavitación inercial ultrasónica para adipocitos, calentamiento dérmico por RF), protocolos combinados por objetivo (adiposidad localizada, celulitis, flacidez corporal), contraindicaciones (marcapasos, embarazo, próximamente cardiovascular), parámetros por equipo y manejo de complicaciones (hematomas, quemaduras superficiales, dolor desproporcionado).',
    sourceDoc: 'docs/cursos/04-vacuum-cavitacion-radiofrecuencia.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'diatermia',
    title: 'Diatermia · Radiofrecuencia facial y corporal',
    category: 'electroestetica',
    eyebrow: 'Calentamiento dérmico controlado · Nivel intermedio',
    level: 'Intermedio',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Calentamiento dérmico controlado mediante corrientes de alta frecuencia. Flacidez, lifting facial no invasivo y modelado corporal.',
    description: 'Diatermia capacitiva y resistiva. Cubre fundamentos electromagnéticos, monopolar vs bipolar vs tripolar, calentamiento del colágeno dérmico (40-42 °C, contracción + neocolagénesis), protocolos por zona (frente, mejillas, papada, cuello, abdomen, brazos), parámetros (frecuencia, potencia, tiempo de exposición), monitorización de temperatura, contraindicaciones específicas (implantes metálicos, marcapasos) y manejo de complicaciones (quemadura, dolor desproporcionado).',
    sourceDoc: 'docs/cursos/05-diatermia.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'ipl-fotorejuvenecimiento',
    title: 'IPL · Fotorejuvenecimiento y fotodepilación',
    category: 'electroestetica',
    eyebrow: 'Luz pulsada intensa · Nivel avanzado',
    level: 'Avanzado',
    duration: '40 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Luz pulsada intensa para fotoenvejecimiento, lesiones vasculares y fotodepilación. Filtros, ventana terapéutica y selección por fototipo.',
    description: 'IPL no es láser pero exige rigor equivalente. Cubre fundamentos de luz policromática pulsada, filtros (515, 530, 560, 590, 640 nm), ventana terapéutica por cromóforo (melanina, hemoglobina, agua), selección por fototipo Fitzpatrick (NUNCA IV-VI sin máxima precaución), protocolo para fotoenvejecimiento (lentigos, eritema difuso), telangiectasias y rosácea (derivación de fondo), fotodepilación (por qué falla en pelo claro y piel oscura), riesgos críticos (quemadura, hipopigmentación, paradójica reactivación pilosa) y manejo.',
    sourceDoc: 'docs/cursos/06-ipl-fotorejuvenecimiento.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'depilacion-laser',
    title: 'Depilación láser',
    category: 'electroestetica',
    eyebrow: 'Diodo · Alejandrita · Nd:YAG · Nivel avanzado',
    level: 'Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Las tres longitudes de onda profesionales (diodo 810 nm, alejandrita 755 nm, Nd:YAG 1064 nm) y su selección por fototipo y zona.',
    description: 'Depilación láser de cabina profesional. Cubre fundamentos de absorción selectiva por melanina, anatomía del folículo y fases anágena-catágena-telógena (CRÍTICO: solo afecta anágenas), las tres longitudes de onda con sus ventajas e indicaciones (diodo polivalente, alejandrita rápido para fototipos bajos, Nd:YAG seguro para fototipos altos), test patch obligatorio, contraindicaciones (embarazo, tatuajes, melanoma previo, isotretinoína reciente), manejo de complicaciones y mantenimiento.',
    sourceDoc: 'docs/cursos/07-depilacion-laser.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'laser-switched-yag-carbon-peel',
    title: 'Láser Q-switched Nd:YAG · Carbon Peel',
    category: 'electroestetica',
    eyebrow: 'Tatuajes, lentigos y peeling de carbón · Avanzado',
    level: 'Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Eliminación de tatuajes, lentigos pigmentados y peeling de carbón activado. Pulsos nanosegundo, fotofragmentación selectiva.',
    description: 'Láser Q-switched Nd:YAG con pulsos en nanosegundos. Cubre principio de fotofragmentación selectiva (rotura mecánica del pigmento sin daño térmico), eliminación de tatuajes por escalas Kirby-Desai (color, profundidad, antigüedad), tratamiento de lentigos solares y melasma con cautela, carbon peel (peeling con carbón activado activado por láser, efecto exfoliante + foto-rejuvenecedor + bactericida). Riesgos (hipopigmentación, viraje paradójico de tintas).',
    sourceDoc: 'docs/cursos/08-laser-switched-yag-carbon-peel.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'hifu',
    title: 'HIFU · Lifting facial no quirúrgico',
    category: 'electroestetica',
    eyebrow: 'Ultrasonido focalizado de alta intensidad · Premium',
    level: 'Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'HIFU: ultrasonido focalizado a 1.5/3/4.5 mm sobre SMAS. Lifting facial y corporal no quirúrgico con anatomía del nervio facial obligatoria.',
    description: 'HIFU como "lifting médico no quirúrgico" — posicionado honestamente entre radiofrecuencia/hilos y cirugía: NO sustituye al lifting cervicofacial en flacidez severa. Cubre física del ultrasonido focalizado, anatomía clínica del nervio facial con mapa de zonas prohibidas (rama temporal, marginal mandibular, periorbitario), tabla de transductores 1.5/3/4.5 mm faciales y 6/9/13 mm corporales, contraindicaciones (implantes metálicos en zona, marcapasos, embarazo), tres casos clínicos y manejo de complicaciones —especialmente parálisis facial transitoria—.',
    sourceDoc: 'docs/cursos/09-hifu.md',
    lessons: [
      {
        id: 'leccion-1',
        title: 'HIFU · Lifting no quirúrgico',
        duration: '~45 min · 23 diapositivas',
        slides: 'assets/cursos/hifu/leccion-1/index.html'
      }
    ],
    test: {
      questions: [
        { q: 'Para tratar la SMAS facial en una mejilla con buen grosor tisular, la profundidad focal más apropiada es:',
          options: ['1,5 mm', '3,0 mm', '4,5 mm', '6,0 mm'],
          correct: 2 },
        { q: 'Paciente con osteosíntesis maxilofacial con placas de titanio en ángulo mandibular izquierdo solicita HIFU para línea mandibular y papada. Actitud correcta:',
          options: ['Tratar normal · el titanio no interfiere con el ultrasonido', 'Tratar con energía reducida en la zona', 'Considerar implante metálico como contraindicación local · no tratar en zona del implante; valorar resto con consentimiento informado', 'Tratar primero el lado derecho y, si va bien, repetir'],
          correct: 2 },
        { q: 'La "línea de Pitanguy" (entre 0,5 cm por debajo del trago y 1,5-2 cm por encima de la cola de la ceja) corresponde a:',
          options: ['Trayecto superficial de la rama temporal del nervio facial · zona prohibida para disparos profundos con HIFU', 'Línea ideal para colocar líneas con 4,5 mm para máximo lifting', 'Hito anatómico decorativo sin relevancia para HIFU', 'Límite anatómico de la SMAS facial'],
          correct: 0 },
        { q: 'Paciente embarazada de 16 semanas solicita HIFU submentoniano "porque será muy suave". Actitud correcta:',
          options: ['Tratar con energía mínima y solo una zona', 'Esperar al segundo trimestre completo', 'No tratar en absoluto · el embarazo es contraindicación absoluta para HIFU', 'Tratar solo con consentimiento adicional'],
          correct: 2 },
        { q: 'El mecanismo principal por el que HIFU produce tensado facial es:',
          options: ['Quemadura superficial del estrato córneo con descamación', 'Coagulación térmica difusa de la dermis completa', 'Generación de puntos de coagulación térmica (TCP) en planos predeterminados — especialmente SMAS — con contracción inmediata + neocolagénesis diferida', 'Cavitación adipocitaria como única vía de respuesta'],
          correct: 2 },
        { q: 'Paciente acude 48 h después de HIFU facial refiriendo "se le ha torcido la sonrisa" y dificultad para elevar la comisura del labio izquierdo. Actitud correcta:',
          options: ['Tranquilizar y citar para revisión en un mes', 'Reconocer afectación probable de la rama marginal mandibular · derivar a valoración médica (neurología/maxilofacial) sin demora · documentar exhaustivamente · informar honestamente sobre recuperación en semanas-meses', 'Aplicar otra sesión de HIFU compensatoria en el lado contralateral', 'Indicar toxina botulínica en el lado sano para igualar'],
          correct: 1 },
        { q: 'La cronología clínica del resultado óptimo post-HIFU facial se sitúa típicamente en:',
          options: ['24 horas tras la sesión', '2 semanas', '4-6 meses', '24 meses'],
          correct: 2 },
        { q: 'Sobre la diferencia entre HIFU y el lifting quirúrgico cervicofacial:',
          options: ['HIFU es equivalente no invasivo del lifting · resultados comparables', 'HIFU induce contracción y neocolagénesis sobre la SMAS pero NO reposiciona quirúrgicamente los tejidos · en flacidez severa la indicación es cirugía, no HIFU', 'HIFU sustituye totalmente al lifting en pacientes mayores de 60 años', 'El lifting quirúrgico ha quedado obsoleto desde la aparición del HIFU'],
          correct: 1 }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA · MICROPIGMENTACIÓN
  // ═══════════════════════════════════════════════════════

  {
    id: 'microblading-cejas',
    title: 'Microblading de cejas',
    category: 'micropigmentacion',
    eyebrow: 'Pelo a pelo manual con cuchilla · Nivel avanzado',
    level: 'Avanzado',
    duration: '40 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Pigmentación manual de cejas con cuchilla. Diseño visajístico, golden ratio, técnica pelo a pelo y normativa REACH de pigmentos.',
    description: 'Microblading como técnica de diseño + ejecución: el resultado depende 50% del diseño, 50% de la técnica. Cubre anatomía de la ceja, dermis papilar como blanco, química de pigmentos y viraje cromático, normativa REACH 2020/2081 de pigmentos para PMU, selección de blade (configuración U/S/curve), regla de los 3 puntos + golden ratio para mapping, ejecución por sectores con casos clínicos sobre cejas escasas simétricas, asimétricas y con cicatriz post-depilación severa.',
    sourceDoc: 'docs/cursos/15-microblading-cejas.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'micropigmentacion-labios',
    title: 'Micropigmentación de labios',
    category: 'micropigmentacion',
    eyebrow: 'Lip blush · Full lips · Lip liner · Avanzado',
    level: 'Avanzado',
    duration: '40 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Lip blush, full lips y lip liner profesional. Anatomía del bermellón, profilaxis herpética obligatoria y neutralización cromática.',
    description: 'La técnica de PMU más solicitada tras cejas, con la particularidad de trabajar sobre mucosa. Cubre anatomía del labio (mucosa, bermellón, inervación V2/V3, vascularización), química y viraje cromático específico del labio (los pinks viran a violeta — usar tonos cálidos), profilaxis antiviral OBLIGATORIA con valaciclovir en pacientes con historial herpético, tres técnicas (lip blush difuminado, full lips saturado, lip liner perfilado), aftercare estricto y manejo de reactivación herpética, viraje y línea defectuosa.',
    sourceDoc: 'docs/cursos/16-micropigmentacion-labios.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'neutralizacion-labios',
    title: 'Neutralización de labios',
    category: 'micropigmentacion',
    eyebrow: 'Corrección cromática avanzada · Especialista',
    level: 'Especialista',
    duration: '16 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Corrección cromática de labios oscuros nativos y trabajos previos virados a azul/violeta. Teoría del color en PMU aplicada.',
    description: 'Subespecialidad técnica para profesional avanzada de PMU labial. Cubre teoría del color en pigmentos (círculo cromático, complementarios cancelan: naranja→azul, amarillo→violeta), química del viraje labial, diagnóstico cromático bajo luz natural y cálida-fría, protocolo de 3 sesiones (sesión 1 corrector peach/orange, sesión 2 evaluación + color final, sesión 3 retoque), gestión de expectativas (NO blanquea, neutraliza), y derivación a láser Q-switched cuando es necesario.',
    sourceDoc: 'docs/cursos/17-neutralizacion-labios.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'micropigmentacion-eyeliner',
    title: 'Micropigmentación de eyeliner',
    category: 'micropigmentacion',
    eyebrow: 'Lash line · Eyeliner clásico · Winged · Avanzado',
    level: 'Avanzado',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Lash enhancement entre pestañas, eyeliner clásico y winged. Anatomía periorbital, REACH, protocolo seguro junto al ojo.',
    description: 'Técnica delicada por la proximidad ocular. Cubre lash enhancement (efecto pestañas más densas, sin línea visible), eyeliner clásico y con winged, anatomía del borde libre del párpado y línea gris (zona de Meibomio, NO pigmentar), pigmentos ferrosos negros y marrones (REACH restringe coloreados), selección de color por subtono de cabello/piel, técnica con protector ocular interno, eyeliner inferior desaconsejado y manejo de complicaciones (inflamación, difusión perioral, derivación oftalmológica).',
    sourceDoc: 'docs/cursos/18-micropigmentacion-eyeliner.md',
    lessons: [],
    test: { questions: [] }
  },

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA · CORPORAL Y BIENESTAR
  // ═══════════════════════════════════════════════════════

  {
    id: 'drenaje-linfatico',
    title: 'Drenaje linfático manual',
    category: 'corporal-bienestar',
    eyebrow: 'Métodos Vodder y Leduc · Inicial-Intermedio',
    level: 'Inicial → Intermedio',
    duration: '40 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Técnica con base anatómica precisa, no "masaje suave" genérico. Métodos Vodder y Leduc con honestidad clínica.',
    description: 'Drenaje linfático con rigor anatómico. Cubre la red linfática completa (capilares iniciales, colectores con linfangiones, ganglios, watersheds, conducto torácico), fisiología del transporte linfático activo, métodos Vodder (1932) y Leduc con sus maniobras propias, indicaciones estéticas con expectativas realistas (post-quirúrgico estético, post-aparatología, retención de líquidos, celulitis edematosa, ojeras vasculares), protocolos facial 30-45 min y corporal 60-90 min, contraindicaciones absolutas (TVP, IC descompensada).',
    sourceDoc: 'docs/cursos/10-drenaje-linfatico.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'maderoterapia',
    title: 'Maderoterapia',
    category: 'corporal-bienestar',
    eyebrow: 'Masaje corporal con instrumentos · Nivel inicial',
    level: 'Inicial',
    duration: '24 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Masaje corporal con instrumentos de madera (rodillo cubano, copa sueca, hongo, tabla guitarra). Origen colombiano.',
    description: 'Técnica de masaje con auge reciente y claridad sobre evidencia. Cubre instrumental completo (rodillo cubano, copa sueca, hongo, tabla guitarra, paleta tonificadora, rodillo dentado, copa anti-celulitis) con función específica por instrumento, anatomía del tejido adiposo subcutáneo y celulitis, secuencia (calentamiento → drenaje → modelado → reducción → tonificación → enfriamiento), contraindicaciones (embarazo abdomen, varices severas) y manejo de hematomas frecuentes.',
    sourceDoc: 'docs/cursos/11-maderoterapia.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'masaje-reductor-remodelante',
    title: 'Masaje reductor y remodelante',
    category: 'corporal-bienestar',
    eyebrow: 'Dos protocolos diferenciados · Nivel intermedio',
    level: 'Intermedio',
    duration: '32 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Dos protocolos distintos: reductor (reducir adiposidad y celulitis) y remodelante (redefinir contorno, drenar, tonificar).',
    description: 'Diferenciación clara entre reductor (presiones medio-altas, técnicas de movilización tisular) y remodelante (técnicas combinadas, modelado de contorno). Cubre anatomía del tejido adiposo subcutáneo, septos fibrosos y celulitis, maniobras técnicas (amasamiento profundo, palper-rouler, percusión, vaciado vascular), protocolos por objetivo, contraindicaciones, manejo de hematomas y honestidad sobre la limitada eficacia del masaje aislado (necesita combinarse con dieta, ejercicio y aparatología).',
    sourceDoc: 'docs/cursos/12-masaje-reductor-remodelante.md',
    lessons: [],
    test: { questions: [] }
  },
  {
    id: 'limpieza-espalda',
    title: 'Limpieza de espalda profunda',
    category: 'corporal-bienestar',
    eyebrow: 'Higiene dorsal · Acné corporal · Nivel inicial',
    level: 'Inicial',
    duration: '16 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Protocolo dermatológico de higiene profunda en zona dorsal. Acné corporal, foliculitis crónica y mantenimiento.',
    description: 'Traslación del protocolo de higiene facial profunda a la zona dorsal, con criterio dermatológico. Cubre especificidad anatómica del triángulo seborreico (estrato córneo grueso, alta densidad sebácea), protocolo en 8 fases (doble limpieza, Vapozono, exfoliación BHA, extracción aséptica, alta frecuencia, mascarilla, sérum, oil-free + SPF), límite estética/derivación dermatológica (acné nódulo-quístico → derma) y casos prácticos (acné comedoniano en adolescente, foliculitis crónica en deportista).',
    sourceDoc: 'docs/cursos/13-limpieza-espalda.md',
    lessons: [],
    test: { questions: [] }
  }
];
