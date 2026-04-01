import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLm5060HardwareInsightModel,
  computeHardwareResults,
  DEFAULT_HW_PARAMS,
  LM5060_HW_CONSTANTS,
} from '../src/lib/lm5060Hardware.js';

test('hardware calculator returns expected formatted and raw values', () => {
  const results = computeHardwareResults(DEFAULT_HW_PARAMS);

  assert.equal(results.R10, '44.71');
  assert.equal(results.R8, '170.00');
  assert.equal(results.C_TIMER, '66.0');
  assert.equal(results.C_GATE, '48.0');
  assert.ok(results.raw.Rs > 0);
  assert.equal(results.raw.V_DSTH, 150);
});

test('deep hardware insight model maps uvlo chain to internal architecture', () => {
  const model = buildLm5060HardwareInsightModel(DEFAULT_HW_PARAMS, 'uvlo');

  assert.equal(model.selectedInsight.id, 'uvlo');
  assert.equal(model.selectedInsight.focusField, 'vinMin');
  assert.match(model.selectedInsight.formula, /VIN_MIN/);
  assert.ok(model.architectureNodes.find((node) => node.id === 'uvlo-comparator')?.active);
  assert.ok(model.architectureLinks.find((link) => link.id === 'uvlo-divider-uvlo-comparator')?.active);
});

test('timer insight exposes internal timer current source and trip voltage', () => {
  const model = buildLm5060HardwareInsightModel(DEFAULT_HW_PARAMS, 'timer');
  const timerCheckpoint = model.selectedInsight.checkpoints.join(' | ');

  assert.match(timerCheckpoint, new RegExp(`${LM5060_HW_CONSTANTS.timerChargeMicroAmp}`));
  assert.match(timerCheckpoint, /2\.0 V|2\.0V/);
  assert.equal(model.selectedInsight.focusField, 'ocpDelay');
  assert.equal(model.selectedInsight.recommendedValue, '66.0 nF');
});
