# Motero 1.1.1 / Build 327

With Protect reader enabled, the Reader toolbar Back arrow was routed through Android's Back dispatcher. The Reader protection handler consumed that explicit exit, so the document stayed open.

Phone and tablet Reader routes now close through their navigation controller. The system Back handler continues to dismiss search, the sidebar or selection, or reveal the Reader controls. Other screens and Reader dialogs retain their existing Back routing. The change adds no UI controls or styling and preserves the Reader submodule, PDF.js, annotation formats and signing identity from verified Build 326.

The native regression uses a real enabled Android Back callback: system Back remains consumed before and after an explicit Reader exit, while that exit pops the navigation stack. A second case verifies explicit exit without a system dispatcher. Full build and release evidence is recorded in [Build 327 verification](../qa/build327/README.md).

Physical BOOX/Pixel UI testing and live-account sync are separate from automated native tests and emulator update checks.
