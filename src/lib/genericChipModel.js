export const DEFAULT_GENERIC_PARAMS = {
  vin: 12,
  enabled: true,
  loadCurrent: 1.2,
  reversePolarity: false,
  thermalFault: false,
};

const TONE = {
  run: { fill: '#dcfce7', stroke: '#15803d', text: '#14532d' },
  fault: { fill: '#fee2e2', stroke: '#dc2626', text: '#7f1d1d' },
  warning: { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' },
  blocked: { fill: '#e2e8f0', stroke: '#64748b', text: '#334155' },
  neutral: { fill: '#f8fafc', stroke: '#94a3b8', text: '#0f172a' },
};

export function evaluateGenericChipState(chip, params) {
  if (!params.enabled) {
    return {
      stateKey: 'blocked',
      state: 'Disabled',
      detail: 'Enable is low, so the protection path is intentionally off.',
    };
  }

  if (params.thermalFault && chip.capabilities.thermalProtection) {
    return {
      stateKey: 'fault',
      state: 'Thermal shutdown',
      detail: 'The device advertises thermal protection and is being forced into shutdown.',
    };
  }

  if (params.reversePolarity) {
    return chip.capabilities.reverseProtection
      ? {
          stateKey: 'blocked',
          state: 'Reverse blocked',
          detail: 'Reverse polarity is present, but this chip profile includes reverse blocking.',
        }
      : {
          stateKey: 'fault',
          state: 'Reverse fault',
          detail: 'Reverse polarity is present and the selected chip profile does not advertise reverse blocking.',
        };
  }

  if (params.vin < chip.thresholds.vinMin) {
    return {
      stateKey: 'blocked',
      state: 'Undervoltage',
      detail: `VIN is below the mapped operating floor of ${chip.thresholds.vinMin} V.`,
    };
  }

  if (params.vin > chip.thresholds.vinMax) {
    return {
      stateKey: 'fault',
      state: 'Overvoltage',
      detail: `VIN is above the mapped operating ceiling of ${chip.thresholds.vinMax} V.`,
    };
  }

  if (params.loadCurrent > chip.thresholds.currentLimitMax) {
    return {
      stateKey: 'warning',
      state: 'Current limiting',
      detail: `Load current exceeds the mapped current limit of ${chip.thresholds.currentLimitMax} A.`,
    };
  }

  return {
    stateKey: 'run',
    state: 'Conducting',
    detail: 'VIN, enable, and load all sit inside the mapped safe operating area.',
  };
}

function topologyLabel(topology) {
  switch (topology) {
    case 'external-mosfet-controller':
      return 'Controller + External FET';
    case 'integrated-efuse':
      return 'Integrated eFuse';
    case 'ideal-diode':
      return 'Ideal Diode';
    default:
      return 'Protection Path';
  }
}

function topologyBlocks(chip, params, state, selectedId) {
  const hotspots = [
    {
      id: 'vin',
      x: 38,
      y: 96,
      w: 82,
      h: 52,
      label: 'VIN',
      value: `${params.vin.toFixed(1)} V`,
      description: 'Input supply entering the protection path.',
      focusField: 'vin',
    },
    {
      id: 'core',
      x: 216,
      y: 72,
      w: 180,
      h: 164,
      label: chip.partNumber,
      value: topologyLabel(chip.topology),
      description: chip.summary,
      focusField: null,
    },
    {
      id: 'limit',
      x: 216,
      y: 266,
      w: 112,
      h: 56,
      label: 'ILIM',
      value: `${chip.thresholds.currentLimitMax} A`,
      description: 'Mapped current-limit capability from the parsed profile.',
      focusField: 'loadCurrent',
    },
    {
      id: 'status',
      x: 354,
      y: 266,
      w: 112,
      h: 56,
      label: 'STATE',
      value: state.state,
      description: state.detail,
      focusField: 'enabled',
    },
    {
      id: 'load',
      x: 612,
      y: 96,
      w: 108,
      h: 52,
      label: 'LOAD',
      value: `${params.loadCurrent.toFixed(1)} A`,
      description: 'Simulated downstream load current.',
      focusField: 'loadCurrent',
    },
  ];

  if (chip.capabilities.reverseProtection) {
    hotspots.push({
      id: 'reverse',
      x: 454,
      y: 82,
      w: 110,
      h: 46,
      label: 'REV BLOCK',
      value: params.reversePolarity ? 'ACTIVE' : 'READY',
      description: 'Reverse-polarity or reverse-current protection path.',
      focusField: 'reversePolarity',
    });
  }

  if (chip.capabilities.thermalProtection) {
    hotspots.push({
      id: 'thermal',
      x: 454,
      y: 142,
      w: 110,
      h: 46,
      label: 'THERMAL',
      value: params.thermalFault ? 'FAULT' : 'OK',
      description: 'Thermal shutdown capability mapped from the datasheet profile.',
      focusField: 'thermalFault',
    });
  }

  return hotspots.map((hotspot) => ({
    ...hotspot,
    isSelected: hotspot.id === selectedId,
    tone:
      hotspot.id === selectedId
        ? TONE[state.stateKey] ?? TONE.neutral
        : hotspot.id === 'status'
          ? TONE[state.stateKey] ?? TONE.neutral
          : TONE.neutral,
  }));
}

export function buildGenericChipViewModel(chip, params, selectedHotspotId = 'core') {
  const state = evaluateGenericChipState(chip, params);
  const hotspots = topologyBlocks(chip, params, state, selectedHotspotId);
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? hotspots[0];
  const powerStyle =
    state.stateKey === 'run'
      ? { stroke: '#16a34a', width: 6, dasharray: undefined }
      : state.stateKey === 'warning'
        ? { stroke: '#d97706', width: 5, dasharray: undefined }
        : state.stateKey === 'fault'
          ? { stroke: '#9ca3af', width: 5, dasharray: '8 6' }
          : { stroke: '#64748b', width: 4, dasharray: '6 4' };

  return {
    chip,
    state,
    hotspots,
    selectedHotspot,
    nets: [
      { id: 'left', path: 'M 120 122 L 216 122', style: powerStyle },
      { id: 'right', path: 'M 396 122 L 612 122', style: powerStyle },
      { id: 'sense', path: 'M 272 236 L 272 266', style: { stroke: '#2563eb', width: 4 } },
      { id: 'state', path: 'M 396 200 L 410 200 L 410 266', style: { stroke: '#64748b', width: 3, dasharray: '5 5' } },
    ],
  };
}

export function verifyGenericCatalogEntries(entries) {
  const issues = [];

  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      ok: false,
      issues: ['Catalog is empty'],
    };
  }

  const ids = new Set();

  for (const chip of entries) {
    if (ids.has(chip.id)) {
      issues.push(`Duplicate chip id: ${chip.id}`);
    }
    ids.add(chip.id);

    if (!chip.productUrl || !chip.datasheetUrl) {
      issues.push(`Chip ${chip.id} is missing source URLs`);
    }

    if (!chip.thresholds || chip.thresholds.vinMax <= chip.thresholds.vinMin) {
      issues.push(`Chip ${chip.id} has invalid voltage thresholds`);
    }

    const state = evaluateGenericChipState(chip, DEFAULT_GENERIC_PARAMS);
    if (!state.state || !state.stateKey) {
      issues.push(`Chip ${chip.id} did not produce a state`);
    }

    const viewModel = buildGenericChipViewModel(chip, DEFAULT_GENERIC_PARAMS);
    if (!viewModel.hotspots.length || !viewModel.nets.length) {
      issues.push(`Chip ${chip.id} did not produce a view model`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
