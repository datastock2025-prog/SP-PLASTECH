import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Truck,
  Box,
  Cpu,
  FileCheck,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { mockOrderTimelines } from '../../data/mockScmData';
import { OrderTimelineItem } from '../../types/scm';

interface ScmOrderTimelineViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmOrderTimelineView: React.FC<ScmOrderTimelineViewProps> = ({ onNavigate, showToast }) => {
  const [orders, setOrders] = useState<OrderTimelineItem[]>(mockOrderTimelines);
  const [selectedOrder, setSelectedOrder] = useState<OrderTimelineItem>(mockOrderTimelines[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(
    (o) =>
      o.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.partName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold uppercase">
              16-Stage Order-to-Delivery Lifecycle
            </span>
            <span className="text-xs text-slate-500">· Real-Time Pipeline Milestone Tracking</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Order Fulfillment Pipeline &amp; Bottleneck Diagnostics
          </h1>
          <p className="text-slate-500 text-xs">
            End-to-end milestone tracker from Sales Order creation and Mold Allocation to Molding Execution, Secondary Assembly, and In-Transit Milk Runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Refreshed real-time IoT machine stage timestamps')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>Sync Live Pipeline</span>
          </button>
        </div>
      </div>

      {/* Grid: Order Selector & 16-Stage Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
              Active Customer Orders ({orders.length})
            </h3>
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SO #, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                  selectedOrder.id === o.id
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{o.salesOrderNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.onTimeRisk === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : o.onTimeRisk === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Risk: {o.onTimeRisk}
                  </span>
                </div>
                <div className="font-bold text-slate-800">{o.customer}</div>
                <div className="text-[11px] text-slate-500">{o.partName} ({o.orderQty.toLocaleString()} PCS)</div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Current: <strong>{o.currentStage}</strong></span>
                  <span>Commit: {o.promisedDeliveryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (2 Cols): 16-Stage Detailed Stepper */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-mono text-[#0F8B8D] font-bold uppercase">
                Fulfillment Milestone Diagnostics
              </span>
              <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D] mt-0.5">
                {selectedOrder.salesOrderNumber} · {selectedOrder.customer}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedOrder.partName} · {selectedOrder.orderQty.toLocaleString()} Units · Commit: {selectedOrder.promisedDeliveryDate}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">Current Stage:</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg">
                {selectedOrder.currentStage}
              </span>
            </div>
          </div>

          {/* 16-Stage Interactive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedOrder.stages.map((st, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                  st.status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                    : st.status === 'in-progress'
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 text-blue-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold">Stage {idx + 1}</span>
                  {st.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {st.status === 'in-progress' && <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                </div>

                <div className="font-bold text-[11px] leading-tight text-slate-900">
                  {st.name}
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {st.timestamp || 'Pending'}
                </div>

                {st.exceptionNote && (
                  <div className="text-[9px] font-bold text-rose-700 bg-rose-100 p-1 rounded">
                    ⚠️ {st.exceptionNote}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div className="text-slate-600">
              Need to reschedule or expedite this customer order?
            </div>
            <button
              onClick={() => onNavigate('scmExceptions', { soNumber: selectedOrder.salesOrderNumber })}
              className="px-3.5 py-1.5 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-lg font-bold transition cursor-pointer"
            >
              Open CAPA Exception
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
