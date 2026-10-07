# -*- coding: utf-8 -*-
"""Materia del aula con estructura editorial (libro de texto): mismo texto
del manual, palabra por palabra, envuelto en componentes HTML que el aula
sabe pintar (.ac-portada, .ac-cap, .ac-obj, .ac-fig, .ac-act, .ac-caso…).
marked deja pasar los bloques HTML y DOMPurify los admite (div/figure/class/id)."""
import re, json, html, sys
S = sys.argv[1]; modo = sys.argv[2]  # 'embed' (aula) | 'docs'
md = open(f'{S}/manual-bruto.md', encoding='utf-8').read()
meta = json.load(open(f'{S}/img-out/meta.json', encoding='utf-8'))
b64 = {k: open(f'{S}/img-out/{v["slug"]}.b64').read() for k, v in meta.items()}

def esc(t): return html.escape(t, quote=False)
def inl(t):
    t = esc(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', t)
    return t
def img_src(k):
    return f'data:image/jpeg;base64,{b64[k]}' if modo == 'embed' else f'img/{meta[k]["slug"]}.jpg'
def figura(k, caption):
    cap = f'<figcaption>{inl(caption)}</figcaption>' if caption else ''
    return f'<figure class="ac-fig"><img src="{img_src(k)}" alt="{esc(meta[k]["alt"])}">{cap}</figure>'

lines = md.split('\n')
# ── Portada: todo lo anterior a "## Cómo usar" ───────────────────────────
i0 = lines.index('## Cómo usar este manual')
aviso = re.search(r'### Aviso de alcance\n\n(.+?)\n', md).group(1)
out = []
out.append('<div class="ac-portada">'
           '<span class="ac-portada-k">Manual profesional</span>'
           '<h1>Depilación láser</h1>'
           '<p class="ac-portada-sub">Fundamentos, valoración, seguridad y práctica supervisada</p>'
           '<div class="ac-kpis">'
           '<div><b>60</b><span>horas</span></div>'
           '<div><b>28 h</b><span>teoría online</span></div>'
           '<div><b>32 h</b><span>práctica presencial</span></div>'
           '<div><b>7</b><span>módulos teóricos</span></div>'
           '<div><b>8</b><span>jornadas prácticas</span></div>'
           '</div></div>')
out.append('')
out.append(figura('image1', 'Secuencia didáctica de referencia para cada sesión.'))
out.append('')
out.append('<p class="ac-lead">Material formativo en español con ilustraciones originales, ejercicios, pruebas de aprendizaje, casos y rúbricas.</p>')
out.append('')
out.append(f'<div class="ac-aviso"><b>Aviso de alcance</b><p>{inl(aviso)}</p></div>')
out.append('')
# Índice
secciones = [(m.group(1), m.start()) for m in re.finditer(r'^## (.+)$', md, re.M)]
def slug(t): return re.sub(r'[^a-z0-9]+', '-', re.sub(r'[áéíóúñ]', lambda m: 'aeiounn'['áéíóúñ'.index(m.group(0))], t.lower())).strip('-')
idx = ''.join(f'<li><a href="#" data-ir="sec-{slug(t)}">{inl(t)}</a></li>' for t, _ in secciones
              if not t.startswith('Seis tests') and not t.startswith('Examen final'))
out.append(f'<nav class="ac-indice"><span class="ac-indice-k">Índice</span><ol>{idx}</ol></nav>')
out.append('')

# ── Resto: sección a sección ────────────────────────────────────────────
rest = lines[i0:]
i = 0
en_tests = False
pend_img = None
def flush_img(cap=None):
    global pend_img
    if pend_img:
        out.append(figura(pend_img, cap)); out.append(''); pend_img = None
while i < len(rest):
    ln = rest[i]
    if ln.startswith('## '):
        flush_img()
        t = ln[3:].strip()
        en_tests = t.startswith('Seis tests') or t.startswith('Examen final')
        if en_tests: i += 1; continue   # van a la pestaña Test
        m = re.match(r'Módulo (\d)\. (.+)', t)
        dur = ''
        # "Duración: 4 horas…" justo debajo → metadato del capítulo
        j = i + 1
        while j < len(rest) and not rest[j].strip(): j += 1
        if j < len(rest) and rest[j].startswith('Duración:'):
            dur = rest[j].strip(); i = j
        if m:
            meta_html = ('<span class="ac-cap-meta">' + inl(dur) + '</span>') if dur else ''
            out.append('<div class="ac-cap" id="sec-' + slug(t) + '"><span class="ac-cap-n">Módulo ' + m.group(1) + ' de 7</span><h2>' + inl(m.group(2)) + '</h2>' + meta_html + '</div>')
        else:
            etiqueta = {'Cómo usar este manual': 'Introducción', 'Prácticas presenciales': 'Bloque presencial · 32 h',
                        'Cinco casos prácticos': 'Para resolver', 'Examen práctico integrado': 'Evaluación',
                        'Fuentes y lecturas de referencia': 'Para ampliar'}.get(t, '')
            et_html = ('<span class="ac-cap-n">' + etiqueta + '</span>') if etiqueta else ''
            out.append('<div class="ac-cap" id="sec-' + slug(t) + '">' + et_html + '<h2>' + inl(t) + '</h2></div>')
        out.append(''); i += 1; continue
    if en_tests: i += 1; continue
    if ln.startswith('### '):
        flush_img()
        t = ln[4:].strip()
        # Resultados de aprendizaje → caja de objetivos
        if t == 'Resultados de aprendizaje':
            items = []; j = i + 1
            while j < len(rest) and (rest[j].startswith('- ') or not rest[j].strip()):
                if rest[j].startswith('- '): items.append(rest[j][2:].strip())
                j += 1
            out.append('<div class="ac-obj"><span class="ac-obj-k">Resultados de aprendizaje</span><ol>' + ''.join(f'<li>{inl(x)}</li>' for x in items) + '</ol></div>')
            out.append(''); i = j; continue
        if t == 'Actividad de aprendizaje':
            j = i + 1
            while j < len(rest) and not rest[j].strip(): j += 1
            out.append(f'<div class="ac-act"><span class="ac-act-k">Actividad de aprendizaje</span><p>{inl(rest[j].strip())}</p></div>')
            out.append(''); i = j + 1; continue
        if t.startswith('Caso '):
            j = i + 1; esc_ = resp = ''
            while j < len(rest) and not rest[j].startswith('###') and not rest[j].startswith('## '):
                if rest[j].startswith('Escenario:'): esc_ = rest[j][10:].strip()
                if rest[j].startswith('Respuesta esperada:'): resp = rest[j][19:].strip()
                j += 1
            num, tit = re.match(r'Caso (\d)\. (.+)', t).groups()
            out.append(f'<div class="ac-caso"><div class="ac-caso-head"><span>Caso {num}</span><h3>{inl(tit)}</h3></div>'
                       f'<p class="ac-caso-k">Escenario</p><p>{inl(esc_)}</p><p class="ac-caso-k">Respuesta esperada</p><p>{inl(resp)}</p></div>')
            out.append(''); i = j; continue
        out.append(f'### {t}'); out.append(''); i += 1; continue
    m = re.match(r'!\[\[IMG:(image\d)\.png\]\]', ln)
    if m:
        flush_img(); pend_img = m.group(1); i += 1; continue
    if pend_img and ln.startswith('*') and ln.endswith('*'):
        flush_img(ln.strip('*')); i += 1; continue
    if ln.startswith('Evidencia: '):
        flush_img()
        out.append(f'<div class="ac-evid"><b>Evidencia de aprendizaje</b><p>{inl(ln[11:].strip())}</p></div>'); out.append(''); i += 1; continue
    if ln.strip() and not ln.startswith('|') and not ln.startswith('- ') and pend_img:
        flush_img()
    out.append(ln); i += 1
flush_img()
texto = '\n'.join(out)
texto = re.sub(r'\n{3,}', '\n\n', texto)
destino = f'{S}/out-materia-depilacion-laser.md' if modo == 'embed' else f'{S}/out-docs-07-depilacion-laser.md'
if modo == 'docs':
    texto = ('<!-- Depilación láser · manual profesional 60 h. Fuente versionada de la\n'
             '     materia del aula (la copia real, con las imágenes embebidas, vive en el\n'
             '     bucket privado course-private y se sube desde el panel de administración). -->\n\n') + texto
open(destino, 'w', encoding='utf-8').write(texto)
print(modo, 'KB:', round(len(texto.encode()) / 1024), '| capítulos:', texto.count('class="ac-cap"'), '| figuras:', texto.count('class="ac-fig"'), '| casos:', texto.count('class="ac-caso"'))
