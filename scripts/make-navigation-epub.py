"""Small deterministic EPUB for chapter boundaries and hardware navigation."""
from pathlib import Path
import sys,zipfile

destination=Path(sys.argv[1])
destination.parent.mkdir(parents=True,exist_ok=True)
for rtl in (False,True):
    path=destination.with_name(destination.stem+('-rtl' if rtl else '')+destination.suffix)
    with zipfile.ZipFile(path,'w') as archive:
        archive.writestr('mimetype','application/epub+zip',compress_type=zipfile.ZIP_STORED)
        archive.writestr('META-INF/container.xml','''<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="book.opf" media-type="application/oebps-package+xml"/></rootfiles></container>''')
        archive.writestr('book.opf','''<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">motero-navigation-test</dc:identifier><dc:title>Navigation test</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">2026-11-06T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="one" href="one.xhtml" media-type="application/xhtml+xml"/><item id="two" href="two.xhtml" media-type="application/xhtml+xml"/></manifest><spine page-progression-direction="'''+('rtl' if rtl else 'ltr')+'''"><itemref idref="one"/><itemref idref="two"/></spine></package>''')
        archive.writestr('nav.xhtml','''<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head><body><nav epub:type="toc"><ol><li><a href="one.xhtml">One</a></li><li><a href="two.xhtml">Two</a></li></ol></nav></body></html>''')
        for chapter,name in [(1,'one'),(2,'two')]:
            paragraphs=''.join(f'<p>Chapter {chapter}, paragraph {i}. '+('Ordinary text for testing reader navigation, preserving every final line. '*5)+'</p>' for i in range(16))
            archive.writestr(name+'.xhtml','<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter '+str(chapter)+'</title></head><body><h1>Chapter '+str(chapter)+'</h1>'+paragraphs+'</body></html>')
    print(path)
