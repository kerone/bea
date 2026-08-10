# PRECISSA INSTITUTE · Guía del proyecto

Web de una academia de estética avanzada en Valencia (formación para
esteticistas profesionales). Sitio estático + SPA, con aula virtual para
alumnado matriculado.

**Lee este archivo entero antes de tocar nada.** Casi todo lo que hay aquí
se descubrió a base de romper cosas; darlo por sabido ahorra horas.

---

## 1. Despliegue · LO MÁS IMPORTANTE

**El sitio se publica con un Worker de Cloudflare llamado `precissainstitute`.**

- Configuración: `wrangler.jsonc` (raíz). Sirve el repo entero como assets
  estáticos, con `not_found_handling: "404-page"` → `/404.html`.
- Se despliega **solo, al hacer push a `main`**. Tarda ~2 minutos.
- `.assetsignore` decide qué NO se publica: `.git`, `.github`, `supabase/`,
  `docs/`, y los propios archivos de configuración.
- Dominio: `precissainstitute.com` y `www`, ambos apuntando al Worker.
  Hay un `CNAME` versionado por seguridad.

**NO se usa GitHub Pages.** Existió un workflow (`.github/workflows/pages.yml`)
que desplegaba a una URL que nadie visitaba mientras producción se quedaba
congelada; se eliminó. Si alguien vuelve a añadirlo, se crean dos sistemas
compitiendo. No lo hagas.

Si un cambio "no se ve" en la web:
1. Comprueba que el push llegó a `main`.
2. Mira el build del Worker en Cloudflare → Workers & Pages → `precissainstitute`.
3. Solo entonces sospecha de caché del navegador (probar en incógnito).

---

## 2. Datos oficiales del negocio (NAP)

Deben ser **idénticos** en toda la web, en los JSON-LD y en la ficha de Google.
Cambiar uno implica cambiarlos todos.

| Dato | Valor |
|---|---|
| Teléfono | `601 05 67 06` · enlaces `tel:+34601056706` |
| Horario | Lunes a viernes, 9:30–14:00 (sin tardes, finde cerrado) |
| Dirección | C/ de la República de la Costa d'Ivori, 46017 València |
| Email | precissainstitute@gmail.com |
| Instagram | https://www.instagram.com/precissainstitute |
| Maps | https://maps.app.goo.gl/RfxWU2e8j4qnrgg5A |

Las páginas legales **no llevan nombre personal ni NIF**: es decisión de la
propietaria, no un olvido. No los añadas.

---

## 3. Estructura

```
index.html          SPA de ~6200 líneas: home, catálogo, tienda, aula, admin.
                    Todo el CSS y el JS van inline. Routing por hash.
cursos/index.html   Catálogo estático indexable (SEO). Generado desde
                    courses-data.js — si cambia el catálogo, regenerar.
cursos/<x>-valencia/  6 landings SEO locales (plasmapen, electroestetica,
                    microblading, hifu, depilacion-laser, micropigmentacion)
sobre/ aviso-legal/ privacidad/ cookies/ 404.html
assets/js/          courses-data.js (23 cursos, 4 categorías), products-data.js,
                    auth.js, enrollments.js, admin.js, course-visibility.js,
                    course-content.js, product-content.js, supabase-config.js
supabase/           SQL de esquema/RLS y scripts .mjs de migración (NO se publica)
sw.js               Service worker
```

---

## 4. Contenido de pago · NO volver a exponerlo

Las presentaciones de los cursos y la materia (.md) **viven en el bucket
privado `course-private` de Supabase** y se sirven con enlace firmado
temporal, solo a quien tiene matrícula (o es admin).

- **Nunca vuelvas a colocar presentaciones en `assets/cursos/`.** Esa carpeta
  se borró a propósito: antes cualquiera se descargaba los cursos escribiendo
  la URL.
- Las referencias privadas en `courses-data.js` / `course_overrides` usan el
  prefijo `private:`.
- **Los decks privados se inyectan con `srcdoc`, no con `src`**: el bucket los
  sirve como texto plano y un iframe con `src` mostraría el código fuente en
  crudo. Ver `aulaPresSetFrame()` en index.html.

---

## 5. Base de datos y acceso (Supabase)

- Proyecto: `fatgkdecpgiptvbagoij`. La clave del navegador es *publishable*
  (pública por diseño); la seguridad real la imponen las políticas **RLS**,
  que están activas en `enrollments`, `profiles` y `course_overrides`.
- **Nunca pidas ni aceptes la `service_role` key en un chat.** Los scripts de
  migración la leen de variable de entorno y los ejecuta la propietaria en su
  máquina.
- Lista de administradoras: `window.PRECISSA_ADMIN_EMAILS` en index.html.
  `admin.js` la lee de ahí (fuente única) y el SQL tiene su `is_admin()`.

---

## 6. Reglas de SEO que ya costaron trabajo

- **El sitemap no lleva URLs con `#`.** Google ignora los fragmentos y las
  colapsa todas en la home. Solo URLs reales.
- **El FAQ del JSON-LD debe coincidir palabra por palabra con el HTML visible**
  (mismas preguntas, mismas respuestas, mismo orden). Si editas una FAQ, edita
  las dos o regenera el schema desde el HTML.
- **Un solo `<h1>` por página.** En index.html las vistas internas de la SPA
  usan `h2` con su clase de estilo; no las vuelvas a subir a `h1`.
- Las presentaciones llevan `<meta name="robots" content="noindex">` y **no**
  se bloquean en robots.txt: Google necesita rastrearlas para ver el noindex.
- Cada landing tiene su `canonical`, `og:url` y breadcrumb propios y únicos.

## 7. Trampas del código

- **`escapeJs()`, no `escapeAttr()`, para strings dentro de `onclick`.** El
  navegador des-escapa las entidades del atributo antes de ejecutar el JS: un
  apóstrofe en un título rompería el handler.
- **Fuente única del curso abierto: `window._currentAulaCourseId`.** Hubo un
  `let` léxico conviviendo con la propiedad de window y los deep links
  `#curso/<id>` abrían siempre el primer curso.
- El router usa `pushState` + `popstate` (no `hashchange`), para que el botón
  atrás navegue dentro de la SPA.
- Los formularios van a **FormSubmit** por AJAX. Valida siempre `res.ok` **y**
  `json.success`: sin eso se muestra un "gracias" falso y el mensaje se pierde.
- `enrollments.js` distingue "sin matrícula" de "no se pudo comprobar"
  (`hadError()`); no vuelvas a cachear los errores.
- Dependencias de CDN con **versión fijada**: supabase-js@2.45.4,
  marked@12.0.2, dompurify@3.0.9. Nada de rangos `@2`.
- La materia en Markdown se sanitiza con DOMPurify antes de insertarla.

## 8. Contenido intencionado (no son fallos)

- **diatermia**: sin lecciones a propósito, pendiente de material real.
- **anatomia-fisiologia-cutanea**: usa la lección integrada de la web
  (`leccion-integrada`), no un deck aparte. Por eso no tiene materia .md.
- La mayoría de cursos aún usa la portada de relleno `assets/le-petit.jpg`.

## 9. Analítica

Cloudflare Web Analytics (sin cookies, no requiere banner), token
`d31ab6472923428fbacbe8d737b4f8d4`, presente en las 13 páginas públicas.
Está declarado en la política de cookies.

---

## 10. Antes de publicar cualquier cambio

Valida siempre:

1. **JSON-LD** de las páginas tocadas parsea (`json.loads`).
2. **JS inline** de index.html sin errores de sintaxis (`new Function`).
3. **sitemap.xml** es XML válido si lo tocaste.
4. Los **enlaces internos** nuevos apuntan a archivos que existen.
5. Si tocaste una FAQ, que schema y HTML sigan coincidiendo.

Y usa `/desplegar`, que hace exactamente eso antes de commitear.

## 11. Estilo de trabajo con la propietaria

- Habla **en español**, claro y sin jerga técnica innecesaria. Es la dueña del
  negocio, no desarrolladora: explica el *porqué* y el impacto en su negocio,
  no la implementación.
- Cuando algo dependa de ella (paneles de Google, Supabase, Cloudflare), dale
  **pasos numerados y exactos**, incluido dónde pinchar.
- Prefiere ver el resultado desplegado y comprobarlo ella misma.

---

## 12. Agenda interna (`/agenda/`)

Aplicación privada de gestión: fichas de clientas, citas, histórico de
tratamientos y consentimientos firmados. **No se enlaza desde la web
pública, no está en el sitemap y está bloqueada en robots.txt.**

- **La URL oculta NO es la protección.** Lo que protege es el login de
  Supabase + RLS restringida a `is_admin()`. La pantalla de acceso es
  deliberadamente neutra: no dice qué hay detrás (no dar pistas).
- Esquema: `supabase/agenda.sql` y `supabase/agenda-consentimientos.sql`.
- Tablas: `clientas`, `tratamientos`, `citas`,
  `consentimiento_plantillas`, `consentimientos_firmados`.
- Bucket privado `consentimientos` para las imágenes de firma.

**Flujo de una cita** (importante, se diseñó con la propietaria):
`programada` → *Ha llegado* (firma el consentimiento) → `en_curso` →
*Finalizar* → `completada`. O bien → *No se presentó* → `no_asistio`,
que alimenta el porcentaje de faltas de su ficha.

**Reglas que no se deben romper:**
- Los consentimientos guardan **copia literal del texto firmado**, no una
  referencia a la plantilla. Si la plantilla se edita después, la firma
  seguiría probando qué se firmó. Editar el texto sube la versión.
- Las citas guardan **nombre y precio del tratamiento en el momento**: el
  histórico no cambia aunque se edite el catálogo.
- El enlace de "añadir a mi calendario" que se envía por WhatsApp
  (`/agenda/cita/`) solo lleva **fecha y duración** en la URL: nunca el
  nombre de la clienta ni el tratamiento.
- `agenda.css` y `agenda.js` van **versionados** (`?v=N`) en el HTML. Al
  cambiarlos, sube la versión: si no, el service worker puede servir HTML
  nuevo con JavaScript viejo y los botones dejan de responder.

**Rejilla y solapes** (v8-v9):
- La detección de solapes AVISA, nunca bloquea: en estética el solape a
  veces es intencionado. Comparación con `<` estrictos e intervalos
  semiabiertos: dos citas pegadas (11:00 fin / 11:00 inicio) NO chocan.
- La comprobación de choques es contra Supabase (`conflictosDe`), no
  contra la memoria, y falla CERRADO: sin respuesta no se guarda.
- Estados que ocupan hueco: programada, en_curso, completada. Canceladas
  y faltas se pintan como franja fina y LIBERAN el hueco.
- La ventana horaria (9:00–14:30 por defecto) se amplía sola si hay
  citas fuera; jamás se oculta una cita.
- La línea de "ahora" solo mueve su style.top: un repintado por reloj
  cerraría el modal o el buscador abiertos.
- "Profesional" es una ETIQUETA (tabla `profesionales`), no una cuenta:
  dar acceso real a otra persona exige revisar RLS y la política de
  privacidad. Con una sola activa, la interfaz no pregunta nada.
- SQL de esta parte: `supabase/agenda-profesionales.sql` (documenta por
  qué NO se usa EXCLUDE USING gist y cuál sería el camino).

**Datos de salud**: el campo `contraindicaciones` de `clientas` es
categoría especial del RGPD (art. 9). La política de privacidad actual
cubre alumnado y newsletter, **no clientas de cabina**: falta ampliarla.
