export const DEFAULT_HW_PARAMS = {
  vinMin: 9.0,
  vinMax: 36.0,
  iLimit: 30.0,
  rdsOn: 5.0,
  ocpDelay: 12.0,
  dvdt: 0.5,
};

export const LM5060_HW_CONSTANTS = {
  ovpThreshold: 2.0,
  uvloThreshold: 1.6,
  uvloBiasMilliAmp: 0.0055,
  dividerBottomKiloOhm: 10,
  timerChargeMicroAmp: 11,
  timerTripVoltage: 2.0,
  gateChargeMicroAmp: 24,
  senseCurrentMicroAmp: 16,
  reverseCompMicroAmp: 8,
  reverseCompOhm: 10_000,
};

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

export function computeHardwareResults(hwParams) {
  const { vinMin, vinMax, iLimit, rdsOn, ocpDelay, dvdt } = hwParams;
  const {
    ovpThreshold,
    uvloThreshold,
    uvloBiasMilliAmp,
    dividerBottomKiloOhm,
    timerChargeMicroAmp,
    timerTripVoltage,
    gateChargeMicroAmp,
    senseCurrentMicroAmp,
    reverseCompMicroAmp,
    reverseCompOhm,
  } = LM5060_HW_CONSTANTS;
  const r8 = dividerBottomKiloOhm * (vinMax - ovpThreshold) / ovpThreshold;
  const r10 = (vinMin - uvloThreshold) / (uvloBiasMilliAmp + (uvloThreshold / dividerBottomKiloOhm));
  const cTimer = (ocpDelay * timerChargeMicroAmp) / timerTripVoltage;
  const vDsth = iLimit * (rdsOn / 1000);
  const rs = (vDsth / (senseCurrentMicroAmp * 1e-6))
    + ((reverseCompOhm * reverseCompMicroAmp * 1e-6) / (senseCurrentMicroAmp * 1e-6));
  const cGate = gateChargeMicroAmp / dvdt;

  return {
    R8: r8 > 0 ? r8.toFixed(2) : '0.00',
    R10: r10 > 0 ? r10.toFixed(2) : '0.00',
    C_TIMER: cTimer.toFixed(1),
    Rs: rs.toFixed(2),
    C_GATE: cGate.toFixed(1),
    V_DSTH: (vDsth * 1000).toFixed(1),
    raw: {
      R8: round(Math.max(r8, 0), 4),
      R10: round(Math.max(r10, 0), 4),
      C_TIMER: round(cTimer, 4),
      Rs: round(rs, 4),
      C_GATE: round(cGate, 4),
      V_DSTH: round(vDsth * 1000, 4),
    },
  };
}

export function buildLm5060HardwareInsightModel(hwParams, selectedInsightId = 'uvlo') {
  const hwResults = computeHardwareResults(hwParams);
  const { vinMin, vinMax, iLimit, rdsOn, ocpDelay, dvdt } = hwParams;
  const {
    dividerBottomKiloOhm,
    uvloThreshold,
    ovpThreshold,
    timerChargeMicroAmp,
    timerTripVoltage,
    gateChargeMicroAmp,
    senseCurrentMicroAmp,
    reverseCompMicroAmp,
  } = LM5060_HW_CONSTANTS;

  const uvloRatio = uvloThreshold / vinMin;
  const ovpRatio = ovpThreshold / vinMax;
  const timerSlew = timerTripVoltage / ocpDelay;
  const gateRampMicroFarad = hwResults.raw.C_GATE / 1000;
  const timerCapMicroFarad = hwResults.raw.C_TIMER / 1000;
  const vdsDropMilliVolt = hwResults.raw.V_DSTH;
  const currentDensity = round(vdsDropMilliVolt / iLimit, 4);

  const insights = [
    {
      id: 'uvlo',
      title: 'UVLO 分压链',
      focusField: 'vinMin',
      recommendedValue: `${hwResults.R10} kΩ`,
      blockLabel: 'UVLO Comparator',
      effect: '把最低输入工作电压映射成 UVLO 引脚的 1.6V 启动门限。',
      summary: `当 VIN 到 ${vinMin.toFixed(1)}V 时，R10/R11 会把 UVLO pin 拉到约 ${uvloThreshold.toFixed(2)}V。`,
      checkpoints: [
        `R11 固定 ${dividerBottomKiloOhm} kΩ，R10 计算为 ${hwResults.R10} kΩ`,
        `引脚分压比约 ${round(uvloRatio, 4)}，说明 1V 输入变化会被缩成 ${round(uvloRatio * 1000, 1)} mV pin 变化`,
        `这条链路决定芯片何时离开待机并允许 GATE 进入软启动`,
      ],
      formula: 'R10 = (VIN_MIN - VUVLO) / (IBIAS + VUVLO / R11)',
      architectureFlow: ['vin-window', 'uvlo-divider', 'uvlo-comparator', 'startup-gate'],
      tone: 'blue',
    },
    {
      id: 'ovp',
      title: 'OVP 分压链',
      focusField: 'vinMax',
      recommendedValue: `${hwResults.R8} kΩ`,
      blockLabel: 'OVP Comparator',
      effect: '把最高可接受输入电压映射成 OVP 引脚的 2.0V 关断门限。',
      summary: `当 VIN 到 ${vinMax.toFixed(1)}V 时，R8/R9 会把 OVP pin 拉到约 ${ovpThreshold.toFixed(2)}V。`,
      checkpoints: [
        `R9 固定 ${dividerBottomKiloOhm} kΩ，R8 计算为 ${hwResults.R8} kΩ`,
        `引脚分压比约 ${round(ovpRatio, 4)}，说明输入过压会先被 OVP 比较器截获`,
        '一旦这条链路触发，芯片会优先强力拉低 GATE，不等 TIMER 积分完成',
      ],
      formula: 'R8 = R9 × (VIN_MAX - VOVP) / VOVP',
      architectureFlow: ['vin-window', 'ovp-divider', 'ovp-comparator', 'fault-pulldown'],
      tone: 'red',
    },
    {
      id: 'sense',
      title: 'SENSE / VDS 检测链',
      focusField: 'iLimit',
      recommendedValue: `${hwResults.Rs} Ω`,
      blockLabel: 'VDS Sense Amplifier',
      effect: '把目标限流点映射成 SENSE 检测网络，决定什么时候进入故障积分窗口。',
      summary: `${iLimit.toFixed(1)}A 与 ${rdsOn.toFixed(1)}mΩ 会得到约 ${vdsDropMilliVolt.toFixed(1)}mV 的 VDS 目标压降。`,
      checkpoints: [
        `主检测电流源 ${senseCurrentMicroAmp} µA，反接补偿电流 ${reverseCompMicroAmp} µA`,
        `Rs 计算结果 ${hwResults.Rs} Ω，其中已包含 Ro = 10kΩ 的补偿项`,
        `每安培允许的检测压降约 ${currentDensity.toFixed(2)} mV/A，决定何时从 RUN 转入 VDS fault timing`,
      ],
      formula: 'RS = VDS_TH / 16µA + (RO × 8µA) / 16µA',
      architectureFlow: ['load-path', 'sense-amp', 'timer-source', 'fault-latch'],
      tone: 'amber',
    },
    {
      id: 'timer',
      title: 'TIMER 故障容忍链',
      focusField: 'ocpDelay',
      recommendedValue: `${hwResults.C_TIMER} nF`,
      blockLabel: '11µA Fault Timer Source',
      effect: '把允许故障持续的时间窗口映射成 TIMER 电容，决定多久进入 latch-off。',
      summary: `设置 ${ocpDelay.toFixed(1)}ms 容忍时间时，${timerChargeMicroAmp}µA 电流需要把 TIMER 电容充到 ${timerTripVoltage.toFixed(1)}V。`,
      checkpoints: [
        `${timerChargeMicroAmp}µA 电流源会在故障窗口里把 TIMER 从 0V 推向 ${timerTripVoltage.toFixed(1)}V`,
        `推荐 C_TIMER = ${hwResults.C_TIMER} nF (${timerCapMicroFarad.toFixed(4)} µF)`,
        `TIMER 的平均充电斜率约 ${timerSlew.toFixed(3)} V/ms`,
        '这条链路只在启动期或 VDS 故障窗口中积分，正常 RUN 会被快速放电',
      ],
      formula: 'C_TIMER = T_DELAY × I_TIMER / V_TRIP',
      architectureFlow: ['sense-amp', 'timer-source', 'timer-cap', 'fault-latch'],
      tone: 'amber',
    },
    {
      id: 'gate',
      title: 'GATE 软启动链',
      focusField: 'dvdt',
      recommendedValue: `${hwResults.C_GATE} nF`,
      blockLabel: '24µA Gate Charge Source',
      effect: '把目标输出爬升速度映射成 GATE 电容，决定 MOSFET 何时被完全增强。',
      summary: `希望输出以 ${dvdt.toFixed(2)}V/ms 上升时，${gateChargeMicroAmp}µA 的 GATE 电流对应约 ${hwResults.C_GATE}nF 电容。`,
      checkpoints: [
        `推荐 C_GATE = ${hwResults.C_GATE} nF (${gateRampMicroFarad.toFixed(4)} µF)`,
        `GATE 充电电流固定在约 ${gateChargeMicroAmp} µA，所以 dv/dt 与外部电容近似成反比`,
        '这条链路直接决定启动时的 inrush 控制，也决定何时跨过 GATE-OUT 约 5V 的阶段切换点',
      ],
      formula: 'C_GATE = I_GATE / dVdt',
      architectureFlow: ['startup-gate', 'gate-source', 'gate-cap', 'mosfet'],
      tone: 'green',
    },
  ];

  const selectedInsight = insights.find((insight) => insight.id === selectedInsightId) ?? insights[0];
  const activeFlow = new Set(selectedInsight.architectureFlow);

  const architectureNodes = [
    { id: 'vin-window', x: 40, y: 42, w: 112, h: 48, label: 'VIN Window', caption: `${vinMin.toFixed(1)}V to ${vinMax.toFixed(1)}V` },
    { id: 'uvlo-divider', x: 40, y: 116, w: 112, h: 48, label: 'R10 / R11', caption: `${hwResults.R10}k / 10k` },
    { id: 'ovp-divider', x: 40, y: 190, w: 112, h: 48, label: 'R8 / R9', caption: `${hwResults.R8}k / 10k` },
    { id: 'load-path', x: 40, y: 264, w: 112, h: 48, label: 'MOSFET + Load', caption: `${iLimit.toFixed(1)}A @ ${rdsOn.toFixed(1)}mΩ` },
    { id: 'uvlo-comparator', x: 214, y: 116, w: 140, h: 48, label: 'UVLO Comparator', caption: `${uvloThreshold.toFixed(1)}V threshold` },
    { id: 'ovp-comparator', x: 214, y: 190, w: 140, h: 48, label: 'OVP Comparator', caption: `${ovpThreshold.toFixed(1)}V threshold` },
    { id: 'sense-amp', x: 214, y: 264, w: 140, h: 48, label: 'VDS Sense Amp', caption: `${hwResults.V_DSTH}mV target` },
    { id: 'startup-gate', x: 214, y: 42, w: 140, h: 48, label: 'Startup Logic', caption: 'Enable + POR path' },
    { id: 'timer-source', x: 416, y: 190, w: 140, h: 48, label: '11µA Timer Source', caption: `${ocpDelay.toFixed(1)}ms budget` },
    { id: 'timer-cap', x: 416, y: 264, w: 140, h: 48, label: 'C_TIMER', caption: `${hwResults.C_TIMER}nF` },
    { id: 'gate-source', x: 416, y: 42, w: 140, h: 48, label: '24µA Gate Source', caption: `${dvdt.toFixed(2)}V/ms target` },
    { id: 'gate-cap', x: 416, y: 116, w: 140, h: 48, label: 'C_GATE', caption: `${hwResults.C_GATE}nF` },
    { id: 'fault-latch', x: 618, y: 226, w: 120, h: 52, label: 'Fault Latch', caption: `${timerTripVoltage.toFixed(1)}V trip` },
    { id: 'fault-pulldown', x: 618, y: 144, w: 120, h: 52, label: 'GATE Pull-down', caption: 'OVP / latch-off' },
    { id: 'mosfet', x: 618, y: 62, w: 120, h: 52, label: 'MOSFET Ramp', caption: 'Inrush shaping' },
  ].map((node) => ({
    ...node,
    active: activeFlow.has(node.id),
  }));

  const architectureLinks = [
    ['vin-window', 'uvlo-divider'],
    ['uvlo-divider', 'uvlo-comparator'],
    ['uvlo-comparator', 'startup-gate'],
    ['vin-window', 'ovp-divider'],
    ['ovp-divider', 'ovp-comparator'],
    ['ovp-comparator', 'fault-pulldown'],
    ['startup-gate', 'gate-source'],
    ['gate-source', 'gate-cap'],
    ['gate-cap', 'mosfet'],
    ['load-path', 'sense-amp'],
    ['sense-amp', 'timer-source'],
    ['timer-source', 'timer-cap'],
    ['timer-cap', 'fault-latch'],
    ['fault-latch', 'fault-pulldown'],
  ].map(([from, to]) => ({
    id: `${from}-${to}`,
    from,
    to,
    active: activeFlow.has(from) && activeFlow.has(to),
  }));

  return {
    hwResults,
    constants: LM5060_HW_CONSTANTS,
    insights,
    selectedInsight,
    architectureNodes,
    architectureLinks,
  };
}
