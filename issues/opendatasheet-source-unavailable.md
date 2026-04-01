# OpenDataSheet Source Issue

- Requested source: OpenDataSheet
- Active source: official-vendor-pages
- Observed behavior: `https://opendatasheet.com` redirected to an unavailable parked page during sync
- Impact: live parsed chip files could not be sourced from OpenDataSheet
- Current fallback: official vendor product pages are parsed and normalized into `catalog/parsed/*.json`
- Next action when source returns: add an OpenDataSheet adapter in `scripts/sync-chip-catalog.js` and switch `activeSource` back
