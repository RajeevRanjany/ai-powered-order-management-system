import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, inventoryAPI } from '../services/api';

const LENS_TYPES   = ['SINGLE_VISION', 'PROGRESSIVE', 'BIFOCAL'];
const LENS_INDEXES = ['1.50', '1.56', '1.60', '1.67', '1.74'];
const COATINGS     = ['NONE', 'AR', 'PHOTOCHROMIC', 'BLUE_CUT', 'TINTED'];
const CHANNELS     = ['STORE', 'ONLINE', 'B2B'];

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
const selectCls = inputCls + ' bg-white';

export default function NewOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    sph_right: '', cyl_right: '', axis_right: '', add_right: '',
    sph_left: '',  cyl_left: '',  axis_left: '',  add_left: '',
    lens_type: 'SINGLE_VISION', lens_index: '1.56', coating: 'AR',
    frame_brand: '', frame_model: '',
    source_channel: 'STORE', store_location: '',
  });
  const [stockCheck, setStockCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function checkStock() {
    try {
      const res = await inventoryAPI.check({
        lens_type: form.lens_type,
        lens_index: form.lens_index,
        coating: form.coating,
        sph_right: parseFloat(form.sph_right) || 0,
        sph_left: parseFloat(form.sph_left) || 0,
        cyl_right: parseFloat(form.cyl_right) || 0,
        cyl_left: parseFloat(form.cyl_left) || 0,
      });
      setStockCheck(res.data);
    } catch {
      setStockCheck(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      ['sph_right','cyl_right','axis_right','add_right','sph_left','cyl_left','axis_left','add_left'].forEach(k => {
        payload[k] = payload[k] !== '' ? parseFloat(payload[k]) : null;
      });
      payload.lens_index = parseFloat(payload.lens_index);
      const res = await ordersAPI.create(payload);
      navigate(`/orders/${res.data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a new eyewear prescription order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Customer Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer Name" required>
              <input required className={inputCls} value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputCls} value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
            </Field>
            <Field label="Store Location">
              <input className={inputCls} value={form.store_location} onChange={e => set('store_location', e.target.value)} placeholder="e.g. Mumbai - Andheri" />
            </Field>
          </div>
        </div>

        {/* Prescription */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Prescription</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-4 grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 pb-1">
              <div></div><div>SPH</div><div>CYL</div><div>AXIS</div><div>ADD</div>
            </div>
            {['right','left'].map(eye => (
              <React.Fragment key={eye}>
                <div className="col-span-4 grid grid-cols-5 gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 capitalize">{eye} Eye</span>
                  {['sph','cyl','axis','add'].map(f => (
                    <input key={f} type="number" step="0.25" className={inputCls}
                      placeholder={f === 'axis' ? '0-180' : '0.00'}
                      value={form[`${f}_${eye}`]}
                      onChange={e => set(`${f}_${eye}`, e.target.value)}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Lens Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Lens Configuration</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Lens Type" required>
              <select required className={selectCls} value={form.lens_type} onChange={e => { set('lens_type', e.target.value); setStockCheck(null); }}>
                {LENS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
            <Field label="Lens Index" required>
              <select required className={selectCls} value={form.lens_index} onChange={e => { set('lens_index', e.target.value); setStockCheck(null); }}>
                {LENS_INDEXES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Coating" required>
              <select required className={selectCls} value={form.coating} onChange={e => { set('coating', e.target.value); setStockCheck(null); }}>
                {COATINGS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select>
            </Field>
          </div>

          <button type="button" onClick={checkStock}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
            Check Stock Availability
          </button>

          {stockCheck && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium ${stockCheck.available ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {stockCheck.available ? 'Yes' : 'No'} {stockCheck.message}
            </div>
          )}
        </div>

        {/* Frame & Order Meta */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Frame & Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Frame Brand">
              <input className={inputCls} value={form.frame_brand} onChange={e => set('frame_brand', e.target.value)} />
            </Field>
            <Field label="Frame Model">
              <input className={inputCls} value={form.frame_model} onChange={e => set('frame_model', e.target.value)} />
            </Field>
            <Field label="Source Channel" required>
              <select required className={selectCls} value={form.source_channel} onChange={e => set('source_channel', e.target.value)}>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            {loading ? 'Creating...' : 'Create Order'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
