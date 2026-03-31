import React from 'react';

function HotspotShape({ hotspot, onSelect, onHover, onLeave }) {
  const commonProps = {
    onClick: () => onSelect(hotspot),
    onMouseEnter: () => onHover(hotspot),
    onMouseLeave: onLeave,
    className: 'cursor-pointer transition-all duration-200',
  };

  return (
    <g {...commonProps}>
      <rect
        x={hotspot.x}
        y={hotspot.y}
        width={hotspot.w}
        height={hotspot.h}
        rx={hotspot.kind === 'controller' ? 18 : 12}
        fill={hotspot.tone.fill}
        stroke={hotspot.tone.stroke}
        strokeWidth={hotspot.isSelected ? 3 : 2}
      />
      <text
        x={hotspot.x + hotspot.w / 2}
        y={hotspot.y + 20}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={hotspot.tone.text}
      >
        {hotspot.label}
      </text>
      <text
        x={hotspot.x + hotspot.w / 2}
        y={hotspot.y + hotspot.h - 14}
        textAnchor="middle"
        fontSize="10"
        fill={hotspot.tone.text}
      >
        {hotspot.value}
      </text>
    </g>
  );
}

export default function Lm5060Schematic({
  viewModel,
  onSelectHotspot,
  onHoverHotspot,
  onLeaveHotspot,
}) {
  return (
    <svg viewBox="0 0 800 420" className="w-full rounded-2xl bg-slate-950/5">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="16" y="16" width="768" height="388" rx="24" fill="#f8fafc" stroke="#e2e8f0" />

      {viewModel.nets.map((net) => (
        <path
          key={net.id}
          d={net.path}
          fill="none"
          stroke={net.style.stroke}
          strokeWidth={net.style.width}
          strokeDasharray={net.style.dasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={net.role === 'power' || net.role === 'gate' ? 'url(#glow)' : undefined}
        />
      ))}

      <text x="36" y="48" fontSize="14" fontWeight="700" fill="#0f172a">
        LM5060 简化原理图
      </text>
      <text x="36" y="66" fontSize="11" fill="#475569">
        点击元件可联动对应输入项，当前只表达决策相关要素，不追求完整 EDA 细节。
      </text>

      {viewModel.hotspots.map((hotspot) => (
        <HotspotShape
          key={hotspot.id}
          hotspot={hotspot}
          onSelect={onSelectHotspot}
          onHover={onHoverHotspot}
          onLeave={onLeaveHotspot}
        />
      ))}

      <text x="588" y="214" fontSize="11" fill="#475569">
        主功率路径
      </text>
      <text x="266" y="324" fontSize="11" fill="#475569">
        TIMER
      </text>
      <text x="470" y="224" fontSize="11" fill="#475569">
        GATE
      </text>
    </svg>
  );
}
