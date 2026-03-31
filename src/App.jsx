import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Activity,
  CircuitBoard,
  Zap,
  AlertTriangle,
  Power,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import {
  buildLm5060SchematicViewModel,
  LM5060_MODULE_DEFINITION,
} from './lib/lm5060Module.js';
import {
  computeHardwareResults,
  DEFAULT_HW_PARAMS,
} from './lib/lm5060Hardware.js';
import {
  DEFAULT_SIM_PARAMS,
  SIM_THRESHOLDS,
  deriveSimulationState,
  evolveSimulation,
  formatGateCurrent,
  formatTimerCurrent,
} from './lib/lm5060.js';
import Lm5060Schematic from './components/Lm5060Schematic.jsx';
import ChipCatalogWorkbench from './components/ChipCatalogWorkbench.jsx';
import {
  CHIP_CATALOG_ENTRIES,
  CHIP_CATALOG_SOURCE,
} from './data/chips.generated.js';

export default function App() {
  const [hwParams, setHwParams] = useState(DEFAULT_HW_PARAMS);
  const [pinnedHotspotId, setPinnedHotspotId] = useState('controller');
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null);
  const [selectedDetailedChipId, setSelectedDetailedChipId] = useState('lm5060');
  const inputRefs = useRef({});

  const handleHwChange = (e) => {
    setHwParams({ ...hwParams, [e.target.name]: parseFloat(e.target.value) || 0 });
  };
  const hwResults = useMemo(() => computeHardwareResults(hwParams), [hwParams]);
  const timerCapValue = hwResults.C_TIMER;
  const gateCapValue = hwResults.C_GATE;

  const [simParams, setSimParams] = useState(DEFAULT_SIM_PARAMS);
  const [faultLatch, setFaultLatch] = useState(false);
  const [autoSim, setAutoSim] = useState(true);
  const [autoGate, setAutoGate] = useState(true);
  const [simStepMs, setSimStepMs] = useState(50);
  const simParamsRef = useRef(simParams);
  const faultLatchRef = useRef(faultLatch);

  useEffect(() => {
    simParamsRef.current = simParams;
  }, [simParams]);

  useEffect(() => {
    faultLatchRef.current = faultLatch;
  }, [faultLatch]);

  useEffect(() => {
    if (!autoSim) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const result = evolveSimulation({
        simParams: simParamsRef.current,
        hwResults: {
          C_TIMER: timerCapValue,
          C_GATE: gateCapValue,
        },
        faultLatch: faultLatchRef.current,
        deltaMs: simStepMs,
        autoGate,
      });
      simParamsRef.current = result.simParams;
      faultLatchRef.current = result.faultLatch;
      setSimParams(result.simParams);
      setFaultLatch(result.faultLatch);
    }, simStepMs);

    return () => window.clearInterval(intervalId);
  }, [autoSim, autoGate, gateCapValue, simStepMs, timerCapValue]);

  const handleSimChange = (e) => {
    const nextParams = {
      ...simParams,
      [e.target.name]: parseFloat(e.target.value),
    };
    const nextPorReady = nextParams.vIn >= SIM_THRESHOLDS.vinPor;
    const nextEnReady = nextParams.vEn >= SIM_THRESHOLDS.enEnable;
    const nextUvloReady = nextParams.vUvlo >= SIM_THRESHOLDS.uvloEnable;
    const nextOvpFault = nextParams.vOvp >= SIM_THRESHOLDS.ovpTrip;

    if (!(nextPorReady && nextEnReady && nextUvloReady)) {
      setFaultLatch(false);
    } else if (!nextOvpFault && nextParams.vTimer >= SIM_THRESHOLDS.timerLatch) {
      setFaultLatch(true);
    }

    setSimParams(nextParams);
  };

  const resetLatch = () => {
    setFaultLatch(false);
    setSimParams({ ...simParams, vEn: 0, vTimer: 0 });
    setTimeout(() => {
      setSimParams((prev) => ({ ...prev, vEn: 5, vTimer: SIM_THRESHOLDS.timerRestart }));
    }, 300);
  };

  const simResults = deriveSimulationState(simParams, faultLatch);
  const activeHotspotId = hoveredHotspotId ?? pinnedHotspotId;
  const schematicViewModel = useMemo(
    () =>
      buildLm5060SchematicViewModel({
        hwParams,
        hwResults,
        simParams,
        simResults,
        faultLatch,
        selectedHotspotId: activeHotspotId,
      }),
    [activeHotspotId, faultLatch, hwParams, hwResults, simParams, simResults],
  );
  const selectedFocusField = schematicViewModel.inspector.focusField;

  const registerInputRef = (fieldName) => (element) => {
    if (element) {
      inputRefs.current[fieldName] = element;
    }
  };

  const focusField = (fieldName) => {
    if (!fieldName) {
      return;
    }

    const element = inputRefs.current[fieldName];
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
  };

  const handleSelectHotspot = (hotspot) => {
    setPinnedHotspotId(hotspot.id);
    focusField(hotspot.focusField);
  };

  const getStateColor = (stateKey) => {
    if (stateKey === 'run') return 'bg-green-100 text-green-800 border-green-300';
    if (stateKey === 'fault') return 'bg-red-100 text-red-800 border-red-300';
    if (stateKey === 'warning') return 'bg-amber-100 text-amber-900 border-amber-300';
    if (stateKey === 'startup') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <Zap className="text-blue-600" />
              IC 智能评估工具
            </h1>
            <p className="mt-1 text-gray-500">
              多芯片硬件评估框架，当前加载模块：LM5060 High-Side Protection Controller
            </p>
          </div>
          <div className="hidden items-center gap-4 text-sm text-gray-500 md:flex">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              纯前端计算
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              实时响应
            </span>
          </div>
        </div>

        <ChipCatalogWorkbench
          catalogEntries={CHIP_CATALOG_ENTRIES}
          sourceMeta={CHIP_CATALOG_SOURCE}
          onDetailedChipChange={setSelectedDetailedChipId}
        />

        {selectedDetailedChipId === 'lm5060' ? (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-slate-900 p-4 text-white">
                <CircuitBoard className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold">LM5060 简化原理图交互视图</h2>
                  <p className="text-sm text-slate-300">
                    这张图只保留支撑 LM5060 模块决策的关键要素，点击任意模块会联动对应输入项。
                  </p>
                </div>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-[1.7fr_0.9fr]">
                <Lm5060Schematic
                  viewModel={schematicViewModel}
                  onSelectHotspot={handleSelectHotspot}
                  onHoverHotspot={(hotspot) => setHoveredHotspotId(hotspot.id)}
                  onLeaveHotspot={() => setHoveredHotspotId(null)}
                />
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 ${getStateColor(simResults.stateKey)}`}>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Active Module
                    </div>
                    <div className="mt-2 text-lg font-semibold">{LM5060_MODULE_DEFINITION.name}</div>
                    <p className="mt-2 text-sm leading-6">
                      {LM5060_MODULE_DEFINITION.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      悬浮 / 选中探针
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">
                      {schematicViewModel.inspector.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {schematicViewModel.inspector.description}
                    </p>
                    <div className="mt-4 rounded-lg bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        实时读数
                      </div>
                      <div className="mt-1 font-mono text-sm text-slate-900">
                        {schematicViewModel.inspector.value}
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        当前状态
                      </div>
                      <div className="mt-1 text-sm text-slate-900">{schematicViewModel.inspector.stateSummary}</div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      {selectedFocusField
                        ? `点击后会定位到输入字段：${selectedFocusField}`
                        : '该元件当前没有直接绑定到单一输入字段。'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      可交互元件
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {schematicViewModel.hotspots.map((hotspot) => (
                        <button
                          key={hotspot.id}
                          type="button"
                          onClick={() => handleSelectHotspot(hotspot)}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            hotspot.isSelected
                              ? 'border-blue-300 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {hotspot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-slate-800 p-4 text-white">
              <Calculator className="h-5 w-5" />
              <h2 className="text-lg font-semibold">1. 外围硬件参数计算器</h2>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Vin 最小工作电压 (V)
                  </label>
                  <input
                    type="number"
                    name="vinMin"
                    value={hwParams.vinMin}
                    ref={registerInputRef('vinMin')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'vinMin'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Vin 最大工作电压 (V)
                  </label>
                  <input
                    type="number"
                    name="vinMax"
                    value={hwParams.vinMax}
                    ref={registerInputRef('vinMax')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'vinMax'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    过流保护阈值 I_limit (A)
                  </label>
                  <input
                    type="number"
                    name="iLimit"
                    value={hwParams.iLimit}
                    ref={registerInputRef('iLimit')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'iLimit'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    MOSFET Rds(on) (mΩ)
                  </label>
                  <input
                    type="number"
                    name="rdsOn"
                    value={hwParams.rdsOn}
                    ref={registerInputRef('rdsOn')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'rdsOn'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    过流容忍时间 (ms)
                  </label>
                  <input
                    type="number"
                    name="ocpDelay"
                    value={hwParams.ocpDelay}
                    ref={registerInputRef('ocpDelay')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'ocpDelay'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    软启动 dV/dt (V/ms)
                  </label>
                  <input
                    type="number"
                    name="dvdt"
                    value={hwParams.dvdt}
                    ref={registerInputRef('dvdt')}
                    onChange={handleHwChange}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      selectedFocusField === 'dvdt'
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-800">
                  计算结果 (BOM 推荐)
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">UVLO R10 (设R11=10k):</span>
                    <span className="font-medium text-slate-900">{hwResults.R10} kΩ</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">OVP R8 (设R9=10k):</span>
                    <span className="font-medium text-slate-900">{hwResults.R8} kΩ</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">TIMER 延时电容:</span>
                    <span className="font-medium text-blue-600">{hwResults.C_TIMER} nF</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">GATE 软启动电容:</span>
                    <span className="font-medium text-blue-600">{hwResults.C_GATE} nF</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">VDS 短路检测压降:</span>
                    <span className="font-medium text-slate-900">{hwResults.V_DSTH} mV</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-500">SENSE 采样电阻 Rs:</span>
                    <span className="font-medium text-red-600">{hwResults.Rs} Ω</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  * Rs 计算已默认包含 Ro=10kΩ 的防反接偏置电流补偿。
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <h2 className="text-lg font-semibold">2. 芯片引脚状态机实时仿真</h2>
              </div>
              <button
                onClick={resetLatch}
                className="flex items-center gap-1 rounded-md bg-white/20 px-3 py-1.5 text-xs transition-colors hover:bg-white/30"
              >
                <RotateCcw className="h-3 w-3" />
                拨动 EN 复位
              </button>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "V_IN (供电)", name: "vIn", min: 0, max: 48, step: 0.1, unit: "V" },
                  { label: "EN (使能)", name: "vEn", min: 0, max: 5, step: 0.1, unit: "V" },
                  { label: "UVLO (欠压引脚)", name: "vUvlo", min: 0, max: 5, step: 0.1, unit: "V" },
                  { label: "OVP (过压引脚)", name: "vOvp", min: 0, max: 5, step: 0.1, unit: "V" },
                  { label: "V_SENSE (源极检测)", name: "vSense", min: 0, max: 48, step: 0.1, unit: "V" },
                  { label: "V_OUT (输出负载)", name: "vOut", min: 0, max: 48, step: 0.1, unit: "V" },
                  { label: "V_GATE (栅极驱动)", name: "vGate", min: 0, max: 60, step: 0.1, unit: "V" },
                  { label: "V_TIMER (延时电容)", name: "vTimer", min: 0, max: 3, step: 0.05, unit: "V" },
                ].map((input) => (
                  <div key={input.name} className="flex flex-col">
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>{input.label}</span>
                      <span className="font-mono font-medium text-blue-600">
                        {simParams[input.name].toFixed(1)}
                        {input.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      name={input.name}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      ref={registerInputRef(input.name)}
                      value={simParams[input.name]}
                      onChange={handleSimChange}
                      className={`w-full accent-blue-600 ${
                        selectedFocusField === input.name ? 'ring-2 ring-blue-200' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">手册门限摘要</div>
                <p className="mt-2">
                  这个状态机按 LM5060 的关键门限切换：VIN POR 约 5.1V、EN 启动约 2.0V、UVLO 启动约
                  1.6V、GATE-OUT 约 5V 作为启动阶段切换点、TIMER 到 2.0V 进入 latch-off。
                </p>
              </div>

              <div className="mb-6 grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 md:grid-cols-3">
                <label className="flex items-center justify-between gap-3 rounded bg-white/70 px-3 py-2">
                  <span>自动积分</span>
                  <input
                    type="checkbox"
                    checked={autoSim}
                    onChange={(e) => setAutoSim(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded bg-white/70 px-3 py-2">
                  <span>自动 GATE</span>
                  <input
                    type="checkbox"
                    checked={autoGate}
                    onChange={(e) => setAutoGate(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded bg-white/70 px-3 py-2">
                  <span>步进</span>
                  <select
                    value={simStepMs}
                    onChange={(e) => setSimStepMs(parseInt(e.target.value, 10))}
                    className="rounded border border-blue-200 bg-white px-2 py-1"
                  >
                    <option value={20}>20 ms</option>
                    <option value={50}>50 ms</option>
                    <option value={100}>100 ms</option>
                  </select>
                </label>
                <div className="rounded bg-white/70 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    计算用 C_TIMER
                  </div>
                  <div className="mt-1 font-mono">{hwResults.C_TIMER} nF</div>
                </div>
                <div className="rounded bg-white/70 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    计算用 C_GATE
                  </div>
                  <div className="mt-1 font-mono">{hwResults.C_GATE} nF</div>
                </div>
                <div className="rounded bg-white/70 px-3 py-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    当前模式
                  </div>
                  <div className="mt-1">
                    {autoSim ? '自动演化中' : '手动滑块模式'}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Power className="h-4 w-4" />
                  芯片内部逻辑响应
                </h3>
                <div
                  className={`rounded-lg border-2 p-4 transition-colors duration-300 ${getStateColor(simResults.stateKey)}`}
                >
                  <div className="mb-2 text-lg font-bold">{simResults.state}</div>
                  <p className="mb-4 text-sm leading-6">{simResults.detail}</p>
                  <div className="grid grid-cols-3 gap-4 rounded bg-white/50 p-3 text-sm shadow-sm">
                    <div>
                      <span className="mb-1 block text-xs uppercase opacity-70">I_GATE 行为</span>
                      <span className="font-mono font-semibold">{formatGateCurrent(simResults.iGate)}</span>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs uppercase opacity-70">I_TIMER 行为</span>
                      <span className="font-mono font-semibold">{formatTimerCurrent(simResults.iTimer)}</span>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs uppercase opacity-70">nPGD 指示脚</span>
                      <span className="flex items-center gap-1 font-mono font-semibold">
                        {simResults.npgd.includes("正常") ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {simResults.npgd}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <div className="rounded bg-white/40 p-3">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        复位 / 下一步
                      </div>
                      <p>{simResults.resetHint}</p>
                    </div>
                    <div className="rounded bg-white/40 p-3">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        当前判定条件
                      </div>
                      <p className="leading-6">{simResults.activeConditions.join(' | ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm">
            当前已切换到 {selectedDetailedChipId.toUpperCase()}。上方 Catalog Workbench 已提供基于解析文件的可视化操控；
            下方这套详细公式计算器和状态机是 LM5060 专用模块，因此在非 LM5060 选择时自动收起，避免把工程师带入错误模型。
          </div>
        )}
      </div>
    </div>
  );
}
