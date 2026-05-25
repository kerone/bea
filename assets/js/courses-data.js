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
 *   3. Añade el curso a este array con sus lecciones apuntando
 *      a esos index.html, y su test (preguntas + respuesta correcta).
 *   4. Haz commit + push. GitHub Pages publica al momento.
 *
 * Campos de cada curso:
 *   id              identificador único (slug, sin espacios)
 *   title           título visible
 *   shortDescription una línea para la card
 *   description     descripción larga
 *   cover           ruta a la imagen de portada (opcional)
 *   eyebrow         pequeña etiqueta superior (ej. "Cosmetología · Nivel inicial")
 *   level           texto de nivel (opcional)
 *   duration        duración total estimada (opcional)
 *   lessons[]       lista de lecciones, cada una:
 *                     - id, title, duration, slides (ruta al HTML)
 *   test            { questions: [{ q, options: [...], correct: idx }, ...] }
 *
 * Quién tiene acceso a qué curso se gestiona FUERA de este
 * archivo, en una Google Sheet (assets/js/enrollments.js sabe
 * la URL). Aquí solo defines los cursos y su contenido.
 * ============================================================= */

window.PRECISSA_COURSES = [
  {
    id: 'anatomia-fisiologia-cutanea',
    title: 'Anatomía y fisiología cutánea',
    eyebrow: 'Cosmetología · Nivel inicial',
    level: 'Inicial',
    duration: '5 h',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Cómo funciona la piel y por qué responde como responde a cada estímulo.',
    description: 'Curso base para entender la piel como órgano: estructura, capas, anejos cutáneos, biotipos y comportamiento ante los estímulos del tratamiento. Necesario para abordar el resto de cursos de protocolo.',
    lessons: [
      {
        id: 'leccion-1',
        title: 'La piel · Introducción',
        duration: '18 min',
        // Valor especial: usa la lección visual integrada en el index.html
        // (la del parallax 3D). Para tus próximas lecciones pon aquí la
        // ruta al HTML que hayas generado, p.ej.:
        //   'assets/cursos/anatomia-fisiologia-cutanea/leccion-2/index.html'
        slides: 'leccion-integrada'
      }
      // Añade más lecciones aquí cuando subas sus HTML, por ejemplo:
      // { id: 'leccion-2', title: 'La epidermis', duration: '22 min',
      //   slides: 'assets/cursos/anatomia-fisiologia-cutanea/leccion-2/index.html' }
    ],
    test: {
      questions: [
        {
          q: '¿Cuántas capas principales tiene la piel?',
          options: ['2', '3', '4', '5'],
          correct: 1
        },
        {
          q: '¿Cuál es la capa más superficial de la piel?',
          options: ['Dermis', 'Hipodermis', 'Epidermis', 'Tejido subcutáneo'],
          correct: 2
        },
        {
          q: 'El ciclo de renovación celular de la epidermis dura aproximadamente:',
          options: ['7 días', '28 días', '60 días', '90 días'],
          correct: 1
        }
      ]
    }
  },
  {
    id: 'plasma-pen',
    title: 'Plasma Pen',
    eyebrow: 'Electroestética avanzada · Nivel profesional',
    level: 'Profesional / Avanzado',
    duration: '40 h · 18 h teoría + 22 h prácticas',
    cover: 'assets/le-petit.jpg',
    shortDescription: 'Sublimación epidérmica controlada con plasma frío atmosférico: indicaciones reales, riesgos honestos y protocolo profesional.',
    description: 'Formación completa en Plasma Pen para la profesional de estética avanzada. Cubre fundamentos físicos del plasma frío, mecanismo histológico, indicaciones evidence-based, contraindicaciones por fototipo y comorbilidad, protocolo técnico paso a paso por zona anatómica, cosmetología pre y post (regeneradores, despigmentantes, fotoprotección), manejo de complicaciones —en especial hiperpigmentación post-inflamatoria— y diagnóstico diferencial de lesiones cutáneas. Incluye casos clínicos comentados, scripts de comunicación con la paciente y troubleshooting técnico.',
    lessons: [
      {
        id: 'leccion-1',
        title: 'Plasma Pen · Curso completo',
        duration: '~60 min de lectura',
        slides: 'assets/cursos/plasma-pen/leccion-1/index.html'
      }
    ],
    test: {
      questions: [
        {
          q: '¿Cuál es la profundidad habitual de la sublimación inducida por plasma pen en condiciones normales de uso?',
          options: [
            '5-10 µm, solo estrato córneo',
            '40-150 µm, epidermis hasta unión dermo-epidérmica',
            '500 µm, dermis reticular',
            '1-2 mm, hipodermis'
          ],
          correct: 1
        },
        {
          q: '¿Cuál de estos es el riesgo MÁS frecuente en piel Fitzpatrick V tratada con plasma pen?',
          options: [
            'Cicatriz queloidea',
            'Infección bacteriana',
            'Hiperpigmentación post-inflamatoria',
            'Hipopigmentación permanente'
          ],
          correct: 2
        },
        {
          q: '¿Qué ingrediente está contraindicado las primeras 2-4 semanas post-tratamiento?',
          options: [
            'Pantenol al 5%',
            'Tretinoína',
            'Centella asiática',
            'Ácido hialurónico libre'
          ],
          correct: 1
        },
        {
          q: '¿Cuál es el intervalo mínimo recomendado entre dos sesiones de plasma pen en la misma zona?',
          options: [
            '1 semana',
            '3-4 semanas',
            '8-12 semanas',
            '6 meses'
          ],
          correct: 2
        },
        {
          q: 'Ante un fibroma blando de 2 mm en cuello con base pediculada en una paciente Fitzpatrick III sin antecedentes relevantes, ¿qué procede?',
          options: [
            'Tratar en la misma consulta de valoración tras consentimiento verbal',
            'Tratar tras consentimiento informado escrito, intensidad media-baja, sesión única',
            'Derivar siempre a cirugía menor por riesgo de cicatriz',
            'Aplicar 3 sesiones espaciadas para minimizar riesgo'
          ],
          correct: 1
        },
        {
          q: '¿Cuál de estas situaciones obliga a NO tratar o derivar al médico antes de cualquier intervención?',
          options: [
            'Paciente con Fitzpatrick II y arrugas periorbitarias estáticas',
            'Paciente con fibroma blando estable de varios años',
            'Lesión pigmentada de bordes irregulares, asimétrica, de aparición reciente',
            'Paciente con dermatocalasia leve del párpado superior'
          ],
          correct: 2
        },
        {
          q: 'Una paciente acude al día 5 post-tratamiento con eritema que se extiende más allá de la zona tratada, dolor creciente y sensación de calor local. ¿Qué procede?',
          options: [
            'Aumentar la frecuencia de aplicación del regenerador y citar en 1 semana',
            'Aplicar corticoide tópico de potencia media',
            'Derivar al médico con sospecha de infección',
            'Iniciar despigmentantes tópicos preventivos'
          ],
          correct: 2
        },
        {
          q: 'Durante una sesión sobre lentigos en dorso de mano de una paciente Fitzpatrick II, en uno de los puntos aparece sangrado puntiforme tras el impacto del arco. ¿Cuál es la conducta correcta?',
          options: [
            'Continuar la sesión con la misma intensidad para mantener la uniformidad del patrón',
            'Repasar inmediatamente el punto sangrante para coagularlo',
            'Detener la pasada en esa zona, limpiar con suero, documentar la incidencia y reducir intensidad en la próxima sesión',
            'Aplicar corticoide tópico en ese punto y continuar el resto del tratamiento'
          ],
          correct: 2
        }
      ]
    }
  }
  // -----------------------------------------------------------
  // Para añadir otro curso, copia el bloque de arriba y cambia
  // id, title, lessons y test. Para dar acceso a una alumna,
  // se hace en la Google Sheet de matrículas, NO aquí.
  // -----------------------------------------------------------
];
