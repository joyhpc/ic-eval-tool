import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SIM_PARAMS,
  deriveSimulationState,
  evolveSimulation,
} from '../src/lib/lm5060.js';

test('stays in startup while gate enhancement threshold is not met', () => {
  const snapshot = deriveSimulationState({
    ...DEFAULT_SIM_PARAMS,
    vGate: 14,
    vOut: 12,
    vTimer: 0.2,
  }, false);

  assert.equal(snapshot.stateKey, 'startup');
  assert.equal(snapshot.iTimer, 6);
});

test('moves into current-limit integration after gate is established but vds fault remains', () => {
  const snapshot = deriveSimulationState({
    ...DEFAULT_SIM_PARAMS,
    vGate: 20,
    vOut: 12,
    vSense: 14,
    vTimer: 0.4,
  }, false);

  assert.equal(snapshot.stateKey, 'warning');
  assert.equal(snapshot.iTimer, 11);
});

test('latches off once timer crosses the latch threshold in a fault window', () => {
  const snapshot = deriveSimulationState({
    ...DEFAULT_SIM_PARAMS,
    vGate: 20,
    vOut: 12,
    vSense: 14,
    vTimer: 2.1,
  }, false);

  assert.equal(snapshot.stateKey, 'fault');
  assert.match(snapshot.state, /LATCHED OFF/);
});

test('ovp fault dominates and does not rely on timer latch state', () => {
  const snapshot = deriveSimulationState({
    ...DEFAULT_SIM_PARAMS,
    vOvp: 2.4,
    vTimer: 2.2,
  }, false);

  assert.equal(snapshot.stateKey, 'fault');
  assert.match(snapshot.state, /OVP FAULT/);
});

test('automatic evolution charges timer during startup and discharges it in run state', () => {
  const startup = evolveSimulation({
    simParams: {
      ...DEFAULT_SIM_PARAMS,
      vGate: 13,
      vOut: 12,
      vTimer: 0,
    },
    hwResults: {
      C_TIMER: '66.0',
      C_GATE: '48.0',
    },
    faultLatch: false,
    deltaMs: 5,
    autoGate: false,
  });

  assert.equal(startup.snapshot.stateKey, 'startup');
  assert.ok(startup.simParams.vTimer > 0);

  const run = evolveSimulation({
    simParams: {
      ...DEFAULT_SIM_PARAMS,
      vGate: 20,
      vOut: 12,
      vSense: 12,
      vTimer: 0.8,
    },
    hwResults: {
      C_TIMER: '66.0',
      C_GATE: '48.0',
    },
    faultLatch: false,
    deltaMs: 5,
    autoGate: false,
  });

  assert.equal(run.snapshot.stateKey, 'run');
  assert.ok(run.simParams.vTimer < 0.8);
});

test('dropping enable conditions clears a previous latch during evolution', () => {
  const result = evolveSimulation({
    simParams: {
      ...DEFAULT_SIM_PARAMS,
      vIn: 4.5,
      vTimer: 2.4,
    },
    hwResults: {
      C_TIMER: '66.0',
      C_GATE: '48.0',
    },
    faultLatch: true,
    deltaMs: 5,
    autoGate: false,
  });

  assert.equal(result.snapshot.stateKey, 'blocked');
  assert.equal(result.faultLatch, false);
});

test('timer is clamped back into the restart window when startup just reaches gate enhancement', () => {
  const result = evolveSimulation({
    simParams: {
      ...DEFAULT_SIM_PARAMS,
      vGate: 16.9,
      vOut: 12,
      vTimer: 0.9,
    },
    hwResults: {
      C_TIMER: '66.0',
      C_GATE: '48.0',
    },
    faultLatch: false,
    deltaMs: 50,
    autoGate: true,
  });

  assert.equal(result.snapshot.stateKey, 'startup');
  assert.ok(result.simParams.vGate - result.simParams.vOut >= 5);
  assert.equal(result.simParams.vTimer, 0.3);
});
