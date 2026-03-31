import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_HW_PARAMS, computeHardwareResults } from '../src/lib/lm5060Hardware.js';
import { DEFAULT_SIM_PARAMS, deriveSimulationState } from '../src/lib/lm5060.js';
import {
  buildLm5060SchematicViewModel,
  LM5060_MODULE_DEFINITION,
  verifyLm5060ModuleDefinition,
} from '../src/lib/lm5060Module.js';

test('module verifier passes for the LM5060 definition', () => {
  const result = verifyLm5060ModuleDefinition();

  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
  assert.ok(result.hotspotCount >= 10);
  assert.ok(result.netCount >= 5);
  assert.equal(result.scenarioResults.length, LM5060_MODULE_DEFINITION.scenarios.length);
});

test('schematic view model resolves selected hotspot and live values', () => {
  const hwResults = computeHardwareResults(DEFAULT_HW_PARAMS);
  const simParams = {
    ...DEFAULT_SIM_PARAMS,
    vGate: 20,
    vSense: 14,
    vOut: 12,
    vTimer: 1.2,
  };
  const simResults = deriveSimulationState(simParams, false);
  const viewModel = buildLm5060SchematicViewModel({
    hwParams: DEFAULT_HW_PARAMS,
    hwResults,
    simParams,
    simResults,
    faultLatch: false,
    selectedHotspotId: 'sense-resistor',
  });

  assert.equal(viewModel.selectedHotspot.id, 'sense-resistor');
  assert.equal(viewModel.inspector.focusField, 'iLimit');
  assert.match(viewModel.inspector.value, /Ω/);
  assert.equal(viewModel.nets.some((net) => net.id === 'power-path'), true);
});
