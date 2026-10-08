#!/usr/bin/env python3
"""Genera 6 landings SEO nuevas a partir de la plantilla de cursos/hifu-valencia/
y las cablea en sitemap, catálogo, footer de la home, landings hermanas y sw.js."""
import re, json, pathlib, datetime, html, subprocess

ROOT = pathlib.Path('/home/user/bea')
TPL = (ROOT / 'cursos/hifu-valencia/index.html').read_text(encoding='utf-8')
HOY = datetime.date.today().isoformat()
BASE = 'https://precissainstitute.com'

STYLE = re.search(r'<style>.*?</style>', TPL, re.S).group(0)
FONTS = re.search(r'<link rel="preconnect".*?rel="stylesheet">', TPL, re.S).group(0)
FAVICON = re.search(r'<!-- ═══ FAVICON.*?theme-color" content="#F2ECE3">', TPL, re.S).group(0)
ORG_LD = re.search(r'<!-- ═══ SCHEMA.ORG · LocalBusiness.*?</script>', TPL, re.S).group(0)
SCRIPTS = TPL[TPL.index('<!-- Envío del formulario'):]
CONTACT_TAIL = TPL[TPL.index('    <div class="lp-alt">'):TPL.index('<!-- Envío del formulario')]

def esc(s): return html.escape(s, quote=True)

def faq_html(faq):
    return '\n'.join(f'  <div class="faq-item">\n    <div class="faq-q">{esc(q)}</div>\n    <div class="faq-a">{esc(a)}</div>\n  </div>' for q, a in faq)

def faq_ld(faq):
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
        ensure_ascii=False, indent=2)

def li(items):
    out = []
    for it in items:
        if isinstance(it, tuple):
            out.append(f'      <li><strong>{esc(it[0])}</strong> · {esc(it[1])}</li>')
        else:
            out.append(f'      <li><strong>{esc(it)}</strong></li>')
    return '\n'.join(out)

def related(links):
    rows = ''.join(f'      <li><strong><a href="{u}" style="color:inherit">{esc(t)}</a></strong><span>{esc(d)}</span></li>\n' for u, t, d in links)
    rows += '      <li><strong><a href="/cursos/" style="color:inherit">Todos los cursos de estética en Valencia <i class="ico ico-arrow" aria-hidden="true"></i></a></strong><span>Los 23 cursos de PRECISSA INSTITUTE, por categorías.</span></li>'
    return rows

def build(L):
    url = f"{BASE}/cursos/{L['slug']}/"
    title = L['title']
    assert len(title) <= 60, (title, len(title))
    assert len(L['desc']) <= 160, (L['slug'], len(L['desc']))
    bc = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Cursos", "item": BASE + "/cursos/"},
        {"@type": "ListItem", "position": 3, "name": L['h1_plain'], "item": url}]}, ensure_ascii=False, indent=2)
    course = json.dumps({"@context": "https://schema.org", "@type": "Course",
        "name": L['course_name'], "description": L['desc'],
        "provider": {"@type": "EducationalOrganization", "name": "PRECISSA INSTITUTE", "url": BASE + "/"},
        "url": url, "inLanguage": "es-ES", "educationalLevel": L['nivel'],
        "courseMode": "onsite",
        "audience": {"@type": "EducationalAudience", "educationalRole": "esteticista profesional"},
        "about": L['about'], "teaches": L['teaches'],
        "hasCourseInstance": [
            {"@type": "CourseInstance", "courseMode": "onsite",
             "location": {"@type": "Place", "name": "PRECISSA INSTITUTE",
                          "address": {"@type": "PostalAddress", "streetAddress": "Av. Primero de Mayo, 59, bajo", "postalCode": "46017",
                                      "addressLocality": "Valencia", "addressRegion": "Comunidad Valenciana", "addressCountry": "ES"}},
             "courseWorkload": f"PT{L['horas']}H"}]},
        ensure_ascii=False, indent=2)
    page = f'''<!DOCTYPE html>
<!-- Landing SEO · {L['h1_plain']} · PRECISSA INSTITUTE -->
<html lang="es-ES">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ═══ SEO ══════════════════════════════════════════════════ -->
<title>{esc(title)}</title>
<meta name="description" content="{esc(L['desc'])}">
<meta name="keywords" content="{esc(L['keywords'])}">
<meta name="author" content="PRECISSA INSTITUTE">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="googlebot" content="index, follow">
<meta name="geo.region" content="ES-V">
<meta name="geo.placename" content="Valencia">
<meta name="geo.position" content="39.4699;-0.3763">
<meta name="ICBM" content="39.4699, -0.3763">
<link rel="canonical" href="{url}">

<!-- ═══ OPEN GRAPH ═══════════════════════════════════════════ -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="PRECISSA INSTITUTE">
<meta property="og:title" content="{esc(L['og_title'])}">
<meta property="og:description" content="{esc(L['desc'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/assets/og-image.jpg">
<meta property="og:image:width" content="1392">
<meta property="og:image:height" content="752">
<meta property="og:image:alt" content="{esc(L['h1_plain'])} — PRECISSA INSTITUTE">
<meta property="og:locale" content="es_ES">

<!-- ═══ TWITTER CARD ═════════════════════════════════════════ -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(L['desc'])}">
<meta name="twitter:image" content="{BASE}/assets/og-image.jpg">

{FAVICON}

<!-- ═══ SCHEMA.ORG · BreadcrumbList ══════════════════════════ -->
<script type="application/ld+json">
{bc}
</script>

<!-- ═══ SCHEMA.ORG · Course ══════════════════════════════════ -->
<script type="application/ld+json">
{course}
</script>

{ORG_LD}

<!-- ═══ SCHEMA.ORG · FAQPage ═════════════════════════════════ -->
<script type="application/ld+json">
{faq_ld(L['faq'])}
</script>

{FONTS}

{STYLE}
</head>
<body>
<a class="skip-link" href="#contenido">Saltar al contenido</a>

<nav class="nav" aria-label="Navegación principal">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="PRECISSA INSTITUTE Dermocosmiatría &amp; Electroestética, ir al inicio">
      PRECISSA INSTITUTE
      <span class="nav-logo-sub">Dermocosmiatría &amp; Electroestética</span>
    </a>
    <a href="tel:+34601056706" class="nav-cta">601 05 67 06</a>
  </div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Inicio</a>
  <span class="breadcrumb-sep">/</span>
  <a href="/cursos/">Cursos</a>
  <span class="breadcrumb-sep">/</span>
  <span aria-current="page">{esc(L['bc_short'])}</span>
</nav>

<main id="contenido" tabindex="-1">
<section class="hero">
  <div class="eyebrow">Curso profesional</div>
  <h1>{L['h1']}</h1>
  <p class="hero-lede">
    {esc(L['lede'])}
  </p>
  <div class="hero-cta">
    <a href="#contacto" class="btn btn-dark">Solicitar información <i class="ico ico-arrow" aria-hidden="true"></i></a>
    <a href="tel:+34601056706" class="btn btn-outline">Llamar 601 05 67 06</a>
  </div>
</section>

<section>
  <div class="eyebrow eyebrow-muted">Qué es</div>
  <h2>{L['que_es_h2']}</h2>
  <p>{L['que_es_p1']}</p>
  <p>{L['que_es_p2']}</p>
</section>

<div class="section-alt">
  <section>
    <div class="eyebrow eyebrow-muted">Contenido</div>
    <h2>El curso incluye</h2>
    <ul class="clean">
{li(L['incluye'])}
    </ul>
  </section>
</div>

<section>
  <div class="eyebrow eyebrow-muted">Perfil</div>
  <h2>¿A quién va dirigido?</h2>
  <ul class="clean">
{li(L['perfil'])}
  </ul>
</section>

<div class="section-alt">
  <section>
    <div class="eyebrow eyebrow-muted">Detalles</div>
    <h2>Ficha del curso</h2>
    <div class="ficha">
      <div class="ficha-grid">
        <div class="ficha-row">
          <div class="label">Modalidad</div>
          <div class="value">Presencial en Valencia</div>
        </div>
        <div class="ficha-row">
          <div class="label">Nivel · Duración</div>
          <div class="value">{esc(L['ficha_nivel'])}</div>
        </div>
        <div class="ficha-row">
          <div class="label">Certificación</div>
          <div class="value">Sí · tras test y prácticas</div>
        </div>
      </div>
    </div>
  </section>
</div>

<section>
  <div class="eyebrow eyebrow-muted">Seguridad y rigor</div>
  <h2>{L['seg_h2']}</h2>
  <p>{L['seg_p1']}</p>
  <p>{L['seg_p2']}</p>
</section>

<div class="section-alt">
  <section>
    <div class="eyebrow eyebrow-muted">FAQ</div>
    <h2>Preguntas frecuentes</h2>
{faq_html(L['faq'])}
  </section>
</div>

<section>
  <div class="eyebrow eyebrow-muted">Formación relacionada</div>
  <h2>Otros cursos en Valencia</h2>
  <ul class="clean">
{related(L['related'])}
  </ul>
</section>

<section class="contact" id="contacto">
  <div class="contact-inner">
    <div class="eyebrow" style="color: var(--accent-soft);">Solicitar información</div>
    <h2>Próxima convocatoria en Valencia</h2>
    <p>Déjanos tu nombre y se abrirá WhatsApp con tu consulta ya escrita: te respondemos por ahí con fechas, precio y plazas disponibles. ¿No usas WhatsApp? Llámanos al 601 05 67 06.</p>
    <form class="lp-form" id="lp-form" novalidate>
      <input type="hidden" name="producto" value="{esc(L['producto'])}">
      <input type="hidden" name="_subject" value="Nueva solicitud de información · PRECISSA INSTITUTE">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="origen" value="Landing {L['slug']}">
      <input type="text" name="_honey" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <label class="lp-field"><span>Nombre y apellidos *</span><input type="text" name="nombre" required autocomplete="name"></label>
      <label class="lp-field"><span>Email <small>(teléfono o email, al menos uno)</small></span><input type="email" name="email" autocomplete="email" inputmode="email"></label>
      <label class="lp-field"><span>Teléfono <small>(teléfono o email, al menos uno)</small></span><input type="tel" name="telefono" autocomplete="tel"></label>
      <label class="lp-field"><span>Mensaje <small>(opcional)</small></span><textarea name="mensaje" rows="3" placeholder="¿Qué fechas te encajan? ¿Tienes experiencia previa?"></textarea></label>
      <label class="lp-rgpd"><input type="checkbox" name="rgpd" required><span>He leído y acepto la <a href="/privacidad/" target="_blank" rel="noopener">política de privacidad</a> *</span></label>
      <button type="submit" class="lp-submit" id="lp-submit">Pedir información por WhatsApp</button>
      <button type="button" class="lp-submit lp-submit-alt" id="lp-alt-btn" data-canal="correo">Prefiero que me llaméis o me escribáis</button>
      <div class="lp-status" id="lp-status" role="status" aria-live="polite"></div>
    </form>
    <div class="lp-success" id="lp-success" hidden>
      <div class="lp-ok-icon"><i class="ico ico-check" aria-hidden="true"></i></div>
      <h3 class="lp-success-title serif" id="lp-success-title"></h3>
      <p id="lp-success-text"></p>
      <p id="lp-wa-wrap"><a id="lp-wa-link" href="#" target="_blank" rel="noopener">¿No se ha abierto WhatsApp? Pulsa aquí</a></p>
      <p><button type="button" class="lp-link" id="lp-again">Enviar otra consulta</button></p>
    </div>
{CONTACT_TAIL}{SCRIPTS}'''
    return page

DONDE = ("¿Dónde se imparte el curso en Valencia?", "PRECISSA INSTITUTE imparte el curso en Valencia capital. L-V de 9:30 a 14:00. Información en el 601 05 67 06.")

R = {
  'dermapen':   ('/cursos/dermapen-valencia/', 'Curso de Dermapen', 'Microneedling profesional: inducción de colágeno con profundidad por zona e indicación.'),
  'hyaluron':   ('/cursos/hyaluron-pen-valencia/', 'Curso de Hyaluron Pen', 'Hialurónico sin aguja: fundamentos, límites y marco regulatorio.'),
  'cejas':      ('/cursos/cejas-valencia/', 'Curso de Cejas', 'Diseño por visajismo, laminado y henna: la cabina de cejas completa.'),
  'lifting':    ('/cursos/lifting-pestanas-valencia/', 'Curso de Lifting de Pestañas', 'Curvado permanente y tinte con química controlada.'),
  'madero':     ('/cursos/maderoterapia-valencia/', 'Curso de Maderoterapia', 'Masaje corporal con instrumentos de madera, con evidencia y sin humo.'),
  'drenaje':    ('/cursos/drenaje-linfatico-valencia/', 'Curso de Drenaje Linfático', 'Métodos Vodder y Leduc con base anatómica real.'),
  'plasmapen':  ('/cursos/plasmapen-valencia/', 'Curso de Plasmapen', 'Blefaroplastia no quirúrgica, fibromas y queratosis por arco voltaico.'),
  'electro':    ('/cursos/electroestetica-valencia/', 'Curso de Electroestética', 'Radiofrecuencia, HIFU, cavitación, IPL y láser: toda la aparatología.'),
  'hifu':       ('/cursos/hifu-valencia/', 'Curso de HIFU', 'Lifting facial no quirúrgico con seguridad anatómica.'),
  'micro':      ('/cursos/microblading-valencia/', 'Curso de Microblading', 'Cejas pelo a pelo con visajismo, pigmentos REACH y casos reales.'),
  'micropig':   ('/cursos/micropigmentacion-valencia/', 'Curso de Micropigmentación', 'Labios, eyeliner y neutralización correctiva.'),
  'laser':      ('/cursos/depilacion-laser-valencia/', 'Curso de Depilación Láser', 'Diodo, alejandrita y Nd:YAG con seguridad por fototipo.'),
}

LANDINGS = [
{
 'slug': 'dermapen-valencia', 'cursos': ['dermapen-microneedling'],
 'title': 'Curso de Dermapen en Valencia · PRECISSA INSTITUTE',
 'og_title': 'Curso de Dermapen en Valencia · Microneedling profesional',
 'desc': 'Curso de Dermapen y microneedling en Valencia: inducción de colágeno, profundidad por zona, asepsia, fototipos altos y complicaciones. Presencial en Valencia.',
 'keywords': 'curso dermapen valencia, curso microneedling valencia, formación dermapen, microneedling profesional valencia, inducción de colágeno curso, academia estética valencia',
 'h1': 'Curso de Dermapen <em>en Valencia</em>', 'h1_plain': 'Curso de Dermapen en Valencia', 'bc_short': 'Dermapen Valencia',
 'course_name': 'Curso de Dermapen en Valencia · Microneedling profesional',
 'nivel': 'Profesional / Intermedio', 'ficha_nivel': 'Intermedio · 32 h', 'horas': 32, 'horas_online': 14,
 'about': ['Dermapen', 'Microneedling', 'Inducción de colágeno', 'Cicatrices de acné'],
 'teaches': 'Fisiología de la inducción de colágeno por trauma controlado, profundidad por zona y objetivo, asepsia y material de un solo uso, cautela en fototipos altos, combinación con activos tópicos, aftercare y manejo de complicaciones.',
 'producto': 'Curso de Dermapen · Microneedling',
 'lede': 'Microagujas motorizadas para inducción de colágeno: cicatrices, textura, poros y rejuvenecimiento, con la profundidad justa para cada zona. Formación profesional de microneedling para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'Dermapen, microneedling con criterio',
 'que_es_p1': 'El Dermapen es un dermógrafo motorizado con un cartucho de microagujas de un solo uso que practica <strong>miles de microcanales controlados</strong> en la piel. Ese trauma mínimo y ordenado activa la cascada de reparación: la piel responde fabricando colágeno y elastina nuevos. Por eso funciona en cicatrices de acné, poros dilatados, textura irregular y pérdida de firmeza, y por eso también mejora la penetración de los activos que se aplican después.',
 'que_es_p2': 'La diferencia entre un buen resultado y un problema está en la <strong>profundidad</strong>. No es lo mismo trabajar a 0,25 mm para potenciar un cosmético que a 1,5-2,5 mm sobre una cicatriz. En el curso aprendes a decidir la profundidad por zona y por objetivo, a saber qué queda dentro del terreno de la estética y a reconocer cuándo una piel no debe tratarse ese día.',
 'incluye': [
   ('Fisiología de la inducción de colágeno', 'qué ocurre en la piel tras el trauma controlado y en qué plazos'),
   ('Profundidad por zona y objetivo', '0,25 mm cosmético · 0,5-1 mm rejuvenecimiento · 1,5-2,5 mm cicatrices'),
   ('Anatomía del rostro aplicada', 'grosor de la piel por zona y áreas que exigen cautela'),
   ('Asepsia rigurosa', 'cartuchos de un solo uso, preparación de la piel y gestión de residuos'),
   ('Fototipos altos', 'por qué exigen más prudencia y cómo prevenir la hiperpigmentación postinflamatoria'),
   ('Activos compatibles e incompatibles', 'qué aplicar durante el tratamiento y qué no usar nunca ese día'),
   ('Indicaciones reales', 'cicatrices de acné, poros, textura, líneas finas, estrías'),
   ('Contraindicaciones', 'acné activo, infecciones, rosácea en brote, tratamientos recientes'),
   ('Protocolo paso a paso', 'consulta, fotografía clínica, técnica de pasadas, cierre y aftercare'),
   ('Manejo de complicaciones', 'hiperpigmentación, granulomas por cosméticos no aptos, infección'),
   ('Casos prácticos', 'cicatriz atrófica, piel fotoenvejecida, poros en zona T'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas con cabina facial', 'que quieren incorporar un tratamiento de resultados visibles y alta demanda'),
   ('Profesionales que ya usan Dermapen', 'y quieren trabajar con criterio propio, no con la tabla del fabricante'),
   ('Centros de estética avanzada', 'que buscan protocolos documentados y seguros para pieles de todos los fototipos'),
 ],
 'seg_h2': 'La profundidad marca el límite',
 'seg_p1': 'El microneedling es seguro cuando se respetan tres cosas: <strong>material de un solo uso</strong>, piel bien seleccionada y profundidad adecuada. Dedicamos un bloque entero a explicar qué profundidades corresponden a un tratamiento cosmético y cuáles entran en un terreno que ya no es de estética, para que trabajes siempre del lado correcto de la línea.',
 'seg_p2': 'La complicación más frecuente no es la infección sino la <strong>hiperpigmentación postinflamatoria</strong>, sobre todo en fototipos altos, y el <strong>granuloma</strong> por introducir en la piel productos que no están formulados para ello. Las dos se previenen con selección de la clienta, elección de activos y un aftercare que la clienta entienda. Eso es lo que entrena este curso.',
 'faq': [
   ('¿Qué diferencia hay entre Dermapen y un roller de microagujas?', 'El roller arrastra las agujas en ángulo y desgarra más; el Dermapen las clava en vertical, con velocidad y profundidad regulables y un cartucho estéril de un solo uso. El resultado es más uniforme, más controlable y con menos daño colateral.'),
   ('¿Para qué sirve el microneedling?', 'Para cicatrices de acné, poros dilatados, textura irregular, líneas finas, estrías y pérdida de firmeza. Además mejora la absorción de los activos que se aplican durante el tratamiento, siempre que estén formulados para ello.'),
   ('¿Cuántas sesiones necesita una clienta?', 'Depende del objetivo: una piel apagada mejora con 1-2 sesiones; una cicatriz atrófica suele requerir una serie de 3-6 sesiones espaciadas 4-6 semanas. En el curso aprendes a planificar y a explicar la cronología del colágeno para gestionar expectativas.'),
   ('¿Es seguro en pieles morenas o negras?', 'Sí, con más prudencia: los fototipos altos tienen más riesgo de hiperpigmentación postinflamatoria. Se trabaja con menos profundidad, se prepara la piel antes y se exige fotoprotección estricta después. Lo tratamos como bloque propio del temario.'),
   ('¿Qué productos se pueden usar con el Dermapen?', 'Solo activos formulados para uso con microneedling, en general sérums estériles de ácido hialurónico o péptidos. Nunca vitamina C en alta concentración ni retinoides el día del tratamiento: provocan irritación y pueden dejar granulomas.'),
   ('¿Necesito tener el equipo para hacer el curso?', 'No. Las prácticas se hacen con el equipo del centro. Si estás pensando en comprar uno, te orientamos sobre qué mirar: motor, rango de profundidad real, cartuchos certificados y servicio técnico.'),
   DONDE,
 ],
 'related': [R['hyaluron'], R['plasmapen'], R['electro']],
},
{
 'slug': 'hyaluron-pen-valencia', 'cursos': ['hyaluron-pen'],
 'title': 'Curso de Hyaluron Pen en Valencia · PRECISSA INSTITUTE',
 'og_title': 'Curso de Hyaluron Pen en Valencia · Hialurónico sin aguja',
 'desc': 'Curso de Hyaluron Pen en Valencia: presión hidráulica, profundidad real, evidencia, marco regulatorio y manejo de complicaciones. Presencial en Valencia.',
 'keywords': 'curso hyaluron pen valencia, hyaluron pen curso, hialurónico sin aguja curso, formación hyaluron pen, curso acido hialuronico sin aguja valencia, academia estética valencia',
 'h1': 'Curso de Hyaluron Pen <em>en Valencia</em>', 'h1_plain': 'Curso de Hyaluron Pen en Valencia', 'bc_short': 'Hyaluron Pen Valencia',
 'course_name': 'Curso de Hyaluron Pen en Valencia · Hialurónico sin aguja',
 'nivel': 'Profesional / Avanzado', 'ficha_nivel': 'Avanzado · 32 h', 'horas': 32, 'horas_online': 14,
 'about': ['Hyaluron Pen', 'Ácido hialurónico sin aguja', 'Presión hidráulica', 'Hidratación labial'],
 'teaches': 'Fundamentos físicos de la presión hidráulica, profundidad real de deposición, evidencia disponible y sus límites, marco regulatorio en la UE, indicaciones cosméticas legítimas y las que no corresponden a estética, manejo de complicaciones y derivación.',
 'producto': 'Curso de Hyaluron Pen',
 'lede': 'Ácido hialurónico sin aguja por presión hidráulica, explicado con la honestidad que esta técnica necesita: qué puede hacer, qué no debe hacerse desde una cabina de estética y cómo trabajar con seguridad. Formación para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'Hyaluron Pen, sin aguja y sin humo',
 'que_es_p1': 'El Hyaluron Pen es un dispositivo que impulsa ácido hialurónico a través de la piel mediante <strong>presión hidráulica</strong>, sin aguja. El producto se deposita de forma difusa en capas superficiales, no en un punto profundo como hace una inyección. Esa diferencia física lo explica todo: sus indicaciones legítimas son <strong>cosméticas y superficiales</strong>, como la hidratación y el aspecto de los labios o de líneas finas.',
 'que_es_p2': 'Es una técnica polémica porque se ha vendido como "relleno sin aguja" para cosas que no puede hacer. Nuestro curso parte de la evidencia disponible y de sus límites, y te enseña a posicionarla con criterio: qué ofrecer, qué rechazar y cómo explicárselo a la clienta. Saber decir que no es parte del temario.',
 'incluye': [
   ('Fundamentos físicos', 'cómo funciona la presión hidráulica y hasta dónde llega realmente el producto'),
   ('Profundidad de deposición', 'qué diferencia a esta técnica de la inyección y por qué importa'),
   ('Evidencia disponible', 'qué dicen los estudios, qué no dicen y cómo contarlo con honestidad'),
   ('Marco regulatorio en la UE', 'categoría del dispositivo y del producto; acto estético frente a acto sanitario'),
   ('Indicaciones legítimas', 'hidratación labial, líneas finas superficiales, aspecto de la piel'),
   ('Lo que no debe hacerse desde estética', 'rellenos profundos, surcos nasogenianos, ojeras, volumetría'),
   ('Selección del producto', 'reticulación, viscosidad, trazabilidad y conservación'),
   ('Protocolo de aplicación', 'consulta, marcaje, carga del dispositivo, disparo y cierre'),
   ('Asepsia y material', 'ampollas de un solo uso, limpieza del cabezal, gestión de residuos'),
   ('Complicaciones y derivación', 'hematoma, asimetría, granuloma y el riesgo vascular: reconocer y derivar'),
   ('Consentimiento informado', 'qué debe constar y por qué protege a la clienta y a ti'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas con cabina facial avanzada', 'que reciben demanda de esta técnica y quieren ofrecerla con rigor'),
   ('Profesionales que ya tienen el dispositivo', 'y quieren entender sus límites reales antes de seguir usándolo'),
   ('Centros que quieren una política clara', 'sobre qué hacer y qué no hacer con el Hyaluron Pen'),
 ],
 'seg_h2': 'Límites claros, clienta segura',
 'seg_p1': 'En el Hyaluron Pen el riesgo no está en la aguja que no hay, sino en <strong>dónde se dispara y qué se dispara</strong>. Ciertas zonas del rostro tienen vasos que no perdonan y ciertas indicaciones son actos sanitarios, no estéticos. El curso dedica un bloque al marco regulatorio europeo y a la frontera entre lo que puede hacerse en cabina de estética y lo que exige un profesional sanitario.',
 'seg_p2': 'Aprenderás a reconocer las complicaciones que sí pueden aparecer, como <strong>hematoma, asimetría o granuloma</strong>, a actuar en el momento y a derivar cuando corresponda. Trabajar con un producto de trazabilidad conocida, material de un solo uso y un consentimiento informado completo no es burocracia: es lo que te permite dormir tranquila.',
 'faq': [
   ('¿El Hyaluron Pen es lo mismo que un relleno con aguja?', 'No. La inyección deposita el producto en un punto y a la profundidad que elige el profesional sanitario; el Hyaluron Pen lo dispersa en capas superficiales. Por eso sus indicaciones son cosméticas y superficiales y no sustituye a un relleno.'),
   ('¿Puede una esteticista usar el Hyaluron Pen?', 'Puede usarlo para indicaciones cosméticas superficiales con el dispositivo y el producto adecuados. Lo que no corresponde a la estética son los rellenos profundos, los surcos, las ojeras o la volumetría, que son actos sanitarios. El curso delimita con precisión esa frontera.'),
   ('¿Qué resultados reales se pueden prometer?', 'Hidratación y mejor aspecto de los labios y de las líneas finas, con una duración limitada. Prometer volumen o corrección de surcos es engañar a la clienta y exponerse a complicaciones. Enseñamos a hablar de resultados con honestidad.'),
   ('¿Qué riesgos tiene?', 'Hematoma, asimetría, nódulos o granulomas y, en zonas de riesgo vascular, complicaciones serias si se trabaja donde no se debe. Todos se previenen conociendo la anatomía, respetando las indicaciones y usando productos trazables.'),
   ('¿Qué ácido hialurónico se utiliza?', 'Productos formulados para uso con este tipo de dispositivo, con trazabilidad y conservación controladas, en ampolla de un solo uso. En el curso aprendes a leer una ficha técnica y a descartar productos sin garantías.'),
   ('¿Necesito tener el dispositivo para hacer el curso?', 'No. Las prácticas se realizan con el equipo del centro. Si estás valorando comprar uno, te orientamos sobre qué mirar y qué evitar.'),
   DONDE,
 ],
 'related': [R['dermapen'], R['plasmapen'], R['hifu']],
},
{
 'slug': 'cejas-valencia', 'cursos': ['cejas-diseno-visajismo', 'cejas-laminado-henna'],
 'title': 'Curso de Cejas en Valencia · Diseño, laminado y henna',
 'og_title': 'Curso de Cejas en Valencia · Diseño por visajismo, laminado y henna',
 'desc': 'Curso de cejas en Valencia: diseño por visajismo con la regla de los 3 puntos, cinco técnicas de modelado, laminado y henna profesional. Presencial en Valencia.',
 'keywords': 'curso de cejas valencia, curso diseño de cejas valencia, curso laminado de cejas valencia, curso henna cejas, brow lamination curso, visajismo cejas curso, academia estética valencia',
 'h1': 'Curso de Cejas <em>en Valencia</em>', 'h1_plain': 'Curso de Cejas en Valencia', 'bc_short': 'Cejas Valencia',
 'course_name': 'Curso de Cejas en Valencia · Diseño por visajismo, laminado y henna',
 'nivel': 'Profesional / Inicial', 'ficha_nivel': 'Inicial · 28 h (16 h diseño + 12 h laminado)', 'horas': 28, 'horas_online': 12,
 'about': ['Diseño de cejas', 'Visajismo', 'Laminado de cejas', 'Henna de cejas'],
 'teaches': 'Análisis facial y formas de rostro, regla de los 3 puntos y proporción áurea, cinco técnicas de modelado (hilo, cera, sugaring, pinzas, navaja), laminado de cejas con química del tioglicolato, henna profesional con lawsona y manejo de complicaciones.',
 'producto': 'Curso de Cejas · Diseño, laminado y henna',
 'lede': 'De la "depilación de cejas" a la consulta de diseño: visajismo, regla de los 3 puntos, cinco técnicas de modelado, laminado y henna profesional. Dos módulos que juntos montan una cabina de cejas completa. Formación para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'La cabina de cejas, completa',
 'que_es_p1': 'Una ceja bien diseñada cambia un rostro más que cualquier otro servicio rápido de cabina, y la clienta lo sabe: por eso el diseño de cejas ha pasado de ser un extra a ser una consulta con valor propio. El primer módulo enseña a <strong>leer el rostro</strong> (ovalado, redondo, cuadrado, rectangular, triángulo invertido, diamante, pera), a aplicar la <strong>regla de los 3 puntos</strong> y la proporción áurea, y a corregir asimetrías con cinco técnicas de modelado: hilo, cera caliente, sugaring, pinzas y navaja.',
 'que_es_p2': 'El segundo módulo añade los dos servicios más demandados de los últimos años: el <strong>laminado</strong>, que fija el pelo en la dirección deseada durante semanas, y la <strong>henna profesional</strong>, que pigmenta pelo y piel y es la alternativa no permanente a la micropigmentación. Se enseñan por separado y en protocolo combinado: diseño, laminado y henna en una misma cita.',
 'incluye': [
   ('Análisis facial y formas de rostro', 'siete formas clásicas y el tipo de ceja que corrige cada una'),
   ('Regla de los 3 puntos', 'mapeo universal de inicio, arco y final'),
   ('Proporción áurea aplicada', 'cómo compensar asimetrías sin forzar el diseño'),
   ('Cinco técnicas de modelado', 'hilo, cera caliente, sugaring, pinzas y navaja: cuándo usar cada una'),
   ('Casos de corrección', 'sobredepilación de los 90, cejas asimétricas, rostros cuadrados'),
   ('Laminado de cejas', 'química del tioglicolato, fases del protocolo y tiempos por tipo de pelo'),
   ('Henna profesional', 'lawsona, elección del tono, tiempos de exposición y duración real en pelo y piel'),
   ('Protocolo combinado', 'diseño, laminado y henna en una sola cita: orden y tiempos'),
   ('Seguridad química', 'prueba de sensibilidad, riesgo de quemadura química y por qué nunca henna negra con PPD'),
   ('Manejo de complicaciones', 'irritación, sobreprocesado, tono no deseado, reacción alérgica'),
   ('La consulta como servicio', 'cómo presentar, fotografiar y cobrar un diseño de cejas'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas que ya depilan cejas', 'y quieren convertir ese servicio en una consulta de diseño con precio propio'),
   ('Profesionales de pestañas y mirada', 'que quieren completar su cabina con laminado y henna'),
   ('Personas que empiezan en estética', 'es un curso de nivel inicial con salida inmediata en cabina'),
   ('Micropigmentadoras', 'que necesitan ofrecer una alternativa no permanente a sus clientas'),
 ],
 'seg_h2': 'Química bien usada, cejas intactas',
 'seg_p1': 'El laminado utiliza productos a base de <strong>tioglicolato</strong>, los mismos principios que una permanente, sobre un pelo mucho más fino y a milímetros del ojo. Tiempos mal calculados producen sobreprocesado y quemadura química. En el curso se trabaja con tiempos por tipo de pelo, prueba de sensibilidad previa y productos conformes a la normativa europea de cosméticos.',
 'seg_p2': 'Con la henna la regla es tajante: <strong>nunca henna negra con PPD</strong>, responsable de reacciones alérgicas graves. Se enseña a identificar una henna profesional con lawsona, a leer su etiquetado y a realizar la prueba de sensibilidad 48 horas antes. Todo el protocolo se adapta a los requisitos higiénico-sanitarios de los centros de estética de la Comunidad Valenciana.',
 'faq': [
   ('¿Cuánto dura el laminado de cejas?', 'Entre 4 y 6 semanas, según el tipo de pelo y el cuidado posterior. No conviene repetirlo antes de las 6-8 semanas para no debilitar el pelo; en el curso aprendes a programar el mantenimiento.'),
   ('¿Cuánto dura la henna de cejas?', 'En el pelo, de 4 a 6 semanas; en la piel, entre 7 y 14 días según el tipo de piel y la limpieza. Es la alternativa no permanente para quien no quiere micropigmentación o quiere probar un diseño antes.'),
   ('¿Puedo hacer solo uno de los dos módulos?', 'Sí. El diseño por visajismo (16 h) y el laminado con henna (12 h) se pueden cursar por separado, aunque juntos forman la cabina de cejas completa y así los planteamos.'),
   ('¿Es seguro el laminado de cejas?', 'Lo es cuando se respetan los tiempos por tipo de pelo, se hace prueba de sensibilidad y se usan productos conformes a la normativa de cosméticos. El riesgo real es el sobreprocesado y la quemadura química, y se previene con técnica.'),
   ('¿Qué diferencia hay entre henna y tinte de cejas?', 'El tinte colorea solo el pelo; la henna profesional con lawsona pigmenta pelo y piel, con lo que rellena huecos y simula más densidad. Por eso es la alternativa no permanente a la micropigmentación.'),
   ('¿Necesito experiencia previa?', 'No. Es un curso de nivel inicial. Si ya depilas cejas, el módulo de visajismo te da el método para diseñar; si empiezas de cero, las prácticas tuteladas cubren toda la técnica.'),
   DONDE,
 ],
 'related': [R['micro'], R['lifting'], R['micropig']],
},
{
 'slug': 'lifting-pestanas-valencia', 'cursos': ['pestanas-lifting-tinte'],
 'title': 'Curso de Lifting de Pestañas en Valencia · PRECISSA',
 'og_title': 'Curso de Lifting de Pestañas en Valencia · Lifting y tinte',
 'desc': 'Curso de lifting de pestañas y tinte en Valencia: química controlada, elección de pad, tiempos por tipo de pelo y complicaciones. Presencial en Valencia.',
 'keywords': 'curso lifting de pestañas valencia, curso lifting pestañas, lash lifting curso valencia, curso tinte de pestañas, formación pestañas valencia, academia estética valencia',
 'h1': 'Curso de Lifting de Pestañas <em>en Valencia</em>', 'h1_plain': 'Curso de Lifting de Pestañas en Valencia', 'bc_short': 'Lifting de pestañas Valencia',
 'course_name': 'Curso de Lifting de Pestañas en Valencia · Lifting y tinte',
 'nivel': 'Profesional / Inicial', 'ficha_nivel': 'Inicial · 12 h', 'horas': 12, 'horas_online': 5,
 'about': ['Lifting de pestañas', 'Tinte de pestañas', 'Lash lifting', 'Cabina de mirada'],
 'teaches': 'Ciclo folicular de la pestaña, química redox del lifting (tioglicolato, neutralizador, queratina), selección de pad por morfología, tiempos por tipo de pelo, tinte específico para pestañas, aftercare y manejo de complicaciones.',
 'producto': 'Curso de Lifting + tinte de pestañas',
 'lede': 'Curvado permanente de la pestaña natural combinado con tinte profesional: uno de los servicios más rentables de la cabina de mirada, sin extensiones. Formación para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'Lifting de pestañas, la mirada sin extensiones',
 'que_es_p1': 'El lifting de pestañas curva la pestaña natural desde la raíz mediante una <strong>reacción química controlada</strong>: un producto a base de tioglicolato abre la estructura del pelo, un neutralizador la fija en la nueva forma y un tratamiento de queratina la repara. Combinado con un tinte específico, el resultado es una mirada abierta y definida durante 6-8 semanas, sin extensiones ni mantenimiento semanal.',
 'que_es_p2': 'Es un servicio corto, de alta rotación y muy rentable, pero trabaja con química a un milímetro del ojo. La técnica está en elegir bien el <strong>pad</strong> según la longitud y la forma del ojo, y en calcular los <strong>tiempos por tipo de pelo</strong>: una pestaña fina y rubia no aguanta lo mismo que una gruesa y oscura. Esa es la diferencia entre una curva bonita y una pestaña quemada.',
 'incluye': [
   ('Ciclo folicular de la pestaña', 'por qué el resultado dura lo que dura y cuándo repetir'),
   ('Química del lifting', 'tioglicolato, neutralizador y queratina: qué hace cada fase'),
   ('Selección del pad', 'S, M, L o XL según longitud de la pestaña y morfología del ojo'),
   ('Tiempos por tipo de pelo', 'pestaña fina o rubia, gruesa, asiática: tablas y criterio'),
   ('Tinte específico para pestañas', 'elección del tono, tiempos y por qué nunca un tinte capilar'),
   ('Protocolo completo', 'limpieza, aislamiento del párpado, colocación, fases y retirada'),
   ('Prueba de sensibilidad', 'cuándo hacerla y cómo registrarla'),
   ('Aftercare', 'las 24-48 horas que deciden la duración del resultado'),
   ('Complicaciones', 'quemadura química, irritación ocular, alergia al tinte: prevenir y actuar'),
   ('Combinación con otros servicios', 'lifting, tinte y diseño de cejas en una misma cita'),
   ('Rentabilidad y agenda', 'tiempos reales de cabina y cómo programar el mantenimiento'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas que quieren abrir cabina de mirada', 'con un servicio rápido, rentable y sin mantenimiento semanal'),
   ('Profesionales de extensiones', 'que buscan una alternativa para clientas que no quieren o no toleran las extensiones'),
   ('Personas que empiezan en estética', 'es un curso de nivel inicial con salida inmediata en cabina'),
 ],
 'seg_h2': 'A un milímetro del ojo',
 'seg_p1': 'El lifting de pestañas es seguro cuando el producto nunca toca la piel ni entra en el ojo, los tiempos respetan el tipo de pelo y el tinte es un <strong>producto específico para pestañas</strong>, conforme a la normativa europea de cosméticos. Un tinte capilar en los ojos no es una opción: está prohibido y puede causar lesiones graves.',
 'seg_p2': 'Enseñamos a hacer y registrar la <strong>prueba de sensibilidad</strong> antes del primer servicio, a aislar correctamente el párpado y a reconocer una irritación o una reacción alérgica en sus primeros minutos. Todo ello adaptado a los requisitos higiénico-sanitarios de los centros de estética de la Comunidad Valenciana.',
 'faq': [
   ('¿Cuánto dura el lifting de pestañas?', 'Entre 6 y 8 semanas, lo que tarda la pestaña en completar su ciclo y renovarse. No se repite antes de las 6 semanas para no debilitar el pelo.'),
   ('¿Lifting de pestañas o extensiones?', 'El lifting trabaja la pestaña natural: sin mantenimiento semanal, sin adhesivos y apto para quien no tolera el cianoacrilato. Las extensiones añaden longitud y volumen artificial. Son servicios complementarios y muchas cabinas ofrecen los dos.'),
   ('¿Es seguro el lifting de pestañas?', 'Sí, con técnica: aislamiento del párpado, tiempos por tipo de pelo, productos conformes y prueba de sensibilidad. Las complicaciones (quemadura química, irritación, alergia) son evitables y el curso te enseña a prevenirlas y a actuar.'),
   ('¿Qué tinte se usa en las pestañas?', 'Solo tintes formulados y autorizados para pestañas. El tinte capilar está prohibido en la zona ocular. En el curso aprendes a elegir el tono y a calcular los tiempos.'),
   ('¿Cuánto tiempo dura el servicio en cabina?', 'Entre 45 y 60 minutos con tinte incluido. Es uno de los servicios con mejor relación tiempo-precio de la cabina de mirada.'),
   ('¿Necesito experiencia previa?', 'No. Es un curso de nivel inicial. Las prácticas tuteladas cubren el protocolo completo sobre modelo real.'),
   DONDE,
 ],
 'related': [R['cejas'], R['micro'], R['micropig']],
},
{
 'slug': 'maderoterapia-valencia', 'cursos': ['maderoterapia'],
 'title': 'Curso de Maderoterapia en Valencia · PRECISSA INSTITUTE',
 'og_title': 'Curso de Maderoterapia en Valencia · Masaje con instrumentos de madera',
 'desc': 'Curso de maderoterapia en Valencia: instrumental completo, anatomía del tejido adiposo, secuencia del protocolo y contraindicaciones. Presencial en Valencia.',
 'keywords': 'curso maderoterapia valencia, maderoterapia curso, formación maderoterapia valencia, masaje con madera curso, curso masaje corporal valencia, academia estética valencia',
 'h1': 'Curso de Maderoterapia <em>en Valencia</em>', 'h1_plain': 'Curso de Maderoterapia en Valencia', 'bc_short': 'Maderoterapia Valencia',
 'course_name': 'Curso de Maderoterapia en Valencia · Masaje con instrumentos de madera',
 'nivel': 'Profesional / Inicial', 'ficha_nivel': 'Inicial · 24 h', 'horas': 24, 'horas_online': 10,
 'about': ['Maderoterapia', 'Masaje corporal', 'Celulitis', 'Modelado corporal'],
 'teaches': 'Instrumental completo y función de cada pieza, anatomía del tejido adiposo subcutáneo y la celulitis, secuencia del protocolo (calentamiento, drenaje, modelado, reducción, tonificación, enfriamiento), contraindicaciones y manejo de hematomas.',
 'producto': 'Curso de Maderoterapia',
 'lede': 'Masaje corporal con instrumentos de madera, de origen colombiano, enseñado con claridad sobre lo que la evidencia respalda: rodillo cubano, copa sueca, hongo, tabla guitarra y una secuencia con sentido. Formación para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'Maderoterapia, con método y sin promesas vacías',
 'que_es_p1': 'La maderoterapia es un masaje corporal que utiliza <strong>instrumentos de madera</strong> de formas específicas para movilizar el tejido, activar la circulación y el drenaje, y modelar el contorno. Cada pieza tiene una función: el rodillo cubano calienta y drena, la copa sueca trabaja la celulitis por succión y arrastre, el hongo actúa sobre zonas localizadas, la tabla guitarra modela el contorno y la paleta tonifica.',
 'que_es_p2': 'Su auge reciente ha venido acompañado de mucho humo. Nosotras la enseñamos con la <strong>secuencia</strong> que tiene sentido fisiológico (calentamiento, drenaje, modelado, reducción, tonificación y enfriamiento) y con claridad sobre lo que puede y no puede conseguir: mejora el aspecto de la celulitis y la retención, pero no sustituye a la dieta, al ejercicio ni a la aparatología. Esa honestidad es lo que hace que la clienta repita.',
 'incluye': [
   ('Instrumental completo', 'rodillo cubano, copa sueca, hongo, tabla guitarra, paleta tonificadora, rodillo dentado y copa anticelulítica'),
   ('Función de cada instrumento', 'qué hace, dónde se usa y con qué presión'),
   ('Anatomía del tejido adiposo subcutáneo', 'septos fibrosos, celulitis y por qué responde al masaje'),
   ('Fisiología de la circulación y el drenaje', 'qué activa realmente el masaje y en qué plazos'),
   ('Secuencia del protocolo', 'calentamiento, drenaje, modelado, reducción, tonificación y enfriamiento'),
   ('Protocolo corporal completo', 'abdomen, glúteos, muslos, brazos y espalda: orden y tiempos'),
   ('Presión y ritmo', 'cómo trabajar intenso sin lesionar ni provocar hematomas innecesarios'),
   ('Contraindicaciones', 'embarazo en abdomen, varices severas, flebitis, lesiones cutáneas'),
   ('Manejo de hematomas', 'por qué aparecen, cómo minimizarlos y qué decirle a la clienta'),
   ('Higiene del instrumental', 'limpieza y desinfección de la madera entre clientas'),
   ('Cómo venderla con honestidad', 'expectativas realistas, bonos y combinación con aparatología'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas con cabina corporal', 'que quieren un servicio manual de alta demanda con baja inversión'),
   ('Masajistas y profesionales del bienestar', 'que buscan incorporar un protocolo modelador con método'),
   ('Personas que empiezan en estética corporal', 'es un curso de nivel inicial con práctica desde el primer día'),
 ],
 'seg_h2': 'Intensa, pero no agresiva',
 'seg_p1': 'La maderoterapia trabaja con presiones medias y altas sobre tejidos blandos. Mal aplicada deja <strong>hematomas</strong> extensos y puede dañar capilares y venas superficiales. El curso dedica un bloque a la presión y el ritmo adecuados por zona y a las contraindicaciones que no admiten discusión: embarazo en abdomen, varices severas, flebitis o trombosis, procesos inflamatorios y lesiones cutáneas.',
 'seg_p2': 'También aprendes a valorar a la clienta antes de empezar, a <strong>higienizar el instrumental</strong> de madera entre servicios y a documentar el tratamiento. Todo el protocolo se adapta a los requisitos higiénico-sanitarios de los centros de estética de la Comunidad Valenciana.',
 'faq': [
   ('¿La maderoterapia funciona de verdad?', 'Mejora el aspecto de la celulitis y la retención de líquidos y modela el contorno de forma temporal, siempre dentro de un plan que incluya hábitos y, si procede, aparatología. No adelgaza por sí sola, y en el curso enseñamos a explicarlo con claridad.'),
   ('¿Cuántas sesiones necesita una clienta?', 'Lo habitual es una serie de 8 a 10 sesiones, 2 por semana, con mantenimiento posterior. Depende del objetivo y de la zona, y en el curso aprendes a planificar el bono.'),
   ('¿Deja hematomas?', 'Puede dejar pequeñas marcas si se trabaja intenso, pero los hematomas extensos son señal de mala técnica. Enseñamos la presión y el ritmo adecuados por zona para minimizarlos.'),
   ('¿Qué instrumentos necesito para empezar?', 'Un kit básico con rodillo cubano, copa sueca, hongo y tabla guitarra cubre el protocolo completo. En el curso usamos el instrumental del centro y te orientamos sobre qué comprar y qué evitar.'),
   ('¿Se puede hacer en embarazadas?', 'No en abdomen. En otras zonas solo con autorización médica y adaptando la presión. Las contraindicaciones forman parte del temario y de la evaluación.'),
   ('¿Necesito experiencia previa en masaje?', 'No. Es un curso de nivel inicial. Si ya haces masaje, avanzarás más rápido en la parte manual; si no, las prácticas tuteladas cubren toda la técnica.'),
   DONDE,
 ],
 'related': [R['drenaje'], R['electro'], R['hifu']],
},
{
 'slug': 'drenaje-linfatico-valencia', 'cursos': ['drenaje-linfatico'],
 'title': 'Curso de Drenaje Linfático en Valencia · PRECISSA',
 'og_title': 'Curso de Drenaje Linfático Manual en Valencia · Métodos Vodder y Leduc',
 'desc': 'Curso de drenaje linfático manual en Valencia: red linfática, métodos Vodder y Leduc, protocolos facial y corporal y contraindicaciones. Presencial en Valencia.',
 'keywords': 'curso drenaje linfático valencia, drenaje linfático manual curso, método vodder curso, curso drenaje linfatico estetica, formación drenaje linfático valencia, academia estética valencia',
 'h1': 'Curso de Drenaje Linfático <em>en Valencia</em>', 'h1_plain': 'Curso de Drenaje Linfático en Valencia', 'bc_short': 'Drenaje linfático Valencia',
 'course_name': 'Curso de Drenaje Linfático Manual en Valencia · Métodos Vodder y Leduc',
 'nivel': 'Profesional / Inicial-Intermedio', 'ficha_nivel': 'Inicial a intermedio · 40 h', 'horas': 40, 'horas_online': 16,
 'about': ['Drenaje linfático manual', 'Método Vodder', 'Método Leduc', 'Retención de líquidos'],
 'teaches': 'Anatomía de la red linfática, fisiología del transporte linfático, métodos Vodder y Leduc con sus maniobras, indicaciones estéticas con expectativas realistas, protocolos facial y corporal, contraindicaciones absolutas y derivación.',
 'producto': 'Curso de Drenaje linfático manual',
 'lede': 'No es un "masaje suave": es una técnica con base anatómica precisa. Métodos Vodder y Leduc, protocolos facial y corporal y honestidad sobre lo que el drenaje puede hacer. Formación para esteticistas en Valencia. Presencial en Valencia.',
 'que_es_h2': 'Drenaje linfático manual, con anatomía real',
 'que_es_p1': 'El drenaje linfático manual es una técnica de maniobras lentas, rítmicas y de presión muy ligera que acompaña el recorrido natural de la linfa hacia los ganglios. Para hacerlo bien hay que conocer la <strong>red linfática</strong>: capilares iniciales, colectores, ganglios, los territorios de drenaje y el conducto torácico. Sin ese mapa, lo que se hace es un masaje relajante con otro nombre.',
 'que_es_p2': 'Enseñamos los dos métodos de referencia, <strong>Vodder</strong> (1932) y <strong>Leduc</strong>, con sus maniobras propias, y sus indicaciones estéticas con expectativas realistas: postoperatorio estético, apoyo tras aparatología, retención de líquidos, celulitis edematosa y ojeras vasculares. Y marcamos con claridad dónde termina la estética y empieza la fisioterapia.',
 'incluye': [
   ('Anatomía de la red linfática', 'capilares iniciales, colectores con linfangiones, ganglios, territorios y conducto torácico'),
   ('Fisiología del transporte linfático', 'cómo se mueve la linfa y qué puede estimular la mano'),
   ('Método Vodder', 'círculos fijos, bombeo, dador y rotatorio: la técnica original'),
   ('Método Leduc', 'maniobras de llamada y reabsorción, y cuándo elegir cada método'),
   ('Protocolo facial', '30-45 minutos: ojeras vasculares, hinchazón, apoyo tras tratamientos'),
   ('Protocolo corporal', '60-90 minutos: piernas, abdomen y zonas con retención'),
   ('Indicaciones estéticas', 'postoperatorio estético, post-aparatología, retención, celulitis edematosa'),
   ('Contraindicaciones absolutas', 'trombosis venosa profunda, insuficiencia cardíaca descompensada, infecciones activas, cáncer no tratado'),
   ('Derivación', 'qué casos corresponden a fisioterapia o medicina y cómo decirlo'),
   ('Presión y ritmo', 'la ligereza como técnica: por qué más fuerza no es más drenaje'),
   ('Valoración de la clienta', 'anamnesis, signos de alarma y registro del tratamiento'),
   'Test de evaluación y prácticas tuteladas',
 ],
 'perfil': [
   ('Esteticistas con cabina corporal o facial', 'que quieren una técnica manual con base científica y mucha demanda'),
   ('Profesionales de aparatología', 'que necesitan el drenaje como apoyo antes y después de los tratamientos'),
   ('Masajistas y profesionales del bienestar', 'que quieren dejar de improvisar el "drenaje" y aprender los métodos de referencia'),
 ],
 'seg_h2': 'Saber cuándo no drenar',
 'seg_p1': 'El drenaje linfático es una técnica suave, pero no inocua: moviliza líquido y, en una persona con <strong>trombosis venosa profunda</strong>, insuficiencia cardíaca descompensada o una infección activa, puede empeorar un cuadro serio. Por eso el curso dedica un bloque completo a las contraindicaciones absolutas y relativas y a la valoración previa de la clienta.',
 'seg_p2': 'También delimitamos con honestidad el terreno: el <strong>linfedema</strong> y los postoperatorios complejos son competencia de la fisioterapia y la medicina. Saber derivar no te quita clientas; te da credibilidad. El protocolo se adapta a los requisitos higiénico-sanitarios de los centros de estética de la Comunidad Valenciana.',
 'faq': [
   ('¿Qué diferencia hay entre drenaje linfático y masaje?', 'El masaje trabaja músculo y tejido con presión; el drenaje linfático usa maniobras muy ligeras que siguen el recorrido de la linfa hacia los ganglios. Más fuerza no es más drenaje: es otra cosa.'),
   ('¿Vodder o Leduc? ¿Cuál se enseña?', 'Los dos. Vodder es el método original, con sus maniobras clásicas; Leduc aporta las maniobras de llamada y reabsorción. Aprendes ambos y cuándo conviene cada uno.'),
   ('¿Para qué sirve el drenaje linfático en estética?', 'Para retención de líquidos, celulitis edematosa, ojeras vasculares, hinchazón facial y como apoyo antes y después de tratamientos de aparatología o cirugía estética. Siempre con expectativas realistas.'),
   ('¿Puede hacerlo una esteticista tras una cirugía?', 'En postoperatorios estéticos sencillos y con el alta del cirujano, sí, y es uno de los servicios más demandados. Los postoperatorios complejos y el linfedema corresponden a fisioterapia, y en el curso aprendes a distinguirlos.'),
   ('¿Cuánto dura una sesión?', 'Un protocolo facial, entre 30 y 45 minutos; uno corporal, entre 60 y 90. Las series habituales son de 5 a 10 sesiones según el objetivo.'),
   ('¿Necesito experiencia previa?', 'No. Es un curso de nivel inicial a intermedio. La base anatómica se da desde cero y las prácticas tuteladas cubren los dos métodos.'),
   DONDE,
 ],
 'related': [R['madero'], R['electro'], R['hifu']],
},
]

# ─────────────────────────────────────────────────────────────────
# 1) Escribir las landings
# ─────────────────────────────────────────────────────────────────
for L in LANDINGS:
    d = ROOT / 'cursos' / L['slug']
    d.mkdir(exist_ok=True)
    page = build(L)
    (d / 'index.html').write_text(page, encoding='utf-8')
    words = len(re.sub(r'<[^>]+>', ' ', re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)).split())
    print(f"{L['slug']}: {words} palabras")

# ─────────────────────────────────────────────────────────────────
# 2) Cableado
# ─────────────────────────────────────────────────────────────────
def rep(path, old, new, n=1):
    p = ROOT / path; s = p.read_text(encoding='utf-8')
    assert s.count(old) == n, (path, s.count(old), old[:70])
    p.write_text(s.replace(old, new), encoding='utf-8')

# sitemap: nuevas URLs + lastmod real de las existentes
sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
def lastmod_git(rel):
    out = subprocess.run(['git', 'log', '-1', '--format=%cd', '--date=short', '--', rel], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or HOY
pages = {'https://precissainstitute.com/': 'index.html', 'https://precissainstitute.com/cursos/': 'cursos/index.html',
         'https://precissainstitute.com/sobre/': 'sobre/index.html', 'https://precissainstitute.com/aviso-legal/': 'aviso-legal/index.html',
         'https://precissainstitute.com/privacidad/': 'privacidad/index.html', 'https://precissainstitute.com/cookies/': 'cookies/index.html'}
for slug in ['plasmapen', 'electroestetica', 'microblading', 'hifu', 'depilacion-laser', 'micropigmentacion']:
    pages[f'https://precissainstitute.com/cursos/{slug}-valencia/'] = f'cursos/{slug}-valencia/index.html'
def fix_lastmod(m):
    loc = m.group(1); return f'<loc>{loc}</loc>\n    <lastmod>{lastmod_git(pages[loc]) if loc in pages else m.group(2)}</lastmod>'
sm = re.sub(r'<loc>([^<]+)</loc>\n    <lastmod>([^<]+)</lastmod>', fix_lastmod, sm)
nuevas = ''.join(f'''  <url>
    <loc>{BASE}/cursos/{L['slug']}/</loc>
    <lastmod>{HOY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
''' for L in LANDINGS)
marker = '  <!-- Landing pages SEO por tratamiento + ciudad -->\n'
assert sm.count(marker) == 1
# insertar las nuevas justo después del último bloque de landings existentes (antes del siguiente comentario)
idx = sm.index(marker)
nxt = sm.index('  <!--', idx + len(marker))
sm = sm[:nxt] + nuevas + '\n' + sm[nxt:]
(ROOT / 'sitemap.xml').write_text(sm, encoding='utf-8')

# catálogo estático: href y url en ItemList
cat = (ROOT / 'cursos/index.html').read_text(encoding='utf-8')
titles = {'dermapen-microneedling': 'Dermapen · Microneedling profesional', 'hyaluron-pen': 'Hyaluron Pen',
          'cejas-diseno-visajismo': 'Diseño de cejas · Visajismo aplicado', 'cejas-laminado-henna': 'Laminado + henna de cejas',
          'pestanas-lifting-tinte': 'Lifting + tinte de pestañas', 'maderoterapia': 'Maderoterapia', 'drenaje-linfatico': 'Drenaje linfático manual'}
for L in LANDINGS:
    for cid in L['cursos']:
        old = f'href="/#curso/{cid}"'; assert cat.count(old) == 1, cid
        cat = cat.replace(old, f'href="/cursos/{L["slug"]}/"')
        old2 = f'"name": "{titles[cid]}"\n'; assert cat.count(old2) == 1, (cid, cat.count(old2))
        cat = cat.replace(old2, f'"name": "{titles[cid]}",\n      "url": "{BASE}/cursos/{L["slug"]}/"\n')
(ROOT / 'cursos/index.html').write_text(cat, encoding='utf-8')

# footer de la home
rep('index.html', '        <a class="footer-link" href="/cursos/micropigmentacion-valencia/">Curso de Micropigmentación</a>\n',
    '        <a class="footer-link" href="/cursos/micropigmentacion-valencia/">Curso de Micropigmentación</a>\n' +
    ''.join(f'        <a class="footer-link" href="{R[k][0]}">{R[k][1]}</a>\n' for k in ['dermapen', 'hyaluron', 'cejas', 'lifting', 'madero', 'drenaje']))

# landings hermanas: cursos relacionados
def add_related(slug, key):
    u, t, d = R[key]
    row = f'      <li><strong><a href="{u}" style="color:inherit">{esc(t)}</a></strong><span>{esc(d)}</span></li>\n'
    rep(f'cursos/{slug}-valencia/index.html', '      <li><strong><a href="/cursos/" style="color:inherit">Todos los cursos', row + '      <li><strong><a href="/cursos/" style="color:inherit">Todos los cursos')
add_related('electroestetica', 'dermapen')
add_related('plasmapen', 'hyaluron')
add_related('microblading', 'cejas')
add_related('micropigmentacion', 'lifting')
add_related('hifu', 'drenaje')
add_related('depilacion-laser', 'madero')

# service worker
rep('sw.js', "  '/cursos/micropigmentacion-valencia/',\n", "  '/cursos/micropigmentacion-valencia/',\n" + ''.join(f"  '/cursos/{L['slug']}/',\n" for L in LANDINGS))
rep('sw.js', "const CACHE_VERSION = 'v31';", "const CACHE_VERSION = 'v32';")
print('cableado ok')
