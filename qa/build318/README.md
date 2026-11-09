# Motero 1.0.3 / Build 318 verification

333 reader unit tests passed. The added regression fails against Build 317 and confirms that a newly detected reference mask is painted on a buffered neighboring page even when its page-frame geometry is unchanged. The correction retains incremental drawing and the optimized layout writes.

Focused Chromium fitting, refinements, UI consistency and crop-performance suites passed. Native application changes from Build 317 are unchanged apart from the increasing version. A fresh protected workflow must repeat all native/browser checks, signing/source verification and API 31/35 data-preserving updates from Builds 303 and 317 before publication.

All reader/UI/cropping features from Build 317 are included. Physical BOOX/Pixel behavior and live account sync remain separate tests.
