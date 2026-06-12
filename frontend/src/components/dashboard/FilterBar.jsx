import React from 'react';

const STATUSES = ['ORDER_PLACED','PRESCRIPTION_VERIFIED','LENS_ALLOCATED','LENS_CUTTING','COATING','FRAME_FITTING','QC','PACKED','SHIPPED','DELIVERED','REORDER','ON_HOLD'];
const LENS_TYPES = ['SINGLE_VISION','PROGRESSIVE','BIFOCAL'];
const RISK_LEVELS = ['SAFE','AT_RISK','BREACHED'];

export default function FilterBar({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val || undefined });

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={filters.status || ''}
        onChange={e => set('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
      </select>

      <select
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={filters.lens_type || ''}
        onChange={e => set('lens_type', e.target.value)}
      >
        <option value="">All Lens Types</option>
        {LENS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
      </select>

      <select
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={filters.risk_level || ''}
        onChange={e => set('risk_level', e.target.value)}
      >
        <option value="">All Risk Levels</option>
        {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <input
        type="text"
        placeholder="Store location..."
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={filters.store_location || ''}
        onChange={e => set('store_location', e.target.value)}
      />

      {Object.values(filters).some(Boolean) && (
        <button
          className="text-xs text-gray-500 hover:text-red-500 underline"
          onClick={() => onChange({})}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
