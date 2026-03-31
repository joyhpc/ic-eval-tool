# IC Eval Tool

Web-based IC hardware evaluation toolkit built with React, Vite, and Tailwind CSS.

The current shipped module is the LM5060 evaluator:
- Hardware calculator for UVLO / OVP / TIMER / GATE sizing
- Pin-level behavior simulator with latch-off and fault timing
- Automatic TIMER / GATE evolution based on computed capacitance values
- Simplified interactive schematic with cross-probing between diagram and inputs

The tool now also includes a multi-chip catalog workbench backed by normalized parsed files for mainstream protection-path devices:
- LM5060
- TPS2490
- TPS2660
- TPS25940
- TPS1663
- TPS1685
- LM66100

## Scripts

- `npm install`
- `npm run dev`
- `npm run sync:catalog`
- `npm run verify:catalog`
- `npm run verify:module`
- `npm run verify`
- `npm test`
- `npm run lint`
- `npm run build`

`npm run verify` is the closed-loop CLI gate for the current module. It runs:
1. Catalog verification
2. Schematic/module definition verification
3. Node test suite
4. ESLint
5. Production build

`npm run sync:catalog` fetches live product metadata and rewrites:
- `catalog/parsed/*.json`
- `src/data/chips.generated.js`

The requested upstream source is OpenDataSheet, but the current sync falls back to official vendor product pages because `opendatasheet.com` was unavailable during implementation.

## Deployment

Production is deployed on Vercel.

## Direction

This repository is intentionally named generically so more IC evaluation modules can be added later without being locked to a single part number.
