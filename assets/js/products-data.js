/* Interruptor de la tienda. true = modo "Próximamente": la vista #tienda muestra un aviso
 * con botón de WhatsApp, se oculta "Aparatología destacada" en la home, las fichas
 * #producto/<id> redirigen a la tienda y desaparece el enlace "Demos". Poner a false
 * cuando haya equipos disponibles y todo vuelve a funcionar como antes. */
window.PRECISSA_TIENDA_PROXIMAMENTE = true; // false cuando haya equipos disponibles

/* =============================================================
 * PRECISSA INSTITUTE · Datos por defecto de la tienda (aparatología)
 * -------------------------------------------------------------
 * Define window.PRECISSA_PRODUCTS (catálogo base) y
 * window.PRECISSA_PRODUCT_CATEGORIES (categorías/filtros de tienda).
 *
 * Igual que courses-data.js es la base de los cursos, este archivo es
 * la base de la tienda. Lo que se cree o edite desde el panel admin se
 * guarda en la tabla `products` de Supabase (ver supabase/products.sql)
 * y reemplaza/añade equipos sobre esta base en tiempo de render.
 *
 * Shape de un producto:
 *   {
 *     id, name, category, eyebrow,
 *     shortDescription, description,
 *     price, priceNote,
 *     relatedCourseId, relatedCourseLabel,
 *     images: [url, ...],          // galería; la 1ª es la principal
 *     specs:  [{ k, v }, ...],     // tabla de características clave-valor
 *     hidden: false                // oculto del catálogo público
 *   }
 * ============================================================= */
(function () {
  window.PRECISSA_PRODUCT_CATEGORIES = [
    { id: 'electroestetica',   label: 'Electroestética' },
    { id: 'cosmetologia',      label: 'Cosmetología' },
    { id: 'micropigmentacion', label: 'Micropigmentación' }
  ];

  window.PRECISSA_PRODUCTS = [
    {
      id: 'rf-200',
      name: 'PRECISSA INSTITUTE RF-200',
      category: 'electroestetica',
      eyebrow: 'PRECISSA INSTITUTE · Electroestética facial',
      shortDescription: 'RF tripolar con sensor de impedancia en tiempo real.',
      description: 'Radiofrecuencia tripolar con sensor de impedancia en tiempo real. Control preciso de temperatura en dermis para tratamientos de lifting y remodelación facial.',
      price: 'Consultar precio',
      priceNote: 'Envío peninsular incluido · Garantía 3 años · Formación incluida',
      relatedCourseId: 'vacuum-cavitacion-radiofrecuencia',
      relatedCourseLabel: 'Vacuum · Cavitación · Radiofrecuencia corporal',
      images: [],
      specs: [
        { k: 'Frecuencia',    v: '1 – 3 MHz' },
        { k: 'Configuración', v: 'Tripolar' },
        { k: 'Potencia máx.', v: '50 W' },
        { k: 'Sensor',        v: 'Impedancia en tiempo real' },
        { k: 'Cabezales',     v: '3 (facial, contorno, body)' },
        { k: 'Pantalla',      v: 'Táctil 5" TFT' },
        { k: 'Garantía',      v: '3 años' },
        { k: 'Peso',          v: '4,2 kg' }
      ],
      hidden: false
    }
  ];
})();
