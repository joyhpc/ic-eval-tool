import React from 'react';

const TONE_MAP = {
  blue: {
    fill: '#dbeafe',
    stroke: '#2563eb',
    text: '#1e3a8a',
  },
  red: {
    fill: '#fee2e2',
    stroke: '#dc2626',
    text: '#7f1d1d',
  },
  amber: {
    fill: '#fef3c7',
    stroke: '#d97706',
    text: '#78350f',
  },
  green: {
    fill: '#dcfce7',
    stroke: '#16a34a',
    text: '#14532d',
  },
  neutral: {
    fill: '#f8fafc',
    stroke: '#94a3b8',
    text: '#0f172a',
  },
};

function ArchitectureNode({ node }) {
  const tone = node.active ? TONE_MAP.blue : TONE_MAP.neutral;

  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={14}
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth={node.active ? 3 : 2}
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + 19}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={tone.text}
      >
        {node.label}
      </text>
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h - 12}
        textAnchor="middle"
        fontSize="9"
        fill={tone.text}
      >
        {node.caption}
      </text>
    </g>
  );
}

function linkPath(from, to) {
  const startX = from.x + from.w;
  const startY = from.y + from.h / 2;
  const endX = to.x;
  const endY = to.y + to.h / 2;
  const midX = (startX + endX) / 2;

  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}

export default function Lm5060HardwareInsight({
  model,
  onSelectInsight,
  onFocusField,
}) {
  const nodeMap = new Map(model.architectureNodes.map((node) => [node.id, node]));
  const selectedTone = TONE_MAP[model.selectedInsight.tone] ?? TONE_MAP.neutral;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            内部作用路径
          </div>
          <svg viewBox="0 0 780 350" className="w-full rounded-2xl bg-white">
            {model.architectureLinks.map((link) => {
              const from = nodeMap.get(link.from);
              const to = nodeMap.get(link.to);

              return (
                <path
                  key={link.id}
                  d={linkPath(from, to)}
                  fill="none"
                  stroke={link.active ? selectedTone.stroke : '#cbd5e1'}
                  strokeWidth={link.active ? 4 : 2}
                  strokeDasharray={link.active ? undefined : '5 5'}
                  strokeLinecap="round"
                />
              );
            })}

            {model.architectureNodes.map((node) => (
              <ArchitectureNode key={node.id} node={node} />
            ))}
          </svg>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            深度洞察
          </div>
          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: selectedTone.fill,
              borderColor: selectedTone.stroke,
              color: selectedTone.text,
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide opacity-75">
              {model.selectedInsight.blockLabel}
            </div>
            <div className="mt-2 text-lg font-semibold">{model.selectedInsight.title}</div>
            <div className="mt-2 text-sm leading-6">{model.selectedInsight.summary}</div>
            <div className="mt-3 rounded-lg bg-white/70 p-3 font-mono text-sm">
              推荐值: {model.selectedInsight.recommendedValue}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFocusField(model.selectedInsight.focusField)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400"
          >
            跳转到对应输入项
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {model.insights.map((insight) => {
            const tone = TONE_MAP[insight.tone] ?? TONE_MAP.neutral;
            const active = model.selectedInsight.id === insight.id;

            return (
              <button
                key={insight.id}
                type="button"
                onClick={() => onSelectInsight(insight.id)}
                className="w-full rounded-xl border p-4 text-left transition"
                style={{
                  backgroundColor: active ? tone.fill : '#fff',
                  borderColor: active ? tone.stroke : '#e2e8f0',
                  color: active ? tone.text : '#0f172a',
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {insight.blockLabel}
                </div>
                <div className="mt-1 text-base font-semibold">{insight.title}</div>
                <div className="mt-2 text-sm leading-6">{insight.effect}</div>
                <div className="mt-3 font-mono text-xs">推荐值 {insight.recommendedValue}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            解释与校验点
          </div>
          <div className="rounded-xl bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">核心公式</div>
            <div className="mt-2 font-mono text-sm text-slate-700">{model.selectedInsight.formula}</div>
          </div>
          <div className="rounded-xl bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">为什么这个配置会生效</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {model.selectedInsight.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>- {checkpoint}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
