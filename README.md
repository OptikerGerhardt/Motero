# Motero Reader

This is Motero’s modified Zotero Reader. The `reader` branch of the private [Motero repository](https://github.com/OptikerGerhardt/Motero) contains this submodule; the Android application and build/release workflow live on `main`.

Clone the main repository with `--recurse-submodules`. Commit reader changes here and push the `reader` branch first, then update the submodule pointer and Android version on `main`.

The main workflow runs the reader unit and browser regressions and packages the Android reader. Local instructions and licensing are in the main repository’s README and `COPYING`. The optional original-document test accepts `BOOX_PLESSNER_PDF`; private documents are not required or distributed.

Derived from [Zotero Reader](https://github.com/zotero/reader), licensed under AGPLv3. Existing copyright notices and third-party licenses are retained.
