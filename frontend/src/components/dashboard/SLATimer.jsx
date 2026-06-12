import React from 'react';

export default function SLATimer({ hours }) {
  const h = parseFloat(hours);
  if (isNaN(h)) return <span className="text-gray-400 text-xs">—</span>;

  if (h < 0) {
    const abs = Math.abs(h);
    const label = abs >= 24 ? `${(abs / 24).toFixed(1)}d overdue` : `${abs.toFixed(0)}h overdue`;
    return <span className="text-xs font-semibold text-red-600">{label}</span>;
  }
  if (h <= 4) {
    return <span className="text-xs font-semibold text-red-500">{h.toFixed(1)}h left</span>;
  }
  if (h <= 24) {
    return <span className="text-xs font-medium text-amber-600">{h.toFixed(0)}h left</span>;
  }
  const days = Math.floor(h / 24);
  const remH  = Math.round(h % 24);
  const label = remH > 0 ? `${days}d ${remH}h` : `${days}d`;
  return <span className="text-xs text-gray-600">{label} left</span>;
}
