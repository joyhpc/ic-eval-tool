#!/usr/bin/env node

import process from 'node:process';

import {
  CHIP_CATALOG_ENTRIES,
  CHIP_CATALOG_GENERATED_AT,
  CHIP_CATALOG_SOURCE,
} from '../src/data/chips.generated.js';
import { verifyGenericCatalogEntries } from '../src/lib/genericChipModel.js';

const result = verifyGenericCatalogEntries(CHIP_CATALOG_ENTRIES);

console.log(`Catalog generated at: ${CHIP_CATALOG_GENERATED_AT}`);
console.log(`Requested source: ${CHIP_CATALOG_SOURCE.requestedSource}`);
console.log(`Active source: ${CHIP_CATALOG_SOURCE.activeSource}`);
console.log(`Entries: ${CHIP_CATALOG_ENTRIES.length}`);

if (CHIP_CATALOG_SOURCE.issues.length > 0) {
  console.log('Source sync issues:');
  for (const issue of CHIP_CATALOG_SOURCE.issues) {
    console.log(`- ${issue}`);
  }
}

if (!result.ok) {
  console.error('Catalog verification failed:');
  for (const issue of result.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Catalog verification passed.');
