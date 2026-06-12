import React, { useState } from 'react';

const TRANSITIONS = {
  ORDER_PLACED:          ['PRESCRIPTION_VERIFIED', 'CANCELLED', 'ON_HOLD'],
  PRESCRIPTION_VERIFIED: ['LENS_ALLOCATED', 'REORDER', 'ON_HOLD'],
  LENS_ALLOCATED:        ['LENS_CUTTING', 'ON_HOLD'],
  LENS_CUTTING:          ['COATING', 'QC', 'ON_HOLD'],
  COATING:               ['FRAME_FITTING', 'ON_HOLD'],
  FRAME_FITTING:         ['QC', 'ON_HOLD'],
  QC:                    ['PACKED', 'REORDER'],
  PACKED:                ['SHIPPED'],
  SHIPPED:               ['DELIVERED'],
  REORDER:               ['LENS_ALLOCATED', 'CANCELLED'],
  ON_HOLD:               ['ORDER_PLACED','PRESCRIPTION_VERIFIED','LENS_ALLOCATED','LENS_CUTTING','COATING','FRAME_FITTING','QC'],
};

export default function StatusUpdateModal({ order, onClose, onSubmit }) {
  const [status, setStatus] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [loading, setLoading] = useState(false);

  const allowed = TRANSITIONS[order.current_status] || [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!status) return;
    setLoading(true);
    try {
      await onSubmit({ status, changed_by: changedBy, delay_reason: delayReason });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold mb-1">Update Status</h2>
        <p className="text-xs text-gray-500 mb-4">Order: <span className="font-medium text-gray-700">{order.order_number}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Status *</label>
            <select
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Select next status</option>
              {allowed.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Updated by</label>
            <input
              type="text"
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={changedBy}
              onChange={e => setChangedBy(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Delay reason <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Log any delay reason..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !status}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
