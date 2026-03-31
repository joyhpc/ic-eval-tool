import { DEFAULT_HW_PARAMS, computeHardwareResults } from './lm5060Hardware.js';
import { DEFAULT_SIM_PARAMS, deriveSimulationState, evolveSimulation } from './lm5060.js';

const HOTSPOT_TONE = {
  run: {
    fill: '#dcfce7',
    stroke: '#15803d',
    text: '#14532d',
  },
  fault: {
    fill: '#fee2e2',
    stroke: '#dc2626',
    text: '#7f1d1d',
  },
  warning: {
    fill: '#fef3c7',
    stroke: '#d97706',
    text: '#78350f',
  },
  startup: {
    fill: '#dbeafe',
    stroke: '#2563eb',
    text: '#1e3a8a',
  },
  blocked: {
    fill: '#e5e7eb',
    stroke: '#64748b',
    text: '#334155',
  },
  neutral: {
    fill: '#f8fafc',
    stroke: '#94a3b8',
    text: '#0f172a',
  },
};

export const LM5060_MODULE_DEFINITION = {
  id: 'lm5060',
  name: 'LM5060 High-Side Protection Controller',
  description: 'A simplified, interactive module schematic intended for evaluation and explanation.',
  focusableFields: [
    'vinMin',
    'vinMax',
    'iLimit',
    'rdsOn',
    'ocpDelay',
    'dvdt',
    'vIn',
    'vEn',
    'vUvlo',
    'vOvp',
    'vSense',
    'vOut',
    'vGate',
    'vTimer',
  ],
  hotspots: [
    {
      id: 'vin',
      kind: 'source',
      x: 36,
      y: 82,
      w: 68,
      h: 46,
      label: 'VIN',
      description: 'Input supply feeding the hot-swap path.',
      focusField: 'vIn',
      detail: ({ simParams }) => `${simParams.vIn.toFixed(1)} V live input`,
    },
    {
      id: 'uvlo-divider',
      kind: 'network',
      x: 36,
      y: 196,
      w: 110,
      h: 58,
      label: 'R10 / R11',
      description: 'UVLO divider that decides when the controller is allowed to start.',
      focusField: 'vinMin',
      detail: ({ hwResults }) => `R10 ${hwResults.R10} kΩ / R11 10.0 kΩ`,
    },
    {
      id: 'ovp-divider',
      kind: 'network',
      x: 36,
      y: 274,
      w: 110,
      h: 58,
      label: 'R8 / R9',
      description: 'OVP divider that trips the controller during over-voltage conditions.',
      focusField: 'vinMax',
      detail: ({ hwResults }) => `R8 ${hwResults.R8} kΩ / R9 10.0 kΩ`,
    },
    {
      id: 'controller',
      kind: 'controller',
      x: 210,
      y: 62,
      w: 180,
      h: 250,
      label: 'LM5060',
      description: 'Controller core. It interprets EN, UVLO, OVP, SENSE and TIMER to drive Q1.',
      detail: ({ simResults }) => simResults.state,
    },
    {
      id: 'en-pin',
      kind: 'pin',
      x: 170,
      y: 94,
      w: 32,
      h: 24,
      label: 'EN',
      description: 'Enable input. Pulling this low is the primary reset path for latch-off.',
      focusField: 'vEn',
      detail: ({ simParams }) => `${simParams.vEn.toFixed(1)} V`,
    },
    {
      id: 'uvlo-pin',
      kind: 'pin',
      x: 170,
      y: 142,
      w: 32,
      h: 24,
      label: 'UVLO',
      description: 'Undervoltage threshold input derived from the UVLO divider.',
      focusField: 'vUvlo',
      detail: ({ simParams }) => `${simParams.vUvlo.toFixed(1)} V`,
    },
    {
      id: 'ovp-pin',
      kind: 'pin',
      x: 170,
      y: 190,
      w: 32,
      h: 24,
      label: 'OVP',
      description: 'Overvoltage input. Crossing the threshold forces an immediate turn-off.',
      focusField: 'vOvp',
      detail: ({ simParams }) => `${simParams.vOvp.toFixed(1)} V`,
    },
    {
      id: 'sense-pin',
      kind: 'pin',
      x: 398,
      y: 126,
      w: 32,
      h: 24,
      label: 'SENSE',
      description: 'Drain-source monitor. It decides whether TIMER should keep integrating.',
      focusField: 'vSense',
      detail: ({ simParams }) => `${simParams.vSense.toFixed(1)} V`,
    },
    {
      id: 'timer-cap',
      kind: 'capacitor',
      x: 218,
      y: 332,
      w: 78,
      h: 52,
      label: 'C_TIMER',
      description: 'Fault timer capacitor. It integrates 6 µA during startup and 11 µA during fault timing.',
      focusField: 'ocpDelay',
      detail: ({ hwResults, simParams }) => `${hwResults.C_TIMER} nF / ${simParams.vTimer.toFixed(2)} V`,
    },
    {
      id: 'gate-cap',
      kind: 'capacitor',
      x: 462,
      y: 232,
      w: 82,
      h: 52,
      label: 'C_GATE',
      description: 'Soft-start gate capacitor shaping Q1 turn-on speed.',
      focusField: 'dvdt',
      detail: ({ hwResults, simParams }) => `${hwResults.C_GATE} nF / ${simParams.vGate.toFixed(1)} V`,
    },
    {
      id: 'sense-resistor',
      kind: 'network',
      x: 462,
      y: 146,
      w: 88,
      h: 52,
      label: 'R_SENSE',
      description: 'Sense path equivalent used by the simulator to estimate VDS short-circuit behavior.',
      focusField: 'iLimit',
      detail: ({ hwResults }) => `${hwResults.Rs} Ω / ${hwResults.V_DSTH} mV`,
    },
    {
      id: 'mosfet',
      kind: 'mosfet',
      x: 566,
      y: 84,
      w: 70,
      h: 116,
      label: 'Q1',
      description: 'External pass MOSFET controlled by the LM5060 gate driver.',
      focusField: 'rdsOn',
      detail: ({ hwParams, simParams }) => `RDS(on) ${hwParams.rdsOn.toFixed(1)} mΩ / VGS ${(simParams.vGate - simParams.vOut).toFixed(1)} V`,
    },
    {
      id: 'vout',
      kind: 'load',
      x: 672,
      y: 92,
      w: 90,
      h: 54,
      label: 'VOUT / LOAD',
      description: 'Protected output seen by the downstream load.',
      focusField: 'vOut',
      detail: ({ simParams }) => `${simParams.vOut.toFixed(1)} V`,
    },
    {
      id: 'pgd-pin',
      kind: 'pin',
      x: 398,
      y: 254,
      w: 32,
      h: 24,
      label: 'PGD',
      description: 'Power-good flag. Low means output is good, high-Z means fault or startup.',
      focusField: 'vOut',
      detail: ({ simResults }) => simResults.npgd,
    },
  ],
  nets: [
    { id: 'vin-bus', role: 'power', points: [[104, 105], [210, 105]] },
    { id: 'uvlo-wire', role: 'sense', points: [[146, 225], [170, 225], [170, 154], [210, 154]] },
    { id: 'ovp-wire', role: 'sense', points: [[146, 303], [170, 303], [170, 202], [210, 202]] },
    { id: 'en-wire', role: 'control', points: [[104, 105], [124, 105], [124, 106], [170, 106]] },
    { id: 'gate-wire', role: 'gate', points: [[390, 226], [462, 226], [462, 258], [566, 258], [566, 142]] },
    { id: 'sense-wire', role: 'sense', points: [[430, 138], [462, 138], [462, 172], [566, 172]] },
    { id: 'power-path', role: 'power', points: [[636, 105], [672, 105]] },
    { id: 'timer-wire', role: 'timer', points: [[256, 312], [256, 332]] },
    { id: 'pgd-wire', role: 'pgd', points: [[390, 266], [672, 266], [672, 146]] },
  ],
  scenarios: [
    {
      id: 'startup',
      label: 'Startup charge',
      simParams: { ...DEFAULT_SIM_PARAMS, vGate: 13.2, vOut: 12, vTimer: 0.15 },
      faultLatch: false,
      expectedStateKey: 'startup',
      expectedHotspot: 'gate-cap',
    },
    {
      id: 'run',
      label: 'Normal run',
      simParams: { ...DEFAULT_SIM_PARAMS, vGate: 24, vOut: 12, vSense: 12, vTimer: 0.2 },
      faultLatch: false,
      expectedStateKey: 'run',
      expectedHotspot: 'vout',
    },
    {
      id: 'fault-window',
      label: 'Current limit timing',
      simParams: { ...DEFAULT_SIM_PARAMS, vGate: 20, vOut: 12, vSense: 14, vTimer: 1.1 },
      faultLatch: false,
      expectedStateKey: 'warning',
      expectedHotspot: 'sense-resistor',
    },
    {
      id: 'latched-off',
      label: 'Timer latch-off',
      simParams: { ...DEFAULT_SIM_PARAMS, vGate: 20, vOut: 12, vSense: 14, vTimer: 2.2 },
      faultLatch: false,
      expectedStateKey: 'fault',
      expectedHotspot: 'timer-cap',
    },
  ],
};

function pointsToPath(points) {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

function roleTone(role, simResults) {
  const stateTone = HOTSPOT_TONE[simResults.stateKey] ?? HOTSPOT_TONE.neutral;

  if (role === 'power') {
    if (simResults.stateKey === 'run') {
      return { stroke: '#16a34a', width: 6, dasharray: undefined };
    }

    if (simResults.stateKey === 'fault') {
      return { stroke: '#9ca3af', width: 5, dasharray: '10 8' };
    }

    if (simResults.stateKey === 'startup') {
      return { stroke: '#3b82f6', width: 5, dasharray: undefined };
    }
  }

  if (role === 'timer') {
    return simResults.iTimer > 0
      ? { stroke: '#d97706', width: 4, dasharray: undefined }
      : { stroke: '#94a3b8', width: 3, dasharray: '5 5' };
  }

  if (role === 'gate') {
    return simResults.stateKey === 'fault'
      ? { stroke: '#ef4444', width: 4, dasharray: '7 5' }
      : { stroke: '#2563eb', width: 4, dasharray: undefined };
  }

  if (role === 'pgd') {
    return simResults.npgd.includes('正常')
      ? { stroke: '#16a34a', width: 4, dasharray: undefined }
      : { stroke: '#a1a1aa', width: 3, dasharray: '6 5' };
  }

  return { stroke: stateTone.stroke, width: 3, dasharray: undefined };
}

function hotspotTone(hotspot, selectedId, simResults) {
  if (selectedId === hotspot.id) {
    return HOTSPOT_TONE[simResults.stateKey] ?? HOTSPOT_TONE.neutral;
  }

  if (
    (hotspot.id === 'timer-cap' && simResults.iTimer > 0) ||
    (hotspot.id === 'mosfet' && simResults.stateKey === 'fault') ||
    (hotspot.id === 'vout' && simResults.stateKey === 'run') ||
    (hotspot.id === 'sense-resistor' && simResults.stateKey === 'warning')
  ) {
    return HOTSPOT_TONE[simResults.stateKey] ?? HOTSPOT_TONE.neutral;
  }

  return HOTSPOT_TONE.neutral;
}

export function buildLm5060SchematicViewModel({
  hwParams = DEFAULT_HW_PARAMS,
  hwResults = computeHardwareResults(hwParams),
  simParams = DEFAULT_SIM_PARAMS,
  simResults = deriveSimulationState(simParams, false),
  faultLatch = false,
  selectedHotspotId,
}) {
  const resolvedSelection = selectedHotspotId ?? 'controller';
  const selectedHotspot =
    LM5060_MODULE_DEFINITION.hotspots.find((hotspot) => hotspot.id === resolvedSelection) ??
    LM5060_MODULE_DEFINITION.hotspots[0];

  return {
    module: LM5060_MODULE_DEFINITION,
    selectedHotspot,
    nets: LM5060_MODULE_DEFINITION.nets.map((net) => ({
      ...net,
      path: pointsToPath(net.points),
      style: roleTone(net.role, simResults),
    })),
    hotspots: LM5060_MODULE_DEFINITION.hotspots.map((hotspot) => ({
      ...hotspot,
      tone: hotspotTone(hotspot, resolvedSelection, simResults),
      value: hotspot.detail({ hwParams, hwResults, simParams, simResults, faultLatch }),
      isSelected: hotspot.id === resolvedSelection,
    })),
    inspector: {
      title: selectedHotspot.label,
      description: selectedHotspot.description,
      value: selectedHotspot.detail({ hwParams, hwResults, simParams, simResults, faultLatch }),
      focusField: selectedHotspot.focusField ?? null,
      stateSummary: simResults.state,
      stateKey: simResults.stateKey,
    },
  };
}

export function verifyLm5060ModuleDefinition() {
  const issues = [];
  const hotspotIds = new Set();
  const netIds = new Set();

  for (const hotspot of LM5060_MODULE_DEFINITION.hotspots) {
    if (hotspotIds.has(hotspot.id)) {
      issues.push(`Duplicate hotspot id: ${hotspot.id}`);
    }
    hotspotIds.add(hotspot.id);

    if (!hotspot.label || !hotspot.description) {
      issues.push(`Hotspot ${hotspot.id} is missing label or description`);
    }

    if (hotspot.focusField && !LM5060_MODULE_DEFINITION.focusableFields.includes(hotspot.focusField)) {
      issues.push(`Hotspot ${hotspot.id} references unknown focus field ${hotspot.focusField}`);
    }
  }

  for (const net of LM5060_MODULE_DEFINITION.nets) {
    if (netIds.has(net.id)) {
      issues.push(`Duplicate net id: ${net.id}`);
    }
    netIds.add(net.id);

    if (!Array.isArray(net.points) || net.points.length < 2) {
      issues.push(`Net ${net.id} does not have enough points`);
    }
  }

  const scenarioResults = LM5060_MODULE_DEFINITION.scenarios.map((scenario) => {
    const simResults = deriveSimulationState(scenario.simParams, scenario.faultLatch);
    const hwResults = computeHardwareResults(DEFAULT_HW_PARAMS);
    const viewModel = buildLm5060SchematicViewModel({
      hwParams: DEFAULT_HW_PARAMS,
      hwResults,
      simParams: scenario.simParams,
      simResults,
      faultLatch: scenario.faultLatch,
      selectedHotspotId: scenario.expectedHotspot,
    });
    const evolution = evolveSimulation({
      simParams: scenario.simParams,
      hwResults,
      faultLatch: scenario.faultLatch,
      deltaMs: 25,
      autoGate: true,
    });

    if (simResults.stateKey !== scenario.expectedStateKey) {
      issues.push(
        `Scenario ${scenario.id} expected ${scenario.expectedStateKey} but got ${simResults.stateKey}`,
      );
    }

    if (viewModel.selectedHotspot.id !== scenario.expectedHotspot) {
      issues.push(`Scenario ${scenario.id} did not resolve hotspot ${scenario.expectedHotspot}`);
    }

    return {
      id: scenario.id,
      label: scenario.label,
      stateKey: simResults.stateKey,
      selectedHotspot: viewModel.selectedHotspot.id,
      nextTimer: evolution.simParams.vTimer,
      nextGate: evolution.simParams.vGate,
    };
  });

  return {
    ok: issues.length === 0,
    issues,
    hotspotCount: LM5060_MODULE_DEFINITION.hotspots.length,
    netCount: LM5060_MODULE_DEFINITION.nets.length,
    scenarioResults,
  };
}
