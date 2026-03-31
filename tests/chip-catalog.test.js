import test from 'node:test';
import assert from 'node:assert/strict';

import { CHIP_SOURCE_CATALOG } from '../src/data/chipSourceCatalog.js';
import {
  CHIP_CATALOG_ENTRIES,
  CHIP_CATALOG_SOURCE,
} from '../src/data/chips.generated.js';
import { normalizeChipCatalogEntry, parseTiProductHtml } from '../src/lib/catalogSync.js';
import {
  buildGenericChipViewModel,
  DEFAULT_GENERIC_PARAMS,
  evaluateGenericChipState,
  verifyGenericCatalogEntries,
} from '../src/lib/genericChipModel.js';

test('TI parser extracts title, summary, status, and family metadata', () => {
  const fixture = `
    <html>
      <head>
        <title>TPS2660 data sheet, product information and support | TI.com</title>
        <meta name="description" content="TI’s TPS2660 is a 4.2-V to 60-V eFuse." />
        <meta name="status" content="ACTIVE" />
        <meta name="keywords" content="TPS2660 information, eFuses (integrated hot swaps)" />
        <meta name="gpnFamily" content="339441_eFuses (integrated hot swaps)" />
      </head>
    </html>
  `;
  const parsed = parseTiProductHtml(fixture);

  assert.equal(parsed.status, 'ACTIVE');
  assert.match(parsed.summary, /TPS2660/);
  assert.match(parsed.keywords, /eFuses/);
  assert.match(parsed.title, /TI\.com/);
});

test('normalization preserves thresholds and source URLs', () => {
  const source = CHIP_SOURCE_CATALOG[0];
  const normalized = normalizeChipCatalogEntry(source, {
    title: 'LM5060 data sheet, product information and support | TI.com',
    summary: 'TI’s LM5060 is a 5.5-V to 65-V hot swap controller.',
    status: 'ACTIVE',
    keywords: 'LM5060 information, Hot-swap controllers',
  });

  assert.equal(normalized.id, source.id);
  assert.equal(normalized.productUrl, source.productUrl);
  assert.equal(normalized.thresholds.vinMax, source.fallback.vinMax);
});

test('generated catalog verifies and produces generic workbench models', () => {
  assert.equal(CHIP_CATALOG_SOURCE.activeSource, 'official-vendor-pages');

  const verified = verifyGenericCatalogEntries(CHIP_CATALOG_ENTRIES);
  assert.equal(verified.ok, true);

  const chip = CHIP_CATALOG_ENTRIES.find((entry) => entry.id === 'tps2660');
  const state = evaluateGenericChipState(chip, {
    ...DEFAULT_GENERIC_PARAMS,
    vin: 12,
    enabled: true,
    loadCurrent: 3,
    reversePolarity: false,
    thermalFault: false,
  });
  assert.equal(state.stateKey, 'warning');

  const viewModel = buildGenericChipViewModel(chip, DEFAULT_GENERIC_PARAMS, 'core');
  assert.ok(viewModel.hotspots.length >= 5);
  assert.ok(viewModel.nets.length >= 3);
});
