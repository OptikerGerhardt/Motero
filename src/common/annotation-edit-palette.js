// Editing owns the gesture. Retain only IDs while the palette is hidden so
// restoring it cannot resurrect deleted annotations or overwrite new geometry.
export function beginPaletteEdit(host, annotations) {
    if (!host?.palette) return;
    host.editPaletteIDs = annotations.map(a => a.id);
    host.closePalette();
}

export function finishPaletteEdit(host, annotations, selectedIDs) {
    const ids = host?.editPaletteIDs;
    if (!ids) return;
    host.editPaletteIDs = null;
    const current = annotations.filter(a => ids.includes(a.id) && selectedIDs.includes(a.id));
    if (current.length) host.showPalette(current);
}
