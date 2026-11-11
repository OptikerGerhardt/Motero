import View from './common/view';
import { navigateWithHardwareButton } from './pdf/hardware-navigation.mjs';
import { createAnnotationSelectionHandler } from './common/annotation-selection-handler.mjs';

var port;

function sendToPort(handlerName, message) {
	const obj = {
		handlerName: handlerName,
		message: message,
	};
	port.postMessage(JSON.stringify(obj));
}

onmessage = function (e) {
	if (e.data == 'initPort') {
		port = e.ports[0];
		// Notify when iframe and port are loaded
		postMessage('onInitialized');
	}
};

function postMessage(event, params = {}) {
	sendToPort("textHandler", { event, params });
}

function log(data) {
	sendToPort("logHandler", data);
}

function base64ToBytes(base64) {
	const text = atob(base64);
	const length = text.length;
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[i] = text.charCodeAt(i);
	}
	return bytes;
}

function decodeBase64(base64) {
	const decoder = new TextDecoder();
	return decoder.decode(base64ToBytes(base64));
}

window.createView = (encodedOptions) => {
	const options = JSON.parse(decodeBase64(encodedOptions));
	log("Create " + options.type + " view");
	log("Loaded " + options.annotations.length + " annotations");
	let handleAnnotationSelection = createAnnotationSelectionHandler({
		select: ids => window._view.selectAnnotations(ids),
		notify: (ids, selectionOptions) => {
			postMessage('onSelectAnnotations', { ids, ...selectionOptions });
		},
		defer: callback => requestAnimationFrame(callback),
		getSelectedIDs: () => window._view.getSelectedAnnotationIDs(),
	});

	let url = new URL(options.url).toString();
	delete options.url;
	window._view = new View({
		...options,
		platform: 'android',
		container: document.getElementById('view'),
		penActive: false,
		data: { url },
		onInitialized: () => {
			postMessage('onViewContentInitialized');
		},
        onChangeHistory: ({ undoSteps, redoSteps }) => postMessage('onHistoryChanged', { canUndo: undoSteps.length > 0, canRedo: redoSteps.length > 0 }),
		onSaveAnnotations: (annotations, {history = false} = {}) => {
			postMessage('onSaveAnnotations', { annotations, history });

			// Select a just-created note annotation. Match by dateCreated to avoid
			// re-selecting an existing note whose pending edit landed in the same batch.
			// Skip while a text annotation is being inline-edited — stealing the selection
			// here would delete the still-empty annotation under the focused editor
			let newNote = annotations.find(x => x.type === 'note' && x.dateCreated === x.dateModified);
			if (newNote && !/^(Lesezeichen|Bookmark) · /.test(newNote.comment || '')
					&& !window._view.getFocusedTextAnnotationID()) {
				window._view.selectAnnotations([newNote.id]);
			}
		},
		onSetOutline: (outline) => {
			postMessage('onSetOutline', { outline });
		},
		onRequestPassword: () => {
			postMessage('onRequestPassword');
		},
		onInitThumbnails: (thumbnails) => {
			postMessage('onInitThumbnails', { thumbnails });
		},
		onRenderThumbnail: (thumbnail) => {
			postMessage('onRenderThumbnail', { thumbnail });
		},
		onRenderAnnotationImage: ({ id, image }) => {
			postMessage('onRenderAnnotationImage', { id, image });
		},
		onSetPageLabels: (pageLabels) => {
			postMessage('onSetPageLabels', { pageLabels });
		},
		onDeleteAnnotations: (ids) => {
			if (ids.length) {
				postMessage('onDeleteAnnotations', { ids });
			}
		},
		onSelectAnnotations: (ids, _event, options = {}) => {
			handleAnnotationSelection(ids, options);
		},
		onSetSelectionPopup: (params) => {
			postMessage('onSetSelectionPopup', params);
		},
		onSetAnnotationPopup: (params) => {
			postMessage('onSetAnnotationPopup', params);
		},
		onOpenLink: (url) => {
			postMessage('onOpenLink', { url });
		},
		onFindResult: (result) => {
			postMessage('onFindResult', result);
		},
		onChangeViewState: (state) => {
			postMessage('onChangeViewState', { state });
		},
		onChangeViewStats: (stats) => {
			postMessage('onChangeViewStats', { stats });
		},
		onBackdropTap: () => {
			postMessage('onBackdropTap');
		},
		onDismissReaderChrome: () => postMessage('onDismissReaderChrome'),
		onEdgePageTurnTap: () => {
			postMessage('onEdgePageTurnTap');
		},
		onManualCropChanged: (params) => postMessage('onManualCropChanged', params),
		onCropEditorChanged: (open) => postMessage('onCropEditorChanged', { open }),
        onCropEditorState: params => postMessage('onCropEditorState', params),
	});
};

window.setContainerInsets = (options) => {
	log("Set container insets: " + JSON.stringify(options));
	const style = document.documentElement.style;
	style.setProperty('--safe-area-inset-top', (options.top || 0) + 'px');
	style.setProperty('--safe-area-inset-right', (options.right || 0) + 'px');
	style.setProperty('--safe-area-inset-bottom', (options.bottom || 0) + 'px');
	style.setProperty('--safe-area-inset-left', (options.left || 0) + 'px');
};

window.fitToContent = (options) => {
	log("Fit to content: " + JSON.stringify(options));
	window._view.fitToContent(options);
};

window.fitToWidth = () => window._view.fitToWidth();
window.setPageFitting = (options, apply = true) => window._view.setPageFitting(options, apply);
window.beginManualCrop = options => window._view?._activeView?._pageFitting?.openCropEditor(options);
window.cropEditorAction = options => window._view?._activeView?._pageFitting?.editor?.action(options);
window.focusReaderAnnotation = async id => {
    const reader = window._view, view = reader?._activeView;
    const annotation = view?._annotations?.find(a => a.id === id);
    if (!annotation) return false;
    reader.selectAnnotations([]);
    view._options.onSetAnnotationPopup?.(null);
    if (Number.isInteger(annotation.position?.pageIndex)) {
        if (view._booxReader?.isOverview()) await view._booxReader.enterPage(annotation.position.pageIndex);
        else await view.navigate({pageIndex: annotation.position.pageIndex});
    }
    else await view.navigate({position: annotation.position});
    reader.setReaderChromeVisible(false);
    return true;
};
// Retain the original bridge alias for callers using the bookmark shortcut.
window.focusReaderBookmark = window.focusReaderAnnotation;
window.cancelManualCrop = () => window._view?._activeView?._pageFitting?.editor?.close();
window.setDirectHighlight = enabled => window._view.setDirectHighlight(enabled);
window.setReaderChromeVisible = visible => window._view?.setReaderChromeVisible(visible);
window.setReaderViewportInset = value => window._view?._view?.setReaderViewportInset?.(value);

window.setContentFit = (options) => {
	log("Set content fit: " + JSON.stringify(options));
	window._view.setContentFit(options);
};

window.undoReaderAnnotation = () => {
    if (!window._view || window._view._options.readOnly) return false;
    window._view.finishTextAnnotationEditing();
    window._view.undo();
    postMessage('onHistoryChanged', { canUndo: window._view.canUndo, canRedo: window._view.canRedo });
    return true;
};

window.redoReaderAnnotation = () => {
    if (!window._view || window._view._options.readOnly) return false;
    window._view.finishTextAnnotationEditing();
    window._view.redo();
    postMessage('onHistoryChanged', { canUndo: window._view.canUndo, canRedo: window._view.canRedo });
    return true;
};

window.setDeviceProfile = profile => window._view?.setDeviceProfile(profile);
window.setPenEraser = active => window._view?.setPenEraser(active, 'key');
window.addAnnotation = options => window._view.addAnnotation(JSON.parse(decodeBase64(options.annotation)));
window.editAnnotation = options => {
    try { window._view.updateAnnotations([JSON.parse(decodeBase64(options.annotation))]); }
    catch (error) { console.error('Annotation edit rejected', error.name); }
};
window.deleteAnnotations = options => window._view.deleteAnnotations(JSON.parse(decodeBase64(options.ids)));

window.setPageNavigation = mode => window._view.setPageNavigation(mode);

window.setTool = (options) => {
	log("Set tool: " + options.type + "; color: " + options.color);
	window._view.setTool(options);
};

window.clearTool = () => {
	log("Clear tool");
	window._view.setTool();
};

window.finishTextAnnotationEditing = () => {
	return window._view?.finishTextAnnotationEditing() || false;
};

window.updateAnnotations = (options) => {
	const deletions = JSON.parse(decodeBase64(options.deletions));
	const insertions = JSON.parse(decodeBase64(options.insertions));
	const modifications = JSON.parse(decodeBase64(options.modifications));

	if (deletions.length > 0) {
		log("Delete annotations: " + deletions.length);
		window._view.unsetAnnotations(deletions);
	}
	let updates = [...insertions, ...modifications];
	if (updates.length > 0) {
		log("Update annotations: " + updates.length);
		window._view.setAnnotations(updates);
	}
};

window.search = (options) => {
	const term = decodeBase64(options.term);
	log("Search document: " + term);
	window._view.find({ query: term, highlightAll: true, caseSensitive: false, entireWord: false });
};

window.select = (options) => {
	log("Select: " + options.key);
	window._view.selectAnnotations([options.key]);
	if (options.centerInDocument !== false) {
		window._view.navigate({ annotationID: options.key });
	}
};

window.navigate = (options) => {
	const decodedLocation = JSON.parse(decodeBase64(options.location));
	log("Show location: " + JSON.stringify(decodedLocation));
	window._view.navigate(decodedLocation);
};

let hardwareNavigationQueue = Promise.resolve();
window.turnPageWithHardwareButton = (next, fraction = 2 / 3) => {
    let owner = window._view;
    let active = owner?._activeView;
    hardwareNavigationQueue = hardwareNavigationQueue.catch(() => {}).then(async () => {
        if (!owner || owner !== window._view || active !== owner._activeView
            || owner.getFocusedTextAnnotationID()) return 'ignored';
        let element = active?._iframeWindow?.document?.activeElement;
        if (element?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element?.tagName)) return 'ignored';
        let result = await navigateWithHardwareButton(active, next, fraction);
        if (result === 'page' || result === 'scroll' || result === 'column') postMessage('onEdgePageTurnTap');
        return result;
    });
    return hardwareNavigationQueue;
};

window.navigateBack = () => {
	log("Navigate back");
	window._view.navigateBack();
};

window.navigateForward = () => {
	log("Navigate forward");
	window._view.navigateForward();
};

window.beginNavigation = () => {
	log("Begin navigation");
	window._view.beginNavigation();
};

window.endNavigation = () => {
	log("End navigation");
	window._view.endNavigation();
};

window.setSDTPack = (options) => {
	log("Set SDT pack: v" + options.packVersion + " schema " + options.schemaMajorVersion);
	window._view.setSDTPack({
		bytes: base64ToBytes(options.bytes),
		packVersion: options.packVersion,
		schemaMajorVersion: options.schemaMajorVersion,
	});
};

window.setAppearance = (options) => {
	log("Set appearance: lineHeight=" + options.lineHeight + "; pageWidth=" + options.pageWidth);
	window._view.setAppearance(options);
};

window.sdtAnchorToPosition = async (options) => {
	const anchor = JSON.parse(decodeBase64(options.anchor));
	const position = await window._view.sdtAnchorToPosition(anchor);
	postMessage('onSDTPosition', { requestID: options.requestID, position });
};

// Enables/disables Reading Mode, which displays the document's structured text as reflowable HTML over the base view.
// Requires the SDT pack. Responds with whether Reading Mode is actually enabled afterwards (false if the SDT is
// unavailable). Only highlight, underline, and note tools work in Reading Mode; others fall back to the pointer tool.
window.setReadingModeEnabled = async (options) => {
	log("Set Reading Mode enabled: " + options.enabled);
	try {
		await window._view.setReadingModeEnabled(options.enabled);
	}
	catch (error) {
		log("Reading Mode unavailable: " + error);
	}
	postMessage('onReadingModeEnabled', { requestID: options.requestID, enabled: window._view.readingModeEnabled });
};

window.createAnnotationFromSDT = async (options) => {
	const params = JSON.parse(decodeBase64(options.params));
	log("Create annotation from SDT: " + params.type);
	const annotation = await window._view.createAnnotationFromSDT(params);
	postMessage('onCreateAnnotationFromSDT', { requestID: options.requestID, annotation });
};

window.getReadAloudSegments = async (options) => {
	log("Get Read Aloud segments: " + options.granularity);
	const segments = await window._view.getReadAloudSegments(options.granularity);
	postMessage('onReadAloudSegments', { requestID: options.requestID, segments });
};

window.setReadAloudAnnotation = async (options) => {
	const params = JSON.parse(decodeBase64(options.params));
	log("Set Read Aloud annotation: " + params.type);
	const annotation = await window._view.setReadAloudAnnotation(params);
	postMessage('onReadAloudAnnotation', { requestID: options.requestID, annotation });
};

window.setPageLabels = (options) => {
	const pageLabels = JSON.parse(decodeBase64(options.pageLabels));
	log("Set page labels: " + JSON.stringify(pageLabels));
	window._view.setPageLabels(pageLabels);
};

window.renderThumbnails = (pageIndexes, options) => {
	log("Render thumbnails: " + JSON.stringify(pageIndexes));
	window._view.renderThumbnails(pageIndexes, options);
};

window.renderAnnotationImages = (ids) => {
	log("Render annotation images: " + JSON.stringify(ids));
	window._view.renderAnnotationImages(ids);
};

window.enterPassword = (options) => {
	const password = decodeBase64(options.password);
	log("Enter password");
	window._view.enterPassword(password);
};

// A late close event must not cancel a newer annotation's gesture/selection.
window.resetAndroidReaderInput = key => {
	let view = window._view?._view;
	if (key && !view?._selectedAnnotationIDs?.includes(key)) return;
	view?.resetAndroidInput?.();
};

// Android notifies both native caches and the WebView process under pressure.
window.trimReaderMemory = () => {
    const view=window._view?._view;
    if (!view) return;
    view._options.deviceProfile={...view._options.deviceProfile,lowMemory:true};
    view._pageFitting?.work.cancelWhere(key => {
        const index=typeof key==='number'?key:Number(key.slice(5));
        return view._pageFitting.work.jobs.get(key)?.priority>0 && Math.abs(index-(view._pageFitting.viewer.currentPageNumber-1))>2;
    });
    view._pageFitting?.analysisWorker.cancelWhere((index,priority)=>priority>0 && Math.abs(index-(view._pageFitting.viewer.currentPageNumber-1))>2);
    view._pdfThumbnails?.trimMemory();
    view.trimMemory?.();
};
