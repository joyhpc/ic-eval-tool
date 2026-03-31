import React from 'react';

function Block({ hotspot, onSelect, onHover, onLeave }) {
  return (
    <g
      onClick={() => onSelect(hotspot)}
      onMouseEnter={() => onHover(hotspot)}
      onMouseLeave={onLeave}
      className="cursor-pointer transition-all duration-200"
    >
      <rect
        x={hotspot.x}
        y={hotspot.y}
        width={hotspot.w}
        height={hotspot.h}
        rx={16}
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

export default function GenericChipSchematic({
  viewModel,
  onSelectHotspot,
  onHoverHotspot,
  onLeaveHotspot,
}) {
  return (
    <svg viewBox="0 0 760 360" className="w-full rounded-2xl bg-slate-950/5">
      <rect x="16" y="16" width="728" height="328" rx="24" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="36" y="44" fontSize="14" fontWeight="700" fill="#0f172a">
        Datasheet-Mapped Workbench
      </text>
      <text x="36" y="62" fontSize="11" fill="#475569">
        Generic protection-path view driven by normalized parsed files.
      </text>

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
        />
      ))}

      {viewModel.hotspots.map((hotspot) => (
        <Block
          key={hotspot.id}
          hotspot={hotspot}
          onSelect={onSelectHotspot}
          onHover={onHoverHotspot}
          onLeave={onLeaveHotspot}
        />
      ))}
    </svg>
  );
}
