export const SIM_THRESHOLDS = {
  vinPor: 5.1,
  enDisable: 0.5,
  enEnable: 2.0,
  uvloEnable: 1.6,
  ovpTrip: 2.0,
  gateEnhanced: 5.0,
  timerRestart: 0.3,
  timerLatch: 2.0,
  timerMax: 3.0,
  gateHeadroom: 12.0,
};

export const DEFAULT_SIM_PARAMS = {
  vIn: 12.0,
  vEn: 5.0,
  vUvlo: 2.0,
  vOvp: 0.0,
  vSense: 12.0,
  vOut: 12.0,
  vGate: 24.0,
  vTimer: 0.3,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseCapacitance(value, fallback) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function integrateVoltage(currentUa, capacitanceNf, deltaMs) {
  if (!capacitanceNf || !deltaMs) {
    return 0;
  }

  return (currentUa * deltaMs) / capacitanceNf;
}

export function deriveSimulationState(simParams, faultLatch) {
  const { vIn, vEn, vUvlo, vOvp, vSense, vOut, vGate, vTimer } = simParams;

  const porReady = vIn >= SIM_THRESHOLDS.vinPor;
  const enDisabled = vEn < SIM_THRESHOLDS.enDisable;
  const enReady = vEn >= SIM_THRESHOLDS.enEnable;
  const uvloReady = vUvlo >= SIM_THRESHOLDS.uvloEnable;
  const ovpFault = vOvp >= SIM_THRESHOLDS.ovpTrip;
  const gateEnhanced = (vGate - vOut) >= SIM_THRESHOLDS.gateEnhanced;
  const vdsFault = vSense > vOut;
  const timerExpired = vTimer >= SIM_THRESHOLDS.timerLatch;
  const timerRestartWindow = vTimer <= SIM_THRESHOLDS.timerRestart;
  const latchActive = porReady && enReady && uvloReady && (faultLatch || (!ovpFault && timerExpired));

  const activeConditions = [
    porReady ? `VIN >= ${SIM_THRESHOLDS.vinPor}V` : `VIN < ${SIM_THRESHOLDS.vinPor}V`,
    enReady ? `EN >= ${SIM_THRESHOLDS.enEnable}V` : `EN < ${SIM_THRESHOLDS.enEnable}V`,
    uvloReady ? `UVLO >= ${SIM_THRESHOLDS.uvloEnable}V` : `UVLO < ${SIM_THRESHOLDS.uvloEnable}V`,
    ovpFault ? `OVP >= ${SIM_THRESHOLDS.ovpTrip}V` : 'OVP normal',
    gateEnhanced
      ? `GATE-OUT >= ${SIM_THRESHOLDS.gateEnhanced}V`
      : `GATE-OUT < ${SIM_THRESHOLDS.gateEnhanced}V`,
    vdsFault ? 'VSENSE > VOUT' : 'VSENSE <= VOUT',
    timerExpired ? `TIMER >= ${SIM_THRESHOLDS.timerLatch}V` : `TIMER < ${SIM_THRESHOLDS.timerLatch}V`,
  ];

  if (!porReady) {
    return {
      stateKey: 'blocked',
      state: 'POWER-ON RESET (输入未达 UVLO/POR)',
      detail: 'VIN 还没到约 5.1V，LM5060 保持关断，内部逻辑不进入软启动。',
      resetHint: '先把 VIN 拉到 POR 门限以上，再看 EN / UVLO 是否允许启动。',
      iGate: -2200,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (enDisabled) {
    return {
      stateKey: 'blocked',
      state: 'DISABLED (EN 明确拉低)',
      detail: 'EN 低于约 0.5V，器件处于关闭态，GATE 被主动拉低。',
      resetHint: '把 EN 提到约 2.0V 以上，器件才会真正进入启动判断。',
      iGate: -2200,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (!enReady) {
    return {
      stateKey: 'blocked',
      state: 'STANDBY (EN 未过启动门限)',
      detail: 'EN 处在 0.5V 到 2.0V 之间，芯片还不会开始给 GATE 充电。',
      resetHint: '继续抬高 EN，跨过约 2.0V 之后才会进入软启动阶段。',
      iGate: -2200,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (!uvloReady) {
    return {
      stateKey: 'blocked',
      state: 'STANDBY (UVLO 阻止导通)',
      detail: 'EN 已经允许，但 UVLO 引脚还没高过约 1.6V，器件保持待机。',
      resetHint: '把 UVLO 拉到阈值之上，才能进入正常启动流程。',
      iGate: -2200,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (ovpFault) {
    return {
      stateKey: 'fault',
      state: 'OVP FAULT (过压关断)',
      detail: 'OVP 高于约 2.0V 时，LM5060 直接把 GATE 以大电流拉低；这不是 TIMER 锁存，OVP 消失后可恢复。',
      resetHint: '先把 OVP 降回门限以下，再重新观察 EN / UVLO / TIMER 状态。',
      iGate: -80000,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (latchActive) {
    return {
      stateKey: 'fault',
      state: 'LATCHED OFF (TIMER 超过 2V)',
      detail: 'TIMER 已达到锁存门限，器件进入故障锁死并强力拉低 GATE。',
      resetHint: '按手册要把 EN、UVLO 或 VIN 拉低后再恢复，才能清掉锁存。',
      iGate: -80000,
      iTimer: -6000,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  if (!gateEnhanced) {
    return {
      stateKey: 'startup',
      state: 'STARTUP PHASE 1 (GATE 软启动充电)',
      detail: 'GATE-OUT 还没到约 5V，芯片用 24uA 给 GATE 充电，同时 TIMER 走 6uA 启动计时。',
      resetHint: '当 GATE-OUT 超过约 5V 后，TIMER 会先被拉回约 0.3V，再进入后续 VDS 监控窗口。',
      iGate: 24,
      iTimer: 6,
      npgd: vdsFault ? 'HIGH-Z (高阻)' : 'LOW (正常)',
      activeConditions,
    };
  }

  if (vdsFault) {
    return {
      stateKey: 'warning',
      state: 'CURRENT LIMIT WINDOW (VDS 故障积分)',
      detail: 'GATE 已经建立，但 VSENSE 仍高于 VOUT。此时 TIMER 应按 11uA 继续累计，超过 2V 会锁死关断。',
      resetHint: timerRestartWindow
        ? '当前更接近手册里的 0.3V 重启动作起点；若故障持续，TIMER 会继续往 2V 走。'
        : '如果不想进锁存，必须在 TIMER 涨到 2V 前让 VSENSE 回到 VOUT 以下。',
      iGate: 24,
      iTimer: 11,
      npgd: 'HIGH-Z (高阻)',
      activeConditions,
    };
  }

  return {
    stateKey: 'run',
    state: 'RUN PHASE (稳态导通)',
    detail: 'EN、UVLO、VIN 都满足，GATE 已经抬起，且 VSENSE 没再报告 VDS 故障，输出处于 power-good。',
    resetHint: '此状态下 TIMER 会被快速放电；若之后出现 VDS 故障，会重新进入 11uA 积分窗口。',
    iGate: 24,
    iTimer: -6000,
    npgd: 'LOW (正常)',
    activeConditions,
  };
}

export function evolveSimulation({
  simParams,
  hwResults,
  faultLatch,
  deltaMs,
  autoGate = true,
}) {
  const snapshot = deriveSimulationState(simParams, faultLatch);
  const timerCapNf = parseCapacitance(hwResults?.C_TIMER, 66);
  const gateCapNf = parseCapacitance(hwResults?.C_GATE, 47);

  let nextTimer = clamp(
    simParams.vTimer + integrateVoltage(snapshot.iTimer, timerCapNf, deltaMs),
    0,
    SIM_THRESHOLDS.timerMax,
  );
  let nextGate = simParams.vGate;

  if (autoGate) {
    const gateTarget =
      snapshot.stateKey === 'blocked' || snapshot.stateKey === 'fault'
        ? simParams.vOut
        : simParams.vOut + SIM_THRESHOLDS.gateHeadroom;
    const gateDelta = integrateVoltage(snapshot.iGate, gateCapNf, deltaMs);

    if (snapshot.iGate >= 0) {
      nextGate = clamp(simParams.vGate + gateDelta, 0, gateTarget);
    } else {
      nextGate = clamp(simParams.vGate + gateDelta, 0, Math.max(gateTarget, simParams.vOut));
    }
  }

  const gateJustEnhanced =
    snapshot.stateKey === 'startup' && (nextGate - simParams.vOut) >= SIM_THRESHOLDS.gateEnhanced;

  if (gateJustEnhanced) {
    nextTimer = Math.min(nextTimer, SIM_THRESHOLDS.timerRestart);
  }

  const nextFaultLatch =
    snapshot.stateKey === 'fault' && snapshot.state.includes('LATCHED OFF')
      ? true
      : snapshot.stateKey === 'blocked'
        ? false
        : nextTimer >= SIM_THRESHOLDS.timerLatch && !(
            simParams.vOvp >= SIM_THRESHOLDS.ovpTrip
          );

  return {
    simParams: {
      ...simParams,
      vGate: Number(nextGate.toFixed(3)),
      vTimer: Number(nextTimer.toFixed(3)),
    },
    faultLatch: nextFaultLatch,
    snapshot,
  };
}

export function formatGateCurrent(current) {
  return current > 0 ? `+${current} μA (充电)` : `${Math.abs(current) / 1000} mA (拉低)`;
}

export function formatTimerCurrent(current) {
  return current > 0 ? `+${current} μA (累计)` : '快速放电';
}
