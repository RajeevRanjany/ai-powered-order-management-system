import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, alertsAPI } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/dashboard/StatusBadge';
import StatusUpdateModal from '../components/orders/StatusUpdateModal';
import { format } from 'date-fns';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    async function fetch() {
      const [orderRes, tatRes] = await Promise.all([
        ordersAPI.get(id),
        ordersAPI.getTAT(id),
      ]);
      setOrder(orderRes.data.order);
      setHistory(orderRes.data.history);
      setPrediction(tatRes.data.prediction);
    }
    fetch();
  }, [id]);

  async function handleStatusUpdate(data) {
    await ordersAPI.updateStatus(id, data);
    const res = await ordersAPI.get(id);
    setOrder(res.data.order);
    setHistory(res.data.history);
  }

  async function handleExplain() {
    setLoadingExplain(true);
    try {
      const res = await alertsAPI.explainRisk(id);
      setExplanation(res.data.explanation);
    } finally {
      setLoadingExplain(false);
    }
  }

  if (!order) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const fmt = d => d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—';

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
        <StatusBadge status={order.current_status} />
        <RiskBadge risk={order.risk_level} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Order Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Order Info</h2>
          <Row label="Customer" val={order.customer_name} />
          <Row label="Phone" val={order.customer_phone} />
          <Row label="Email" val={order.customer_email} />
          <Row label="Channel" val={order.source_channel} />
          <Row label="Store" val={order.store_location} />
          <Row label="Created" val={fmt(order.created_at)} />
          <Row label="SLA Deadline" val={fmt(order.sla_deadline)} />
          <Row label="Lens In House" val={order.lens_in_house ? 'Yes' : 'No'} />
        </div>

        {/* Lens & Prescription */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Lens & Prescription</h2>
          <Row label="Type" val={order.lens_type?.replace(/_/g,' ')} />
          <Row label="Index" val={order.lens_index} />
          <Row label="Coating" val={order.coating} />
          <Row label="Frame" val={`${order.frame_brand || ''} ${order.frame_model || ''}`} />
          <div className="pt-1 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Prescription</p>
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className="text-gray-400">Eye</div>
              {['SPH','CYL','AXIS','ADD'].map(h => <div key={h} className="text-gray-400">{h}</div>)}
              <div className="font-medium">R</div>
              <div>{order.sph_right}</div><div>{order.cyl_right}</div>
              <div>{order.axis_right}</div><div>{order.add_right}</div>
              <div className="font-medium">L</div>
              <div>{order.sph_left}</div><div>{order.cyl_left}</div>
              <div>{order.axis_left}</div><div>{order.add_left}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAT Prediction */}
      {prediction && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">TAT Prediction</h2>
            <button onClick={handleExplain} disabled={loadingExplain}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
              {loadingExplain ? 'Analyzing...' : 'Explain Risk (AI)'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Risk Level" val={<RiskBadge risk={prediction.riskLevel} />} />
            <Row label="SLA Breach" val={prediction.slaBreach ? 'Yes' : 'No'} />
            <Row label="Predicted Completion" val={fmt(prediction.predictedCompletionDate)} />
            <Row label="Reason" val={prediction.reason} />
          </div>
          {explanation && (
            <div className="mt-2 bg-blue-50 rounded-lg p-4 text-sm text-blue-900">{explanation}</div>
          )}
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Status Timeline</h2>
          {!['DELIVERED','CANCELLED'].includes(order.current_status) && (
            <button onClick={() => setShowModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">
              Update Status
            </button>
          )}
        </div>
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${i === history.length - 1 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-gray-400">{fmt(h.created_at)}</span>
                  {h.changed_by && <span className="text-xs text-gray-400">by {h.changed_by}</span>}
                </div>
                {h.delay_reason && <p className="text-xs text-amber-600 mt-1">⚠️ {h.delay_reason}</p>}
                {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <StatusUpdateModal order={order} onClose={() => setShowModal(false)} onSubmit={handleStatusUpdate} />
      )}
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-800 text-xs font-medium text-right max-w-[60%]">{val || '—'}</span>
    </div>
  );
}
