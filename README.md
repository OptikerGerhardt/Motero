# Motero

[![Build and tests](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml/badge.svg)](https://github.com/OptikerGerhardt/Motero/actions/workflows/motero.yml)

Motero is an unofficial fork of **[Zotero for Android](https://github.com/zotero/zotero-android)**, focused on reading and annotating PDFs on BOOX e-readers and Android phones. It adds reading controls, page fitting and cropping, and annotation tools tailored to that workflow.

This fork is maintained independently and is not affiliated with or endorsed by Zotero or the Corporation for Digital Scholarship.

## Features

- Direct text highlighting, Zotero tags, and a bottom PDF tool dock with annotation Undo and color/size controls.
- Black bookmark flags, a bookmark filter, and direct jump/delete shortcuts.
- Reader appearance applied at startup, matching system-bar contrast and page previews.
- Continuous cropped PDF pages, temporary two-finger access to full pages, and an overview that stays open when two complete pages are visible.
- Font-size controls with a percentage display for EPUBs and Reading Mode.
- Automatic content fitting with controls for margins and marginal notes, local layout learning, and a bounded geometry cache.
- Automatic or manual content cropping, shared by the page-fitting modes. Manual frames for all, odd, or even pages are saved per attachment.
- SmartScroll, hardware-button navigation, and edge taps in vertical, horizontal, and wrapped PDF layouts.
- A top-right bookmark shortcut for the centered reading page: tap to add a black bookmark, then tap again to remove it. Existing bookmark colors are preserved.
- Tag suggestions ranked by use in the current document and library, with explicit creation of new tags.
- EPUB navigation, local reading-position restoration, and a persistent choice of progress display, including hidden.

View cropping does not modify the PDF file or annotation coordinates. Manual crop settings are stored locally and are not synchronized with Zotero.

## Install and update

**Requires Android 9 or later.** Download `Motero_Build<number>.apk` from the [latest release](https://github.com/OptikerGerhardt/Motero/releases/latest). Each release also includes source code, test reports, and SHA-256 checksums.

Release APKs are signed with a dedicated Motero key. The public certificate and signing policy are available in [signing/](signing/). The application ID is `org.zotero.android.debug`; this is retained for compatibility with earlier Motero installations. Release APKs are not debuggable.

Use **Build 307 or later** when updating an earlier Motero test build. Build 306 has a receiver-permission conflict that prevents this migration. The corrected update retains the application ID and uses a new internal permission alongside signing-key rotation. Back up your data before updating. A successful Build 307 update has been reported on a Pixel 8 running GrapheneOS; BOOX confirmation is still pending. See [SECURITY.md](SECURITY.md).

You can also track this repository with [Obtainium](https://github.com/ImranR98/Obtainium). Use the APK filename filter `^Motero_Build[0-9]+\.apk$`.

## Development with ChatGPT

All Motero-specific changes and their integration were programmed using **ChatGPT / OpenAI Codex**, including the accompanying tests and build configuration. The project maintainer is responsible for requirements, review, and release decisions.

The underlying Zotero code and incorporated community contributions retain their original authorship. Motero includes selected pull requests and fixes from the upstream projects; some have been merged upstream, while others were incorporated into this fork from open pull requests. [UPSTREAM_CHANGES.md](UPSTREAM_CHANGES.md) lists the contributions and their upstream status.

## Thanks to Zotero and its contributors

Motero exists because of the work behind **[Zotero](https://www.zotero.org/)**, **[Zotero for Android](https://www.zotero.org/support/android)**, and **[Zotero Reader](https://github.com/zotero/reader)**.

Thank you to the Corporation for Digital Scholarship and to the developers, maintainers, contributors, translators, reviewers, and testers for the time, care, and effort invested in these projects. Their work on reference management, synchronization, document reading, annotations, and open infrastructure is the foundation of this fork. Credit also belongs to the original authors of the pull requests incorporated into Motero.

Upstream source repositories: [Zotero](https://github.com/zotero/zotero), [Zotero for Android](https://github.com/zotero/zotero-android), and [Zotero Reader](https://github.com/zotero/reader).

## Build from source

Requirements: JDK 17, Node.js 24, Python 3.12, Android SDK package `platforms;android-37.0`, and Build Tools 36.0.0. Current Android SDK command-line tools require JDK 21 for SDK installation; the app itself builds with JDK 17. The Gradle wrapper downloads the pinned Gradle distribution and checks its SHA-256 checksum.

```sh
git clone --recurse-submodules https://github.com/OptikerGerhardt/Motero.git
cd Motero
python3 scripts/prepare_reader_assets.py
cd reader
npm ci --no-audit --no-fund
npm test
npx webpack --config-name android
cd ..
python3 scripts/package_reader_assets.py
./gradlew :app:testDevDebugUnitTest :app:assembleDevDebug --init-script scripts/test_jvm_agent.gradle --no-build-cache
```

The development APK is written to `app/build/outputs/apk/dev/debug/app-dev-debug.apk`. It uses a public development key and must not be distributed as a production release. See [docs/RELEASING.md](docs/RELEASING.md) for release builds and private signing.

The customized reader is pinned as a submodule from this repository's [`reader` branch](https://github.com/OptikerGerhardt/Motero/tree/reader). Initialize submodules when cloning. The pinned PDF.js distribution and runtime packages are documented in [vendor/README.md](vendor/README.md).

## Tests and project status

The release workflow runs reader and Android unit tests, browser checks, and publication/signing checks. Before publishing, it also exercises a real update from Build 303 on Android API 31 and 35, verifies private test-data and UID retention, and rejects updates or internal-permission access using the old public key. Versioned reports accompany each release. New reader behavior on physical devices, BOOX keyboard behavior, and synchronization with a live Zotero account require separate testing.

Browser checks use Playwright 1.56.1 and Chromium. With Playwright installed and available through `NODE_PATH`, run:

```sh
python3 scripts/run_browser_checks.py --browser /usr/bin/chromium
```

Further development notes: [feature plan](FEATUREPLAN.md), [changelog](CHANGELOG.md), and [build verification](BUILD_STATUS.md) (in German).

## Contributing and support

Report Motero bugs and feature requests in [this repository's issues](https://github.com/OptikerGerhardt/Motero/issues). Include the build number, device, Android version, and steps to reproduce. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance and [SECURITY.md](SECURITY.md) for security reports. Please keep personal documents and credentials out of reports.

## License

Motero's derived application code is distributed under the **GNU Affero General Public License, version 3 (AGPLv3)**, following the upstream license. See [LICENSE](LICENSE), the preserved upstream [COPYING](COPYING), and [NOTICE.md](NOTICE.md). Dependencies retain their respective licenses and copyright notices.

Zotero is a registered trademark of the Corporation for Digital Scholarship. The Motero name identifies this independent fork.
