# Auditoría de diseño y usabilidad · PRECISSA INSTITUTE

Fecha: 8 de octubre de 2026 · Alcance: web pública (home y vistas de la SPA, catálogo `/cursos/`, 12 landings, `/sobre/`, páginas legales, 404) y pantalla de acceso al aula.

Material: 31 capturas de página completa a 375 px y 1440 px en `capturas/` (páginas, menú móvil abierto, formularios con error y con éxito, FAQ, foco de teclado) más `capturas/notas-automaticas.json`. Informes íntegros de los tres revisores en `revisores/` (A diseño, B usabilidad, C accesibilidad).

Límites de la auditoría:
- El aula con un curso abierto no se ha podido capturar: no hay acceso a Supabase desde el entorno. Se ha revisado por código.
- Las capturas se hicieron sin las fuentes de Google (sin red): la tipografía que se ve es la de respaldo. No se ha contado como fallo.
- Las capturas `*-spa-curso-plasmapen.png` muestran la home: el identificador real del curso es `plasma-pen`, y con uno inexistente la web vuelve a la home sin avisar (hallazgo 26).
- La captura `movil-estado-form-spa-exito.png` muestra en realidad un segundo error de validación (la pregunta "¿Eres profesional?" es obligatoria). El éxito se reprodujo con Playwright.

---

## 1. Resumen para la propietaria

1. La web tiene identidad propia (paleta tierra, tipografía editorial, landings con contenido real) y una base técnica sana: un solo h1 por página, imágenes con alt, formularios con etiquetas, 99 sobre 100 de rendimiento en las landings. No hace falta rediseñar.
2. Lo que más frena ventas es el camino hasta pedir información: 7 toques en móvil y unos 9 clics en ordenador, sin ver nunca precio ni fechas, y con WhatsApp como único canal de envío. En ordenador, quien no tiene WhatsApp vinculado se queda atascada.
3. Se pierden contactos: solo el nombre es obligatorio. Si la persona no pulsa "Enviar" en WhatsApp, te llega un correo con un nombre y nada más, y si ese correo falla nadie se entera.
4. En móvil, la primera pantalla de la home es solo una foto: el titular queda tapado por la barra inferior y no hay ningún botón a la vista. El botón más visible de la cabecera es "Acceder", pensado para alumnas ya matriculadas, no para captar nuevas. Además se sale del borde.
5. Las 12 landings, que son las páginas que mejor convencen, no se enlazan desde el menú, la home ni el catálogo de la SPA. Solo desde el pie.
6. Los testimonios de la home son de alumnas de Bilbao, Madrid y Sevilla, dos sin foto y una con la misma modelo del hero. Si no son reales hay que retirarlos: las reseñas inventadas están prohibidas y son un riesgo legal.
7. La web parece "plantilla" por el acabado, no por el diseño: títulos en negrita sintética en toda la SPA (la fuente solo tiene un peso), la misma foto de cejas en 21 de 23 tarjetas de curso, tres cabeceras y cuatro pies distintos, cinco estilos de botón principal, mensajes de error en inglés y una tienda con un producto sobre un degradado.
8. Accesibilidad: el color de acento no cumple el contraste mínimo en texto pequeño (rótulos, etiquetas de tarjeta, precios, enlaces legales). Se arregla usando el acento oscuro, que ya existe en la paleta. Varias cosas no funcionan con teclado: la tienda, el alta y la recuperación de contraseña del aula, el desplegable "Cursos" en ordenador y el cierre del menú móvil.
9. Rendimiento: la home se queda en 58 sobre 100 en móvil porque carga de golpe todo el código del aula y del panel de administración y la foto del hero a tamaño completo. Las landings van perfectas.
10. Urgente: contactos que se pierden (3), WhatsApp como único canal (2), primera pantalla móvil y botón de cabecera (4), testimonios (6), contraste y teclado (8). Todo lo demás es pulido que se puede hacer por fases pequeñas.

Pendiente de decisión tuya antes de tocar código: si los testimonios son reales, si se publica precio (aunque sea "desde") y fechas de convocatoria, y si quieres foto real del RF-200 y de la cabina.

---

## 2. Hallazgos por gravedad

Gravedad: **alta** = impide o frena directamente pedir información, o es un riesgo legal; **media** = fricción, inconsistencia visible o incumplimiento WCAG; **baja** = pulido.

| # | Página | Elemento | Grav. | Por qué importa | Propuesta | Captura |
|---|---|---|---|---|---|---|
| 1 | Modal SPA y 12 landings | Formulario: solo el nombre obligatorio; la copia por correo se envía sin comprobar y los fallos se ignoran | Alta | Si la persona no pulsa "Enviar" en WhatsApp, llega un correo con un nombre sin forma de responder; si FormSubmit falla, el contacto se pierde en silencio | Teléfono **o** email obligatorio ("Para poder responderte, déjanos teléfono o email"). Validar `res.ok` y `json.success` también en la copia; si falla y WhatsApp no se abrió, aviso con el teléfono | movil-estado-form-landing-error, pc-estado-form-spa-error |
| 2 | Modal SPA y landings | WhatsApp como único canal de envío | Alta | En ordenador, sin WhatsApp Web vinculado la página wa.me pide descargar la app y la visitante abandona | Segundo botón "Prefiero que me llaméis o me escribáis" que envía solo por correo con confirmación real; en ordenador al mismo nivel que el de WhatsApp | pc-estado-form-landing-exito |
| 3 | Todas las fichas | Sin precio ni fechas en ninguna página; sin forma de reservar plaza | Alta | Quien compara academias quiere saber cuánto cuesta y cuándo empieza antes de dar su nombre | "Precio desde X €" o rango, y "Próxima convocatoria: mes" o "grupos cada mes". Si no se publica precio, decir el motivo y el plazo de respuesta. Decisión de negocio | pc-cursos, movil-landing-plasmapen |
| 4 | Home móvil | `.hero-right` de 520 px; h1 tapado por la barra inferior; "Ver cursos" fuera de pantalla | Alta | En los 3 primeros segundos no se ve qué es la academia ni hay acción posible | Foto a 300 px (o detrás del texto) y h1 + subtítulo + dos botones por encima del pliegue | movil-home, movil-estado-foco-teclado |
| 5 | Home y SPA | Cabecera: único botón oscuro "Acceder"; sin "Solicitar información" ni teléfono (solo en el pie, a 6.800 px) | Alta | La acción más visible sirve a quien ya pagó, no a quien decide | Hero: `btn-dark` "Solicitar información" + `btn-outline` "Ver cursos". Cabecera: píldora con el teléfono (como en las landings) y "Acceder" como enlace secundario | pc-home, movil-home |
| 6 | Cabecera móvil | "Acceder" se sale 5 px del borde; hamburguesa de 24×24 px | Alta | Botón cortado = web rota; zona táctil mínima | Hamburguesa 44×44, botón de 40 px de alto, logo más estrecho en móvil | movil-estado-foco-teclado |
| 7 | Home | Testimonios: ciudades Bilbao/Madrid/Sevilla, dos degradados sin foto, uno con la modelo del hero en blanco y negro | Alta | Si no son reales: publicidad engañosa (prohibida) y pérdida de confianza | Confirmar. Si no son reales: retirar y mostrar nota y número de reseñas de Google con enlace; nunca reutilizar la foto del hero | pc-home, movil-home |
| 8 | Home, menú, catálogo SPA | Las 12 landings no se enlazan salvo desde el pie | Alta | La visitante nunca ve temario, FAQ ni ficha completa | "Ver temario y detalles" en la tarjeta SPA de cada curso con landing; enlaces a las landings desde las tarjetas de área | movil-cursos, pc-cursos |
| 9 | SPA (toda) | Títulos sin `font-weight`: heredan 700 y Instrument Serif solo tiene 400 (negrita sintética). Las landings sí usan 400 | Alta | Es la mayor diferencia visual entre "plantilla" y "editorial" entre SPA y landings | `h1,h2,h3,h4 { font-weight: 400 }` en el bloque base de index.html | pc-home vs pc-landing-plasmapen |
| 10 | SPA #cursos | Portada `le-petit.jpg` (cejas) en 21 de 23 cursos cuando no cargan las portadas de Supabase | Alta | La misma foto de cejas en HIFU, láser o maderoterapia | Portada de respaldo por categoría (`area-*.jpg`); pedir una foto real por categoría | pc-estado-form-spa-error |
| 11 | Landings, /cursos/, /sobre/, legales | Tres cabeceras y cuatro pies distintos; landings sin enlaces legales; /sobre/ y legales sin menú ni teléfono | Alta | Quien entra por Google a una landing no llega al catálogo ni al aula; incoherencia de marca | Cabecera común (logo · Cursos · Aparatología · Sobre · teléfono · Acceder) y el pie de la SPA en todas | pc-landing-plasmapen, pc-sobre, pc-aviso-legal |
| 12 | Todas | Contraste: acento #A86B4E sobre crema 3,66:1, sobre blanco 4,30:1, sobre beige 3,19:1 en texto de 10,5-13 px (rótulos, etiquetas de tarjeta, precios, enlaces legales, pestaña activa); `--muted` sobre beige 3,95:1; pie oscuro 2,9-3,9:1 | Alta | Incumple WCAG AA; 15-26 nodos por página según axe | Texto pequeño en acento → `--accent-dark` (#7E4C36: 6,0 / 7,1 / 5,2). Sobre `--bg2` usar `--ink-soft`. Pie: alfa 0,62-0,65 | pc-home |
| 13 | Tienda, aula, SPA | Sin teclado: filtros de la tienda (span), tarjetas de producto (div), "Date de alta" y "¿Olvidaste la contraseña?" (span), tarjetas del aula (article), migas (span), pestañas del aula | Alta | Sin ratón no se puede abrir un producto ni darse de alta | `<button>` / `<a href>` reales con rol; migas como enlaces | movil-spa-tienda, movil-spa-aula-login |
| 14 | Menú móvil y desplegable PC | Cajón: Escape no cierra, no atrapa el foco, sin `aria-expanded`. Desplegable "Cursos": solo `:hover`; con Tab se salta | Alta | Teclado y lectores de pantalla no llegan a las categorías ni cierran el menú | Escape, trampa de foco, foco al abrir y retorno al cerrar; `:focus-within` y `aria-haspopup` en el desplegable | movil-estado-menu-abierto, pc-estado-foco-teclado |
| 15 | Todas | Cinco estilos de botón principal (`.btn-dark`, `.cursos-pub-card-cta`, `.lp-submit` crema, `.btn-clay` terracota, `.newsletter-btn`) | Alta | Rompe "oscuro = acción principal" | Tres: `btn-dark`, `btn-light` (sobre oscuro), `btn-outline`; eliminar `.btn-clay` | pc-estado-form-spa-error, pc-estado-form-landing-error |
| 16 | Modal SPA | Validación nativa del navegador: burbujas en inglés, de una en una; pregunta "¿Eres profesional?" obligatoria; 910 px de contenido en 747 (botón fuera de pantalla); campos de 14 px (zoom en iPhone) | Media | Parece error técnico; abandono en móvil | Misma validación que las landings con mensaje bajo el campo, `aria-invalid` y foco; pregunta opcional; `font-size:16px`; botón fijo al pie | movil-estado-form-spa-error, pc-estado-form-spa-error |
| 17 | Landings | Error en línea de 13 px bajo el botón, sin marcar campo; al enviar desaparece el formulario y no se puede corregir | Media | En móvil el mensaje pasa desapercibido | Mensaje junto al campo, borde de error, foco; enlace "Enviar otra consulta" | movil-estado-form-landing-error, movil-estado-form-landing-exito |
| 18 | Todas | Sin `:focus-visible` propio; botón oscuro sin anillo visible; inputs con `outline:none` | Media | Quien navega con teclado pierde el foco en el hero | `:focus-visible { outline: 2px solid var(--accent-dark); outline-offset: 3px }` global; sobre oscuro `outline-color: var(--bg)` | pc-estado-foco-teclado |
| 19 | Navegación | El aula tiene cinco nombres ("Acceder", "Aula", "Mi aula", "Acceso alumnado", "Entrar al área docente"); este último lleva al catálogo | Media | Una alumna nueva no sabe dónde entrar; "área docente" suena a profesoras | Un solo nombre: "Aula" / "Entrar al aula". El botón de la home pasa a "Ver cursos" | movil-estado-menu-abierto, pc-spa-aula-login |
| 20 | Textos | "fechas, precio y modalidad" en modal, landings y WhatsApp | Media | Todo es presencial; sugiere versión online | "fechas, precio y plazas disponibles" | movil-estado-form-spa-error |
| 21 | Aula (login) | Errores de Supabase en inglés; cambio de contraseña con `prompt()`; sin explicar que hay que usar el email de la matrícula | Media | Llamadas de "¿cómo entro?"; el `prompt()` parece phishing | Traducir los 4 errores comunes; formulario propio; subtítulo "Entra con el mismo email que nos diste al matricularte" | pc-spa-aula-login |
| 22 | Tienda | Un producto, "Ordenado por relevancia", filtros que llevan a "No hay equipos"; tarjeta sobre degradado; en móvil rejilla de 2 columnas con una vacía; ficha RF-200 enlaza a un curso inexistente | Media | Comunica "tienda sin abrir" | Con menos de 4 productos: sin filtros ni meta, ficha destacada horizontal con foto real; una columna en móvil; enlazar al curso real | pc-spa-tienda, movil-spa-tienda |
| 23 | Landings (12) | Sin ninguna imagen en 5.000-7.000 px; no se dice quién imparte | Media | Se lee como documento; en formación presencial la profesora es el producto | Hero a dos columnas con la foto de su área; bloque "Imparte" antes del formulario; galería "Así es el aula" | pc-landing-plasmapen, pc-landing-microblading |
| 24 | Landings y /cursos/ | Cabecera a 1100 px y contenido a 920: logo desalineado 90 px | Media | Se nota a simple vista | Mismo ancho para cabecera, migas, contenido y pie | pc-landing-plasmapen |
| 25 | /cursos/ | 23 cursos sin botón de información; 9 sin enlace a ficha; solo teléfono al final | Media | Página indexable sin forma de pedir información | Enlazar cada curso; botón "Solicitar información" por categoría | pc-cursos, movil-cursos |
| 26 | SPA | `#curso/<id>` inexistente devuelve la home sin aviso; con id válido cambia a `#cursos` y desplaza 3.500 px | Media | Un enlace mal escrito compartido por Instagram deja a la persona en la home | Catálogo con aviso "No encontramos ese curso"; resaltar la tarjeta unos segundos | movil-spa-curso-plasmapen |
| 27 | Home | Marca de agua detrás del titular del hero (0,13) y cortada en /sobre/ y legales | Media | Compite con el texto | Hero: opacidad 0,07 y desplazada; secundarias: 0,05 o al pie. La propietaria quiere conservarla | pc-home, pc-sobre |
| 28 | Home | Tarjeta oscura "Aprende" con 150 px vacíos; newsletter sobre degradado oliva fuera de paleta | Media | Relleno visible | Imagen en la tarjeta o quitar `min-height`; newsletter sobre `--ink` | pc-home |
| 29 | Todas | Sin `<main>` ni enlace "Saltar al contenido" en SPA, landings y 404; `aria-label` del logo en landings no empieza por el texto visible | Media | Lectores de pantalla y control por voz | `<main id="contenido">`, skip link, `aria-label="PRECISSA INSTITUTE, ir al inicio"` | pc-home |
| 30 | Móvil | Zonas táctiles por debajo de 24 px: enlaces del pie (20-21 px), migas (12 px), checkbox RGPD (13 px), "(opcional)" a 10 px | Media | Toques fallidos; WCAG 2.5.8 | `display:block; padding:10-12px 0` en enlaces de pie y migas; `.lp-rgpd{padding:8px 0}`; etiquetas a 12 px mínimo | movil-landing-plasmapen |
| 31 | SPA | `.btn-outline:hover` se vuelve idéntico al primario | Media | Pierde jerarquía al pasar el ratón | Hover con `--soft` como en las landings | pc-home |
| 32 | Home | JSON-LD `logo` apunta a la foto de la modelo (`og-image.jpg`) | Baja | Google puede mostrar esa cara como logo | `logo` → `assets/seal-ss-lg.webp` | — |
| 33 | Home y catálogo | "→" en el nivel de 3 cursos en `courses-data.js`; "✓" de éxito y emojis en revisiones como texto | Baja | Glifos que Manrope no tiene: descentrados | "Inicial a Avanzado"; `.ico-check` | pc-cursos, pc-estado-form-landing-exito |
| 34 | Varias | Cursiva fuera de hero y cita (ficha, teléfono, precios, pies de foto, "Sobre *PRECISSA INSTITUTE*"); eyebrows con "· " en modal y producto; punto final en eyebrows de /cursos/; 7 escalas de eyebrow; radios de 10 y 6 px en landings y /cursos/ | Baja | Contradice el sistema visual documentado | Normalizar según CLAUDE.md §7 | pc-landing-plasmapen, pc-sobre, pc-estado-form-spa-error |
| 35 | Home | Rendimiento móvil 58: 142 KB de JS inline (aula, admin, editor) y 117 KB de CSS cargados en la home; hero a 1392 px para 412 px pintados; `og-image.jpg` duplica el hero | Baja (no bloquea) | Carga lenta en móvil con datos; Google lo mide | Hero en WebP con `srcset`; separar el JS de aula/admin en archivos cargados por vista; `defer` en los 11 scripts | pc-home |
| 36 | SPA | Textos de desarrollador visibles si falla la carga ("Edita assets/js/courses-data.js", "Configura Supabase") | Baja | La web parece a medio hacer | Textos para la usuaria; detalle técnico a `console.warn` | — |
| 37 | Menú móvil | Sin "Inicio", "Sobre" ni teléfono; "Acceso alumnado" y "Acceder" duplicados | Baja | Lo primero que se mira para contactar | Añadir Inicio, Sobre y "Llamar 601 05 67 06"; un solo acceso al aula | movil-estado-menu-abierto |
| 38 | Aviso legal | "Última actualización: 27 de mayo de 2026" con la dirección cambiada en octubre | Baja | Dato incoherente | Fecha real | pc-aviso-legal |

Qué está bien y no hay que tocar: paleta y ritmo claro/oscuro; botones píldora con iconos SVG; filtros como pestañas; contenido y estructura de las landings (ficha oscura, FAQ, cursos relacionados); pie de la SPA con todos los datos del negocio; flujo del formulario con WhatsApp prellenado y copia por correo; 404 y estados vacíos del aula; `lang`, h1 único, alt en imágenes, `prefers-reduced-motion` en la SPA; botón atrás funcional en la SPA.

---

## 3. Plan de cambios (commits pequeños, en orden)

Cada commit pasa `/desplegar` (JSON-LD, JS, sitemap, enlaces, FAQ) y vuelve a lanzar el script de capturas (`capturas.cjs`) para comparar antes y después. Los que tocan `index.html` llevan además la prueba de sintaxis y una captura de cada vista de la SPA.

| Orden | Commit | Hallazgos | Validación extra |
|---|---|---|---|
| 1 | **Formularios que no pierden contactos**: teléfono o email obligatorio, validación propia en el modal (mensajes en español bajo el campo, foco, `aria-invalid`), pregunta "¿profesional?" opcional, campos a 16 px, botón alternativo "Prefiero que me llaméis" por correo con confirmación real, textos "fechas, precio y plazas", "Enviar otra consulta", icono SVG de éxito. Modal y `gen-landings.py` + 6 landings manuales | 1, 2, 16, 17, 20, 33 | Envío simulado con FormSubmit falso: error, éxito por WhatsApp, éxito por correo, fallo de red |
| 2 | **Cabecera y hero**: píldora con teléfono en la cabecera, "Acceder" secundario, hero con "Solicitar información" + "Ver cursos", foto del hero a 300 px en móvil, hamburguesa 44 px, botón sin recorte, "Aula" como único nombre, "Entrar al área docente" → "Ver cursos", menú móvil con Inicio, Sobre y teléfono | 4, 5, 6, 19, 37 | Captura móvil del pliegue; ancho de cabecera a 320, 375 y 414 px |
| 3 | **Contraste y foco**: texto pequeño en `--accent-dark`, `--ink-soft` sobre beige, alfa del pie, `:focus-visible` global, hover del botón de borde | 12, 18, 31 | axe-core en las 10 páginas: 0 violaciones de `color-contrast` |
| 4 | **Teclado**: cajón móvil (Escape, trampa y retorno de foco, `aria-expanded`), desplegable con `:focus-within`, filtros y tarjetas de la tienda como botones y enlaces, enlaces del aula como `<button>`, migas como `<a>`, `<main>` + skip link, `aria-label` del logo, zonas táctiles | 13, 14, 29, 30 | Recorrido por Tab grabado con Playwright; axe-core sin `scrollable-region-focusable` ni `landmark-one-main` |
| 5 | **Tipografía y sistema**: `h1-h4 { font-weight: 400 }` en la SPA, tres botones (fuera `.btn-clay`), un solo eyebrow, cursivas fuera de hero y cita, radios, "· " y puntos finales, flechas de texto en `courses-data.js` | 9, 15, 34 | Diff visual de las 31 capturas |
| 6 | **Enlaces a las landings y catálogo estático**: "Ver temario" en tarjetas SPA, enlaces desde las áreas de la home, cada curso de `/cursos/` enlazado y con botón de información, aviso para `#curso/<id>` inexistente, resaltado de tarjeta | 8, 25, 26 | Comprobación de que los 23 enlaces existen |
| 7 | **Portadas y relleno**: portada de respaldo por categoría, tarjeta "Aprende" sin hueco, newsletter sobre `--ink`, marca de agua más suave y sin cortar, JSON-LD `logo` al sello, tienda como ficha destacada sin filtros vacíos y a una columna en móvil, enlace del RF-200 al curso real | 10, 22, 27, 28, 32 | Capturas home y tienda |
| 8 | **Testimonios y confianza** (tras tu decisión): retirar o sustituir por reseñas de Google reales; bloque "Imparte" en landings; precio "desde" y próxima convocatoria si decides publicarlos | 3, 7, 23 | Revisión de textos contigo antes de publicar |
| 9 | **Cabecera y pie comunes + CSS compartido** (ver sección 4): `assets/site.css`, primero legales y /sobre/, luego las 12 landings, luego `/cursos/`, al final index.html | 11, 24 | Diff visual por fase; `CACHE_VERSION` y `?v=N` |
| 10 | **Aula**: errores de Supabase en español, formulario propio de nueva contraseña, aviso "usa el email de la matrícula", textos de desarrollador fuera | 21, 36 | Prueba con sesión real (tú) |
| 11 | **Rendimiento de la home**: hero en WebP con `srcset`, `og-image.jpg` propio, `defer`, JS de aula y admin en archivos aparte cargados por vista | 35 | Lighthouse móvil antes y después; aula probada con sesión real |
| 12 | **Aviso legal**: fecha de actualización | 38 | — |

Los commits 1 a 5 son los que cambian la percepción de forma desproporcionada al esfuerzo. El 8 depende de tus decisiones. El 9 es el de más riesgo y va por fases con captura antes y después de cada una.

---

## 4. Tokens: desviaciones y propuesta de CSS compartido

### 4.1 Desviaciones respecto a `:root` de index.html

| Archivo | Selector | Actual | Esperado |
|---|---|---|---|
| `cursos/index.html` | `:root --muted` | `#6E6558` | `#726A5D` |
| `cursos/index.html` | `:root` | faltan `--surface`, `--accent-soft`, `--r`, `--r-sm` | añadir |
| 12 landings, `assets/legal.css` | `:root` | faltan `--r`, `--r-sm` | añadir y sustituir los `10px` literales |
| Landings, `/cursos/`, `legal.css` | `body` | 16px / 1.6-1.65 | unificar con index (15px / 1.55) en `--fs-body: 16px` |
| `index.html` | `h1, h2` | sin `font-weight` (hereda 700, negrita sintética) | `400` |
| `index.html` | `.eyebrow` | 10,5px / 0,22em / 500 / `--muted` | 11px / 0,22em / 600; `.accent` → `--accent-dark` |
| Landings, `/cursos/`, legal | `.eyebrow` | 11px / 0,24em / 500 / `--accent` | igual que arriba |
| `index.html` | `.chip` 0,24em; `.cursos-pub-card-tag` 0,14em; `.drawer-section` 800; `.quote-eyebrow`, `.producto-aprende-eyebrow` 0,18em | 7 escalas | una: 11px / 0,22em / 600 |
| Landings | `.btn` | 13px 24px / 14px | 14px 24px / 14px (como index) |
| `index.html` | `.btn-outline:hover` | `background: var(--ink)` | `var(--soft)` (como landings) |
| Landings | `.lp-submit` | crema, 600, 100 % | `btn btn-light` |
| `index.html` | `.cursos-pub-card-cta` | 10px 18px / 12,5px / 600 / 0,03em | `btn btn-dark btn-sm` |
| `index.html` | `.btn-clay`, `.newsletter-btn` | terracota, acento (4,3:1) | eliminar / `btn-light` |
| Landings | `.nav-cta` | 10px 18px / 13px | `btn btn-dark btn-sm` |
| Landings | `.ficha`, `.lp-field input`, `.faq-item` (en /cursos/) | 10px | `var(--r)` = 12px |
| `/cursos/` | `.course-item` | 6px | 4px |
| Landings, `/cursos/` | `.nav-inner` 1100px vs `section` 920px | desalineados | mismo ancho |
| Todas | contenedores 1280/56 · 920/32 · 1100 · 760 | cuatro anchos | `--container: 1280px` (listados, cabecera, pie) y `--measure: 920px` (lectura) |
| Landings, `/cursos/`, legal | migas con "/" de texto | | chevrón `.ico` como en la SPA |
| Landings, `/cursos/`, legal, /sobre/ | pie | 3 variantes sin legales o sin NAP | el pie de la SPA |
| `index.html` | `h1 em` solo en hero y cita; landings `h1 em`; /sobre/ `h1 em` con la marca | cursiva en marca | h1 de landing sí (es su hero); /sobre/ sin em |
| Fuentes | pesos 400-800 (index, landings), 400-700 (/cursos/), 400-600 (/sobre/) | tres `<link>` distintos | uno: `400;500;600` |

### 4.2 Propuesta de CSS compartido

Situación: el `<style>` de las 12 landings es idéntico byte a byte; `/cursos/` lleva una copia divergente; `/sobre/` y las legales usan `assets/legal.css`; `index.html` lo lleva todo inline. Hoy cada corrección se aplica en 15 sitios.

Objetivo: `assets/site.css` con tokens, base y componentes (unos 15 KB), cargado por todas las páginas con `?v=N` y precacheado en `sw.js`. Cada página conserva un `<style>` pequeño con lo suyo.

- **Fase 0** (no toca páginas): crear `site.css` copiando de index.html en este orden: `:root` (+ `--r`, `--r-sm`, `--fs-body`, `--container`, `--measure`, `--ring`), reset, `.ico*`, tipografía base (`h1-h4 { font-weight: 400 }`, `.eyebrow`), `.btn*` unificados, `.chip*`, tarjeta, formularios y `:focus-visible`, migas, `.faq-item`, `ul.clean`, `.ficha`, `.contact`, cabecera y pie comunes (los de la SPA). Añadir a `PRECACHE_URLS` y subir `CACHE_VERSION`. Guardar capturas "antes".
- **Fase 1** (legales y /sobre/, 4 páginas, riesgo mínimo): `<link site.css>` antes de `legal.css`, que queda solo con `.legal-wrap`, `.legal-table`, `.note-box`, `.page-watermark`. Cabecera y pie comunes. Capturas antes y después.
- **Fase 2** (12 landings, un solo cambio): el bloque idéntico se sustituye por `<link>` + `<style>` residual (`.hero`, `.section-alt`, `.ficha-grid`, `.lp-form*`). `gen-landings.py` extrae el estilo de la plantilla, así que al cambiar la plantilla quedan alineadas; se regeneran las 6 generadas y se verifican las 6 manuales. Aquí se aplican de una vez los hallazgos 23 y 24.
- **Fase 3** (`/cursos/`): igual; eliminar su `:root` propio.
- **Fase 4** (`index.html`): sustituir solo el bloque base (tokens, reset, `.ico`, `.btn`, `.chip`, tarjeta, cabecera, pie) por el `<link>`, que debe ir antes de cualquier `<style>` inline; mantener clases y especificidad. Validar con `/desplegar` y recapturar las 31 vistas.
- **Reglas**: un componente se define una vez en `site.css` y las páginas solo añaden modificadores; `:root` solo en `site.css`; subir `?v=N` y `CACHE_VERSION` en cada cambio; el script de capturas pasa a ser prueba de regresión visual antes de cada despliegue que toque CSS.
- **Riesgos cubiertos**: parpadeo sin estilos (archivo pequeño, precacheado, `preload`); una regla base que altere la SPA (diff de capturas por fase); el generador pisando retoques manuales (solo regenera las 6 generadas).

---

## Anexo · Métricas

| Métrica | Home (móvil) | Landing Plasmapen (móvil) |
|---|---|---|
| Lighthouse rendimiento | 58 | 99 |
| Lighthouse accesibilidad | 93 | 95 |
| Lighthouse SEO | 92 | 100 |
| LCP | 5,4 s | 1,8 s |
| Peso total | 740 KiB | 88 KiB |
| Violaciones axe | 3 reglas (contraste 15 nodos, sin `main`, regiones) | 4 reglas (contraste 11, logo, sin `main`, regiones) |

Toques hasta pedir información: 7 en móvil por el catálogo SPA, 5 por la landing, unos 9 clics en ordenador (con WhatsApp vinculado).

---

## Estado de ejecución (8 de octubre de 2026)

Plan ejecutado íntegramente, un commit por bloque, cada uno validado (`/desplegar`) y con capturas antes/después en `capturas/NN-*/`:

| Commit | Carpeta de capturas | Hallazgos cerrados |
|---|---|---|
| 1 Formularios | 01-formularios | 1, 2, 16, 17, 20, 33 |
| 2 Cabecera y hero (+ WhatsApp y "Ver N cursos") | 02-cabecera-hero, 02b-whatsapp | 4, 5, 6, 19, 37 |
| 3 Contraste y foco | 03-contraste-foco | 12, 18, 31 |
| 4 Teclado | 04-teclado | 13, 14, 29, 30 |
| 5 Tipografía y sistema | 05-tipografia | 9, 15, 32, 34 |
| 6 Enlaces a landings | 06-enlaces-landings | 8, 25, 26 |
| 7 Portadas y rellenos | 07-portadas-relleno | 10, 22, 27 (sin bajar opacidad, por decisión de la propietaria), 28 |
| 8 Testimonios y fechas | 08-testimonios-fechas | 7, parte de 3 (fechas; el precio no se publica) |
| 9a/9b CSS compartido | 09a-…, 09b-… | 11, 24 |
| 10 Aula | 10-aula | 21, 36 |
| 11 Rendimiento | 11-rendimiento | 35 (Lighthouse móvil 69 → 97 en las mismas condiciones) |
| 12 Legal y viñetas | 12-legal-vinetas | 38 |
| 13 Convocatorias | 13-convocatorias | bloque "Próximas convocatorias", landing de Limpieza facial, pósteres, foto del aula |

Pendiente (gravedad media o decisión de negocio): precio no publicado (3); bloque "Imparte" y galería del aula en las landings (23); reseñas reales (7, a cargar desde el panel); separar el JS de admin y aula del resto (35, segunda fase); unificar `body` 15 px y pie de 5 columnas de la SPA con site.css (9b); FAQ como `<h3>` (accesibilidad, baja).
