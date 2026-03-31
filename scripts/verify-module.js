#!/usr/bin/env node

import process from 'node:process';

import { verifyLm5060ModuleDefinition } from '../src/lib/lm5060Module.js';

const moduleId = process.argv[2] ?? 'lm5060';

if (moduleId !== 'lm5060') {
  console.error(`Unsupported module "${moduleId}". Only "lm5060" is available right now.`);
  process.exit(1);
}

const result = verifyLm5060ModuleDefinition();

console.log(`Module verification: ${moduleId}`);
console.log(`Hotspots: ${result.hotspotCount}`);
console.log(`Nets: ${result.netCount}`);
console.log('Scenarios:');

for (const scenario of result.scenarioResults) {
  console.log(
    `  - ${scenario.id}: state=${scenario.stateKey}, selected=${scenario.selectedHotspot}, nextTimer=${scenario.nextTimer}, nextGate=${scenario.nextGate}`,
  );
}

if (!result.ok) {
  console.error('Verification failed:');
  for (const issue of result.issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

console.log('Verification passed.');
