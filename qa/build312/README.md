# Build 312 verification

119 native tests passed. APK packaging, signing and update validation are performed by the release workflow. The added recovery regression first failed on Build 311's manager, then passed after retaining exact preview requests across renderer instances.

The reader revision remains `2d0fc4a9b428affb2125442a27388f3c99468a81` from verified Build 311: 305 reader tests and all 12 browser suites passed on GitHub, including forced delayed geometry during rapid alternating turns. API 31/35 independently verified Build 311's data-retaining updates, signing and old-key refusal; see `../build311/github-*.json`. The Build 312 workflow repeats the full gates with Build 311 as its current update baseline.

Physical GrapheneOS/BOOX and live-account tests remain separate. No BOOX SDK or variable-pressure format is included.
