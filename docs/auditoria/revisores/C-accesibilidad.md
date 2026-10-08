# Revisor C · Accesibilidad WCAG 2.2 AA y rendimiento básico

Método: axe-core (wcag2a/aa, 21aa, 22aa + best-practice) con Playwright a 375 y 1440 px; pruebas manuales de teclado/foco/zonas táctiles; Lighthouse móvil. Solo lectura: no se tocó el repo. Sin red externa: Google Fonts, jsDelivr/Supabase y Cloudflare Insights no cargan (afecta al rendimiento medido y a "errores en consola" de Lighthouse, no es fallo del sitio). Scripts y JSON en el scratchpad (axe.json).

## Resumen de axe
Los resultados son casi idénticos en 375 y 1440 (cambian solo algunos nodos). Entre paréntesis, nodos en 375 / 1440 cuando difieren.

| Página | Violaciones (nº) | Reglas (id, impacto, nodos) |
|---|---|---|
| `/` | 3 | color-contrast serious 15 (14); landmark-one-main moderate 1; region moderate 45 (41) |
| `/cursos/` | 1 | color-contrast serious 9 |
| `/cursos/plasmapen-valencia/` | 4 | color-contrast serious 11; label-content-name-mismatch serious 1 (`.nav-logo`); landmark-one-main moderate 1; region moderate 21 |
| `/cursos/microblading-valencia/` | 4 | color-contrast serious 12; label-content-name-mismatch serious 1; landmark-one-main moderate 1; region moderate 21 |
| `/sobre/` | 1 | color-contrast serious 7 |
| `/aviso-legal/` | 1 | color-contrast serious 7 |
| `/#cursos` | 4 | color-contrast serious 25 (24); landmark-one-main 1; page-has-heading-one moderate 1; region moderate 105 (101) |
| `/#tienda` | 5 (375) / 4 (1440) | color-contrast serious 3 (2); landmark-one-main 1; page-has-heading-one 1; region 16 (12); scrollable-region-focusable serious 1 (solo 375, `#tienda-filter-chips`) |
| `/#aula` | 4 | color-contrast serious 4 (3); landmark-one-main 1; page-has-heading-one 1; region 12 (8) |
| `404.html` | 3 | landmark-one-main 1; link-in-text-block serious 1 (`a[href="tel:+34601056706"]`, 1,23:1 frente al texto); region 6 |
| Menú móvil abierto (375, `/`) | 2 | color-contrast serious 15; region moderate 53 (sin landmark-one-main nuevo) |
| Modal info abierto (`/#cursos`, `openCursoInfoForm`) | 3 | color-contrast serious 26 (25); region 105 (101). Axe no marca nada propio del modal (labels OK, `role=dialog` OK). |

Agrupación de causas de `color-contrast` (de todas las páginas, 1440):

| Par (texto / fondo) | Ratio | Tamaño | Dónde |
|---|---|---|---|
| #A86B4E / #F2ECE3 | 3,66 | eyebrows 10,5-11 px; enlaces 16 px en legales | `.eyebrow.accent` (home, /cursos/, landings, sobre, legales, SPA), `p > a` en `/sobre/` y `/aviso-legal/` |
| #A86B4E / #FFFFFF | 4,30 | 10,5 px eyebrow, tags de tarjeta, precio, enlaces del aula, pestaña activa de la tab-bar móvil | `.cursos-pub-card-tag` (x25), `.tienda-product-price`, `.product-price`, `#aula-mode-toggle`, `.tab-item.active span` |
| #A86B4E / #ECDDD0 | 3,24 | 10,5 px | `.chip-accent` |
| #726A5D / #E6DDCC | 3,95 | 10,5-13 px | `.eyebrow-muted` en secciones `.section-alt`, `.pullquote > .eyebrow`, `.footer-inner` de landings/legales (x15) |
| #6E6558 y #837B6E / #E6DDCC | 4,25 y 3,10 | 13 px | `address` en `/cursos/` y landings |
| #796F63 / #E6DDCC | 3,65 | 14 px | `.diptych-light > .diptych-desc` (home) |
| #FFFFFF / #A86B4E | 4,30 | 13,5 px | `.newsletter-btn` |
| Pie sobre #241D17: #726A5D (3,11), #817A73 (3,93), #6C655E (2,89) | 2,9-3,9 | 10-13 px | `.footer-logo-sub`, `.footer-nap-hours`, `.footer-col-title`, `.footer-copy` |

## Hallazgos manuales

| Página | Elemento (selector) | Criterio WCAG | Gravedad | Por qué importa | Propuesta concreta | Captura |
|---|---|---|---|---|---|---|
| SPA /#tienda | `.tienda-product-card` (div con onclick, sin botón/enlace dentro; tabindex -1) | 2.1.1 Teclado, 4.1.2 | alta | Sin ratón no se puede abrir ningún producto de la tienda: queda inaccesible el catálogo y la solicitud de demo | Renderizar el título como enlace: `<a class="tienda-product-name" href="/#producto/${id}" onclick="goToProducto('${id}');return false">` y CSS `.tienda-product-card{position:relative}.tienda-product-name::after{content:"";position:absolute;inset:0}` (tarjeta entera clicable) | movil-spa-tienda.png |
| SPA /#tienda | `.filter-chip` (span onclick, tabindex -1, sin role) y `#tienda-filter-chips` (axe: scrollable-region-focusable) | 2.1.1, 4.1.2 | alta | Los filtros de la tienda no son operables con teclado ni se anuncian como pestañas. En /#cursos los filtros sí son `<button class="cursos-pub-filter">` | Cambiar `<span class="filter-chip">` por `<button type="button" class="filter-chip" aria-pressed="true|false">` y añadir `border:0;background:none;font-family:inherit;` a `.filter-chip` | movil-spa-tienda.png |
| SPA /#aula | `.aula-link` (`#aula-mode-toggle`, "¿Olvidaste la contraseña?") spans con onclick | 2.1.1, 4.1.2 | alta | Quien usa teclado no puede darse de alta ni recuperar contraseña; es la puerta del alumnado | `<button type="button" class="aula-link" ...>` con `.aula-link{background:none;border:0;padding:0;font:inherit;color:var(--accent-dark)}` | movil-spa-aula-login.png |
| SPA (cursos/tienda/aula y curso) | Migas `.page-bc > span[onclick="goTo('home','')"]` ("Inicio", 28x12 px), `.ac-tab` (pestañas Materia/Presentación/Test), `.tab-btn` (Temario/Recursos...), `.modulo-header`, `.leccion-row`, `.test-opt`, `.lv-back`, `.lv-close`, `.ac-slides-close` (✕), `.lv-end-cta-*` (`<a>` sin href), `.precio-card-play-btn`, `.producto-thumb` | 2.1.1, 4.1.2, 2.5.8 | alta (aula) / media (migas) | Muchos div/span con onclick: no entran en el orden de tabulación ni tienen rol. Las migas miden 12 px de alto (<24 px, falla 2.5.8) | Migas: `<a href="/" onclick="goTo('home','');return false">Inicio</a>` y `nav aria-label="Migas"`. Pestañas: `<button role="tab" aria-selected>` dentro de `role="tablist"`. Cierres: `<button aria-label="Cerrar">`. Regla CSS mínima para migas: `.page-bc a{display:inline-block;padding:6px 0}` | movil-spa-curso-plasmapen.png |
| SPA aula | `article.aula-course-card[onclick]` (L5488) | 2.1.1, 4.1.2 | alta | Tarjetas del aula con onclick en `<article>`; no se abren con teclado (solo comprobado en código: requiere sesión) | Título como `<a href="/#curso/${id}">` con `::after{inset:0}` (patrón de tarjeta clicable) | movil-spa-aula-login.png |
| Home | `.area-card` x4 (div onclick) | 2.1.1 | media | Dentro lleva un `<button>` "Ver itinerario" que sí se tabula y el clic burbujea a la tarjeta, así que hay vía de teclado. Pero el botón no tiene `onclick` propio ni nombre que distinga la categoría (3 botones idénticos) | Añadir `aria-label="Ver itinerario de ${cat.label}"` al botón (L6316) y `onclick` propio | movil-home.png |
| Home y SPA | Menú móvil `.hamburger` / `#mobile-drawer` | 2.1.2/2.4.3 (foco), 4.1.2, 2.1.1 Escape | alta | Al abrir con Enter el foco se queda en el hamburguesa (detrás del cajón), el Tab recorre logo/"Acceder" del fondo y luego la página entera (no atrapa foco). Escape NO cierra (verificado: sigue `open`, `body overflow:hidden`). El botón no tiene `aria-expanded`; el panel no tiene `role="dialog"` | JS: en `openDrawer()` poner `hamburger.setAttribute('aria-expanded','true')`, `drawer-close.focus()`, y listener `keydown Escape -> closeDrawer(); hamburger.focus()`; atrapar Tab entre `.drawer-close` y el último enlace. HTML: `<div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menú">` y `<div inert>` en el resto o `main[inert]` mientras esté abierto | movil-estado-menu-abierto.png |
| PC home | Desplegable "Cursos" `.nav-link-wrap:hover .nav-dropdown` | 2.1.1, 1.4.13, 4.1.2 | media | El desplegable se abre solo con `:hover` (L410-412). Con teclado los enlaces están en el orden de tab (tabindex 0) pero siguen con `visibility:hidden` mientras no hay hover: el foco desaparece (axe/tab: el Tab salta de "Cursos" a "Aparatología" sin pasar por ellos). Sin `aria-haspopup` | CSS: `.nav-link-wrap:focus-within .nav-dropdown{opacity:1;visibility:visible;transform:translateY(0)}`; y Escape opcional | pc-estado-foco-teclado.png |
| Home/SPA | Modal `#quote-overlay` (`role=dialog aria-modal`, `aria-labelledby`) | 2.4.3, 2.1.2, 3.2.x | media | Bien: foco inicial en "Nombre" (setTimeout 80 ms), Escape cierra, labels correctos. Mal: no hay trampa de foco (tras 8 Tab el foco sale al fondo: `acceder-btn`), y al cerrar el foco no vuelve al botón que lo abrió (cae en `A.nav-logo`/body) | Guardar `const opener=document.activeElement` en `openContactForm`, `opener.focus()` en `closeQuoteForm`; trampa: listener keydown Tab que cicla entre primer/último focusable de `.quote-modal`; o `inert` en `.page-wrap` | movil-estado-form-spa-error.png |
| Modal | `.quote-close` "×" | 2.5.8 / 2.5.5, 1.1.1 | baja | 32x32 px: cumple 24 px, no llega a 44. El "×" es carácter de texto (el sitio usa `.ico` para iconos) y tiene `aria-label`, así que es accesible | `.quote-close{width:44px;height:44px}` en móvil y usar `<i class="ico ico-x" aria-hidden="true">` | movil-estado-form-spa-error.png |
| Modal SPA | Validación nativa (`novalidate` + `reportValidity()`) | 3.3.1, 3.3.3, 3.1.1 | baja | El foco va al primer campo inválido y el navegador muestra su mensaje, en el idioma del navegador (en la prueba salió "Please fill out this field." por Chromium en inglés); no hay `aria-invalid` ni texto persistente; `#quote-status` es `role=status` aria-live polite (bien) | Opcional: mensajes propios `setCustomValidity('Escribe tu nombre')` y `aria-invalid="true"` al fallar | movil-estado-form-spa-error.png |
| Landings | Formulario `#lp-status` (`role=status aria-live=polite`) | 3.3.1, 3.3.3, 4.1.3 | media | Bien: labels envolventes y anuncio por aria-live. Mal: errores genéricos ("Escribe tu nombre."), sin mover el foco al campo ni `aria-invalid`; tras enviar se reemplaza todo el `form.innerHTML` (el foco se pierde) | En cada rama: `form.nombre.setAttribute('aria-invalid','true'); form.nombre.focus();` y al éxito `status.setAttribute('tabindex','-1'); status.focus()` | movil-estado-form-landing-error.png |
| Landings | Foco de `.lp-field input/textarea` (`outline:none` + borde rgba(242,236,227,.7) y sombra .12) | 2.4.7, 1.4.11 | baja | Sobre fondo oscuro el borde claro de 1 px se ve; es el indicador mínimo aceptable (>3:1), pero sutil | `.lp-field input:focus-visible,.lp-field textarea:focus-visible{outline:2px solid var(--bg);outline-offset:2px}` | movil-estado-foco-teclado.png |
| Landings (12) | `a.nav-logo[aria-label="Inicio PRECISSA INSTITUTE"]` (axe label-content-name-mismatch) | 2.5.3 Label in Name | media | Una usuaria de voz que diga "PRECISSA INSTITUTE" no activa el enlace: el nombre accesible debe empezar por el texto visible | `aria-label="PRECISSA INSTITUTE, ir al inicio"` (o quitar el aria-label) | pc-landing-plasmapen.png |
| Landings (12), home, SPA, 404 | Sin `<main>` (axe landmark-one-main y region) y sin skip link en ninguna página | 1.3.1, 2.4.1 | media | Quien navega con lector de pantalla/teclado repite el menú en cada página; /cursos/, /sobre/ y legales sí tienen `<main>` | Envolver contenido en `<main id="contenido">`; `<a class="skip" href="#contenido">Saltar al contenido</a>` y CSS `.skip{position:absolute;left:-9999px}.skip:focus{left:12px;top:12px;z-index:999;background:#241D17;color:#fff;padding:10px 14px}`. En index.html el `main` debe cubrir `.page-wrap` y las vistas | pc-home.png |
| SPA vistas (#cursos, #tienda, #aula) | Sin `h1` visible (axe page-has-heading-one); las vistas usan h2 por decisión documentada en CLAUDE.md | 1.3.1, 2.4.6 | baja | Con lector, la vista no tiene h1. Es una decisión SEO intencionada (solo un h1 por documento); se puede conciliar sin romperla | Al navegar, mover el foco al h2 de la vista: `h2.setAttribute('tabindex','-1'); h2.focus()` y actualizar `document.title` (ya se actualiza) | pc-cursos.png |
| Todas | Eyebrows en mayúsculas 10,5-11 px (`.eyebrow`) | 1.4.3 | alta | #A86B4E sobre #F2ECE3 da 3,66:1 (fallo) y 10,5 px es texto pequeño: exige 4,5:1. El color `--muted` 3,95 sobre `--bg2` también falla | `.eyebrow.accent{color:var(--accent-dark)}` (6,01:1 sobre bg; 5,24 sobre bg2; 7,06 sobre blanco). En fondos `--bg2` usar `--ink-soft` en vez de `--muted` | pc-home.png |
| Todas | Enlaces en `<p>` de legales (`p > a`, color accent) | 1.4.3, 1.4.1 | media | 3,66:1 con 16 px normal y se distinguen de prosa solo por color en algunos casos | `a{color:var(--accent-dark);text-decoration:underline;text-underline-offset:2px}` en `assets/legal.css` | pc-aviso-legal.png |
| Home | Pie `.footer-copy`, `.footer-nap-hours`, `.footer-col-title`, `.footer-logo-sub` | 1.4.3 | media | Texto crema con alfa .35-.55 sobre #241D17 da 2,9-3,9:1; son datos útiles (horario) | Subir alfa: `.footer-copy{color:rgba(242,236,227,.65)}`, `.footer-nap-hours,.footer-col-title,.footer-logo-sub{color:rgba(242,236,227,.62)}` (aprox. 5-6:1) | pc-home.png |
| 404 | `a[href^="tel:"]` | 1.4.1 | media | Enlace del teléfono sin subrayado, 1,23:1 con el texto que lo rodea: solo se distingue por color casi igual | `a{text-decoration:underline}` o `color:var(--accent-dark)` | (sin captura) |
| Home (móvil) | Zonas táctiles: `.hero-ig` 82x20, `.footer-link` 152x21, `.footer-nap-line` 152x20, `.hamburger` 24x24, `Acceder` 72x30, `.nav-logo` 200x28 | 2.5.8 (24 px), 2.5.5 (44, AAA) | media | 19 elementos < 24 px de alto en la home a 375 px (enlaces del pie). Hamburguesa justo en el mínimo de 24 px | `.footer-link,.footer-nap-line{display:block;padding:12px 0}` y `.hamburger{width:44px;height:44px}` `.hero-ig{padding:12px 0}` | movil-home.png |
| Landings (móvil) | Migas "Inicio"/"Cursos" 28x12 y 37x12, `a` del pie 21 px, checkbox rgpd 13x13, "política de privacidad" 113x14 | 2.5.8 | media | Quedan por debajo de 24 px sin espacio compensatorio | `.breadcrumb a{display:inline-block;padding:6px 4px}`; `.lp-rgpd{padding:8px 0}` (la etiqueta envuelve el checkbox, así que su zona real es la fila) y `.footer a{display:block;padding:10px 0}` | movil-landing-plasmapen.png |
| SPA /#cursos | Pestañas `.cursos-pub-filter` (buttons 39-151 x 43) | 2.5.8 | baja (bien) | 43 px de alto: cumple 24 y casi 44. Verdadero `<button>` y foco por defecto visible | `.cursos-pub-filter{min-height:44px}` | movil-cursos.png |
| SPA /#tienda | `.filter-chip` 39x49 (alto OK), pero spans (ver fila 2) | 2.5.8 | baja | Tamaño correcto, problema de teclado | (ver fila 2) | movil-spa-tienda.png |
| Todas | Foco visible | 2.4.7, 2.4.11 | baja (bien en general) | No hay `:focus-visible` propio; se usa el anillo nativo (outline auto 1 px, visible en `.btn`, filtros, enlaces del pie y botón del cajón). Excepciones con `outline:none`: `.cursos-search-input` (solo cambia el borde a --ink, 1 px, sombra al 6%), `.aula-input`, `.newsletter-input`, `.adm-modal-search`, `.res-input` | `:focus-visible{outline:2px solid var(--accent-dark);outline-offset:2px}` global y quitar `outline:none` o añadir `:focus-visible` a esos inputs | pc-estado-foco-teclado.png |
| Landings + legales | FAQ `.faq-item > .faq-q/.faq-a` | 1.3.1 | baja | Confirmado: bloques estáticos (div/div), no acordeones, sin `details`; no hay problema de teclado/ARIA. Las preguntas son `div`, no encabezados, por lo que no aparecen en la navegación por encabezados. No tocar el HTML sin actualizar el JSON-LD (regla CLAUDE.md) | Opcional: `<h3 class="faq-q">` (mismo CSS) | movil-estado-faq.png |
| Home/SPA | Animaciones | 2.3.3 (AAA) / buena práctica | baja (bien) | index.html tiene `@media (prefers-reduced-motion: reduce)` global (L2271) que anula animaciones/transiciones y el scroll suave. Las landings, /cursos/, /sobre/ y 404 no tienen la media query, pero solo usan transiciones de color/transform de 0,12-0,18 s en hover | Añadir el mismo bloque `@media (prefers-reduced-motion:reduce){*{transition-duration:.01ms!important;animation-duration:.01ms!important}}` a las landings | n/a |
| Todas | Imágenes (alt) | 1.1.1 | baja | Home: 12 img, 4 con alt="" decorativas (sellos, marca de agua, portada de lección) y 8 informativas con alt. No hay `<img>` sin atributo alt. Las portadas de tarjetas usan alt="" y el título está al lado: correcto. Alts flojos: "Editorial PRECISSA INSTITUTE" (hero y testimonial, L972/1115) y "Profesora de PRECISSA INSTITUTE" no describen la imagen | Describir la foto, p. ej. `alt="Alumna practicando con el equipo en cabina de PRECISSA INSTITUTE"`; en la copia en gris del testimonio usar `alt=""` si es decorativa | movil-home.png |
| Todas | Encabezados, lang y títulos | 1.3.1, 3.1.1, 2.4.2 | baja (bien) | `lang="es-ES"` en las 10 páginas, un solo h1 visible por página y títulos únicos. Orden sin saltos (home: h1 h2 h2 h2 h2 h3...). Sin saltos h2->h4. En vistas SPA el h1 oculto sigue en DOM (ver fila h1) | — | n/a |

## Contraste
Calculado con la fórmula WCAG (luminancia relativa), tokens de `:root` de index.html.

| Texto | Fondo | Ratio | Veredicto |
|---|---|---|---|
| --muted #726A5D | --bg #F2ECE3 | 4,54 | Pasa AA (justo) |
| --muted #726A5D | --bg2 #E6DDCC | 3,96 | Falla texto normal; pasa solo texto grande |
| --muted #726A5D | blanco | 5,34 | Pasa |
| --muted #726A5D | --accent-soft #ECDDD0 | 4,02 | Falla |
| --accent #A86B4E | --bg #F2ECE3 | 3,67 | Falla texto normal (pasa solo >=18,66 px/ 24 px bold o componentes UI 3:1) |
| --accent #A86B4E | --bg2 #E6DDCC | 3,19 | Falla |
| --accent #A86B4E | blanco | 4,30 | Falla por 0,2 (se ve en tags, precios, pestaña activa de la tab-bar) |
| --accent #A86B4E | --accent-soft #ECDDD0 | 3,24 | Falla (`.chip-accent`) |
| --accent-dark #7E4C36 | --bg #F2ECE3 | 6,01 | Pasa |
| --accent-dark #7E4C36 | --bg2 #E6DDCC | 5,24 | Pasa |
| --accent-dark #7E4C36 | blanco | 7,06 | Pasa (AAA) |
| --accent-dark #7E4C36 | --accent-soft | 5,32 | Pasa |
| Blanco sobre --accent #A86B4E (`.newsletter-btn`) | | 4,30 | Falla (`.btn-clay` ya usa accent-dark: 7,06, bien) |
| --ink-soft #544A40 | --bg / --bg2 / blanco | 7,36 / 6,41 / 8,64 | Pasa |
| --ink #241D17 | --bg / --bg2 / blanco | 14,16 / 12,33 / 16,63 | Pasa (AAA) |
| Texto claro sobre --ink: --bg #F2ECE3 | #241D17 | 14,16 | Pasa |
| --bg2 sobre --ink | | 12,33 | Pasa |
| Pie: rgba(242,236,227,.45) -> #817A73 | #241D17 | 3,93 | Falla (11-13 px) |
| Pie: rgba(.35) -> #6C655E (`.footer-copy`) | #241D17 | 2,89 | Falla |
| Pie: `--muted` (`.footer-logo-sub`) | #241D17 | 3,11 | Falla |
| Eyebrows 10,5-11 px mayúsculas, color accent | --bg | 3,66 | Falla ratio; tamaño 10,5 px es pequeño (1.4.3 no fija mínimo de px, pero obliga a 4,5:1) |
| Eyebrows `.eyebrow-muted` | --bg2 | 3,95 | Falla |
| Eyebrows con accent-dark propuesta | --bg / --bg2 / blanco | 6,01 / 5,24 / 7,06 | Pasaría |

## Rendimiento

Peso y causas:

| Recurso | Tamaño | Notas |
|---|---|---|
| `index.html` | 358.280 B (82.695 B con gzip), 6.448 líneas | CSS inline 116.776 B (33%), JS inline 142.865 B (40%), HTML 89.065 B (27%). Sin base64 incrustado |
| Scripts externos propios (`assets/js`, 10 archivos) | ~85 KB (26 KB gzip); `courses-data.js` 45.199 B | 11 `<script>` síncronos sin `defer` antes de `</body>` + supabase-js desde jsDelivr |
| `cursos/index.html` / landing plasmapen / sobre / 404 | 29.557 / 32.662 / 5.830 / 3.069 B | Landing: 88 KiB totales en Lighthouse, sin imágenes, sin JS propio relevante |
| Imágenes más pesadas | `favicon-512.png` 249.698; `IMG-20260522-WA0032.jpg` 215.505 (1392x752); `og-image.jpg` 215.505 (idéntico: duplicado); `anatomia-fisiologia-cutanea.jpg` 123.865; `higiene-facial-profunda.jpg` 120.571; `area-facial.jpg` 114.786 (1280x720); `area-corporal.jpg` 86.498; `profesora.jpg` 75.092 (1207x1303); `le-petit.jpg` 74.721 (800x1200); `seal-ss.png` 49.448 (ya hay `.webp` 12 KB) | Todo JPG/PNG, ninguno en WebP/AVIF salvo los sellos |
| Imágenes en la home | 12 `<img>`: 11 con `loading="lazy"`, la imagen del héroe correctamente `fetchpriority="high"` sin lazy; 8 de 12 sin width/height | La imagen del héroe se pinta a ~412x520 px en móvil pero se descarga a 1392 px: Lighthouse estima 137-140 KiB de ahorro (image-delivery) |
| Fuentes | Google Fonts con `display=swap` (L138), preconnect a googleapis y gstatic | La hoja CSS de fuentes es render-blocking: Lighthouse la señala (~780 ms ahorrables; sin red aquí el valor es una medida de timeout, tómalo como orden de magnitud) |
| Terceros | Google Fonts, jsDelivr (supabase-js), Cloudflare Insights (defer) | Todos ellos fallaron aquí por falta de red |
| Caché | En local sin cabeceras (`cacheLifetime 0`); en producción Cloudflare asigna sus valores | No medible aquí |

Lighthouse móvil (Chromium, throttling por defecto, sin red externa):

| Métrica | Home `/` | Landing `/cursos/plasmapen-valencia/` |
|---|---|---|
| Rendimiento | 58 | 99 |
| Accesibilidad | 93 | 95 |
| Buenas prácticas | 96 | 96 |
| SEO | 92 | 100 |
| FCP / LCP | 3,2 s / 5,4 s | 1,5 s / 1,8 s |
| TBT / CLS | 530 ms / 0 | 0 ms / 0 |
| Speed Index / TTI | 4,6 s / 5,4 s | 2,4 s / 1,8 s |
| Peso total | 740 KiB | 88 KiB |

Cinco oportunidades principales, home:
1. Reducir JS sin usar/minificar: 109 KiB sin usar (~600 ms) y 46 KiB sin minificar; 142 KB de JS inline que incluye aula, admin y editor que la home no necesita.
2. Imagen del héroe: servirla como WebP/AVIF y con `srcset` (137 KiB de ahorro; es el elemento LCP).
3. CSS sin usar (54 KiB) y sin minificar (12 KiB): 116 KB inline de los que la home usa una parte.
4. Hoja de Google Fonts render-blocking (~530 ms): `media="print" onload="this.media='all'"` o autoalojar las dos familias.
5. Caché larga para imágenes y JS (295 KiB de ahorro estimado) y SEO/accesibilidad menores que Lighthouse marca: enlaces `<a>` sin `href` en `.lv-end-cta-main/.lv-end-cta-ghost` (crawlable-anchors), contraste y falta de `main`.

Cinco oportunidades principales, landing (rendimiento 99, quedan solo detalles): 
1. Google Fonts render-blocking (~690-780 ms estimados, es lo único relevante).
2. Cadena de dependencias de red (hoja de fuentes -> woff2): precargar los dos pesos principales.
3. `label-content-name-mismatch` en `.nav-logo`.
4. Falta `<main>` (landmark-one-main).
5. Contraste de eyebrows y pie.

5 acciones recomendadas (ordenadas por impacto):
1. Cambiar `--accent` por `--accent-dark` en todo texto pequeño (eyebrows, tags, precios, enlaces, tab activa) y subir los alfa del pie: corrige ~95% de las violaciones de axe de una vez.
2. Hacer operables con teclado los elementos clave de la SPA: filtros de tienda, tarjetas de producto y de aula, `aula-link`, migas y pestañas (button/a con rol), más Escape y trampa de foco en cajón y modal con retorno de foco.
3. Añadir `<main>` + skip link y arreglar el aria-label del logo en landings (se hace con una pasada sobre las 12 landings y el generador `gen-landings.py`).
4. Optimizar la imagen del héroe (WebP + `srcset`), borrar duplicado `og-image.jpg`/`IMG-...WA0032.jpg` o enlazar uno, usar `seal-ss.webp` en lugar de `seal-ss.png`, y dar width/height a las 8 imágenes sin dimensiones.
5. Cargar JS por vista: separar admin/aula/lección del script inline, añadir `defer` a los 11 scripts y no bloquear con la hoja de Google Fonts.

## Qué está bien
1. Base semántica sólida: `lang="es-ES"` en todas las páginas, títulos únicos por página, un único h1, sin saltos de nivel y sin `<img>` sin atributo `alt` (decorativas con `alt=""`).
2. Teclado en lo esencial: botones nativos en filtros de /#cursos, CTAs y menú; el cajón móvil y el modal tienen botón de cierre con `aria-label`; el modal tiene `role="dialog" aria-modal aria-labelledby`, foco inicial en el primer campo y Escape que cierra.
3. Formularios con `<label>` envolviendo cada campo, `autocomplete` correcto (name, email, tel), `required` y zona de estado con `role="status" aria-live="polite"` en el modal y en las landings.
4. `prefers-reduced-motion` global en la SPA, flechas/chevrones como iconos `aria-hidden`, y la regla de 24 px mínimo cumplida en los filtros de /#cursos (43 px de alto) y en los botones principales.
5. Rendimiento sólido en las landings (Lighthouse 99, 88 KiB, CLS 0) y buena higiene en la home: héroe con `fetchpriority="high"` y dimensiones, 11 de 12 imágenes con `loading="lazy"`, `display=swap` en las fuentes, sin base64 incrustado, FAQ estáticas sin JS y gzip del HTML en 82 KB.
