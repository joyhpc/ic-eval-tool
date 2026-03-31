import React, { useMemo, useRef, useState } from 'react';
import { Database, ExternalLink, FileCode2 } from 'lucide-react';

import {
  buildGenericChipViewModel,
  DEFAULT_GENERIC_PARAMS,
  evaluateGenericChipState,
} from '../lib/genericChipModel.js';
import GenericChipSchematic from './GenericChipSchematic.jsx';

function controlClass(isFocused) {
  return `w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
    isFocused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300 focus:ring-blue-500'
  }`;
}

function buildDefaultParams(chip) {
  return {
    vin: Number(
      Math.min(Math.max(chip.thresholds.vinMin + 1, 1), chip.thresholds.vinMax - 0.1).toFixed(1),
    ),
    enabled: true,
    loadCurrent: Number(
      Math.min(chip.thresholds.currentLimitMax * 0.4, chip.thresholds.currentLimitMax).toFixed(2),
    ),
    reversePolarity: false,
    thermalFault: false,
  };
}

export default function ChipCatalogWorkbench({ catalogEntries, sourceMeta, onDetailedChipChange }) {
  const initialChip = catalogEntries[0];
  const [selectedChipId, setSelectedChipId] = useState(initialChip?.id ?? 'lm5060');
  const [selectedHotspotId, setSelectedHotspotId] = useState('core');
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null);
  const [params, setParams] = useState(initialChip ? buildDefaultParams(initialChip) : DEFAULT_GENERIC_PARAMS);
  const inputRefs = useRef({});

  const selectedChip = useMemo(
    () => catalogEntries.find((entry) => entry.id === selectedChipId) ?? catalogEntries[0],
    [catalogEntries, selectedChipId],
  );

  const handleSelectChip = (chipId) => {
    const chip = catalogEntries.find((entry) => entry.id === chipId);
    if (!chip) {
      return;
    }

    setSelectedChipId(chipId);
    setSelectedHotspotId('core');
    setHoveredHotspotId(null);
    setParams(buildDefaultParams(chip));
    onDetailedChipChange?.(chip.id);
  };

  const activeHotspotId = hoveredHotspotId ?? selectedHotspotId;
  const viewModel = useMemo(
    () => buildGenericChipViewModel(selectedChip, params, activeHotspotId),
    [activeHotspotId, params, selectedChip],
  );
  const state = useMemo(() => evaluateGenericChipState(selectedChip, params), [params, selectedChip]);
  const focusField = viewModel.selectedHotspot.focusField;

  const registerRef = (id) => (element) => {
    if (element) {
      inputRefs.current[id] = element;
    }
  };

  const scrollToField = (field) => {
    if (!field || !inputRefs.current[field]) {
      return;
    }

    inputRefs.current[field].scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRefs.current[field].focus();
  };

  const setField = (field, value) => {
    setParams((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-slate-950 p-4 text-white">
        <Database className="h-5 w-5" />
        <div>
          <h2 className="text-lg font-semibold">Catalog Workbench</h2>
          <p className="text-sm text-slate-300">
            Parsed chip files are normalized into one workbench so engineers can compare devices in the same interaction model.
          </p>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {catalogEntries.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSelectChip(chip.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  chip.id === selectedChipId
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {chip.familyLabel}
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{chip.partNumber}</div>
                <div className="mt-2 text-sm text-slate-600">{chip.summary}</div>
                <div className="mt-3 text-xs text-slate-500">{chip.vendor}</div>
              </button>
            ))}
          </div>

          <GenericChipSchematic
            viewModel={viewModel}
            onSelectHotspot={(hotspot) => {
              setSelectedHotspotId(hotspot.id);
              scrollToField(hotspot.focusField);
            }}
            onHoverHotspot={(hotspot) => setHoveredHotspotId(hotspot.id)}
            onLeaveHotspot={() => setHoveredHotspotId(null)}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected Chip
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{selectedChip.partNumber}</div>
            <div className="mt-2 text-sm text-slate-700">{selectedChip.summary}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{selectedChip.family}</span>
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{selectedChip.topology}</span>
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{selectedChip.status}</span>
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              <a
                href={selectedChip.productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Product page
              </a>
              <a
                href={selectedChip.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 hover:underline"
              >
                <FileCode2 className="h-4 w-4" />
                Datasheet
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Live Inspector
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{viewModel.selectedHotspot.label}</div>
            <div className="mt-2 text-sm text-slate-700">{viewModel.selectedHotspot.description}</div>
            <div className="mt-3 rounded-lg bg-white p-3 font-mono text-sm text-slate-900">
              {viewModel.selectedHotspot.value}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {focusField ? `This hotspot maps to the control field "${focusField}".` : 'This hotspot is informational.'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Controls
            </div>
            <div className="mt-3 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">VIN</label>
                <input
                  ref={registerRef('vin')}
                  type="range"
                  min={0}
                  max={selectedChip.thresholds.vinMax + 5}
                  step={0.1}
                  value={params.vin}
                  onChange={(event) => setField('vin', parseFloat(event.target.value))}
                  className={`w-full accent-blue-600 ${focusField === 'vin' ? 'ring-2 ring-blue-200' : ''}`}
                />
                <input
                  type="number"
                  value={params.vin}
                  onChange={(event) => setField('vin', parseFloat(event.target.value) || 0)}
                  className={controlClass(focusField === 'vin')}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Load Current</label>
                <input
                  ref={registerRef('loadCurrent')}
                  type="range"
                  min={0}
                  max={Math.max(selectedChip.thresholds.currentLimitMax * 1.5, 2)}
                  step={0.1}
                  value={params.loadCurrent}
                  onChange={(event) => setField('loadCurrent', parseFloat(event.target.value))}
                  className={`w-full accent-blue-600 ${focusField === 'loadCurrent' ? 'ring-2 ring-blue-200' : ''}`}
                />
                <input
                  type="number"
                  value={params.loadCurrent}
                  onChange={(event) => setField('loadCurrent', parseFloat(event.target.value) || 0)}
                  className={controlClass(focusField === 'loadCurrent')}
                />
              </div>

              <label className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-sm text-slate-700">Enabled</span>
                <input
                  ref={registerRef('enabled')}
                  type="checkbox"
                  checked={params.enabled}
                  onChange={(event) => setField('enabled', event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-sm text-slate-700">Reverse Polarity</span>
                <input
                  ref={registerRef('reversePolarity')}
                  type="checkbox"
                  checked={params.reversePolarity}
                  onChange={(event) => setField('reversePolarity', event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              {selectedChip.capabilities.thermalProtection ? (
                <label className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <span className="text-sm text-slate-700">Thermal Fault</span>
                  <input
                    ref={registerRef('thermalFault')}
                    type="checkbox"
                    checked={params.thermalFault}
                    onChange={(event) => setField('thermalFault', event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parsed Summary
            </div>
            <div className="mt-2 rounded-lg bg-white p-3">
              <div className="text-sm font-semibold text-slate-900">{state.state}</div>
              <div className="mt-1 text-sm text-slate-700">{state.detail}</div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {selectedChip.featureBullets.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-slate-500">
              Source pipeline requested OpenDataSheet, active source is {sourceMeta.activeSource}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
