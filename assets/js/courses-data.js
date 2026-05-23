/* =============================================================
 * AUREA · Datos de los cursos
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

window.AUREA_COURSES = [
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
  }
  // -----------------------------------------------------------
  // Para añadir otro curso, copia el bloque de arriba y cambia
  // id, title, lessons y test. Para dar acceso a una alumna,
  // se hace en la Google Sheet de matrículas, NO aquí.
  // -----------------------------------------------------------
];
