import React from "react";

export default function AutomataGraph({ states, transitions, startState, acceptStates, activeState }) {
  if (!states || states.length === 0) return null;

  const nodeRadius = 22;
  const paddingX = 60;
  const spacingX = Math.max(90, Math.min(130, 800 / states.length));
  const centerY = 130;
  const svgWidth = Math.max(500, paddingX * 2 + (states.length - 1) * spacingX);
  const svgHeight = 260;

  const positions = {};
  states.forEach((st, idx) => {
    positions[st] = {
      x: paddingX + idx * spacingX,
      y: centerY,
      index: idx,
    };
  });

  const groupedTransitions = [];
  transitions.forEach((t) => {
    const existing = groupedTransitions.find((g) => g.from === t.from && g.to === t.to);
    if (existing) {
      if (!existing.symbols.includes(t.symbol)) existing.symbols.push(t.symbol);
    } else {
      groupedTransitions.push({ from: t.from, to: t.to, symbols: [t.symbol] });
    }
  });

  return (
    <div className="w-full overflow-x-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex justify-center items-center">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="min-w-full h-auto select-none"
        style={{ minWidth: `${svgWidth}px`, height: `${svgHeight}px` }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="21"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
        </defs>

        {groupedTransitions.map((t, i) => {
          const src = positions[t.from];
          const dst = positions[t.to];
          if (!src || !dst) return null;

          const label = t.symbols.join(", ");

          if (t.from === t.to) {
            const x = src.x;
            const y = src.y - nodeRadius;
            const pathData = `M ${x - 8} ${y} C ${x - 24} ${y - 45}, ${x + 24} ${y - 45}, ${x + 8} ${y}`;

            return (
              <g key={`loop-${i}`}>
                <path d={pathData} fill="none" stroke="#64748b" strokeWidth="1.8" markerEnd="url(#arrow)" />
                <text x={x} y={y - 48} fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="monospace">{label}</text>
              </g>
            );
          }

          const diff = dst.index - src.index;
          const isForward = diff > 0;
          const absDiff = Math.abs(diff);

          if (diff === 1) {
            return (
              <g key={`edge-${i}`}>
                <line x1={src.x} y1={src.y} x2={dst.x} y2={dst.y} stroke="#64748b" strokeWidth="1.8" markerEnd="url(#arrow)" />
                <text x={(src.x + dst.x) / 2} y={src.y - 8} fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="monospace">{label}</text>
              </g>
            );
          }

          const curveHeight = Math.min(90, 25 + absDiff * 14);
          const offsetY = isForward ? -curveHeight : curveHeight;
          const midX = (src.x + dst.x) / 2;
          const ctrlY = centerY + offsetY;
          const pathData = `M ${src.x} ${src.y} Q ${midX} ${ctrlY} ${dst.x} ${dst.y}`;

          return (
            <g key={`edge-curve-${i}`}>
              <path d={pathData} fill="none" stroke="#64748b" strokeWidth="1.8" markerEnd="url(#arrow)" />
              <text x={midX} y={ctrlY + (isForward ? -6 : 15)} fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="monospace">{label}</text>
            </g>
          );
        })}

        {states.map((st) => {
          const pos = positions[st];
          if (!pos) return null;

          const isAccept = acceptStates.includes(st);
          const isActive = activeState === st;

          return (
            <g key={`node-${st}`} className="transition-transform duration-200">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={isActive ? "#fbbf24" : "#ffffff"}
                stroke={isActive ? "#d97706" : isAccept ? "#10b981" : "#2563eb"}
                strokeWidth={isAccept ? "3" : "2.5"}
                className="transition-colors duration-200"
              />
              {isAccept && <circle cx={pos.x} cy={pos.y} r={nodeRadius - 4} fill="none" stroke="#10b981" strokeWidth="1.5" />}
              <text
                x={pos.x}
                y={pos.y + 4}
                fill={isActive ? "#78350f" : "#0f172a"}
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
              >
                {st}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}