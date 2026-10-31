#!/usr/bin/env python3
"""Render launcher exports from the same geometric M and original red gradient."""
from pathlib import Path
import re
import cairosvg

root = Path(__file__).resolve().parents[1]
res = root / 'app/src/main/res'
path = 'M34,76V32H43L54,51L65,32H74V76H65V49L56.5,64H51.5L43,49V76Z'
for name in ['drawable-v24/ic_launcher_foreground.xml', 'drawable/ic_launcher_monochrome.xml']:
    p = res / name
    p.write_text(re.sub(r'android:pathData="[^"]+"', 'android:pathData="' + path + '"', p.read_text()))
gradient = '<linearGradient id="red" x1="54" y1="32" x2="54" y2="76" gradientUnits="userSpaceOnUse"><stop stop-color="#ff6666"/><stop offset="1" stop-color="#db2c3a"/></linearGradient>'
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><defs>' + gradient + '</defs><path fill="url(#red)" d="' + path + '"/></svg>\n'
(root / 'design').mkdir(exist_ok=True)
(root / 'design/motero-icon.svg').write_text(svg)
# Legacy square icon: retain the white rounded card and original glyph height.
scale = 48 / 44
offset = 48 - 54 * scale
legacy = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs>' + gradient + '</defs><rect x="8.5" y="8.5" width="79" height="79" rx="8" fill="#999"/><rect x="9" y="9" width="78" height="78" rx="7.5" fill="white" stroke="#ddd" stroke-width=".5"/><path transform="translate(' + str(offset) + ' ' + str(offset) + ') scale(' + str(scale) + ')" fill="url(#red)" d="' + path + '"/></svg>'
for density, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    cairosvg.svg2png(bytestring=legacy.encode(), write_to=str(res / ('mipmap-' + density) / 'ic_launcher.png'), output_width=size, output_height=size)
print('M vector, monochrome icon and five legacy densities generated')
