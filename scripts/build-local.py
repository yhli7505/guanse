"""Rebuild the local JS data and standalone HTML, using only the Python standard library."""
import base64
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
colors = json.loads((dist / 'colors.json').read_text())
data_script = 'window.GUANSE_COLORS = ' + json.dumps(colors, ensure_ascii=False, indent=2) + ';\n'
(dist / 'colors.js').write_text(data_script)
image_types = {'.jpg': 'image/jpeg', '.png': 'image/png'}
examples = {
    image.stem: f'data:{image_types[image.suffix]};base64,' + base64.b64encode(image.read_bytes()).decode('ascii')
    for image in sorted((dist / 'examples').iterdir())
    if image.is_file() and image.suffix in image_types
}
(dist / 'extract-examples.js').write_text('window.GUANSE_EXAMPLES = ' + json.dumps(examples) + ';\n')
html = (dist / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + (dist / 'styles.css').read_text() + '</style>')
for name in ('colors.js', 'extract-examples.js', 'app.js'):
    source = (dist / name).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>' + source + '</script>')
output = root / 'index.html'
output.write_text(html)
print(f'Built {output}: {len(colors)} colors; no server or external assets required.')
