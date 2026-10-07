import sys, re, docx
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph
d = docx.Document(sys.argv[1])
rels = {r.rId: r.target_ref.split('/')[-1] for r in d.part.rels.values() if 'image' in r.reltype}

def runs_md(p):
    out = []
    for r in p.runs:
        t = r.text
        if not t: continue
        if r.bold and t.strip(): t = f'**{t.strip()}**' + (' ' if t.endswith(' ') else '')
        elif r.italic and t.strip(): t = f'*{t.strip()}*' + (' ' if t.endswith(' ') else '')
        out.append(t)
    s = ''.join(out).strip()
    return re.sub(r'\*\*\s*\*\*', '', s)

def para_md(p):
    st = p.style.name
    imgs = [rels.get(b.get(qn('r:embed'))) for b in p._p.iter(qn('a:blip'))]
    lines = []
    for im in imgs:
        lines.append(f'![[IMG:{im}]]')
    txt = runs_md(p) or p.text.strip()
    if not txt: return lines
    if st == 'Title': lines.append(f'# {txt}')
    elif st.startswith('Heading 1'): lines.append(f'## {txt}')
    elif st.startswith('Heading 2'): lines.append(f'### {txt}')
    elif st.startswith('Heading 3'): lines.append(f'#### {txt}')
    elif 'List Bullet' in st: lines.append(f'- {txt}')
    elif 'List Number' in st: lines.append(f'1. {txt}')
    else: lines.append(txt)
    return lines

def table_md(t):
    rows = [[c.text.strip().replace('\n', ' ').replace('|', '\\|') for c in r.cells] for r in t.rows]
    if not rows: return []
    w = max(len(r) for r in rows)
    rows = [r + [''] * (w - len(r)) for r in rows]
    out = ['| ' + ' | '.join(rows[0]) + ' |', '|' + '---|' * w]
    out += ['| ' + ' | '.join(r) + ' |' for r in rows[1:]]
    return out

body = d.element.body
md = []
for child in body.iterchildren():
    if child.tag == qn('w:p'):
        md += para_md(Paragraph(child, d))
    elif child.tag == qn('w:tbl'):
        md += [''] + table_md(Table(child, d)) + ['']
# compactar: líneas en blanco entre bloques
text = '\n'.join(md)
text = re.sub(r'\n(?=#)', '\n\n', text)
text = re.sub(r'(?<!\n)\n(?!\n)(?!- |1\. |\|)', '\n\n', text)
text = re.sub(r'\n{3,}', '\n\n', text)
open(sys.argv[2], 'w', encoding='utf-8').write(text)
print(len(text), 'caracteres;', text.count('\n## '), 'secciones;', text.count('![[IMG'), 'imágenes;', text.count('|---'), 'tablas')
