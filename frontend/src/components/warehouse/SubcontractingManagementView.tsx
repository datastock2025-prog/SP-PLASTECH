import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Building,
  Layers,
  FileText,
} from 'lucide-react';
import { SubcontractOrder } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  orders: SubcontractOrder[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateOrder?: (order: SubcontractOrder) => void;
  onCreateOrder?: (order: SubcontractOrder) => void;
}

export const SubcontractingManagementView: React.FC<Props> = ({
  orders,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateOrder,
  onCreateOrder,
}) => {
  const [orderList, setOrderList] = useState<SubcontractOrder[]>(orders);

  const handleReceiveJobWork = (order: SubcontractOrder) => {
    let receivedQty = order.quantitySent - order.rejectionScrapQuantity;
    let scrapQty = order.rejectionScrapQuantity;

    openDrawer(
      `Receive Job-Work Return &mdash; ${order.orderNumber}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 text-sm">{order.materialSentName}</div>
          <div className="text-slate-500 font-mono">
            Vendor: {order.vendorName} &bull; Process: {order.processType}
          </div>
          <div className="text-slate-600">Dispatched: <span className="font-bold">{order.quantitySent.toLocaleString()} {order.uom}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Good Quantity Received</label>
            <input
              type="number"
              defaultValue={receivedQty}
              onChange={(e) => (receivedQty = parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-600 focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Scrap / Plating Rejects</label>
            <input
              type="number"
              defaultValue={scrapQty}
              onChange={(e) => (scrapQty = parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-rose-600 focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updated: SubcontractOrder = {
              ...order,
              quantityReceived: receivedQty,
              rejectionScrapQuantity: scrapQty,
              status: 'completed',
            };
            setOrderList((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
            if (onUpdateOrder) onUpdateOrder(updated);
            closeDrawer();
            showToast(`Received ${receivedQty} ${order.uom} from ${order.vendorName}`);
          }}
          className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold"
        >
          Post Inward Job-Work GRN
        </button>
      </div>
    );
  };

  const openNewSubcontractDrawer = () => {
    let vendor = 'Apex Electroplating & Metallizing Works';
    let process: any = 'Electroplating (Bright Chrome)';
    let item = 'FG-AUTO-BEZEL-RAW (Molded Raw ABS Automotive Trim)';
    let qty = 2000;
    let rate = 18.5;

    openDrawer(
      'Issue New Subcontract (Job-Work) Order',
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Subcontracting Vendor</label>
          <input
            type="text"
            defaultValue={vendor}
            onChange={(e) => (vendor = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Job-Work Process Type</label>
          <select
            defaultValue={process}
            onChange={(e) => (process = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="Electroplating (Bright Chrome)">Electroplating (Bright Chrome)</option>
            <option value="Screen & Pad Printing">Screen &amp; Pad Printing</option>
            <option value="Ultrasonic Plastic Welding">Ultrasonic Plastic Welding</option>
            <option value="Hot Stamping & Laser Etching">Hot Stamping &amp; Laser Etching</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Material Sent for Processing</label>
          <input
            type="text"
            defaultValue={item}
            onChange={(e) => (item = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Dispatch Quantity (PCS)</label>
            <input
              type="number"
              defaultValue={qty}
              onChange={(e) => (qty = parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Job Rate (₹ / PC)</label>
            <input
              type="number"
              defaultValue={rate}
              onChange={(e) => (rate = parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newOrder: SubcontractOrder = {
              id: `SUBCON-${Date.now()}`,
              orderNumber: `SCO-2026-0${orderList.length + 20}`,
              vendorName: vendor,
              vendorCode: 'VEND-SUB-NEW',
              processType: process,
              materialSentSku: 'FG-PART-RAW',
              materialSentName: item,
              quantitySent: qty,
              quantityReceived: 0,
              uom: 'PCS',
              unitProcessingRate: rate,
              totalOrderCost: qty * rate,
              dispatchDate: new Date().toISOString().slice(0, 10),
              expectedReturnDate: '2026-09-06',
              status: 'dispatched',
              rejectionScrapQuantity: 0,
            };
            setOrderList((prev) => [newOrder, ...prev]);
            if (onCreateOrder) onCreateOrder(newOrder);
            closeDrawer();
            showToast(`Created Subcontract Order ${newOrder.orderNumber}`);
          }}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold"
        >
          Issue Outward Delivery Challan
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-300 uppercase tracking-wider">
              Outsourced Manufacturing &middot; Job Work
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Subcontracting &amp; Outside Job-Work Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Delivery challans, chrome electroplating, pad printing, and material reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewSubcontractDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> + New Subcontract Challan
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderList.map((order) => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#14213D]">{order.orderNumber}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    {order.processType}
                  </span>
                </div>
                <WarehouseStatusBadge status={order.status} size="xs" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#14213D]">{order.materialSentName}</h3>
                <div className="text-xs text-slate-600 mt-0.5">
                  Vendor: <span className="font-bold text-slate-800">{order.vendorName}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Quantity Dispatched:</span>
                  <span className="font-bold text-[#14213D]">{order.quantitySent.toLocaleString()} {order.uom}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Quantity Received:</span>
                  <span className="font-bold text-emerald-600">{order.quantityReceived.toLocaleString()} {order.uom}</span>
                </div>
                {order.rejectionScrapQuantity > 0 && (
                  <div className="flex justify-between text-rose-600 font-mono">
                    <span>Rejection Scrap:</span>
                    <span className="font-bold">{order.rejectionScrapQuantity} {order.uom}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200 mt-1">
                  <span>Rate: ₹{order.unitProcessingRate}/{order.uom}</span>
                  <span>Due: {order.expectedReturnDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              {order.status !== 'completed' ? (
                <button
                  onClick={() => handleReceiveJobWork(order)}
                  className="w-full py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Receive Inward Return
                </button>
              ) : (
                <div className="w-full text-center py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                  Fully Received &amp; Reconciled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
