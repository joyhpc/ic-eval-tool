# IC Eval Tool

Web-based IC hardware evaluation toolkit built with React, Vite, and Tailwind CSS.

The current shipped module is the LM5060 evaluator:
- Hardware calculator for UVLO / OVP / TIMER / GATE sizing
- Pin-level behavior simulator with latch-off and fault timing
- Automatic TIMER / GATE evolution based on computed capacitance values

## Scripts

- `npm install`
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run build`

## Deployment

Production is deployed on Vercel.

## Direction

This repository is intentionally named generically so more IC evaluation modules can be added later without being locked to a single part number.
