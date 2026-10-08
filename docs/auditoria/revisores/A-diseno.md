# Revisor A · Auditoría de diseño PRECISSA INSTITUTE

Alcance: index.html (SPA: home, catálogo, tienda, aula, modal de información), 12 landings `/cursos/*-valencia/`, `/cursos/`, `/sobre/`, páginas legales. Capturas a 375 y 1440 px + inspección del CSS real y comprobaciones con Playwright sobre `http://127.0.0.1:8123`.

Dos avisos previos para no perseguir fantasmas:

- **Las tarjetas "Áreas de especialización" salen en blanco en `pc-home.png` / `movil-home.png` por el `loading="lazy"` de las imágenes durante la captura de página completa.** En el navegador real cargan bien (comprobado: `naturalWidth` 1280 en las 4). No es un fallo de la web.
- `pc-spa-curso-plasmapen.png` y `movil-spa-curso-plasmapen.png` son idénticas a la home (mismo tamaño de archivo): el deep link `#curso/plasmapen` no se abrió en la captura, así que la ficha de curso de la SPA no se ha podido evaluar visualmente.

---

## Hallazgos

Ordenados por gravedad. Las capturas "live-*" están en el scratchpad del revisor (`crops/`), el resto en `docs/auditoria/capturas/`.

| # | Página | Elemento | Gravedad | Por qué importa para el negocio | Propuesta concreta | Captura |
|---|---|---|---|---|---|---|
| 1 | Home (SPA) | `.hero-ctas` → "Ver cursos" + "Aparatología"; `.nav-right` → solo "Acceder" | **Alta** | La acción que paga las facturas (pedir información) no existe en la primera pantalla de la home. El único botón oscuro de la cabecera ("Acceder") es para alumnas ya matriculadas, no para quien llega buscando curso. El teléfono solo aparece en el pie, a 6.800 px. | Hero: primario `btn-dark` "Solicitar información" (abre `openCursoInfoForm()` sin curso fijado) + secundario `btn-outline` "Ver cursos". Cabecera: píldora con el teléfono (`tel:+34601056706`, como ya hacen las landings con `.nav-cta`) y "Acceder" como enlace de texto (`btn-text`). Misma lógica en `.nav-mobile-right`. | pc-home.png, movil-home.png |
| 2 | Home móvil | `.hero-right { height: 520px; order: 1 }` | **Alta** | A 375 px la primera pantalla entera es la foto de stock; el titular queda cortado por la barra de pestañas y los botones aparecen a ~900 px. El visitante no sabe qué es la web sin hacer scroll. | `.hero-right { height: 300px }` (o `aspect-ratio: 4/3`) y `.hero-left { padding: 28px 20px 36px }`; alternativa: `order` invertido (texto primero, foto después). Objetivo: eyebrow + h1 + CTA visibles en los primeros 740 px. | movil-home.png |
| 3 | Home | Sección "Quien ya está en cabina" (`.testimonials`, index.html:1109-1135) | **Alta** | Dos de tres testimonios son degradados de relleno (`ph-rose`, `ph-clay`) y el tercero usa **la misma modelo de stock del hero en blanco y negro** como "Nerea Álvarez · Bilbao". Cualquier visitante lo reconoce; nombres y ciudades (Bilbao, Madrid, Sevilla) suenan inventados para una escuela de Valencia. Un testimonio ficticio es un riesgo legal (publicidad engañosa) y rompe la confianza justo antes del CTA. | Hasta tener reseñas reales con permiso: sustituir la sección por un bloque "Reseñas en Google" con el enlace de Maps y una cita real, o retirarla. Nunca reutilizar la foto del hero. Si hay alumnas reales, foto propia o iniciales en un círculo `--accent-soft` (sin foto) en lugar de degradado. | pc-home.png (y 05), movil-home.png |
| 4 | SPA (todas las vistas) | Todos los `h1`/`h2` de index.html (`.hero-h1`, `.diptych-h2`, `.section-h2`, `.profesora-h2`, `.pullquote-h2`, `.enfoque-h2`, `.cursos-pub-h1`, `.tienda-h1`, `.aula-login-h1`, `.quote-title`…) | **Alta** | index.html no fija `font-weight` en los títulos, así que heredan el `700` del navegador (comprobado con `getComputedStyle`: `.diptych-h2 → font-weight 700`). Instrument Serif solo existe en 400: en producción el navegador **sintetiza una negrita falsa** (trazos engordados, contraformas tapadas). Por eso la SPA parece más tosca que las landings, donde `h1, h2 { font-weight: 400 }`. Es la diferencia más visible entre "plantilla" y "editorial". | En el bloque base de index.html: `h1, h2, h3, h4 { font-weight: 400; }`. Revisar visualmente los 20 títulos; ninguno necesita negrita. | pc-home.png vs pc-landing-plasmapen.png, live-pc-spa-cursos-top.png |
| 5 | SPA catálogo (`#cursos`) | `.cursos-pub-card-cover` con `assets/le-petit.jpg` en 21 de 23 cursos | **Alta** | Sin las portadas del bucket, el catálogo muestra la misma foto de laminado de cejas en HIFU, Depilación láser, Maderoterapia… Es el síntoma de plantilla más evidente que ve una alumna potencial. (CLAUDE.md dice que las reales viven en `course_overrides`; si en producción cargan, el problema es solo el fallback.) | Fallback por categoría en vez de global: `cover` = `area-facial.jpg` / `area-electro.jpg` / `area-micropigmentacion.jpg` / `area-corporal.jpg` según `cat.id`, y `le-petit.jpg` solo para cejas/pestañas. Mientras no haya portada propia, pedir a la propietaria 1 foto real por categoría (4 fotos resuelven 21 tarjetas). | live-pc-spa-cursos-full-01/02.png, pc-estado-form-spa-error.png (fondo) |
| 6 | Landings, /cursos/, /sobre/, legales | Cabecera y pie: 3 cabeceras y 4 pies distintos | **Alta** | SPA: menú completo + logo + Acceder, pie oscuro con NAP y 23 enlaces. Landings: logo + teléfono, pie beige de 2 líneas **sin enlaces legales**. /cursos/: pie con "Plasmapen · Electroestética · Sobre nosotras". /sobre/ y legales: **solo logo centrado, sin ningún menú ni teléfono**, pie con solo legales. Quien entra por Google a una landing no puede llegar al catálogo ni al aula, y la marca se percibe como varias webs. | Un solo `header` compartido (logo · Cursos · Aparatología · Sobre · píldora teléfono · Acceder) y un solo `footer` (versión completa de la SPA; en páginas secundarias puede ser la misma con las columnas colapsadas, pero con NAP + legales + Instagram siempre). Ver sección "Propuesta para compartir CSS". | pc-landing-plasmapen.png, pc-cursos.png, pc-sobre.png, pc-aviso-legal.png |
| 7 | SPA + landings | Cinco "botones primarios" distintos: `.btn-dark` (14/24 px, 13.5 px, 500), `.cursos-pub-card-cta` (10/18 px, 12.5 px, 600, tracking .03em), `.lp-submit` landing (crema, 600, 100 % ancho), `.btn-clay` del modal (terracota), `.newsletter-btn` (accent) | **Alta** | El ojo aprende "lo oscuro y redondo es la acción principal" y luego el formulario de la landing se lo contradice (crema) y el modal también (terracota). Cada estilo nuevo resta peso al CTA. | Reducir a tres: `btn-dark` (primario sobre claro), `btn-light` (primario sobre fondo oscuro: el `.lp-submit` y `.newsletter-btn` pasan a ser `btn btn-light`), `btn-outline` (secundario). `.cursos-pub-card-cta` → `class="btn btn-dark btn-sm"`. Eliminar `.btn-clay` del modal: "Enviar por WhatsApp" en `btn-dark`. | pc-estado-form-spa-error.png, pc-estado-form-landing-error.png, live-pc-spa-cursos-full-01.png |
| 8 | Todas | `:focus-visible` inexistente en `.btn`, `.tab-item`, `.nav-link`, `.cursos-pub-filter` | **Alta** | Con teclado el botón oscuro del hero no muestra ningún anillo (el `outline: auto 1px rgb(16,16,16)` por defecto se pierde sobre `--ink`); en móvil la pestaña enfocada muestra un rectángulo negro por defecto sobre un elemento sin esquinas. Accesibilidad básica y aspecto descuidado. | Regla global en el CSS base: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: inherit; }` y `:focus:not(:focus-visible) { outline: none; }`. Para `.btn-dark` sobre fondo oscuro usar `outline-color: var(--bg)`. | pc-estado-foco-teclado.png, movil-estado-foco-teclado.png |
| 9 | Landing (form) y SPA (modal) | Estados de error | **Media** | Landing: el error es una línea de 13 px al 85 % de opacidad debajo del botón ("Escribe tu nombre."), sin marcar el campo. SPA: burbujas nativas del navegador ("Please fill out this field." en inglés si el navegador lo está) y después `.quote-status` en rojo `#b3322a` que no es de la paleta. Dos comportamientos distintos para el mismo formulario; el usuario no sabe qué campo arreglar. | Validación propia idéntica en ambos: `novalidate` en el `<form>`, `aria-invalid="true"` + `border-color: var(--accent-dark)` + mensaje de 12.5 px bajo el campo (`.field-error`), foco automático al primer campo inválido. Color de error: `--accent-dark` (#7E4C36) en lugar de rojo externo. | pc-estado-form-landing-error.png, pc-estado-form-spa-error.png, movil-estado-form-spa-error.png |
| 10 | SPA modal | `.quote-radio` "Sí, profesional" | **Media** | La píldora de radio parte en dos líneas ("Sí, / profesional") a 1440 y a 375 px; parece un fallo de maquetación en el único formulario de captación. | `.quote-radio { white-space: nowrap }` y etiqueta "Profesional" / "Particular". | pc-estado-form-spa-error.png, movil-estado-form-spa-error.png |
| 11 | SPA modal y detalle producto | Eyebrow con punto inicial: `'· Información del curso'` (index.html:6166) y `· Aprende a usarlo` (index.html:5160) | **Media** | Rompe la regla del sistema ("eyebrows sin · inicial") en el elemento más visto del embudo: el modal de información. | Quitar el `· ` en ambas cadenas. | pc-estado-form-spa-error.png |
| 12 | Tienda móvil | `.tienda-grid { grid-template-columns: 1fr 1fr }` a ≤768 px | **Media** | A 375 px la tarjeta mide 160 px: nombre en 3 líneas ("PRECISSA / INSTITUTE RF- / 200"), chip "ELECTROESTÉTICA" recortado, etiqueta "APRENDE A USARLO" en dos líneas, y la segunda columna vacía porque solo hay un producto. | `@media (max-width: 480px) { .tienda-grid { grid-template-columns: 1fr } }`; en la home, `.products-grid` igual. Chip con `max-width: 100%; overflow: hidden; text-overflow: ellipsis`. | movil-spa-tienda.png, movil-home.png (05) |
| 13 | Tienda (SPA) y "Aparatología destacada" (home) | Un producto, imagen `ph-clay` (degradado), "Ordenado por relevancia", 4 pestañas de filtro | **Media** | Un catálogo con 1 artículo sobre un degradado, filtros y "ordenado por" comunica "tienda sin abrir". En la home deja 3/4 de la fila vacíos. | Mientras haya < 4 productos: ocultar `.filter-chips` y `.tienda-meta`; presentar el RF-200 como ficha horizontal (foto real 4:3 + texto + "Pedir presupuesto"). Hace falta **una foto real del RF-200**; sin ella, mejor una ilustración de línea sobre `--bg2` que un degradado. | pc-spa-tienda.png, pc-home.png (04) |
| 14 | Home | Díptico "Aprende." (`.diptych-dark`, `min-height: 420px`, `.diptych-sub-grid { margin-top: auto }`) | **Media** | La tarjeta oscura deja ~150 px vacíos entre la descripción y las sub-tarjetas porque la de la derecha tiene imagen y esta no. Parece un bloque a medio hacer. | Darle imagen también a la tarjeta oscura (`.diptych-img` con `profesora.jpg` recortada o foto de aula) o quitar `min-height` y alinear arriba (`margin-top: 20px` en lugar de `auto`). | pc-home.png (01), movil-home.png (00-01) |
| 15 | Home, /sobre/, legales | Sello de agua (`.hero-left::before` opacidad .13, 540–720 px; `.page-watermark` fijo `right:-160px`) | **Media** | En el hero el sello pasa justo por detrás del titular y lo ensucia; en /sobre/ y legales queda cortado por el borde derecho y compite con el texto. Linear/Stripe usan texturas al 3-6 %, nunca encima del titular. | Hero: `opacity: .07`, `left: 78%` (que asome detrás del borde de la foto). Secundarias: `opacity: .05`, `right: -220px`, o moverlo al pie. | pc-home.png (00), pc-sobre.png, pc-aviso-legal.png |
| 16 | Landings (12) | Sin ninguna imagen en 5.000–7.000 px; todas las secciones con el mismo patrón eyebrow + h2 + lista | **Media** | Para un curso de estética, no enseñar la cabina, la técnica ni la profesora es perder el argumento de venta; la página se lee como un documento. Las fotos ya existen (`area-*.jpg`, `profesora.jpg`). | Hero a dos columnas en ≥900 px: texto + foto de categoría (`area-electro.jpg` para Plasmapen/HIFU/láser, etc.) con `border-radius: 12px`; y un bloque "La profesora" reutilizando `.profesora` de la home antes del formulario. "El curso incluye" en `grid-template-columns: 1fr 1fr` cuando hay ≥8 ítems. | pc-landing-plasmapen.png, pc-landing-microblading.png |
| 17 | Landings y /cursos/ | `.nav-inner { max-width: 1100px }` vs `section { max-width: 920px }` | **Media** | El logo queda en x=202 y el contenido en x=292: la cabecera no está alineada con nada. Es el tipo de detalle que separa "cuidado" de "aproximado". | Mismo `max-width` para `.nav-inner`, `.breadcrumb`, `section` y `.footer-inner` (920 px), o alinear todo a 1100. | pc-landing-plasmapen.png, pc-cursos.png |
| 18 | Landings, /cursos/, tienda, /sobre/, legales | Cursiva fuera de hero y cita: `.ficha-row .value`, `.contact-phone`, `.tienda-product-price`, `.tienda-product-course`, `.ph-label`, `.diptych-img-cap`, `h1 em` en "Sobre *PRECISSA INSTITUTE*" y "Aviso *Legal*" | **Media** | CLAUDE.md fija la cursiva de acento solo en hero y cita. La ficha del curso en cursiva y el teléfono en cursiva restan solidez; la marca en mayúsculas cursivas en /sobre/ se ve forzada. | `font-style: normal` en ficha, teléfono, precios y captions. En /sobre/: `<h1>Sobre nosotras</h1>` (sin em); en legales el `em` del título puede quedarse (es su hero). | pc-landing-plasmapen.png (01, 04), pc-sobre.png, pc-spa-tienda.png |
| 19 | /cursos/ (estático) | Lista de 23 cursos sin CTA ni enlace en 11 de ellos; único contacto al final (teléfono, sin formulario) | **Media** | Es la página indexable del catálogo: quien llega desde Google ve títulos sin botón ni enlace y un bloque oscuro al final con un teléfono. No hay forma de "pedir información" sin llamar. | Cada `.course-item` enlaza a su landing o a `/#curso/<id>`; botón `btn btn-dark btn-sm` "Solicitar información" (WhatsApp prefijado con el nombre del curso, como el de la landing) en cada categoría; CTA fijo inferior en móvil. | pc-cursos.png, movil-cursos.png |
| 20 | SPA | `.btn-outline:hover { background: var(--ink); color: var(--bg) }` | **Media** | Al pasar el ratón, el secundario se convierte en una copia exacta del primario: la jerarquía desaparece justo cuando el usuario decide. Las landings ya lo hacen bien (`background: var(--soft)`). | Unificar: `.btn-outline:hover { background: var(--soft); border-color: var(--ink) }`. | live-pc-hover-outline.png |
| 21 | SPA catálogo, /cursos/, landing (éxito), aula | Glifos de texto: "→" en `level` de courses-data.js (líneas 75, 139, 566 → "Inicial → Avanzado"), "✓" en éxito del formulario y `.quote-success-icon`, emojis ✅/❌ en `.revision-icon` | **Baja/Media** | CLAUDE.md explica que Manrope no tiene esos glifos: se pintan con otra fuente, descentrados. En el catálogo aparece en varias tarjetas. | `level: 'Inicial a Avanzado'` o renderizar con `<i class="ico ico-arrow">`; añadir `.ico-check` (SVG por máscara) para éxito y revisión. | pc-cursos.png, live-pc-spa-cursos-full-01.png, pc-estado-form-landing-exito.png |
| 22 | Home móvil | Navegación triple: hamburguesa + píldora "Acceder" + barra inferior con "Aula"; el drawer repite "Acceder" | **Media** | Tres accesos al aula en una pantalla de 375 px y ninguno al teléfono. Para quien no es alumna, la cabecera no ofrece nada útil. | En `.nav-mobile-right` sustituir "Acceder" por la píldora `tel:` ("601 05 67 06"); "Acceder" se queda en la barra inferior ("Aula") y en el drawer. | movil-home.png, movil-estado-menu-abierto.png |
| 23 | Home | `.newsletter` con fondo `ph-honey` (#d4b870→#a88840) + overlay | **Media** | El resultado es un verde oliva/caqui que no está en la paleta tierra; es el único bloque de la web con ese tono y desentona con el pie oscuro inmediato. | Fondo `var(--ink)` liso o `--bg2` con foto (`area-corporal.jpg` con overlay `rgba(36,29,23,.75)`); eliminar `.ph-honey` aquí. | pc-home.png (05), movil-home.png (06) |
| 24 | Home (áreas) | `area-facial.jpg`, `area-electro.jpg`, `area-corporal.jpg` muestran frascos con la marca ficticia "LUMINA" | **Baja** | Son imágenes generadas; la marca inventada bien legible en 3 de 4 tarjetas resta credibilidad a quien se fije (y se fijan: son profesionales del sector). | Recorte con `object-position` que saque el frasco del encuadre (p. ej. `object-position: 70% 50%` en facial y corporal) o retoque. | live-pc-areas.png |
| 25 | index.html JSON-LD | `"logo": ".../assets/og-image.jpg"` (línea 62) = foto de la modelo del hero | **Baja** | Google puede mostrar la cara de una modelo de stock como logotipo de la escuela en el panel de conocimiento. | `logo` → `assets/seal-ss-lg.webp` (o un PNG cuadrado del sello). | — |
| 26 | Landings | `ul.clean li::before { top: 11px }` | **Baja** | El punto queda por encima del centro de la x del texto (visible en zoom); en listas largas se nota. | `top: 1.05em` o `top: 18px` con `line-height 1.45` a 15.5 px. | zoom-bullets.png (scratchpad) |
| 27 | /cursos/ | Eyebrow de categoría con punto final ("…CABINA FACIAL.") | **Baja** | Contradice la regla "títulos sin punto final" y en mayúsculas espaciadas el punto queda colgando. | Quitar el punto en los 4 eyebrows (`.eyebrow-muted` de `cursos/index.html`). | pc-cursos.png |
| 28 | SPA | Siete escalas de "eyebrow": `.eyebrow` 10.5/0.22em/500, `.chip` 10.5/0.24em, `.cursos-pub-card-tag` 10.5/0.14em/600, `.producto-aprende-eyebrow` 10/0.18em/600, `.quote-eyebrow` 11/0.18em/600, `.drawer-section` 11/0.2em/**800**, `.footer-col-title` 11/0.2em/600 | **Baja** | Cada variante es una decisión que el ojo percibe como ruido; `800` en el drawer se ve pesado frente al resto. | Un solo token: 11 px / 0.22em / 600 (`--eyebrow`). Aplicarlo a todas las clases anteriores y a landings (`0.24em` → `0.22em`). | movil-estado-menu-abierto.png |
| 29 | Landings, /cursos/ | Radios 10 px: `.ficha`, `.lp-field input`, `.faq-item` (/cursos/); `.course-item` 6 px | **Baja** | El sistema es 999 / 12 / 4. Un 10 px al lado de un 12 px se nota en los bordes de tarjeta y campo. | `border-radius: var(--r)` (12 px) en `.ficha`, `.faq-item`, inputs; `.course-item` → 4 px o sin radio. | pc-landing-plasmapen.png (01), pc-cursos.png (04) |
| 30 | /cursos/ vs SPA | Nombres distintos para lo mismo: "Cursos de estética en Valencia" / "Programas formativos"; "Sobre nosotras" / "Sobre PRECISSA INSTITUTE"; FAQ en tarjetas beige (/cursos/) vs FAQ en lista con líneas (landings) | **Baja** | Dos componentes de FAQ y dos nombres de sección para el mismo contenido hacen que la web parezca montada en momentos distintos. | Un solo componente `.faq-item` (el de lista con línea, más editorial) y un solo rótulo. | pc-cursos.png (04), pc-landing-plasmapen.png (02) |
| 31 | Landing móvil | Hero con dos CTAs apilados ("Solicitar información" + "Llamar…") y además píldora de teléfono en cabecera | **Baja** | El teléfono aparece tres veces en la primera pantalla; el espacio vertical en móvil es caro. | En ≤720 px ocultar `.btn-outline` del hero (ya está el `tel:` en cabecera) y dejar un único primario. | movil-landing-plasmapen.png |

---

## Desviaciones respecto a los tokens

Referencia: `:root` de `index.html` (líneas 141-158) + reglas de CLAUDE.md §7. Formato: archivo → selector → valor actual → valor esperado.

**Tokens que faltan o difieren**

- `cursos/index.html` → `:root --muted` → `#6E6558` → `#726A5D` (el resto del sitio).
- `cursos/index.html` → `:root` → faltan `--surface`, `--accent-soft`, `--r`, `--r-sm` → añadirlos (copiar el bloque de index.html).
- `cursos/*-valencia/index.html` (12) y `assets/legal.css` → `:root` → faltan `--r: 12px`, `--r-sm: 4px` → añadirlos; sustituir los `10px` literales por `var(--r)`.
- Fuentes: `sobre/index.html` carga Manrope 400–600; `cursos/index.html` 400–700; `index.html` y landings 400–800 → un solo `<link>` con 400;500;600 (700/800 solo lo usa `.drawer-section` y `.cart-badge`, que deberían pasar a 600).

**Base**

- Landings, `/cursos/`, `legal.css` → `body` → `font-size: 16px; line-height: 1.6/1.65` → index.html `body` → `15px / 1.55`. Recomendación: **16 px / 1.6 como token** (`--fs-body`) en todo el sitio: las landings son lectura larga y 15 px es pequeño; en index.html casi todos los componentes fijan su px, así que el cambio solo afecta al texto sin clase.
- `index.html` → `h1, h2` (sin regla) → `font-weight: 700` heredado (negrita sintética) → `font-weight: 400` como en landings/legal.

**Tipografía de sección**

- `index.html` → `.eyebrow` → `10.5px / 0.22em / 500 / --muted` ; landings, `/cursos/`, `legal.css` → `.eyebrow` → `11px / 0.24em / 500 / --accent` → unificar `11px / 0.22em / 600`, color `--muted` por defecto y `.accent` como modificador (como ya hace index).
- `index.html` → `.chip` → `letter-spacing 0.24em` → `0.22em`.
- `index.html` → `.cursos-pub-card-tag` → `0.14em / 600` → `0.22em / 600`.
- `index.html` → `.drawer-section` → `font-weight 800` → `600`.
- `index.html` → `.quote-eyebrow`, `.producto-aprende-eyebrow` → `0.18em` → `0.22em`.
- h1: index `.hero-h1` 72px fijo; landings `clamp(38px,6vw,64px)`; `/cursos/` `clamp(38px,6vw,58px)`; legal `clamp(36px,5vw,52px)` → una escala: `--h1: clamp(40px, 5.5vw, 64px)` (hero home puede mantener 72 como excepción documentada).
- h2: index 48px (secciones) / 56px (profesora) / 52px (cita); landings `clamp(28px,4vw,38px)`; `/cursos/` `clamp(26px,4vw,34px)`; legal 26px → `--h2: clamp(30px, 3.4vw, 44px)` para páginas secundarias; la home conserva 48.

**Botones**

- Landings (12) → `.btn` → `padding: 13px 24px; font-size: 14px` → index `.btn` → `14px 24px; 13.5px`. Unificar en `14px 24px / 14px` (14 px lee mejor que 13.5).
- Landings → `.btn-outline:hover` → `background: var(--soft)` ; index → `background: var(--ink); color: var(--bg)` → adoptar el de las landings.
- Landings → `.lp-submit` → `background: var(--bg); font-weight: 600; width: 100%` → `class="btn btn-light"` (ya existe en index) con `font-weight: 500`.
- index → `.cursos-pub-card-cta` → `10px 18px / 12.5px / 600 / 0.03em` → `btn btn-dark btn-sm` (`9px 18px / 12.5px / 500`).
- index → `.btn-clay` (modal) → `--accent-dark` → eliminar; usar `btn-dark`.
- index → `.newsletter-btn` → `--accent` → `btn-light`.
- Landings → `.nav-cta` → `10px 18px / 13px` → es `btn btn-dark btn-sm` (9/18, 12.5): usar la clase.

**Radios**

- Landings → `.ficha`, `.lp-field input/textarea` → `10px` → `var(--r)` 12px.
- `/cursos/` → `.faq-item` → `10px` → 12px; `.course-item` → `6px` → `var(--r-sm)` 4px.
- index → `.quote-field input` → `12px` ✔ (referencia para inputs).

**Cabecera / logo**

- index `.nav-logo` 24px / móvil 17px; landings y legal 22px / móvil 16px; `.nav-logo-sub` 9px (index, landings, legal) vs 10px (`/cursos/`) → 22px / 16px / sub 9px en todo.
- index `.nav-row1` padding `18px 56px`; landings `.nav-inner` `18px 32px` + `max-width 1100` → un contenedor común.

**Contenedores**

- index `.container` 1280/56px · landings `section` 920/32px · `.nav-inner` 1100 · legal `.legal-wrap` 760 · `/cursos/` 920 → tokens `--container: 1280px` (listados) y `--measure: 920px` (lectura), cabecera y pie siempre a `--container`.

**Breadcrumb**

- index `.page-bc` → separador `<i class="ico ico-chev-r">` ; landings/`/cursos/`/legal → `.breadcrumb-sep` con `/` de texto → usar el chevrón `.ico` en todas.

**Pie**

- index `.footer` → `--ink`, `64px 56px 32px`, 5 columnas + NAP + legales + Instagram ; landings/`/cursos/` → `--bg2`, `30px 32px`, 1-2 líneas, sin legales ; legal/sobre → `--bg2` solo legales → un único pie.

**Foco**

- index `.quote-field :focus` anillo accent · `.cursos-search-input:focus` anillo ink · `.aula-input:focus` solo borde · landing `.lp-field :focus` anillo crema · `.btn`/`.tab-item`/`.nav-link`: ninguno → un token `--ring: 0 0 0 3px rgba(168,107,78,.18)` para campos y `:focus-visible` global para todo lo demás.

**Estado vacío / carga**

- index `.cursos-pub-noresults` y `.cursos-pub-empty` existen (borde discontinuo, cursiva) ✔; no hay equivalente para la tienda ni skeleton de carga de portadas (`.cursos-pub-card-cover` muestra `--bg2` plano mientras carga: aceptable).

---

## Qué está bien (no tocar)

1. **La paleta y el ritmo claro/oscuro**: crema `#F2ECE3`, beige `#E6DDCC`, tinta `#241D17` y el terracota como acento único. Los bloques oscuros (ficha del curso, formulario de la landing, pie de la SPA) son el elemento más reconocible de la marca; la alternancia de bandas en las landings guía el scroll sin esfuerzo.
2. **Los componentes de píldora**: botones `999px` con flecha SVG por máscara, filtros como pestañas con subrayado (`.cursos-pub-filter`, `.filter-chip`), chips de categoría. Son consistentes entre catálogo y tienda y funcionan bien a 375 px (scroll horizontal oculto, sin saltos).
3. **El contenido de las landings**: eyebrow → h2 → lista con término en negrita y explicación en gris es muy escaneable; "Ficha del curso" en tarjeta oscura y la FAQ tipográfica (sin acordeones) son decisiones correctas. Cero scroll horizontal en las 31 capturas y una sola `h1` por página.
4. **El pie de la SPA**: NAP completo con iconos SVG, horario, "Cómo llegar", reseñas, 12 enlaces a landings, legales e Instagram. Es la referencia para el pie común; no hay que rediseñarlo, solo reutilizarlo.
5. **El flujo del modal "Solicitar información"** y del formulario de landing: título claro, línea de contexto con el curso, radios en píldora, casilla RGPD, abrir WhatsApp con el mensaje escrito y copia por email en segundo plano, con el enlace "¿No se ha abierto? Pulsa aquí". Es un embudo bien pensado; los hallazgos 7, 9 y 10 son de acabado, no de concepto.

Mención aparte: las tarjetas de áreas con numeral romano sobre foto (cuando cargan) y el divisor con el sello son los dos momentos donde la web ya parece una escuela con identidad y no una plantilla.

---

## ¿Plantilla o identidad propia? Qué falta para el nivel Linear / Stripe

Hoy: identidad propia en paleta, tipografía y voz, pero acabado de plantilla por cinco motivos concretos, todos resolubles dentro del sistema actual:

1. **Rellenos visibles** (degradados de testimonios, producto y newsletter; la misma foto en 21 tarjetas; la modelo del hero repetida). Linear/Stripe nunca enseñan un placeholder: si no hay contenido real, el bloque no existe.
2. **Negrita sintética en los títulos de la SPA** (hallazgo 4). Es la causa principal de que la home se vea "pesada" frente a las landings.
3. **Inconsistencia estructural** (3 cabeceras, 4 pies, 5 botones primarios, 7 eyebrows). El nivel premium se percibe como "cada cosa es exactamente igual en todas partes".
4. **Sin estados pulidos**: foco invisible, hover que anula la jerarquía, errores con burbuja nativa en inglés. En Stripe cada estado está diseñado con el mismo cuidado que el reposo.
5. **Sin imagen propia en las landings** y sin foto real del producto. La web vende criterio clínico y cabina; hay que verlos.

Lo que NO hace falta: cambiar fuentes, paleta, radios ni el layout general. Con los hallazgos 1-8 resueltos la percepción cambia de forma desproporcionada al esfuerzo.

---

## Propuesta para compartir CSS

Situación: el bloque `<style>` de las 12 landings es **byte a byte idéntico** (md5 `9945672c` en las 12), `/cursos/` lleva una copia divergente, `/sobre/` y legales usan `assets/legal.css`, e `index.html` tiene todo inline (358 KB). Cada corrección de este informe habría que aplicarla hoy en 15 sitios.

**Objetivo**: `assets/site.css` (tokens + base + componentes compartidos, ≤ 15 KB) que cargan todas las páginas; cada página conserva un `<style>` pequeño con lo que es solo suyo. Sin rediseñar nada.

### Fase 0 · Preparar (sin tocar páginas)

1. Crear `assets/site.css` copiando de index.html, en este orden: `:root` (añadiendo `--r`, `--r-sm`, `--fs-body: 16px`, `--container: 1280px`, `--measure: 920px`, `--ring`), reset, `.ico*` completo, tipografía base (`body`, `h1-h4 { font-weight: 400 }`, `.eyebrow`, `.serif`), `.btn*` (con la unificación del hallazgo 7), `.chip*`, `.card`, formularios (`.field`, inputs y `:focus` con `--ring`), `:focus-visible` global, `.breadcrumb`, `.faq-item`, `ul.clean`, `.ficha`, `.contact`, cabecera (`.site-nav`) y pie (`.site-footer`, el de la SPA).
2. Añadir `/assets/site.css` a `PRECACHE_URLS` de `sw.js` y subir `CACHE_VERSION`. Cargarlo siempre con `?v=N` (misma regla que `agenda.css`): si no, el service worker puede servir HTML nuevo con CSS viejo.
3. Guardar el script de capturas actual como "antes" para comparar.

### Fase 1 · Legales y /sobre/ (riesgo mínimo, 4 páginas)

- `<link href="/assets/site.css?v=1">` antes de `legal.css`; dejar en `legal.css` solo `.legal-wrap`, `.legal-table`, `.note-box`, `.page-watermark`. Cabecera y pie: sustituir por el markup común (resuelve el hallazgo 6 en estas páginas).
- Verificar con capturas antes/después; cualquier diferencia debe ser una de las correcciones del informe, no un efecto secundario.

### Fase 2 · Landings (12 páginas, 1 cambio)

- Como el bloque `<style>` es idéntico en las 12, un solo reemplazo (sed o script) lo sustituye por `<link href="/assets/site.css?v=1">` + un `<style>` residual con `.hero`, `.section-alt`, `.ficha-grid`, `.lp-form*`.
- Actualizar `docs/cursos/herramientas/gen-landings.py`: hoy extrae `STYLE` de la plantilla plasmapen (línea 11); al cambiar la plantilla, el generador queda alineado sin tocar su lógica. Regenerar las 6 generadas y comprobar que las 6 manuales quedan iguales.
- Es aquí donde se aplican los hallazgos 16-18 y 26 una sola vez.

### Fase 3 · /cursos/

- Igual que las landings; `cursos/index.html` se regenera desde `courses-data.js`, así que el cambio va en su plantilla/generador. Quitar su `:root` propio (resuelve `--muted` divergente y los tokens que faltan).

### Fase 4 · index.html (la SPA)

- Sustituir **solo** el bloque base (tokens, reset, `.ico`, `.btn`, `.chip`, `.card`, nav, footer; líneas ~140-470 y 898-920) por el `<link>`. Los `<style>` por página (home, cursos, tienda, aula, admin) se quedan inline: son específicos y moverlos no aporta.
- Orden de cascada: `site.css` debe ir **antes** de cualquier `<style>` inline para que las excepciones de página sigan ganando. Mantener las mismas clases y la misma especificidad (una clase) para que nada cambie.
- Validar con `/desplegar` (sintaxis JS, JSON-LD) y volver a capturar las 31 vistas.

### Reglas para que no se rompa después

- Un componente se define una vez en `site.css`; una página solo puede **añadir** modificadores (`.hero-h1`), nunca redefinir `.btn` o `.eyebrow`.
- Nada de `@import` ni de un segundo archivo de tokens: `:root` vive solo en `site.css`.
- Subir `?v=N` y `CACHE_VERSION` en cada cambio de `site.css`.
- El script de capturas de la auditoría pasa a ser la prueba de regresión visual: se ejecuta antes de cada `/desplegar` que toque CSS y se compara con PIL (`ImageChops.difference`).

Riesgos y cómo se cubren: (a) FOUC en páginas que antes tenían el CSS inline → `site.css` es pequeño y va precacheado por el SW, y se puede inyectar `<link rel="preload" as="style">`; (b) una regla base que cambie algo en la SPA sin querer → se detecta con la comparación de capturas por fase; (c) el generador de landings pisando retoques manuales → ya está documentado en CLAUDE.md y la Fase 2 lo respeta regenerando solo las 6 generadas.
