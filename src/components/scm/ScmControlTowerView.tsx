import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Play,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  Send,
  Sliders,
} from 'lucide-react';
import {
  mockScmKPIs,
  mockSupplyChainFlowNodes,
  mockScmExceptions,
  mockMrpSuggestions,
  mockInboundShipments,
  mockOutboundDeliveries,
} from '../../data/mockScmData';
import { SCMViewType } from '../../types/scm';

interface ScmControlTowerViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmControlTowerView: React.FC<ScmControlTowerViewProps> = ({ onNavigate, showToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>('mrp');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState<string>('');

  const activeExceptions = mockScmExceptions.filter((e) => e.status !== 'Closed');

  const handleRunMRP = () => {
    showToast('Running MRP Engine across 18 Injection Machines & 142 SKUs...');
    setTimeout(() => {
      showToast('MRP Calculation complete: 4 Purchase Requisitions & 2 Production suggestions generated.');
    }, 1200);
  };

  const handleExecuteQuickAction = (actionName: string) => {
    setActiveModal(actionName);
  };

  const submitQuickAction = () => {
    showToast(`Action executed: ${activeModal} (${actionInput || 'Applied to active queue'})`);
    setActiveModal(null);
    setActionInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1C2B4D] to-[#0F8B8D] p-6 rounded-2xl text-white shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
              Live SCM Control Tower
            </span>
            <span className="flex items-center gap-1 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black font-['Space_Grotesk'] mt-1 tracking-tight">
            Plastic Manufacturing Supply Chain Command Center
          </h1>
          <p className="text-slate-200 text-xs max-w-3xl mt-1">
            End-to-end visibility across polymer demand, supplier JIT schedules, resin volatility, multi-echelon MRP, shop-floor buffer staging, and outbound OEM logistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunMRP}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run MRP Simulation</span>
          </button>
          <button
            onClick={() => onNavigate('scmExceptions')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition cursor-pointer backdrop-blur-xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>{activeExceptions.length} Active Exceptions</span>
          </button>
          <button
            onClick={() => showToast('Refreshed all SCM IoT gateways, ERP inventories & carrier telemetry')}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 8 Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {mockScmKPIs.slice(0, 8).map((kpi, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-all ${
              kpi.status === 'critical'
                ? 'bg-rose-50/80 border-rose-200 shadow-2xs'
                : kpi.status === 'warning'
                ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="truncate">{kpi.label.split('(')[0]}</span>
              {kpi.status === 'critical' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
              {kpi.status === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
            <div className="text-lg font-bold font-['Space_Grotesk'] text-[#14213D] mt-1 truncate">
              {kpi.value}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              {kpi.subValue}
            </div>
          </div>
        ))}
      </div>

      {/* Supply Chain Flow Map */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
                End-to-End Visual Supply Chain Flow Map
              </h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                13 Linked Operational Nodes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive pipeline from Customer Demand forecast down to line-side OEM assembly delivery. Click any node to drill into live operational workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Healthy
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Warning / Bottleneck
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Critical Shortage
            </span>
          </div>
        </div>

        {/* Horizontal Pipeline Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {mockSupplyChainFlowNodes.map((node, index) => {
            const isSel = selectedNode === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNode(node.id);
                  onNavigate(node.targetView);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSel
                    ? 'ring-2 ring-[#0F8B8D] bg-[#0F8B8D]/5 border-[#0F8B8D]'
                    : node.status === 'critical'
                    ? 'bg-rose-50/50 border-rose-300 hover:bg-rose-50'
                    : node.status === 'warning'
                    ? 'bg-amber-50/50 border-amber-300 hover:bg-amber-50'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      #{index + 1} {node.shortCode}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        node.status === 'critical'
                          ? 'bg-rose-500 animate-ping'
                          : node.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="font-bold text-xs text-[#14213D] mt-2 group-hover:text-[#0F8B8D] transition-colors">
                    {node.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {node.valueSummary}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700">{node.recordCount} records</span>
                  {node.exceptionsCount > 0 && (
                    <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                      {node.exceptionsCount} alerts
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Exception Command & Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Exceptions & Critical MRP Shortages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Exceptions Command Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
                    Critical Supply Chain Exception Alerts &amp; Interventions
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Real-time automated alerts requiring planner resolution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('scmExceptions')}
                className="text-xs text-[#0F8B8D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View All Exceptions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {mockScmExceptions.slice(0, 3).map((exc) => (
                <div
                  key={exc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    exc.severity === 'Critical'
                      ? 'bg-rose-50/40 border-rose-200'
                      : exc.severity === 'High'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          exc.severity === 'Critical'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {exc.severity}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{exc.id}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-xs text-slate-700">{exc.category} Exception</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-xs">{exc.customerOrSupplier}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Due: {exc.dueDate}</span>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-slate-900">
                    {exc.itemCode ? `${exc.itemCode} - ${exc.itemName}: ` : ''}
                    <span className="text-slate-700 font-normal">{exc.impact}</span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Action:</strong> {exc.recommendedAction}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          showToast(`Opened resolution modal for ${exc.id}`);
                          onNavigate('scmExceptions', { exceptionId: exc.id });
                        }}
                        className="px-3 py-1 bg-[#14213D] text-white hover:bg-[#1C2B4D] rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MRP Suggestions Action Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0F8B8D]/10 text-[#0F8B8D] rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
                    Immediate MRP Supply &amp; Production Actions
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Automated recommendations calculated based on BOM explosion, resin MOQ, and customer JIT releases.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('scmMRP')}
                className="text-xs text-[#0F8B8D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full MRP Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Item / Resin</th>
                    <th className="p-3">Required By</th>
                    <th className="p-3">Shortage Qty</th>
                    <th className="p-3">Suggested Order</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Supplier / Resource</th>
                    <th className="p-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {mockMrpSuggestions.map((mrp) => (
                    <tr key={mrp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{mrp.itemCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{mrp.itemName}</div>
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-700">{mrp.requiredDate}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">
                        {mrp.projectedShortage.toLocaleString()} {mrp.uom}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {mrp.suggestedOrderQty.toLocaleString()} {mrp.uom}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mrp.supplyType === 'Purchase'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {mrp.supplyType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[150px]">{mrp.preferredSupplier}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => showToast(`Created Requisition for ${mrp.itemCode} (${mrp.suggestedOrderQty} ${mrp.uom})`)}
                          className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                        >
                          Convert to PO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Quick Action Deck & Operational Widgets */}
        <div className="space-y-6">
          {/* Quick Action Command Deck */}
          <div className="bg-[#14213D] p-5 rounded-2xl text-white shadow-md space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#0F8B8D] font-bold uppercase tracking-wider font-mono">
                  Planner Command Deck
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 text-slate-300 rounded font-mono">
                  1-Click Action Hub
                </span>
              </div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] mt-1">
                Operational Action Triggers
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => handleExecuteQuickAction('Create Purchase Requisition')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Purchase Requisition</span>
              </button>

              <button
                onClick={() => handleExecuteQuickAction('Expedite Purchase Order')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Expedite Open PO</span>
              </button>

              <button
                onClick={() => handleExecuteQuickAction('Reschedule Machine Work Order')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Reschedule Work Order</span>
              </button>

              <button
                onClick={() => handleExecuteQuickAction('Allocate Virgin / Regrind Stock')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Allocate Resin Stock</span>
              </button>

              <button
                onClick={() => onNavigate('scmSupplierCollaboration')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Building className="w-4 h-4 text-orange-400" />
                <span>Notify Supplier (EDI/ASN)</span>
              </button>

              <button
                onClick={() => onNavigate('scmOutboundLogistics')}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-left font-semibold transition cursor-pointer flex flex-col justify-between h-[80px]"
              >
                <Truck className="w-4 h-4 text-teal-400" />
                <span>Track JIT Outbound Fleet</span>
              </button>
            </div>
          </div>

          {/* Inbound Freight Tracker Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0F8B8D]" />
                <h4 className="font-bold text-slate-900 font-['Space_Grotesk']">Inbound Shipments in Transit</h4>
              </div>
              <button
                onClick={() => onNavigate('scmInboundLogistics')}
                className="text-[11px] text-[#0F8B8D] font-bold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {mockInboundShipments.map((inb) => (
                <div key={inb.shipmentId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{inb.shipmentId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inb.status === 'Customs Clearance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inb.status}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{inb.supplierName}</div>
                  <div className="text-slate-500 text-[10px] flex items-center justify-between pt-1">
                    <span>ETA: <strong className="text-slate-700">{inb.expectedArrivalDate}</strong></span>
                    <span>{inb.totalWeightKg.toLocaleString()} KG ({inb.modeOfTransport})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer JIT Outbound Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 font-['Space_Grotesk']">Customer JIT Outbound Deliveries</h4>
              </div>
              <button
                onClick={() => onNavigate('scmOutboundLogistics')}
                className="text-[11px] text-[#0F8B8D] font-bold hover:underline"
              >
                Live PODs
              </button>
            </div>

            <div className="space-y-2.5">
              {mockOutboundDeliveries.map((outb) => (
                <div key={outb.deliveryNoteNumber} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{outb.deliveryNoteNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {outb.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">{outb.customerName}</div>
                  <div className="text-slate-500 text-[11px] truncate">{outb.itemSummary}</div>
                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>Carrier: {outb.carrier.split(' ')[0]}</span>
                    <span className="font-mono text-indigo-700 font-bold">{outb.podStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Action Drawer for Quick Execution */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
                Execute Action: {activeModal}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Specify reference document number, SKU code, or target plant to dispatch this instruction directly to procurement and shop-floor controllers.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Identifier / Work Order / PO / Resin Code:</label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-8819 or RM-PP-101"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-[11px] space-y-1">
                <strong>System Safety Check:</strong>
                <p>This action will log an immutable entry into the SCM audit ledger and notify assigned plant superintendents via SMS/Email broadcast.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitQuickAction}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
              >
                Confirm &amp; Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
