import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../services/api';
import { RiskBadge, StatusBadge } from '../components/dashboard/StatusBadge';
import { format } from 'date-fns';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [showAcked, setShowAcked] = useState(false);

  const fetchAlerts = useCallback(async () => {
    const res = await alertsAPI.list(showAcked ? {} : { acknowledged: false });
    setAlerts(res.data.alerts);
    setTotal(res.data.total);
  }, [showAcked]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  async function acknowledge(id) {
    await alertsAPI.acknowledge(id, 'Staff');
    fetchAlerts();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SLA Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} {showAcked ? 'total' : 'unacknowledged'} alerts</p>
        </div>
        <button
          onClick={() => setShowAcked(!showAcked)}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium">
          {showAcked ? 'Show Active' : 'Show All'}
        </button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm text-gray-500">No {showAcked ? '' : 'unacknowledged '}alerts</p>
          </div>
        )}
        {alerts.map(alert => (
          <div key={alert.id}
            className={`bg-white rounded-xl border p-5 ${alert.risk_level === 'BREACHED' ? 'border-red-200' : 'border-amber-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <RiskBadge risk={alert.risk_level} />
                  <span className="font-mono text-xs text-blue-600 cursor-pointer hover:underline"
                    onClick={() => navigate(`/orders/${alert.order_id}`)}>
                    {alert.order_number}
                  </span>
                  <StatusBadge status={alert.current_status} />
                  <span className="text-xs text-gray-400">{alert.customer_name}</span>
                </div>
                <p className="text-sm text-gray-700">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{alert.lens_type?.replace(/_/g,' ')} · {alert.store_location || '—'}</span>
                  <span>{format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm')}</span>
                  {alert.email_sent && <span className="text-green-600">✓ Email sent</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {!alert.acknowledged && (
                  <button onClick={() => acknowledge(alert.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
                    Acknowledge
                  </button>
                )}
                <button onClick={() => navigate(`/orders/${alert.order_id}`)}
                  className="text-xs text-blue-600 hover:underline text-center">
                  View Order →
                </button>
                {alert.acknowledged && (
                  <span className="text-xs text-gray-400 text-center">
                    Acked by {alert.acknowledged_by}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
