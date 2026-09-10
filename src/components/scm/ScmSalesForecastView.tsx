import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { mockSalesForecasts } from '../../data/mockScmData';
import { SalesForecastEntry } from '../../types/scm';

interface ScmSalesForecastViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmSalesForecastView: React.FC<ScmSalesForecastViewProps> = ({ onNavigate, showToast }) => {
  const [forecasts, setForecasts] = useState<SalesForecastEntry[]>(mockSalesForecasts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForecast, setSelectedForecast] = useState<SalesForecastEntry | null>(mockSalesForecasts[0]);

  // Form State
  const [formData, setFormData] = useState({
    customer: 'Hyundai Mobis Automotive',
    itemCode: 'FG-BUMP-01',
    itemName: 'Front Bumper Fascia Shell',
    productFamily: 'Exterior Trim',
    periodType: 'Monthly' as const,
    periodValue: 'October 2026',
    forecastQty: 15000,
    uom: 'PCS',
    priceEstimate: 1250,
    probabilityPct: 90,
    source: 'EDI / JIT Schedule' as const,
    salesperson: 'Rajesh Mehra',
    notes: '',
  });

  const handleCreateForecast = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: SalesForecastEntry = {
      id: `FC-2026-0${forecasts.length + 84}`,
      ...formData,
      status: 'Submitted',
      lastUpdated: 'Just now',
      actualSalesOrderQty: 0,
      actualDeliveredQty: 0,
      varianceQty: 0,
      variancePct: 0,
      accuracyPct: 100,
    };
    setForecasts([newEntry, ...forecasts]);
    setSelectedForecast(newEntry);
    setIsModalOpen(false);
    showToast(`Created Forecast ${newEntry.id} for ${newEntry.customer}`);
  };

  const handleApprove = (id: string) => {
    setForecasts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'Approved', lastUpdated: 'Today' } : f))
    );
    showToast(`Forecast ${id} approved by Demand Planning Team`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold uppercase">
              Sales Forecasting
            </span>
            <span className="text-xs text-slate-500">· EDI / JIT / CRM Pipeline Intake</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Sales Forecast Management &amp; Consumption Tracker
          </h1>
          <p className="text-slate-500 text-xs">
            Manage bottom-up forecast submissions from sales managers, customer portals, and EDI release schedules with real-time order consumption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Forecast Entry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Forecast List & Detailed Comparison Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast List (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
              Forecast Submissions &amp; Pipeline ({forecasts.length})
            </h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Account or Part..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Forecast ID</th>
                  <th className="p-3">Customer &amp; Part</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Forecast Qty</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {forecasts.map((fc) => (
                  <tr
                    key={fc.id}
                    onClick={() => setSelectedForecast(fc)}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${
                      selectedForecast?.id === fc.id ? 'bg-[#0F8B8D]/5' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{fc.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{fc.customer}</div>
                      <div className="text-[11px] text-slate-500">{fc.itemCode} - {fc.itemName}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{fc.periodValue}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {fc.forecastQty.toLocaleString()} {fc.uom}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                        {fc.source}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fc.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {fc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {fc.status !== 'Approved' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(fc.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">✓ Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Forecast Consumption Panel (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase">
              Actual Order Consumption
            </span>
            <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk'] mt-0.5">
              {selectedForecast ? selectedForecast.id : 'Select a Forecast'}
            </h3>
            {selectedForecast && (
              <p className="text-xs text-slate-500">{selectedForecast.customer} · {selectedForecast.itemName}</p>
            )}
          </div>

          {selectedForecast ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Forecast Plan</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {selectedForecast.forecastQty.toLocaleString()} {selectedForecast.uom}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">₹{selectedForecast.priceEstimate} / unit</div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="text-[10px] text-blue-700 uppercase font-semibold">Actual Ordered</div>
                  <div className="text-base font-bold font-mono text-blue-950 mt-1">
                    {selectedForecast.actualSalesOrderQty.toLocaleString()} {selectedForecast.uom}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                    {((selectedForecast.actualSalesOrderQty / selectedForecast.forecastQty) * 100).toFixed(1)}% Consumed
                  </div>
                </div>
              </div>

              {/* Progress Visualizer */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600 font-semibold text-[11px]">
                  <span>Order Consumption Fulfillment</span>
                  <span>{selectedForecast.actualDeliveredQty.toLocaleString()} Delivered</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-3"
                    style={{
                      width: `${Math.min(100, (selectedForecast.actualDeliveredQty / selectedForecast.forecastQty) * 100)}%`,
                    }}
                    title="Delivered"
                  />
                  <div
                    className="bg-blue-400 h-3"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((selectedForecast.actualSalesOrderQty - selectedForecast.actualDeliveredQty) /
                            selectedForecast.forecastQty) *
                            100
                        )
                      )}%`,
                    }}
                    title="Pending Open Orders"
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Delivered (
                    {selectedForecast.actualDeliveredQty.toLocaleString()})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> Open SO (
                    {(selectedForecast.actualSalesOrderQty - selectedForecast.actualDeliveredQty).toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Forecast Variance Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Variance Quantity:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedForecast.varianceQty > 0 ? `+${selectedForecast.varianceQty}` : selectedForecast.varianceQty} {selectedForecast.uom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy Rating:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedForecast.accuracyPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sales Probability:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedForecast.probabilityPct}% Confidence</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lead Salesperson:</span>
                  <span className="font-semibold text-slate-800">{selectedForecast.salesperson}</span>
                </div>
              </div>

              {selectedForecast.notes && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-[11px] border border-amber-200">
                  <strong>Planner Notes:</strong> {selectedForecast.notes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-xs">Select a forecast from the list to view variance details.</p>
          )}
        </div>
      </div>

      {/* New Forecast Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
                New Sales Forecast Entry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForecast} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Account</label>
                  <input
                    type="text"
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Forecast Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.forecastQty}
                    onChange={(e) => setFormData({ ...formData, forecastQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Period (Month / Quarter)</label>
                  <input
                    type="text"
                    required
                    value={formData.periodValue}
                    onChange={(e) => setFormData({ ...formData, periodValue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Source Pipeline</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="EDI / JIT Schedule">EDI / JIT Schedule</option>
                    <option value="Customer Portal">Customer Portal</option>
                    <option value="Salesperson">Salesperson</option>
                    <option value="CRM Opportunity">CRM Opportunity</option>
                    <option value="Historical Trend">Historical Trend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.probabilityPct}
                    onChange={(e) => setFormData({ ...formData, probabilityPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Planner Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context on tooling status or festival surge..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E8622C] text-white rounded-lg text-xs font-bold hover:bg-[#d45422]"
                >
                  Save &amp; Submit Forecast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
