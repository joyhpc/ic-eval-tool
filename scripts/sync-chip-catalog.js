#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { CHIP_SOURCE_CATALOG } from '../src/data/chipSourceCatalog.js';
import {
  normalizeChipCatalogEntry,
  parseTiProductHtml,
  serializeCatalogModule,
} from '../src/lib/catalogSync.js';

const projectRoot = '/home/ubuntu/ic-eval-tool';
const parsedDir = path.join(projectRoot, 'catalog', 'parsed');
const generatedModulePath = path.join(projectRoot, 'src', 'data', 'chips.generated.js');

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'ic-eval-tool-sync/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function sync() {
  await fs.mkdir(parsedDir, { recursive: true });

  const entries = [];
  const issues = [];

  for (const source of CHIP_SOURCE_CATALOG) {
    let parsed = {};

    try {
      const html = await fetchHtml(source.productUrl);
      if (source.sourceType === 'ti-product') {
        parsed = parseTiProductHtml(html);
      }
    } catch (error) {
      issues.push(`${source.id}: ${error.message}`);
    }

    const entry = normalizeChipCatalogEntry(source, parsed);
    entries.push(entry);

    await fs.writeFile(
      path.join(parsedDir, `${source.id}.json`),
      `${JSON.stringify(
        {
          source,
          parsed,
          normalized: entry,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: {
      requestedSource: 'OpenDataSheet',
      activeSource: 'official-vendor-pages',
      note: 'OpenDataSheet was unavailable during sync, so official product pages were used as the live source.',
      issues,
    },
    entries,
  };

  await fs.writeFile(generatedModulePath, serializeCatalogModule(catalog), 'utf8');

  console.log(`Synced ${entries.length} chip entries.`);
  if (issues.length > 0) {
    console.log('Source issues:');
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
  }
}

sync().catch((error) => {
  console.error(error);
  process.exit(1);
});
