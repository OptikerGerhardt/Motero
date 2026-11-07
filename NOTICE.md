# Attribution and third-party licenses

Motero contains code derived from Zotero for Android and Zotero Reader. The original copyright notices and the Corporation for Digital Scholarship's AGPLv3 terms are preserved in [COPYING](COPYING), `reader/COPYING`, and the relevant source files. Fork modifications do not replace the original authorship.

- [Zotero for Android](https://github.com/zotero/zotero-android) and [Zotero Reader](https://github.com/zotero/reader): AGPLv3.
- [PDF.js](https://github.com/zotero/pdf.js): Apache-2.0 and the included third-party notices.
- [EPUB.js](https://github.com/zotero/epub.js): BSD license; see its included license.
- Translators, translation components, citation styles, locales, utilities, and document workers: pinned submodules listed in `.gitmodules` and `reader/.gitmodules`. Their own license and copyright files remain applicable.

The mobile PDF.js distribution in `vendor/pdfjs-mobile.zip` is pinned by archive and file hashes in `vendor/pdfjs-mobile.json`. Its source is the reader submodule `pdfjs/pdf.js`, at commit `3ec7e00205d95c512a8d74fefee5228611416d46`. Included license files are retained. Other bundled runtime packages are listed in `vendor/runtime-assets.json`; their source submodules and packaging scripts remain available.

The tracked `debug.keystore` and `app/google-services.json` are unchanged public Zotero upstream files. The development key is not a private production credential. Motero's private release key and personal test documents are excluded from source distributions.

All Motero-specific changes and their integration were programmed using ChatGPT / OpenAI Codex. Original Zotero code and incorporated community contributions retain their authorship and notices. See [UPSTREAM_CHANGES.md](UPSTREAM_CHANGES.md) for incorporated pull requests.

Zotero is a registered trademark of the Corporation for Digital Scholarship. Use of the source code does not grant trademark rights. Motero is an independent fork, not an official Zotero product.

AndroidX Core (Apache-2.0) receives a packaging-time change to its internal receiver-permission suffix for the Motero release variant. The transform source is `buildSrc/src/main/kotlin/MoteroReceiverPermissionTransform.kt`; original AndroidX authorship and licensing remain applicable.
