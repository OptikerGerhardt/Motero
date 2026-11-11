// Budgets cover duplicate preview data and crop metadata separately from PDF.js
// canvases. Device hints may lower a budget, never raise the previous limits.
export function readerResourceBudget(profile = {}, deviceMemory = globalThis.navigator?.deviceMemory) {
    const constrained = !!(profile.eReader || profile.lowMemory
        || profile.memoryClassMb > 0 && profile.memoryClassMb <= 192
        || deviceMemory > 0 && deviceMemory <= 2);
    return {thumbnailBytes:(constrained?4:8)*1024*1024, thumbnailCount:constrained?16:32,
        cropPages:constrained?16:32, recentPages:constrained?1:2, prefetchRadius:constrained?2:4};
}
