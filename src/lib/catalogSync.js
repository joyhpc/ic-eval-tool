function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&Omega;/g, 'Ohm')
    .replace(/&reg;/g, 'R')
    .replace(/&trade;/g, 'TM')
    .replace(/&nbsp;/g, ' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+name=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, 'i');
  const matched = html.match(pattern);
  return matched ? decodeHtmlEntities(matched[1]) : null;
}

function matchTitle(html) {
  const matched = html.match(/<title>([^<]+)<\/title>/i);
  return matched ? decodeHtmlEntities(matched[1]) : null;
}

export function parseTiProductHtml(html) {
  return {
    title: matchTitle(html),
    summary: matchMeta(html, 'description'),
    status: matchMeta(html, 'status'),
    keywords: matchMeta(html, 'keywords'),
    family: matchMeta(html, 'gpnFamily'),
  };
}

export function normalizeChipCatalogEntry(source, parsed) {
  const summary = parsed.summary ?? source.fallback.summary;
  const title = parsed.title ?? `${source.partNumber} product information`;
  const familyHint = parsed.keywords?.split(',').at(-1)?.trim() ?? source.familyLabel;
  const family = familyHint || source.familyLabel;

  return {
    id: source.id,
    vendor: source.vendor,
    partNumber: source.partNumber,
    title,
    summary,
    status: parsed.status ?? source.fallback.status,
    family,
    familyLabel: source.familyLabel,
    topology: source.topology,
    productUrl: source.productUrl,
    datasheetUrl: source.datasheetUrl,
    thresholds: {
      vinMin: source.fallback.vinMin,
      vinMax: source.fallback.vinMax,
      currentLimitMax: source.fallback.currentLimitMax,
    },
    capabilities: {
      reverseProtection: source.fallback.reverseProtection,
      thermalProtection: source.fallback.thermalProtection,
      integratedFet: source.topology !== 'external-mosfet-controller',
    },
    featureBullets: source.fallback.featureBullets,
    pins: source.fallback.pins,
  };
}

export function serializeCatalogModule(catalog) {
  return `export const CHIP_CATALOG_GENERATED_AT = ${JSON.stringify(catalog.generatedAt)};\nexport const CHIP_CATALOG_SOURCE = ${JSON.stringify(catalog.source)};\nexport const CHIP_CATALOG_ENTRIES = ${JSON.stringify(catalog.entries, null, 2)};\n`;
}
