import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, ordersAPI } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/dashboard/StatusBadge';
import SLATimer from '../components/dashboard/SLATimer';
import FilterBar from '../components/dashboard/FilterBar';
import StatusUpdateModal from '../components/orders/StatusUpdateModal';

function StatCard({ label, value, color = 'text-gray-900', sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, ordersRes] = await Promise.all([
        dashboardAPI.summary(),
        dashboardAPI.activeOrders(filters),
      ]);
      setSummary(sumRes.data.summary);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleStatusUpdate(data) {
    await ordersAPI.updateStatus(selectedOrder.id, data);
    fetchData();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Order Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live view of all active orders and SLA status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Active Orders"       value={summary?.active_orders}       />
        <StatCard label="Delivered Today"     value={summary?.delivered_today}     color="text-green-600" />
        <StatCard label="At Risk"             value={summary?.at_risk}             color="text-amber-600" />
        <StatCard label="Breached SLA"        value={summary?.breached}            color="text-red-600" />
        <StatCard label="Needs Attention"     value={summary?.needs_attention}     color="text-orange-600" sub="QC / Reorder" />
        <StatCard label="Pending Procurement" value={summary?.pending_procurement} color="text-blue-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Active Orders ({orders.length})</h2>
          <button
            onClick={() => navigate('/orders/new')}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium"
          >
            + New Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order #', 'Customer', 'Lens', 'Stage', 'SLA', 'Risk', 'Store', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td></tr>
              )}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="font-mono text-xs text-blue-600 hover:underline"
                    >
                      {order.order_number}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.customer_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.lens_type?.replace(/_/g,' ')} · {order.lens_index} · {order.coating}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.current_status} /></td>
                  <td className="px-4 py-3"><SLATimer hours={order.hours_until_sla} /></td>
                  <td className="px-4 py-3"><RiskBadge risk={order.risk_level} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{order.store_location || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <StatusUpdateModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSubmit={handleStatusUpdate}
        />
      )}
    </div>
  );
}
