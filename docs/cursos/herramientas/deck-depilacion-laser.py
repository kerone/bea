# -*- coding: utf-8 -*-
"""Deck docente de Depilación láser (manual 60 h). Diapositivas escritas a
mano con criterio pedagógico; el texto íntegro del manual va en el panel de
guion de cada diapositiva (solo lo ve quien expone)."""
import re, json, html, sys
S = sys.argv[1]
md = open(f'{S}/manual-bruto.md', encoding='utf-8').read()
meta = json.load(open(f'{S}/img-out/meta.json', encoding='utf-8'))
b64 = {k: open(f'{S}/img-out/{v["slug"]}.b64').read() for k, v in meta.items()}

# ── Texto del manual por sección, para el guion ──────────────────────────
def seccion(h2, h3=None):
    """Párrafos (sin tablas/imagenes/listas) de una ### dentro de una ##."""
    m = re.search(r'^## ' + re.escape(h2) + r'.*?\n(.*?)(?=^## |\Z)', md, re.S | re.M)
    if not m: return ''
    cuerpo = m.group(1)
    if not h3:
        cuerpo = cuerpo.split('\n### ')[0]
    if h3:
        m2 = re.search(r'^### ' + re.escape(h3) + r'\n(.*?)(?=^### |\Z)', cuerpo, re.S | re.M)
        cuerpo = m2.group(1) if m2 else ''
    lineas = [l.strip() for l in cuerpo.split('\n') if l.strip() and not l.startswith('|') and not l.startswith('![') and not l.startswith('###')]
    return '\n\n'.join(lineas)

def esc(t): return html.escape(t, quote=False)
def inl(t):
    t = t.replace('<strong>', '**').replace('</strong>', '**')
    t = esc(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', t)
    return t
def notas_html(txt):
    if not txt: return ''
    partes = [p.strip() for p in txt.split('\n\n') if p.strip()]
    out = []
    for p in partes:
        if p.startswith('- '): out.append('<ul>' + ''.join(f'<li>{inl(x[2:])}</li>' for x in p.split('\n') if x.startswith('- ')) + '</ul>')
        else: out.append(f'<p>{inl(p)}</p>')
    return ''.join(out)

slides = []
def add(cls, bloque, inner, notas='', eyebrow='', titulo='', h1=False):
    tag = 'h1' if h1 else 'h2'
    slides.append({
        'cls': cls, 'bloque': bloque,
        'html': (f'<div class="slide-eyebrow">{eyebrow}</div>' if eyebrow else '') +
                (f'<{tag} class="slide-{tag}">{titulo}</{tag}>' if titulo else '') + inner,
        'notas': notas_html(notas)})

# Componentes
def fig(k, alto=470):
    v = meta[k]
    return f'<img class="fig" style="max-height:{alto}px" src="data:image/jpeg;base64,{b64[k]}" alt="{esc(v["alt"])}">'
def split(k, puntos, lead=''):
    """Infografía grande a la izquierda + puntos clave a la derecha."""
    items = ''.join(f'<li><b>{inl(t)}</b>{(" " + inl(d)) if d else ""}</li>' for t, d in puntos)
    lead_html = ('<p class="slide-lead">' + inl(lead) + '</p>') if lead else ''
    return '<div class="split"><div class="split-fig">' + fig(k) + '</div><div class="split-txt">' + lead_html + '<ul class="claves">' + items + '</ul></div></div>'
def cards(items, cols=3, num=True):
    out = ''.join('<div class="card">' + (('<span class="card-n">%02d</span>' % (i + 1)) if num else '') + '<b>' + inl(t) + '</b><p>' + inl(d) + '</p></div>' for i, (t, d) in enumerate(items))
    return f'<div class="cards cols-{cols}">{out}</div>'
def tabla(rows, cls=''):
    h = '<tr>' + ''.join(f'<th>{inl(c)}</th>' for c in rows[0]) + '</tr>'
    b = ''.join('<tr>' + ''.join(f'<td>{inl(c)}</td>' for c in r) + '</tr>' for r in rows[1:])
    return f'<table class="tbl {cls}">{h}{b}</table>'
def callout(tit, txt, tipo=''):
    return f'<div class="callout {tipo}"><strong>{inl(tit)}</strong><p>{inl(txt)}</p></div>'
def objetivos(lista):
    return '<div class="objetivos"><div class="objetivos-k">Al terminar este módulo sabrás</div><ol>' + ''.join(f'<li>{inl(x)}</li>' for x in lista) + '</ol></div>'
def tabla_md(h2, h3):
    m = re.search(r'^## ' + re.escape(h2) + r'.*?\n(.*?)(?=^## |\Z)', md, re.S | re.M).group(1)
    m2 = re.search(r'^### ' + re.escape(h3) + r'\n(.*?)(?=^### |\Z)', m, re.S | re.M).group(1)
    rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in m2.split('\n') if l.startswith('|') and not re.match(r'^\|(\s*-+\s*\|)+\s*$', l)]
    return rows

# ════════════════════════════════════════════════════════════════════════
# PORTADA Y MARCO
# ════════════════════════════════════════════════════════════════════════
add('slide--cover', 'Depilación láser', '''
  <p class="slide-lead">Fundamentos, valoración, seguridad y práctica supervisada. Un curso para trabajar con criterio: sin parámetros universales, siempre dentro de las instrucciones del fabricante y de la propia competencia.</p>
  <div class="slide-cover-meta">
    <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Duración</span><span class="slide-cover-meta-v">60 horas</span></div>
    <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Teoría</span><span class="slide-cover-meta-v">28 h · 7 módulos</span></div>
    <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Práctica</span><span class="slide-cover-meta-v">32 h · 8 jornadas</span></div>
    <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Nivel</span><span class="slide-cover-meta-v">Avanzado</span></div>
  </div>''',
  notas='Material formativo en español con ilustraciones originales, ejercicios, pruebas de aprendizaje, casos y rúbricas.\n\n' + re.search(r'### Aviso de alcance\n\n(.+?)\n', md).group(1),
  eyebrow='Curso 07 · Electroestética · Manual profesional', titulo='Depilación<br><em>láser</em>', h1=True)

add('', 'Presentación', callout('Material de formación general', re.search(r'### Aviso de alcance\n\n(.+?)\n', md).group(1), 'callout--warn') +
    '<p class="slide-meta" style="margin-top:22px">Lo repetiremos a lo largo del curso: <strong>no se prescriben parámetros</strong>. Se aplican los del fabricante para el dispositivo, la zona y la persona.</p>',
    notas=re.search(r'### Aviso de alcance\n\n(.+?)\n', md).group(1),
    eyebrow='Antes de empezar', titulo='Aviso de <em>alcance</em>')

add('', 'Presentación', '''
  <div class="kpis">
    <div class="kpi"><b>60</b><span>horas en total</span></div>
    <div class="kpi"><b>28</b><span>h de teoría online · 7 módulos de 4 h</span></div>
    <div class="kpi"><b>32</b><span>h presenciales · 8 jornadas de 4 h</span></div>
    <div class="kpi"><b>3</b><span>pruebas: tests, examen teórico y examen práctico</span></div>
  </div>''' + cards([
    ('Teoría online', 'Explicación, tablas de síntesis y actividades en cada módulo. Un test de cinco preguntas al cerrar cada bloque.'),
    ('Jornadas presenciales', 'Demostración, práctica entre compañeras o modelos informadas y supervisión docente. Listas de cotejo y registro individual.'),
    ('Práctica sobre personas', 'Solo si el centro está autorizado, con consentimiento, evaluación previa y supervisión competente.')], 3, num=False),
    notas=seccion('Cómo usar este manual'),
    eyebrow='Cómo usar este manual', titulo='El curso <em>en cifras</em>')

mapa = tabla_md('Cómo usar este manual', 'Mapa curricular')
add('', 'Presentación', '<div class="mapa"><div><div class="mapa-k">Módulos teóricos · 4 h cada uno</div><ol>' +
    ''.join(f'<li>{inl(r[0][3:])}</li>' for r in mapa[1:] if r[0]) + '</ol></div><div><div class="mapa-k">Jornadas prácticas · 4 h cada una</div><ol>' +
    ''.join(f'<li>{inl(r[1][3:])}</li>' for r in mapa[1:] if r[1]) + '</ol></div></div>',
    notas=seccion('Cómo usar este manual'), eyebrow='Cómo usar este manual', titulo='Mapa <em>curricular</em>')

add('', 'Presentación', cards([
    ('Seis tests de aprendizaje', 'Cinco preguntas al cerrar cada módulo, con la respuesta razonada. Sirven para afianzar, no para seleccionar.'),
    ('Examen final teórico', '30 preguntas en la pestaña Test del aula. 45–60 minutos. Umbral sugerido: 24/30 (80 %).'),
    ('Cinco casos prácticos', 'Cada alumna presenta: datos que faltan, decisión, fundamento, explicación a la persona, registro y seguimiento.'),
    ('Examen práctico integrado', 'Cuatro estaciones, 50 minutos. Rúbrica de seis criterios: aprobado con ≥ 80 % y ningún fallo crítico de seguridad.')], 2),
    notas=seccion('Examen final teórico') + '\n\n' + seccion('Cinco casos prácticos') + '\n\n' + seccion('Examen práctico integrado'),
    eyebrow='Evaluación', titulo='Cómo se <em>evalúa</em>')

# ════════════════════════════════════════════════════════════════════════
def modulo(num, titulo_html, objetivos_lista, h2):
    add('slide--section', f'Módulo {num}', objetivos(objetivos_lista),
        notas=seccion(h2, 'Resultados de aprendizaje'),
        eyebrow=f'Módulo {num} de 7 · 4 h de estudio online', titulo=titulo_html, h1=True)

# ── MÓDULO 1 ─────────────────────────────────────────────────────────────
M1 = 'Módulo 1. Piel, pelo y folículo'
modulo(1, 'Piel, pelo <em>y folículo</em>', ['Distinguir las capas cutáneas y sus funciones generales.', 'Reconocer las partes del pelo y del folículo relevantes para la fotodepilación.', 'Explicar por qué la melanina del tallo y de la unidad pilosebácea es el cromóforo principal.'], M1)
add('', 'Módulo 1', cards([
    ('Epidermis', 'Epitelio estratificado <strong>sin vasos propios</strong>. Su estrato córneo frena la pérdida de agua: es la barrera.'),
    ('Dermis', 'Matriz, vasos, nervios y soporte mecánico. Aquí vive la mayor parte del folículo.'),
    ('Hipodermis', 'Tejido adiposo y conectivo. Su grosor varía según la región del cuerpo.')]) +
    callout('La superficie visible no informa por sí sola del estado de la barrera', 'Irritación, inflamación, lesión, infección, pigmentación reciente y bronceado alteran la evaluación y pueden exigir aplazar o derivar.', 'callout--warn'),
    notas=seccion(M1, 'Piel y barrera cutánea'), eyebrow='Módulo 1 · Piel, pelo y folículo', titulo='La piel, <em>por capas</em>')
add('', 'Módulo 1', split('image2', [
    ('Tallo', 'la parte visible: células queratinizadas con melanina.'),
    ('Bulbo y matriz', 'en la base; la matriz fabrica el pelo en fase activa.'),
    ('Papila dérmica', 'vascularizada: soporte y señales para el folículo.'),
    ('Melanocitos', 'producen la melanina: el pigmento que absorbe la luz y la convierte en calor.'),
    ('Glándula sebácea y músculo erector', 'forman parte de la unidad, pero no son el blanco térmico.')],
    lead='El folículo es una invaginación de la epidermis hacia la dermis. Lo que vemos es solo el tallo.'),
    notas=seccion(M1, 'Unidad pilosebácea'), eyebrow='Módulo 1 · Esquema 1', titulo='Anatomía del <em>folículo</em>')
add('', 'Módulo 1', cards([
    ('Pelo terminal', 'Más grueso y pigmentado: más melanina disponible para absorber energía.'),
    ('Vello fino', 'Menos pigmento, menos cromóforo: respuesta más limitada.'),
    ('Pelo blanco, gris, rubio claro o rojo', 'Puede responder poco: apenas hay melanina absorbente.')]) +
    callout('Lo que se promete: reducción duradera, no "eliminación permanente de todo el pelo"', 'Hay variabilidad individual y posibles sesiones de mantenimiento. El objetivo y la respuesta dependen de profundidad, calibre, pigmentación, fase y parámetros; la anatomía no se ve por completo desde fuera.'),
    notas=seccion(M1, 'Aplicación a la práctica'), eyebrow='Módulo 1 · Aplicación a la práctica', titulo='No todos los pelos <em>responden igual</em>')
add('', 'Módulo 1', tabla(tabla_md(M1, 'Ficha de estudio')), notas=seccion(M1, 'Unidad pilosebácea'), eyebrow='Módulo 1 · Ficha de estudio', titulo='Estructuras y <em>su relevancia</em>')

# ── MÓDULO 2 ─────────────────────────────────────────────────────────────
M2 = 'Módulo 2. Ciclo piloso y fototipos'
modulo(2, 'Ciclo piloso <em>y fototipos</em>', ['Describir anágena, catágena y telógena.', 'Relacionar el ciclo asíncrono con la necesidad de sesiones espaciadas.', 'Utilizar Fitzpatrick como referencia complementaria y no como ajuste automático.'], M2)
add('', 'Módulo 2', split('image3', [
    ('Anágena · crecimiento activo', 'tallo pigmentado conectado con la unidad profunda. La fase más susceptible al daño térmico dirigido.'),
    ('Catágena · transición', 'breve; cesa el crecimiento y el folículo involuciona.'),
    ('Telógena · reposo', 'y desprendimiento; después puede empezar una nueva anágena.'),
    ('Los pelos no van sincronizados', 'en una misma zona conviven las tres fases.')]),
    notas=seccion(M2, 'Fases del ciclo'), eyebrow='Módulo 2 · Esquema 2', titulo='Las tres fases <em>del ciclo</em>')
add('', 'Módulo 2', '<p class="slide-lead">Si solo responde bien el pelo en anágena y los pelos de una zona no están sincronizados, una sesión alcanza a una parte. Por eso:</p>' + cards([
    ('Sesiones espaciadas', 'Para ir alcanzando los pelos según entran en fase activa.'),
    ('Eficacia variable', 'Depende de dispositivo, pelo, zona y tratamiento. No hay un número fijo de sesiones.'),
    ('Sin promesas de calendario', 'Se explica a la persona desde la primera consulta.')]),
    notas=seccion(M2, 'Fases del ciclo'), eyebrow='Módulo 2 · Ciclo piloso', titulo='Por qué hacen falta <em>varias sesiones</em>')
add('', 'Módulo 2', split('image4', [
    ('Qué mide Fitzpatrick', 'la respuesta habitual al sol: tendencia a quemarse o broncearse.'),
    ('Qué NO mide', 'la cantidad de melanina, ni predice con precisión la respuesta al láser.'),
    ('Qué registrar por separado', 'fototipo, tono observado hoy, bronceado reciente, hiperpigmentación y reacciones previas.'),
    ('Piel más pigmentada o bronceada', 'la epidermis compite por la energía: longitud de onda y protocolo adecuados, enfriamiento y prueba de tolerancia.')],
    lead='Una referencia complementaria. Un fototipo no habilita a tratar ni determina por sí solo la fluencia.'),
    notas=seccion(M2, 'Fototipos Fitzpatrick I–VI'), eyebrow='Módulo 2 · Esquema 3', titulo='Fototipos <em>Fitzpatrick I–VI</em>')
add('', 'Módulo 2', tabla(tabla_md(M2, 'Tabla de referencia')), notas=seccion(M2, 'Fototipos Fitzpatrick I–VI'), eyebrow='Módulo 2 · Tabla de referencia', titulo='Fototipo y <em>consideración formativa</em>')

# ── MÓDULO 3 ─────────────────────────────────────────────────────────────
M3 = 'Módulo 3. Física de la luz y fototermólisis selectiva'
modulo(3, 'Física de la luz y <em>fototermólisis selectiva</em>', ['Diferenciar láser de luz pulsada intensa.', 'Definir longitud de onda, fluencia, duración de pulso, frecuencia, spot y enfriamiento.', 'Explicar el principio de fototermólisis selectiva y sus límites.'], M3)
add('', 'Módulo 3', '<div class="two-col"><div><h3>Láser</h3><ul><li>Luz con propiedades espectrales y de coherencia específicas.</li><li>Una longitud de onda definida.</li></ul></div><div><h3>IPL · luz pulsada intensa</h3><ul><li>Espectro amplio, filtrado.</li><li><strong>No es láser.</strong></li></ul></div></div>' +
    callout('Cromóforos en depilación', 'El objetivo es la melanina del pelo. Compiten por la energía la melanina epidérmica y la hemoglobina. La absorción depende de la longitud de onda y del tejido.'),
    notas=seccion(M3, 'Luz y cromóforos'), eyebrow='Módulo 3 · Luz y cromóforos', titulo='Láser e IPL <em>no son lo mismo</em>')
add('', 'Módulo 3', split('image5', [
    ('1. La luz alcanza el folículo', 'con una longitud de onda adecuada penetra y llega al pelo.'),
    ('2. La melanina absorbe', 'la energía óptica de forma selectiva.'),
    ('3. Se genera calor', 'en el folículo.'),
    ('4. Daño selectivo', 'si energía y tiempo se ajustan al objetivo sin difundir calor al tejido vecino.'),
    ('La selectividad es relativa, nunca absoluta', '')],
    lead='Concentrar el calor en el folículo sin lesionar innecesariamente la piel.'),
    notas=seccion(M3, 'Fototermólisis selectiva'), eyebrow='Módulo 3 · Esquema 4', titulo='Fototermólisis <em>selectiva</em>')
add('', 'Módulo 3', cards([
    ('Longitud de onda (nm)', 'Condiciona absorción y penetración óptica.'),
    ('Fluencia (J/cm²)', 'Energía por superficie.'),
    ('Duración del pulso (ms)', 'Tiempo de entrega; según el blanco y el fabricante.'),
    ('Frecuencia (Hz)', 'Pulsos por segundo; en barrido marca ritmo y solapamiento.'),
    ('Spot', 'Tamaño de la zona iluminada: cobertura y reparto de energía.'),
    ('Refrigeración', 'Protege la epidermis y mejora la tolerancia cuando el sistema está diseñado para ello.')], 3) +
    callout('No se cambia un parámetro aislado "a ojo"', 'La combinación segura depende de modelo, modo, aplicador, calibración, zona, pelo, tono, enfriamiento y prueba previa. Nunca se trasladan ajustes de un equipo a otro, aunque compartan longitud de onda.', 'callout--danger'),
    notas=seccion(M3, 'Parámetros que interactúan'), eyebrow='Módulo 3 · Parámetros', titulo='Seis parámetros <em>que interactúan</em>')
add('', 'Módulo 3', '<div class="two-col"><div><h3 class="ok">Respuesta esperable</h3><ul><li>Enrojecimiento perifolicular leve y transitorio.</li><li>No se busca una respuesta intensa como "prueba de eficacia".</li></ul></div><div><h3 class="warn">Detener de inmediato ante</h3><ul><li>Dolor desproporcionado</li><li>Blanqueamiento grisáceo</li><li>Ampolla</li><li>Carbonización</li><li>Eritema confluyente</li></ul></div></div>' +
    callout('Qué puede causar una quemadura o un cambio pigmentario', 'Pulsos demasiado agresivos, piel bronceada, solapamiento, mala refrigeración o mala técnica. Ante cualquiera de las señales: parar y activar el protocolo de incidencia.', 'callout--danger'),
    notas=seccion(M3, 'Fototermólisis selectiva'), eyebrow='Módulo 3 · Límites', titulo='Qué es normal y <em>qué obliga a parar</em>')
add('', 'Módulo 3', tabla(tabla_md(M3, 'Ficha técnica')) + f'<p class="slide-meta" style="margin-top:12px">Actividad: {inl(seccion(M3, "Actividad de aprendizaje"))}</p>',
    notas=seccion(M3, 'Parámetros que interactúan'), eyebrow='Módulo 3 · Ficha técnica', titulo='La pregunta antes <em>de operar</em>')

# ── MÓDULO 4 ─────────────────────────────────────────────────────────────
M4 = 'Módulo 4. Tecnologías y equipos'
modulo(4, 'Tecnologías <em>y equipos</em>', ['Comparar diodo, alejandrita, Nd:YAG e IPL con lenguaje no absoluto.', 'Reconocer que la etiqueta comercial no garantiza seguridad ni eficacia.', 'Leer las instrucciones de uso y el etiquetado del equipo antes de operarlo.'], M4)
add('', 'Módulo 4', split('image6', [
    ('Alejandrita · ~755 nm', 'absorción de melanina relativamente alta; cuidado con epidermis pigmentada o bronceada.'),
    ('Diodo · ~800–810 nm (con variantes)', 'uso extendido; distintos modos y refrigeración; sin ajuste universal entre modelos.'),
    ('Nd:YAG · 1064 nm', 'menor absorción epidérmica relativa; útil en algunos fototipos oscuros, pero no elimina el riesgo.'),
    ('IPL · espectro amplio filtrado', 'no es láser; el filtro y el pulso dependen del equipo.')],
    lead='Rangos indicativos, no una prescripción. La elección depende del equipo concreto, tono actual, pelo, zona, historial y formación.'),
    notas=seccion(M4, 'Comparación orientativa'), eyebrow='Módulo 4 · Esquema 5', titulo='Cuatro tecnologías, <em>cuatro perfiles</em>')
add('', 'Módulo 4', cards([
    ('"Diodo"', 'Describe una familia de equipos con bandas y modos muy distintos. No es un ajuste.'),
    ('"SHR"', 'Un modo de entrega comercial (baja fluencia / alta repetición o barrido) en ciertos equipos. No es una longitud de onda.'),
    ('"Triple onda"', 'Una etiqueta de marketing. No garantiza seguridad ni eficacia por sí misma.')]) +
    callout('La tecnología más apropiada no se decide por publicidad, precio ni fototipo aislado', 'Consultar siempre indicación, contraindicaciones, consumibles, filtros y parámetros del manual de usuario. Las tablas de esta formación son didácticas: no clasifican un producto comercial.', 'callout--warn'),
    notas=seccion(M4, 'Comparación orientativa') + '\n\n' + seccion(M4, 'Límites comparativos'), eyebrow='Módulo 4 · Etiquetas comerciales', titulo='Lo que la etiqueta <em>no garantiza</em>')
add('', 'Módulo 4', cards([
    ('Identificación y documentación', 'Modelo, manual, registros de mantenimiento y calibración según fabricante.'),
    ('Estado físico', 'Cables, manípulo, cristal, refrigeración, alarmas y accesorios.'),
    ('Aplicador correcto', 'El que corresponde al tratamiento, montado y limpio.'),
    ('Gafas certificadas', 'Para cliente y operadora: rango espectral y densidad óptica requeridos.'),
    ('Lectura estable', 'Sin alarmas ni lecturas inestables.'),
    ('Si algo falla', 'Falta una pieza, hay daño, alarma o instrucción poco clara: <strong>no usar y escalar</strong> al responsable técnico.')], 3),
    notas=seccion(M4, 'Equipo y control'), eyebrow='Módulo 4 · Equipo y control', titulo='Antes de encender, <em>seis comprobaciones</em>')
add('', 'Módulo 4', tabla(tabla_md(M4, 'Matriz comparativa')), notas=seccion(M4, 'Límites comparativos'), eyebrow='Módulo 4 · Matriz comparativa', titulo='Sistemas, naturaleza <em>y límites</em>')

# ── MÓDULO 5 ─────────────────────────────────────────────────────────────
M5 = 'Módulo 5. Valoración, anamnesis y criterios de aplazamiento'
modulo(5, 'Valoración, anamnesis y <em>criterios de aplazamiento</em>', ['Realizar una entrevista estructurada con privacidad y consentimiento.', 'Identificar los datos que obligan a aplazar, consultar o derivar.', 'Documentar zona, pelo, piel, exposición, medicación e historial.'], M5)
add('', 'Módulo 5', cards([
    ('Qué explicar', 'Finalidad, límites, sensaciones, alternativas, riesgos razonables, número variable de sesiones, mantenimiento y cuidados.'),
    ('Consentimiento informado', 'Antes de la sesión. Con autorización específica para fotografías cuando proceda.'),
    ('Datos mínimos', 'Recoger solo lo necesario y proteger su confidencialidad.')]) + cards([
    ('Qué registrar', 'Tono/fototipo orientativo, bronceado o autobronceador reciente, exposición solar, color y calibre del pelo, métodos usados, sesiones previas y respuesta.'),
    ('Qué inspeccionar', 'La zona con luz adecuada: heridas, infección, irritación, tatuaje, lesión pigmentada o anomalía no aclarada.'),
    ('Qué no hacer', '<strong>No diagnosticar lesiones cutáneas.</strong> Ante incertidumbre: aplazar y derivar.')], 3, num=False),
    notas=seccion(M5, 'Anamnesis y evaluación'), eyebrow='Módulo 5 · Anamnesis y evaluación', titulo='La consulta: <em>explicar, registrar, inspeccionar</em>')
add('', 'Módulo 5', '<div class="two-col"><div><h3>Preguntar siempre por</h3><ul><li>Medicación prescrita y no prescrita</li><li>Productos tópicos</li><li>Antecedentes de fotosensibilidad</li><li>Cicatrización anómala</li></ul></div><div><h3 class="warn">No improvisar ante</h3><ul><li>Embarazo, enfermedad activa</li><li>Lesión, brote, infección, herpes en la zona</li><li>Historia de reacción intensa</li><li>Medicación potencialmente fotosensibilizante</li></ul></div></div>' +
    callout('Nunca se suspende ni se modifica una medicación por cuenta propia', 'Se consulta al prescriptor o se sigue la instrucción concreta del fabricante. Evitar listas simplistas de "contraindicación absoluta" universales: el alcance depende del uso previsto, la IFU, la normativa y el juicio clínico. Cuando no pueda aclararse con seguridad, se aplaza.', 'callout--danger'),
    notas=seccion(M5, 'Medicaciones y condiciones'), eyebrow='Módulo 5 · Medicaciones y condiciones', titulo='Medicación: <em>cuando no está claro, se aplaza</em>')
add('', 'Módulo 5', cards([
    ('Tratar', 'Solo si una profesional competente confirma la idoneidad y se cumplen <strong>todas</strong> las condiciones.'),
    ('Aplazar', 'Exposición o bronceado, irritación, preparación inadecuada o evaluación incompleta.'),
    ('Derivar o consultar', 'Lesión, condición médica o medicación que excede la propia competencia.')]) +
    callout('La prueba de parche o de sensibilidad', 'Se realiza donde y como indiquen la IFU y el protocolo del centro. Observar y documentar el intervalo indicado antes de tratar un área extensa.'),
    notas=seccion(M5, 'Decisión y prueba previa'), eyebrow='Módulo 5 · Decisión y prueba previa', titulo='Tres salidas posibles: <em>tratar, aplazar, derivar</em>')
add('', 'Módulo 5', tabla(tabla_md(M5, 'Ficha de valoración previa'), 'tbl--compacta') + f'<p class="slide-meta" style="margin-top:10px">Actividad: {inl(seccion(M5, "Actividad de aprendizaje"))}</p>',
    notas=seccion(M5, 'Anamnesis y evaluación'), eyebrow='Módulo 5 · Ficha de valoración previa', titulo='La ficha <em>de valoración</em>')

# ── MÓDULO 6 ─────────────────────────────────────────────────────────────
M6 = 'Módulo 6. Seguridad, protocolo y efectos adversos'
modulo(6, 'Seguridad, protocolo y <em>efectos adversos</em>', ['Aplicar controles de ingeniería, administrativos y de protección personal.', 'Seguir una secuencia de sesión segura sin omitir barreras.', 'Reconocer y responder a incidentes dentro de la propia competencia.'], M6)
add('', 'Módulo 6', split('image1', [
    ('Antes', 'anamnesis, contraindicaciones, rasurado previo, sin sol ni bronceado, zona limpia.'),
    ('Durante', 'protección ocular, equipo verificado, observar la piel, registrar parámetros, higiene.'),
    ('Después', 'cuidados calmantes, fotoprotección, seguimiento, evaluación de resultados, recomendaciones.'),
    ('Nunca olvidar', 'gafas obligatorias · no tratar zonas con contraindicaciones · detener ante reacción no esperada · registrar cada sesión.')],
    lead='La secuencia didáctica de referencia para cada sesión. La instrucción de uso específica del equipo prevalece.'),
    notas=seccion(M6, 'Secuencia de sesión'), eyebrow='Módulo 6 · Esquema 6', titulo='Protocolo <em>y seguridad</em>')
add('', 'Módulo 6', cards([
    ('Radiación directa o reflejada', 'Puede lesionar ojos y piel. Parte de la emisión infrarroja es invisible.'),
    ('Sala controlada', 'Acceso delimitado, señalización, superficies reflectantes controladas, protección de todas las personas presentes.'),
    ('Gafas específicas', 'Identificadas y adecuadas a longitud de onda y densidad óptica. <strong>Las gafas de sol no sirven.</strong> Puestas durante toda la emisión.')]) +
    callout('Clase del equipo y medidas', 'Las que exijan el fabricante y la evaluación de riesgos del centro.'),
    notas=seccion(M6, 'Seguridad del recinto y ocular'), eyebrow='Módulo 6 · Seguridad del recinto y ocular', titulo='Proteger los ojos <em>y la sala</em>')
pasos = ['Confirmar identidad, consentimiento, indicación y zona', 'Revisar anamnesis y cambios desde la visita previa', 'Inspeccionar la piel y confirmar la preparación', 'Retirar productos y marcar la zona de forma segura', 'Gafas puestas; verificar equipo, enfriamiento y accesorios', 'Confirmar protocolo y prueba previa', 'Aplicar según IFU, observando piel, dolor y contacto', 'Detener ante cualquier respuesta inesperada', 'Cuidados permitidos, pautas verbales y escritas, registro']
add('', 'Módulo 6', '<ol class="pasos">' + ''.join(f'<li><span>{i+1}</span>{inl(p)}</li>' for i, p in enumerate(pasos)) + '</ol>',
    notas=seccion(M6, 'Secuencia de sesión'), eyebrow='Módulo 6 · Secuencia de sesión', titulo='Nueve pasos, <em>sin saltarse ninguno</em>')
add('', 'Módulo 6', '<div class="two-col"><div>' + callout('Sospecha de lesión o exposición ocular', 'Detener la emisión. No frotar el ojo. Activar asistencia médica urgente según protocolo.', 'callout--danger') + '</div><div>' +
    callout('Quemadura, ampolla, dolor intenso, reacción extensa o síntomas sistémicos', 'Detener. Apagar y asegurar el equipo. Primeros auxilios básicos dentro de la formación. Evaluación sanitaria urgente. Documentar.', 'callout--danger') + '</div></div>' +
    callout('En todos los casos', 'No aplicar remedios caseros ni reanudar la sesión. Avisar al responsable y conservar los datos del dispositivo y del evento.', 'callout--warn'),
    notas=seccion(M6, 'Incidentes y respuesta'), eyebrow='Módulo 6 · Incidentes y respuesta', titulo='Si algo va mal: <em>parar, atender, documentar</em>')
add('', 'Módulo 6', cards([
    ('Entre usuarios', 'Limpiar y desinfectar superficies y aplicadores con materiales compatibles e IFU. No sumergir. Sin químicos no aprobados.'),
    ('Revisión periódica', 'Filtros, ventana, cables, pedal y refrigeración.'),
    ('Registros', 'Mantenimiento, incidencias, controles y formación.'),
    ('Límite', 'No reparar ni modificar el equipo sin estar autorizada.')], 2),
    notas=seccion(M6, 'Higiene y mantenimiento'), eyebrow='Módulo 6 · Higiene y mantenimiento', titulo='Higiene y <em>mantenimiento</em>')
chk = tabla_md(M6, 'Lista de comprobación')
cols = [[x.strip() for x in c.replace('□', '\n□').split('\n') if x.strip()] for c in chk[1]]
add('', 'Módulo 6', '<div class="checks">' + ''.join(f'<div><h3>{inl(chk[0][i])}</h3><ul>' + ''.join(f'<li>{inl(x.lstrip("□ "))}</li>' for x in cols[i]) + '</ul></div>' for i in range(3)) + '</div>',
    notas=seccion(M6, 'Secuencia de sesión'), eyebrow='Módulo 6 · Lista de comprobación', titulo='Lista de comprobación <em>de cada sesión</em>')

# ── MÓDULO 7 ─────────────────────────────────────────────────────────────
M7 = 'Módulo 7. Cuidados, documentación, casos y repaso'
modulo(7, 'Cuidados, documentación <em>y casos</em>', ['Indicar cuidados posteriores individualizados y signos de alarma.', 'Registrar los datos necesarios para trazabilidad y continuidad.', 'Resolver casos con una decisión segura y una explicación comprensible.'], M7)
add('', 'Módulo 7', '<div class="two-col"><div><h3 class="ok">Cuidados posteriores</h3><ul><li>Eritema o edema perifolicular leve y transitorio: esperable.</li><li>Enfriar suavemente si está indicado.</li><li>Evitar fricción y calor intenso temporalmente.</li><li>Proteger del sol; no manipular la zona.</li><li>Sin exfoliantes ni activos irritantes sobre piel reactiva.</li></ul></div><div><h3 class="warn">Consulta sanitaria si aparece</h3><ul><li>Ampollas</li><li>Dolor creciente</li><li>Costras extensas o secreción</li><li>Alteraciones de pigmento persistentes</li><li>Síntomas oculares o cualquier reacción preocupante</li></ul></div></div>' +
    callout('El calendario se individualiza', 'No se prometen intervalos fijos ni resultados garantizados.'),
    notas=seccion(M7, 'Cuidados posteriores'), eyebrow='Módulo 7 · Cuidados posteriores', titulo='Después de la sesión: <em>cuidados y señales de alarma</em>')
campos = ['Fecha y profesional', 'Zona', 'Evaluación actualizada', 'Equipo, aplicador y versión', 'Parámetros completos tal como los muestra el dispositivo', 'Prueba previa', 'Método y cobertura de pases conforme a IFU', 'Enfriamiento', 'Respuesta de la piel y de la persona', 'Incidencias', 'Cuidados entregados', 'Próxima revisión']
add('', 'Módulo 7', '<ul class="campos">' + ''.join(f'<li>{inl(c)}</li>' for c in campos) + '</ul>' +
    callout('Protección de datos', 'Acceso limitado y plazos de conservación vigentes. Solo los datos identificativos necesarios.'),
    notas=seccion(M7, 'Registro de sesión'), eyebrow='Módulo 7 · Registro de sesión', titulo='Doce campos para <em>la trazabilidad</em>')
add('', 'Módulo 7', cards([
    ('Reducción del vello, respuesta variable', 'Nunca "depilación permanente garantizada".'),
    ('Pelo claro o blanco', 'Puede responder poco. Factores hormonales y el ciclo afectan a la evolución.'),
    ('Fotografías y datos sensibles', 'Solo con autorización.'),
    ('Derivar es prudente', 'Y se explica así a la persona cuando toca.')], 2) + f'<p class="slide-meta" style="margin-top:14px">Actividad: {inl(seccion(M7, "Actividad de aprendizaje"))}</p>',
    notas=seccion(M7, 'Comunicación y ética'), eyebrow='Módulo 7 · Comunicación y ética', titulo='Cómo hablamos <em>de los resultados</em>')

# ════════════════════════════════════════════════════════════════════════
# PRÁCTICAS PRESENCIALES
# ════════════════════════════════════════════════════════════════════════
P = 'Prácticas presenciales'
jornadas = [r[1] for r in mapa[1:] if r[1]]
add('slide--section', 'Prácticas', '<ol class="indice">' + ''.join(f'<li>{inl(j[3:])}</li>' for j in jornadas) + '</ol>',
    notas=seccion(P), eyebrow='Bloque presencial · 32 h · 8 jornadas de 4 h', titulo='Prácticas <em>presenciales</em>', h1=True)
sub_p = re.findall(r'^### (Jornada \d\. .+)$', md, re.M)
for j in sub_p:
    rows = tabla_md(P, j)
    ev = re.search(r'^### ' + re.escape(j) + r'\n.*?^Evidencia: (.+?)$', md, re.S | re.M).group(1)
    tl = ''.join(f'<div class="timeline-row"><div class="timeline-when">{inl(r[0])}</div><div class="timeline-what">{inl(r[1][0].upper() + r[1][1:])}</div></div>' for r in rows[1:])
    num, tit = re.match(r'Jornada (\d)\. (.+)', j).groups()
    add('', 'Prácticas', f'<div class="timeline">{tl}</div>' + callout('Evidencia de aprendizaje', ev, 'callout--ok'),
        notas=seccion(P) + '\n\nEvidencia: ' + ev, eyebrow=f'Prácticas presenciales · Jornada {num} de 8 · 4 h', titulo=inl(tit))

# ════════════════════════════════════════════════════════════════════════
# CASOS, EXAMEN PRÁCTICO Y CIERRE
# ════════════════════════════════════════════════════════════════════════
C = 'Cinco casos prácticos'
add('slide--section', 'Casos', '<p class="slide-lead" style="max-width:720px">' + inl(seccion(C)) + '</p>',
    notas=seccion(C), eyebrow='Para discutir en clase', titulo='Cinco casos <em>prácticos</em>', h1=True)
for j in re.findall(r'^### (Caso \d\. .+)$', md, re.M):
    txt = seccion(C, j)
    esc_ = re.search(r'Escenario: (.+)', txt).group(1); resp = re.search(r'Respuesta esperada: (.+)', txt).group(1)
    num, tit = re.match(r'Caso (\d)\. (.+)', j).groups()
    add('', 'Casos', f'''<div class="case"><div class="case-head"><span class="case-head-num">Caso {num} de 5</span><span class="case-head-title">{inl(tit)}</span></div>
      <div class="case-body"><dl><div class="case-row"><dt>Escenario</dt><dd>{inl(esc_)}</dd></div>
      <div class="case-row"><dt>Para resolver</dt><dd>Datos que faltan · decisión · fundamento · explicación a la persona · registro · acción de seguimiento</dd></div>
      <div class="case-row case-row--resp"><dt>Respuesta esperada</dt><dd>{inl(resp)}</dd></div></dl></div></div>''',
        notas=txt, eyebrow='Casos prácticos', titulo='')
E = 'Examen práctico integrado'
est = re.search(r'^## Examen práctico integrado\n(.*?)(?=^### )', md, re.S | re.M).group(1)
est_rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in est.split('\n') if l.startswith('|') and not re.match(r'^\|(\s*-+\s*\|)+\s*$', l)]
add('', 'Evaluación', '<p class="slide-lead">' + inl(seccion(E)) + '</p>' + tabla(est_rows),
    notas=seccion(E), eyebrow='Examen práctico integrado · 50 min por alumna', titulo='Cuatro estaciones, <em>cada comprobación en voz alta</em>')
add('', 'Evaluación', tabla(tabla_md(E, 'Rúbrica de evaluación'), 'tbl--compacta') + '<p class="slide-meta" style="margin-top:10px">Aprobado sugerido: ≥ 80 % del máximo y ningún nivel 1 en seguridad ocular, decisión de idoneidad, equipo/IFU o respuesta a incidencias. Un fallo crítico detiene la evaluación y exige nueva demostración.</p>',
    notas=seccion(E, 'Criterio de aprobación') + '\n\n' + seccion(E, 'Lista breve de observación'), eyebrow='Examen práctico integrado · Rúbrica', titulo='Seis criterios, <em>cuatro niveles</em>')
add('slide--closing', 'Cierre', '''<p class="slide-lead">Protección ocular obligatoria · no tratar zonas con contraindicaciones · detener el procedimiento ante una reacción no esperada · registrar cada sesión.</p>
<div class="refs"><strong>Fuentes de referencia:</strong> BOE, Real Decreto 1024/2024 (cualificaciones de Imagen Personal) · Reglamento de Ejecución (UE) 2022/2346 (productos del anexo XVI) · AEMPS, nota NI-PS-38-2022 · FDA, Laser Products FAQ y "Your Skin". Enlaces completos en la materia del curso.</div>''',
    notas=seccion('Fuentes y lecturas de referencia'), eyebrow='PRECISSA INSTITUTE · Electroestética', titulo='La seguridad del paciente <em>es siempre la prioridad</em>')

slides = [s for s in slides if s]

# ════════════════════════════════════════════════════════════════════════
# ENSAMBLADO
# ════════════════════════════════════════════════════════════════════════
viejo = open(f'{S}/deck-viejo.html', encoding='utf-8').read()
css = re.search(r'<style>(.*?)</style>', viejo, re.S).group(1)
css = css.replace('.deck-progress{flex:1;display:flex;gap:4px;justify-content:center;padding:0 24px;flex-wrap:wrap;}', '.deck-progress{flex:1;display:flex;align-items:center;gap:14px;padding:0 24px;min-width:0;}')
css += '''
/* ─── v2 · componentes docentes ───────────────────────────── */
.deck-main{flex:1;display:flex;min-height:0;}
.deck-stage{flex:1;}
.deck-bar{flex:1;height:4px;background:var(--line);border-radius:2px;overflow:hidden;}
.deck-bar i{display:block;height:100%;background:var(--accent);border-radius:2px;transition:width .25s;}
.deck-bloque{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap;}
.deck-btn--txt{width:auto;padding:0 16px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;font-family:var(--sans);}
.deck-btn--txt.on{background:var(--ink);color:var(--bg);border-color:var(--ink);}
.deck-notas{display:none;width:400px;flex-shrink:0;border-left:1px solid var(--line);background:var(--surface);overflow-y:auto;padding:26px 28px 40px;font-size:14.5px;line-height:1.65;color:var(--ink);}
.deck-notas.open{display:block;}
.deck-notas-k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:12px;}
.deck-notas p{margin-bottom:12px;}
.deck-notas ul{padding-left:18px;margin-bottom:12px;}
.deck-notas li{margin-bottom:6px;}
.deck-notas .vacio{color:var(--muted);font-style:italic;}
.slide .notas{display:none;}
.slide-lead{margin-bottom:16px;}
.fig{display:block;max-width:100%;object-fit:contain;border-radius:10px;box-shadow:0 8px 28px rgba(36,29,23,.12);background:#fff;}
.split{display:grid;grid-template-columns:340px 1fr;gap:36px;align-items:start;margin-top:0;}
.split .slide-lead{font-size:17px;margin-bottom:10px;}
.split .claves li{padding:8px 0 8px 16px;font-size:14.5px;margin-bottom:6px;}
.split-fig{display:flex;justify-content:center;}
.claves{list-style:none;}
.claves li{padding:10px 0 10px 18px;border-left:2px solid var(--line-strong);margin-bottom:8px;font-size:15px;line-height:1.5;color:var(--ink-soft);}
.claves li b{color:var(--ink);font-weight:600;}
.cards{display:grid;gap:16px;margin-top:16px;}
.cards.cols-2{grid-template-columns:1fr 1fr;}
.cards.cols-3{grid-template-columns:1fr 1fr 1fr;}
.cards+.cards{margin-top:14px;}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px 20px;position:relative;}
.card-n{font-family:var(--serif);font-style:italic;font-size:20px;color:var(--accent);display:block;margin-bottom:4px;}
.card b{display:block;font-family:var(--serif);font-size:19px;line-height:1.2;margin-bottom:8px;color:var(--ink);font-weight:400;}
.card p{font-size:13.5px;line-height:1.5;color:var(--ink-soft);}
.callout{margin-top:18px;padding:18px 24px;}
.callout strong{font-size:18px;}
.callout--ok{border-color:var(--ok);background:#EEF4EA;}
.callout--ok strong{color:var(--ok);}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:6px 0 20px;}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px 22px;}
.kpi b{display:block;font-family:var(--serif);font-size:54px;line-height:1;color:var(--accent-dark);margin-bottom:6px;}
.kpi span{font-size:13px;color:var(--ink-soft);line-height:1.4;display:block;}
.mapa{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:10px;}
.mapa-k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:12px;}
.mapa ol,.indice{list-style:none;counter-reset:m;}
.mapa li,.indice li{counter-increment:m;padding:9px 0;border-bottom:1px solid var(--line);font-size:16px;display:flex;gap:16px;align-items:baseline;}
.mapa li::before,.indice li::before{content:counter(m,decimal-leading-zero);font-family:var(--serif);font-style:italic;color:var(--accent);min-width:28px;}
.indice{columns:2;column-gap:48px;margin-top:10px;max-width:980px;}
.indice li{break-inside:avoid;}
.objetivos{margin-top:28px;max-width:860px;}
.objetivos-k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:10px;}
.objetivos ol{list-style:none;counter-reset:o;}
.objetivos li{counter-increment:o;display:flex;gap:16px;align-items:baseline;padding:9px 0;border-top:1px solid var(--line);font-size:17px;line-height:1.5;}
.objetivos li::before{content:counter(o,decimal-leading-zero);font-family:var(--serif);font-style:italic;color:var(--accent);}
.slide--section .slide-h1{font-size:64px;margin-bottom:6px;}
.pasos{list-style:none;display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px;}
.pasos li{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;font-size:14.5px;line-height:1.45;display:flex;gap:14px;align-items:flex-start;}
.pasos li span{font-family:var(--serif);font-style:italic;font-size:26px;color:var(--accent);line-height:1;flex-shrink:0;}
.campos{list-style:none;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 24px;margin-top:14px;counter-reset:c;}
.campos li{counter-increment:c;padding:9px 0;border-bottom:1px solid var(--line);font-size:14.5px;display:flex;gap:12px;align-items:baseline;}
.campos li::before{content:counter(c,decimal-leading-zero);font-family:var(--serif);font-style:italic;color:var(--accent);}
.checks{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:16px;}
.checks h3{font-family:var(--serif);font-size:24px;margin-bottom:10px;color:var(--accent-dark);}
.checks ul{list-style:none;}
.checks li{padding:8px 0 8px 28px;border-bottom:1px dashed var(--line);font-size:14px;line-height:1.45;position:relative;color:var(--ink-soft);}
.checks li::before{content:"";position:absolute;left:0;top:11px;width:14px;height:14px;border:1.5px solid var(--line-strong);border-radius:4px;}
.two-col{margin-top:14px;}
.two-col h3{font-size:22px;}
.two-col li{font-size:14.5px;}
.tbl{margin-top:12px;}
.tbl th{padding:11px 16px;font-size:11.5px;}
.tbl td{padding:11px 16px;font-size:13.5px;}
.tbl--compacta th{padding:8px 12px;font-size:10.5px;}
.tbl--compacta td{padding:7px 12px;font-size:12px;line-height:1.4;}
.timeline{margin-top:10px;}
.timeline-row{padding:11px 0;}
.timeline-when{font-size:18px;}
.timeline-what{font-size:15px;}
.case{margin-top:10px;}
.case-head-title{font-size:28px;}
.case-row{grid-template-columns:170px 1fr;font-size:15px;padding:14px 0;}
.case-row--resp dd{color:var(--ok);font-weight:500;}
@media (max-width:780px){
  .deck-notas{position:absolute;inset:0;width:100%;z-index:5;}
  .deck-bloque{display:none;}
}
'''
js = re.search(r'<script>(.*?)</script>\s*</body>', viejo, re.S).group(1)
js = js.replace("const dotsHost=document.getElementById('dots');", "const bar=document.getElementById('bar');const bloque=document.getElementById('bloque');const notas=document.getElementById('notas');const notasBtn=document.getElementById('notas-btn');")
js = re.sub(r"  slides\.forEach\(\(s,idx\)=>\{\n    const d=document\.createElement\('div'\);.*?\}\);\n", "", js, flags=re.S)
js = js.replace("    dotsHost.querySelectorAll('.deck-dot').forEach((d,idx)=>d.classList.toggle('active',idx===i));",
                "    bar.style.width=((i+1)/slides.length*100)+'%';\n    bloque.textContent=slides[i].dataset.bloque||'';\n    const nt=slides[i].querySelector('.notas');\n    notas.innerHTML='<div class=\"deck-notas-k\">Guion · '+String(i+1).padStart(2,'0')+' / '+slides.length+'</div>'+(nt&&nt.innerHTML.trim()?nt.innerHTML:'<p class=\"vacio\">Sin guion para esta diapositiva.</p>');")
js = js.replace("  go(0);\n", "  function toggleNotas(){notas.classList.toggle('open');notasBtn.classList.toggle('on');setTimeout(fitDeck,30);}\n  notasBtn.onclick=toggleNotas;\n  go(0);\n")
js = js.replace("    if(e.key==='Home')go(0);", "    if(e.key==='n'||e.key==='N')toggleNotas();\n    if(e.key==='Home')go(0);")

secs = []
for k, s in enumerate(slides):
    secs.append(f'''    <section class="slide{(' ' + s['cls']) if s['cls'] else ''}{' active' if k == 0 else ''}" data-bloque="{esc(s['bloque'])}">
      <div class="slide-inner">{s['html']}</div>
      <aside class="notas">{s['notas']}</aside>
    </section>''')
deck = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>PRECISSA INSTITUTE · Depilación láser · Manual profesional 60 h</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<div class="deck">
  <header class="deck-top">
    <span class="deck-top-eyebrow">PRECISSA · Depilación láser · Manual profesional 60 h</span>
    <span class="deck-top-counter"><span id="cur">01</span> <span style="color:var(--line-strong)">/</span> <span id="tot">00</span></span>
  </header>
  <div class="deck-main">
    <main class="deck-stage" id="stage">
      <div class="deck-stage-inner" id="stage-inner">
{chr(10).join(secs)}
      </div>
    </main>
    <aside class="deck-notas" id="notas"></aside>
  </div>
  <footer class="deck-bottom">
    <div class="deck-nav"><button class="deck-btn" id="prev" aria-label="Anterior">‹</button><button class="deck-btn deck-btn--txt" id="notas-btn" title="Mostrar u ocultar el guion (tecla N)">Guion</button></div>
    <div class="deck-progress"><span class="deck-bloque" id="bloque"></span><div class="deck-bar"><i id="bar"></i></div></div>
    <div class="deck-nav"><button class="deck-btn" id="next" aria-label="Siguiente">›</button></div>
  </footer>
</div>
<script>{js}</script>
</body>
</html>'''
open(f'{S}/out-deck-depilacion-laser.html', 'w', encoding='utf-8').write(deck)
sin_notas = sum(1 for s in slides if not s['notas'])
print('slides:', len(slides), '| sin guion:', sin_notas, '| KB:', round(len(deck.encode()) / 1024))
