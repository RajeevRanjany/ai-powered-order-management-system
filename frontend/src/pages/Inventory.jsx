import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [recommendation, setRecommendation] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [editSku, setEditSku] = useState(null);
  const [editQty, setEditQty] = useState('');

  useEffect(() => {
    async function load() {
      const res = await inventoryAPI.list(showLowStock ? { low_stock: true } : {});
      setInventory(res.data.inventory);
    }
    load();
  }, [showLowStock]);

  async function handleStockUpdate(sku) {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) return;
    await inventoryAPI.updateStock(sku, qty);
    setEditSku(null);
    const res = await inventoryAPI.list(showLowStock ? { low_stock: true } : {});
    setInventory(res.data.inventory);
  }

  async function getRecommendations() {
    setLoadingRec(true);
    try {
      const res = await inventoryAPI.recommendations();
      setRecommendation(res.data.recommendation);
    } finally {
      setLoadingRec(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lens Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{inventory.length} SKUs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`text-sm px-4 py-2 rounded-lg font-medium border transition-colors ${showLowStock ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {showLowStock ? '⚠️ Low Stock' : 'All Stock'}
          </button>
          <button onClick={getRecommendations} disabled={loadingRec}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium">
            {loadingRec ? '...' : 'AI Recommendations'}
          </button>
        </div>
      </div>

      {recommendation && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">AI Stocking Recommendations</h3>
          <pre className="text-sm text-blue-900 whitespace-pre-wrap font-sans">{recommendation}</pre>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['SKU','Type','Index','Coating','SPH Range','CYL Range','In Stock','Reorder Pt','Status','Action'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map(item => {
                const isLow = item.quantity_on_hand <= item.reorder_point;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{item.sku}</td>
                    <td className="px-4 py-2.5 text-xs">{item.lens_type?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-2.5 text-xs">{item.lens_index}</td>
                    <td className="px-4 py-2.5 text-xs">{item.coating}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{item.sph_min} to {item.sph_max}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{item.cyl_min} to {item.cyl_max}</td>
                    <td className="px-4 py-2.5">
                      {editSku === item.sku ? (
                        <div className="flex items-center gap-1">
                          <input type="number" min="0"
                            className="w-16 border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none"
                            value={editQty} onChange={e => setEditQty(e.target.value)} />
                          <button onClick={() => handleStockUpdate(item.sku)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded">✓</button>
                          <button onClick={() => setEditSku(null)}
                            className="text-xs text-gray-400 px-1">✕</button>
                        </div>
                      ) : (
                        <span className={`text-xs font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.quantity_on_hand}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{item.reorder_point}</td>
                    <td className="px-4 py-2.5">
                      {isLow
                        ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Low Stock</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">OK</span>
                      }
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => { setEditSku(item.sku); setEditQty(String(item.quantity_on_hand)); }}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
