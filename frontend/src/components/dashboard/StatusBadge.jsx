import React from 'react';

const STATUS_STYLES = {
  ORDER_PLACED:          'bg-gray-100 text-gray-700',
  PRESCRIPTION_VERIFIED: 'bg-blue-100 text-blue-700',
  LENS_ALLOCATED:        'bg-cyan-100 text-cyan-700',
  LENS_CUTTING:          'bg-indigo-100 text-indigo-700',
  COATING:               'bg-violet-100 text-violet-700',
  FRAME_FITTING:         'bg-purple-100 text-purple-700',
  QC:                    'bg-yellow-100 text-yellow-700',
  PACKED:                'bg-teal-100 text-teal-700',
  SHIPPED:               'bg-orange-100 text-orange-700',
  DELIVERED:             'bg-green-100 text-green-700',
  REORDER:               'bg-red-100 text-red-700',
  CANCELLED:             'bg-gray-200 text-gray-500',
  ON_HOLD:               'bg-amber-100 text-amber-700',
};

const RISK_STYLES = {
  SAFE:     'bg-green-100 text-green-700',
  AT_RISK:  'bg-amber-100 text-amber-700',
  BREACHED: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || 'bg-gray-100 text-gray-600';
  const dot = risk === 'BREACHED' ? '' : risk === 'AT_RISK' ? '' : '';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {dot} {risk}
    </span>
  );
}
