import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Unlink,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  MonthlyPlanOrder,
  PlasticSalesOrder,
  OrderRelationship,
} from '../../../types/salesOrderDeliveryTypes';

interface MonthlyDailyReconciliationProps {
  monthlyPlans: MonthlyPlanOrder[];
  dailyOrders: PlasticSalesOrder[];
  relationships: OrderRelationship[];
  onUpdateRelationships: (newRels: OrderRelationship[]) => void;
  showToast: (msg: string) => void;
}

export const MonthlyDailyReconciliation: React.FC<MonthlyDailyReconciliationProps> = ({
  monthlyPlans,
  dailyOrders,
  relationships,
  onUpdateRelationships,
  showToast,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState('Tata Motors Passenger Vehicles Ltd');
  const [selectedPeriod, setSelectedPeriod] = useState('September 2026');
  const [selectedPlanId, setSelectedPlanId] = useState('PLN-2026-09-01');
  const [selectedDailySoIds, setSelectedDailySoIds] = useState<string[]>([]);
  const [mappingReason, setMappingReason] = useState('JIT Call-Off synchronization against September forecast');
  const [mappingType, setMappingType] = useState('Reconciliation Only');

  // Customer options
  const customers = Array.from(new Set(monthlyPlans.map((p) => p.customer)));

  // Filtered monthly plans
  const filteredPlans = monthlyPlans.filter(
    (p) => p.customer === selectedCustomer && p.monthPeriod === selectedPeriod
  );
  const activePlan = monthlyPlans.find((p) => p.id === selectedPlanId) || filteredPlans[0];

  // Filtered daily orders for customer
  const filteredDailyOrders = dailyOrders.filter(
    (d) => d.customer === selectedCustomer
  );

  // Toggle selection
  const handleToggleSo = (soId: string) => {
    if (selectedDailySoIds.includes(soId)) {
      setSelectedDailySoIds(selectedDailySoIds.filter((id) => id !== soId));
    } else {
      setSelectedDailySoIds([...selectedDailySoIds, soId]);
    }
  };

  // Perform Mapping
  const handleMapOrders = () => {
    if (!activePlan) {
      showToast('Please select a Monthly Plan first.');
      return;
    }
    if (selectedDailySoIds.length === 0) {
      showToast('Please select at least one Daily Sales Order to map.');
      return;
    }

    const newRelationships: OrderRelationship[] = [...relationships];

    selectedDailySoIds.forEach((soId) => {
      const so = dailyOrders.find((d) => d.id === soId);
      if (so) {
        so.lines.forEach((line) => {
          newRelationships.push({
            id: `MAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            monthlyPlanId: activePlan.id,
            monthlyPlanLineItem: line.itemCode,
            linkedDailySoId: so.id,
            linkedDailySoLineItem: line.itemCode,
            linkType: 'Manually Mapped',
            linkedQuantity: line.orderedQty,
            remainingMonthlyQuantity: Math.max(0, activePlan.remainingPlanQty - line.orderedQty),
            mappingReason,
            mappedBy: 'Commercial Operations Team',
            mappingDate: '2026-09-12 11:50',
            approvalStatus: 'Approved',
          });
        });
      }
    });

    onUpdateRelationships(newRelationships);
    setSelectedDailySoIds([]);
    showToast(`Successfully mapped ${selectedDailySoIds.length} Daily Order(s) to Plan ${activePlan.id}.`);
  };

  // Unmap an existing relationship
  const handleUnmap = (relId: string) => {
    const updated = relationships.filter((r) => r.id !== relId);
    onUpdateRelationships(updated);
    showToast('Order mapping removed. Daily order restored to unlinked state.');
  };

  return (
    <div className="space-y-4">
      {/* Header with Explanatory Architecture Note */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-800">
              <Layers className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Monthly Plan vs. Daily Orders Reconciliation Workbench
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manual reconciliation bridge between broad monthly commitments and independent daily dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('AI Auto-Suggestion: Mapped SO-5001 to PLN-2026-09-01 based on customer and part codes.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Auto-Suggest Mappings
          </button>
          <button
            onClick={() => showToast('Exported Reconciliation Audit Report (PDF).')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" /> Export Audit
          </button>
        </div>
      </div>

      {/* Top Filter Controls */}
      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="text-gray-500 font-medium">Customer Account</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900 font-semibold"
          >
            {customers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-500 font-medium">Plan Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900 font-semibold"
          >
            <option value="September 2026">September 2026</option>
            <option value="October 2026">October 2026</option>
          </select>
        </div>

        <div>
          <label className="text-gray-500 font-medium">Reconciliation Mode</label>
          <select
            value={mappingType}
            onChange={(e) => setMappingType(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900"
          >
            <option value="Reconciliation Only">Reconciliation Only (Independent Billing)</option>
            <option value="Forecast Consumption">Forecast Consumption</option>
            <option value="Rate Contract Drawdown">Rate Contract Drawdown</option>
          </select>
        </div>
      </div>

      {/* Two-Panel Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel: Monthly Plan Orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Monthly Supply Plans ({filteredPlans.length})
            </h3>
            <span className="text-[10px] text-gray-400">Select active plan</span>
          </div>

          <div className="space-y-2">
            {filteredPlans.map((plan) => {
              const isSelected = activePlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#0F8B8D]">{plan.id}</span>
                    <span className="font-bold text-gray-900">{plan.monthPeriod}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    Plant: {plan.plant.split('-')[0]} &bull; {plan.fgStore}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100 text-[11px]">
                    <div>
                      <span className="text-gray-400">Planned:</span>
                      <div className="font-bold text-gray-900">{plan.totalPlannedQty.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Supplied:</span>
                      <div className="font-bold text-emerald-700">{plan.totalDailySuppliedQty.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Remaining:</span>
                      <div className="font-bold text-amber-700">{plan.remainingPlanQty.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Line Items for Active Plan */}
          {activePlan && (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <h4 className="font-bold text-gray-700 text-[11px] uppercase">
                Plan Product Targets ({activePlan.items.length})
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2">Item Code</th>
                      <th className="p-2 text-right">Planned</th>
                      <th className="p-2 text-right">Supplied</th>
                      <th className="p-2 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activePlan.items.map((it) => (
                      <tr key={it.itemCode}>
                        <td className="p-2 font-mono font-bold text-gray-900">{it.itemCode}</td>
                        <td className="p-2 text-right font-semibold">{it.plannedQty.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{it.deliveredQty.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-amber-700">{it.remainingQty.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Daily Sales Orders for Mapping */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Daily Sales Orders Available ({filteredDailyOrders.length})
            </h3>
            <span className="text-[10px] text-gray-400">Check boxes to map</span>
          </div>

          <div className="space-y-2">
            {filteredDailyOrders.map((dOrder) => {
              const isChecked = selectedDailySoIds.includes(dOrder.id);
              const isAlreadyLinked = Boolean(dOrder.monthlyPlanRef);

              return (
                <div
                  key={dOrder.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : isAlreadyLinked
                      ? 'border-blue-200 bg-blue-50/20'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSo(dOrder.id)}
                      className="mt-1 rounded text-emerald-600 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gray-900">{dOrder.id}</span>
                        <span className="font-bold font-mono text-gray-800">
                          ₹{dOrder.totalOrderValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Date: {dOrder.orderDate} | PO: {dOrder.customerPoNumber}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 text-[10px]">
                        <span className="text-gray-500">
                          {dOrder.lines.map((l) => `${l.itemCode} (${l.orderedQty})`).join(', ')}
                        </span>
                        {isAlreadyLinked ? (
                          <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                            Mapped to {dOrder.monthlyPlanRef}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                            Unlinked (Independent)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mapping Control Bar */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2 mt-4">
            <label className="text-[11px] font-semibold text-gray-700">Mapping Audit Reason:</label>
            <input
              type="text"
              value={mappingReason}
              onChange={(e) => setMappingReason(e.target.value)}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white text-gray-900"
            />

            <button
              onClick={handleMapOrders}
              disabled={selectedDailySoIds.length === 0}
              className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm ${
                selectedDailySoIds.length > 0
                  ? 'bg-[#0F8B8D] hover:bg-[#0c7072] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Map {selectedDailySoIds.length} Selected Daily Order(s) to Plan {activePlan?.id}
            </button>
          </div>
        </div>
      </div>

      {/* Active Mapping Relationships Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs space-y-3">
        <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
          Current Order Relationships & Reconciliation Audit Log ({relationships.length})
        </h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
              <tr>
                <th className="p-2.5">Map ID</th>
                <th className="p-2.5">Monthly Plan ID</th>
                <th className="p-2.5">Daily SO #</th>
                <th className="p-2.5">Product Code</th>
                <th className="p-2.5 text-right">Mapped Qty</th>
                <th className="p-2.5">Mapped By & Date</th>
                <th className="p-2.5">Audit Note</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {relationships.map((rel) => (
                <tr key={rel.id} className="hover:bg-gray-50">
                  <td className="p-2.5 font-mono text-gray-500">{rel.id}</td>
                  <td className="p-2.5 font-mono font-bold text-blue-700">{rel.monthlyPlanId}</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-700">{rel.linkedDailySoId}</td>
                  <td className="p-2.5 font-mono text-gray-900">{rel.monthlyPlanLineItem}</td>
                  <td className="p-2.5 text-right font-bold text-gray-900">{rel.linkedQuantity.toLocaleString()} PCS</td>
                  <td className="p-2.5">
                    <div>{rel.mappedBy}</div>
                    <div className="text-[10px] text-gray-400">{rel.mappingDate}</div>
                  </td>
                  <td className="p-2.5 text-gray-600 max-w-[200px] truncate" title={rel.mappingReason}>
                    {rel.mappingReason}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleUnmap(rel.id)}
                      className="text-red-600 hover:text-red-800 font-semibold text-[11px]"
                    >
                      Unmap
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
