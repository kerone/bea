import re, json, html, sys, os
S = sys.argv[1]
md = open(f'{S}/manual-bruto.md', encoding='utf-8').read()
meta = json.load(open(f'{S}/img-out/meta.json', encoding='utf-8'))
b64 = {k: open(f'{S}/img-out/{v["slug"]}.b64').read() for k, v in meta.items()}

# ── 1) MATERIA (.md) con imágenes embebidas + copia para docs/ ──────────
def img_md(m, modo):
    k = m.group(1).replace('.png', '')
    v = meta[k]
    src = f'data:image/jpeg;base64,{b64[k]}' if modo == 'embed' else f'img/{v["slug"]}.jpg'
    return f'![{v["alt"]}]({src})'
# Los tests y el examen NO van en la materia: viven en la pestaña "Test" del
# aula (courses-data.js → test.questions). Se recortan del texto.
md_materia = re.sub(r'\n## Seis tests de aprendizaje\n.*?(?=\n## Cinco casos prácticos\n)', '\n', md, flags=re.S)
assert '## Examen final' not in md_materia and '## Cinco casos' in md_materia
materia = re.sub(r'!\[\[IMG:(image\d\.png)\]\]', lambda m: img_md(m, 'embed'), md_materia)
docs    = re.sub(r'!\[\[IMG:(image\d\.png)\]\]', lambda m: img_md(m, 'docs'), md_materia)
cab = ('<!-- Depilación láser · manual profesional 60 h. Fuente versionada de la\n'
       '     materia del aula (la copia real, con las imágenes embebidas, vive en el\n'
       '     bucket privado course-private y se sube desde el panel de administración). -->\n\n')
open(f'{S}/out-materia-depilacion-laser.md', 'w', encoding='utf-8').write(materia)
open(f'{S}/out-docs-07-depilacion-laser.md', 'w', encoding='utf-8').write(cab + docs)

# ── 2) Parseo en bloques para la presentación ─────────────────────────────
def parse(md):
    secs = []; cur = None; sub = None
    lines = md.split('\n'); i = 0
    def push(block):
        (sub if sub else cur)['blocks'].append(block)
    while i < len(lines):
        ln = lines[i].rstrip()
        if ln.startswith('## '):
            cur = {'title': ln[3:].strip(), 'blocks': [], 'subs': []}; sub = None; secs.append(cur); i += 1; continue
        if ln.startswith('### ') and cur:
            sub = {'title': ln[4:].strip(), 'blocks': []}; cur['subs'].append(sub); i += 1; continue
        if cur is None: i += 1; continue
        if not ln.strip(): i += 1; continue
        m = re.match(r'!\[\[IMG:(image\d)\.png\]\]', ln)
        if m: push({'t': 'img', 'k': m.group(1)}); i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                if not re.match(r'^\|(\s*-+\s*\|)+\s*$', lines[i]):
                    rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            push({'t': 'table', 'rows': rows}); continue
        if ln.startswith('- ') or re.match(r'^\d+\. ', ln):
            items = []
            while i < len(lines) and (lines[i].startswith('- ') or re.match(r'^\d+\. ', lines[i])):
                items.append(re.sub(r'^(- |\d+\. )', '', lines[i]).strip()); i += 1
            push({'t': 'list', 'items': items}); continue
        push({'t': 'p', 'text': ln.strip()}); i += 1
    return secs
secs = parse(md)

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', t)
    return t

# ── 3) Generación de slides ──────────────────────────────────────────────
slides = []
def slide(cls, eyebrow, h2, body, h1=False):
    tag = 'h1' if h1 else 'h2'
    slides.append(f'''<section class="slide{(' ' + cls) if cls else ''}">
  <div class="slide-inner">
    {f'<div class="slide-eyebrow">{eyebrow}</div>' if eyebrow else ''}
    {f'<{tag} class="slide-{tag}">{h2}</{tag}>' if h2 else ''}
    {body}
  </div>
</section>''')

def table_html(rows, fila_max=9):
    """Devuelve una lista de tablas HTML (troceadas si hay muchas filas)."""
    head, body = rows[0], rows[1:]
    out = []
    for j in range(0, max(1, len(body)), fila_max):
        parte = body[j:j + fila_max]
        h = '<tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr>'
        b = ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in parte)
        out.append(f'<table class="tbl">{h}{b}</table>')
    return out

def fig(k, caption=''):
    v = meta[k]
    return (f'<figure class="figura"><img src="data:image/jpeg;base64,{b64[k]}" alt="{html.escape(v["alt"])}">'
            f'{f"<figcaption>{inline(caption)}</figcaption>" if caption else ""}</figure>')

def render_blocks(blocks, eyebrow, titulo, presupuesto=1050):
    """Reparte los bloques de una subsección en una o varias slides."""
    pend_img = None; cuerpo = []; chars = 0; n = 0
    def flush(force=False):
        nonlocal cuerpo, chars, n
        if not cuerpo and not force: return
        n += 1
        t = titulo if n == 1 else f'{titulo} <em>(cont.)</em>'
        slide('', eyebrow, t, '<div class="slide-body">' + ''.join(cuerpo) + '</div>')
        cuerpo, chars = [], 0
    for b in blocks:
        if b['t'] == 'img':
            pend_img = b['k']; continue
        if b['t'] == 'p' and pend_img and b['text'].startswith('*'):
            flush(); slide('slide--figura', eyebrow, '', fig(pend_img, b['text'].strip('*'))); pend_img = None; continue
        if pend_img:
            flush(); slide('slide--figura', eyebrow, '', fig(pend_img)); pend_img = None
        if b['t'] == 'p':
            if chars + len(b['text']) > presupuesto: flush()
            cuerpo.append(f'<p>{inline(b["text"])}</p>'); chars += len(b['text'])
        elif b['t'] == 'list':
            txt = sum(len(x) for x in b['items'])
            if chars + txt > presupuesto: flush()
            cuerpo.append('<ul class="bullets">' + ''.join(f'<li>{inline(x)}</li>' for x in b['items']) + '</ul>')
            chars += txt + 60 * len(b['items'])
        elif b['t'] == 'table':
            flush()
            for k, th in enumerate(table_html(b['rows'])):
                t = titulo if k == 0 else f'{titulo} <em>(cont.)</em>'
                slide('', eyebrow, t, th)
    if pend_img: flush(); slide('slide--figura', eyebrow, '', fig(pend_img))
    flush()

# Portada
slide('slide--cover', 'Curso 07 · Electroestética · Manual profesional',
      'Depilación<br><em>láser</em>',
      '''<p class="slide-lead">Fundamentos, valoración, seguridad y práctica supervisada. Siete módulos teóricos y ocho jornadas presenciales para trabajar con criterio: sin parámetros universales, siempre dentro de las instrucciones del fabricante.</p>
      <div class="slide-cover-meta">
        <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Duración</span><span class="slide-cover-meta-v">60 horas</span></div>
        <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Teoría</span><span class="slide-cover-meta-v">28 h online</span></div>
        <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Práctica</span><span class="slide-cover-meta-v">32 h presencial</span></div>
        <div class="slide-cover-meta-item"><span class="slide-cover-meta-k">Nivel</span><span class="slide-cover-meta-v">Avanzado</span></div>
      </div>''', h1=True)

for sec in secs:
    T = sec['title']
    if T.startswith('Seis tests') or T.startswith('Examen final') or T.startswith('Cinco casos') or T.startswith('Examen práctico') or T.startswith('Fuentes'):
        continue  # evaluación y fuentes: slides de resumen al final
    m = re.match(r'Módulo (\d)\. (.+)', T)
    if m:
        num, nombre = m.groups()
        eyebrow = f'Módulo {num} · 4 h online'
        slide('slide--section', f'Módulo {num} de 7', inline(nombre), '', h1=True)
        for b in sec['blocks']:
            pass  # "Duración: 4 horas…" ya va en el eyebrow
        for sub in sec['subs']:
            render_blocks(sub['blocks'], eyebrow, inline(sub['title']))
    elif T.startswith('Cómo usar'):
        render_blocks(sec['blocks'], 'Cómo usar este manual', 'Cómo usar <em>este manual</em>')
        for sub in sec['subs']:
            render_blocks(sub['blocks'], 'Cómo usar este manual', inline(sub['title']))
    elif T.startswith('Prácticas'):
        slide('slide--section', 'Bloque presencial · 32 h', 'Prácticas <em>presenciales</em>', '', h1=True)
        render_blocks(sec['blocks'], 'Prácticas presenciales', 'Ocho jornadas de cuatro horas')
        for sub in sec['subs']:
            render_blocks(sub['blocks'], 'Prácticas presenciales', inline(sub['title']))

# Aviso de alcance (bloque previo al primer ##): está en el "preámbulo"; lo recuperamos del md
aviso = re.search(r'### Aviso de alcance\n\n(.+?)\n', md).group(1)
slides.insert(1, f'''<section class="slide">
  <div class="slide-inner">
    <div class="slide-eyebrow">Antes de empezar</div>
    <h2 class="slide-h2">Aviso de <em>alcance</em></h2>
    <div class="callout callout--warn"><strong>Material de formación general</strong><p>{inline(aviso)}</p></div>
  </div>
</section>''')
# Imagen de portada (protocolo) como primera figura tras el aviso
slides.insert(2, f'''<section class="slide slide--figura">
  <div class="slide-inner">
    <div class="slide-eyebrow">Secuencia didáctica de referencia</div>
    {fig('image1', 'Protocolo y seguridad: puntos clave antes, durante y después de cada sesión.')}
  </div>
</section>''')

# Evaluación (resumen) y cierre
slide('slide--section', 'Evaluación', 'Cómo se <em>evalúa</em>', '', h1=True)
slide('', 'Evaluación', 'Tres pruebas, <em>una competencia</em>', '''<div class="takeaways">
  <div class="takeaway"><div class="takeaway-text"><strong>Seis tests de aprendizaje</strong>Cinco preguntas por módulo para afianzar cada bloque de teoría, con la respuesta razonada.</div></div>
  <div class="takeaway"><div class="takeaway-text"><strong>Examen final teórico</strong>30 preguntas en la pestaña <em>Test</em> del aula. Umbral sugerido: 24/30 (80 %).</div></div>
  <div class="takeaway"><div class="takeaway-text"><strong>Cinco casos prácticos</strong>Bronceado reciente, pelo blanco, medicación fotosensibilizante, piel reactiva y protección ocular no verificada.</div></div>
  <div class="takeaway"><div class="takeaway-text"><strong>Examen práctico integrado</strong>Rúbrica de seis criterios. Aprobado ≥ 80 % y ningún fallo crítico en seguridad, decisión, equipo o incidencias.</div></div>
</div><p class="slide-meta" style="margin-top:18px">El examen se hace en la pestaña Test del aula; casos y rúbrica están en la materia del curso.</p>''')
slide('slide--closing', 'PRECISSA INSTITUTE · Electroestética', 'La seguridad del paciente <em>es siempre la prioridad</em>', '''<p class="slide-lead">Protección ocular obligatoria · no tratar zonas con contraindicaciones · detener el procedimiento ante una reacción no esperada · registrar cada sesión.</p>
<div class="refs"><strong>Fuentes de referencia:</strong> BOE, Real Decreto 1024/2024 (cualificaciones de Imagen Personal) · Reglamento de Ejecución (UE) 2022/2346 (productos del anexo XVI) · AEMPS, nota informativa NI-PS-38-2022 · FDA, Laser Products FAQ y "Your Skin". Enlaces completos en la materia del curso.</div>''')

# ── 4) Ensamblar el deck con el estilo de los decks de PRECISSA ──────────
viejo = open(f'{S}/deck-viejo.html', encoding='utf-8').read()
css = re.search(r'<style>(.*?)</style>', viejo, re.S).group(1)
js  = re.search(r'<script>(.*?)</script>\s*</body>', viejo, re.S).group(1)
css += '''
/* Figuras (infografías del manual) */
.slide--figura .slide-inner{display:flex;flex-direction:column;align-items:center;height:100%;}
.figura{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px;max-height:570px;}
.figura img{max-height:520px;max-width:100%;object-fit:contain;border-radius:10px;box-shadow:0 8px 28px rgba(36,29,23,.12);background:#fff;}
.figura figcaption{font-size:13px;color:var(--muted);font-style:italic;text-align:center;max-width:820px;}
.slide-body .bullets li{font-size:15.5px;padding:10px 0;}
.slide-body p{font-size:15.5px;}
.tbl td,.tbl th{padding:10px 14px;font-size:13.5px;}
'''
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
    <span class="deck-top-eyebrow">PRECISSA · Depilación láser · Electroestética</span>
    <span class="deck-top-counter"><span id="cur">01</span> <span style="color:var(--line-strong)">/</span> <span id="tot">00</span></span>
  </header>
  <main class="deck-stage" id="stage">
    <div class="deck-stage-inner" id="stage-inner">
{chr(10).join(slides)}
    </div>
  </main>
  <footer class="deck-bottom">
    <div class="deck-nav"><button class="deck-btn" id="prev" aria-label="Anterior">‹</button></div>
    <div class="deck-progress" id="dots"></div>
    <div class="deck-nav"><button class="deck-btn" id="next" aria-label="Siguiente">›</button></div>
  </footer>
</div>
<script>{js}</script>
</body>
</html>'''
deck = deck.replace('<section class="slide ', '<section class="slide ', 1)
# la primera slide debe arrancar activa
deck = deck.replace('<section class="slide slide--cover">', '<section class="slide slide--cover active">', 1)
open(f'{S}/out-deck-depilacion-laser.html', 'w', encoding='utf-8').write(deck)
print('slides:', len(slides), '| deck KB:', round(len(deck.encode())/1024), '| materia KB:', round(len(materia.encode())/1024))
