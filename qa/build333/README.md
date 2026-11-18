# Build 333 verification

- Reader unit tests include the new Fit to Width cue, word/guide overlap, spread clearance, elliptical contour and crop spacing. The EPUB tests cover unequal safe areas.
- The browser comfort suite tests real finger input, current-page bounds, crop centering, stable spread flags, Reading Assist after a page turn and the global switch.
- Android unit tests cover throttled scrubbing, completion of pending renderer callbacks, attachment progress and checksum cache invalidation.
- The release gate installs updates from Builds 303 and 332 on Android API 31 and 35 and verifies the production signer, retained data and rejection of the old key.

Physical BOOX, Pixel and tablet testing is listed in the [Feature Plan](../../FEATUREPLAN.md).
