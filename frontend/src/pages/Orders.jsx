import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/dashboard/StatusBadge';
import SLATimer from '../components/dashboard/SLATimer';
import FilterBar from '../components/dashboard/FilterBar';
import { format } from 'date-fns';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 25;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.list({ ...filters, page, limit: LIMIT });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [filters]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <button onClick={() => navigate('/orders/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order #','Customer','Lens','Coating','Stage','SLA','Risk','Store','Created'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm">{o.customer_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{o.lens_type?.replace(/_/g,' ')} {o.lens_index}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{o.coating}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.current_status} /></td>
                  <td className="px-4 py-3"><SLATimer hours={o.hours_until_sla} /></td>
                  <td className="px-4 py-3"><RiskBadge risk={o.risk_level} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.store_location || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(o.created_at), 'dd MMM')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
