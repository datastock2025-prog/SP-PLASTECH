import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Copy,
  Upload,
  Clipboard,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  SalesOrderLineItem,
} from '../../../types/salesOrderDeliveryTypes';

interface DailyOrderQuickEntryProps {
  onSaveOrder: (order: PlasticSalesOrder, autoDelivery?: boolean) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

interface QuickRow {
  id: string;
  itemCode: string;
  itemName: string;
  customerItemCode: string;
  hsn: string;
  availableStock: number;
  qty: number;
  uom: string;
  unitPrice: number;
  gstRate: number;
  deliveryDate: string;
  batchPreference: string;
  polymerGrade: string;
  mouldCode: string;
}

const CATALOG_ITEMS = [
  {
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    customerItemCode: 'TATA-7890-DSB',
    hsn: '39269099',
    availableStock: 8200,
    unitPrice: 55.0,
    polymerGrade: 'LG Chem ABS-HI121H',
    mouldCode: 'M-104-ABS-2C',
  },
  {
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    customerItemCode: 'TATA-4412-ADH',
    hsn: '39269099',
    availableStock: 4600,
    unitPrice: 42.0,
    polymerGrade: 'Reliance Repol H110MA',
    mouldCode: 'M-088-PP-1C',
  },
  {
    itemCode: 'FG-FLIP-28',
    itemName: '28mm PP Flip-Top Dispenser Cap (Parachute Blue)',
    customerItemCode: 'MAR-CAP-28B',
    hsn: '39235010',
    availableStock: 20000,
    unitPrice: 15.0,
    polymerGrade: 'Indian Polymers PP MI 30',
    mouldCode: 'M-032-CAP-16C',
  },
  {
    itemCode: 'FG-MOTO-088',
    itemName: 'Nylon-6 Reinforced Rear Mudguard Cowl',
    customerItemCode: 'BAJ-CWL-900',
    hsn: '39269099',
    availableStock: 9500,
    unitPrice: 95.0,
    polymerGrade: 'BASF Ultramid PA6',
    mouldCode: 'M-090-COWL-1C',
  },
];

export const DailyOrderQuickEntry: React.FC<DailyOrderQuickEntryProps> = ({
  onSaveOrder,
  onCancel,
  showToast,
}) => {
  // Header State
  const [customer, setCustomer] = useState('Tata Motors Passenger Vehicles Ltd');
  const [orderDate, setOrderDate] = useState('2026-09-12');
  const [plant, setPlant] = useState('Plant 1 - Pimpri Auto-Hub');
  const [fgStore, setFgStore] = useState('FG-Automotive Cell');
  const [customerPoNumber, setCustomerPoNumber] = useState('PO-TM-JIT-9921');

  // Customer metadata mock
  const isInterState = customer.includes('Maruti');
  const customerCreditAvailable = customer.includes('Bajaj') ? -450000 : 8580000;

  // Grid Rows State
  const [rows, setRows] = useState<QuickRow[]>([
    {
      id: 'row-1',
      itemCode: 'FG-AUTO-012',
      itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
      customerItemCode: 'TATA-7890-DSB',
      hsn: '39269099',
      availableStock: 8200,
      qty: 2500,
      uom: 'PCS',
      unitPrice: 55.0,
      gstRate: 18,
      deliveryDate: '2026-09-13',
      batchPreference: 'FEFO Strict',
      polymerGrade: 'LG Chem ABS-HI121H',
      mouldCode: 'M-104-ABS-2C',
    },
    {
      id: 'row-2',
      itemCode: 'FG-AUTO-045',
      itemName: 'PP Air Duct Housing - Front Left',
      customerItemCode: 'TATA-4412-ADH',
      hsn: '39269099',
      availableStock: 4600,
      qty: 1500,
      uom: 'PCS',
      unitPrice: 42.0,
      gstRate: 18,
      deliveryDate: '2026-09-13',
      batchPreference: 'FIFO Standard',
      polymerGrade: 'Reliance Repol H110MA',
      mouldCode: 'M-088-PP-1C',
    },
  ]);

  // Row Manipulation
  const handleAddRow = () => {
    const defaultCatalog = CATALOG_ITEMS[0];
    const newRow: QuickRow = {
      id: `row-${Date.now()}`,
      itemCode: defaultCatalog.itemCode,
      itemName: defaultCatalog.itemName,
      customerItemCode: defaultCatalog.customerItemCode,
      hsn: defaultCatalog.hsn,
      availableStock: defaultCatalog.availableStock,
      qty: 1000,
      uom: 'PCS',
      unitPrice: defaultCatalog.unitPrice,
      gstRate: 18,
      deliveryDate: '2026-09-13',
      batchPreference: 'FEFO Strict',
      polymerGrade: defaultCatalog.polymerGrade,
      mouldCode: defaultCatalog.mouldCode,
    };
    setRows([...rows, newRow]);
  };

  const handleItemSelect = (index: number, code: string) => {
    const item = CATALOG_ITEMS.find((c) => c.itemCode === code);
    if (!item) return;
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      itemCode: item.itemCode,
      itemName: item.itemName,
      customerItemCode: item.customerItemCode,
      hsn: item.hsn,
      availableStock: item.availableStock,
      unitPrice: item.unitPrice,
      polymerGrade: item.polymerGrade,
      mouldCode: item.mouldCode,
    };
    setRows(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...rows];
    updated[index].qty = qty;
    setRows(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...rows];
    updated[index].unitPrice = price;
    setRows(updated);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length === 1) {
      showToast('At least one product line required.');
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  // Quick Action Buttons
  const handleDuplicateYesterday = () => {
    setCustomerPoNumber(`PO-JIT-COPY-${Math.floor(1000 + Math.random() * 9000)}`);
    showToast("Duplicated yesterday's dispatch profile into entry grid.");
  };

  const handlePasteClipboard = () => {
    showToast('Clipboard TSV parsed: 2 items appended.');
  };

  // Aggregates
  const totalItems = rows.length;
  const totalQuantity = rows.reduce((sum, r) => sum + r.qty, 0);
  const totalTaxable = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0);
  const totalGst = totalTaxable * 0.18;
  const totalOrderValue = totalTaxable + totalGst;
  const remainingCreditAfterOrder = customerCreditAvailable - totalOrderValue;
  const isEwbMandatory = totalOrderValue > 50000;

  const handleSave = (confirmed: boolean, autoDelivery = false) => {
    const lines: SalesOrderLineItem[] = rows.map((r, idx) => ({
      lineNumber: idx + 1,
      itemCode: r.itemCode,
      itemName: r.itemName,
      customerItemCode: r.customerItemCode,
      hsn: r.hsn,
      orderedQty: r.qty,
      allocatedQty: r.qty,
      pickedQty: 0,
      packedQty: 0,
      deliveredQty: 0,
      invoicedQty: 0,
      remainingQty: r.qty,
      uom: r.uom,
      plant,
      fgStore,
      batchPreference: r.batchPreference,
      requestedDeliveryDate: r.deliveryDate,
      availableStock: r.availableStock,
      reservedStock: r.qty,
      shortageQty: Math.max(0, r.qty - r.availableStock),
      status: r.qty > r.availableStock ? 'Shortage' : 'In Stock',
      unitPrice: r.unitPrice,
      discountPct: 0,
      taxableValue: r.qty * r.unitPrice,
      gstRatePct: r.gstRate,
      cgstAmount: isInterState ? 0 : r.qty * r.unitPrice * 0.09,
      sgstAmount: isInterState ? 0 : r.qty * r.unitPrice * 0.09,
      igstAmount: isInterState ? r.qty * r.unitPrice * 0.18 : 0,
      cessAmount: 0,
      totalValue: r.qty * r.unitPrice * 1.18,
      polymerGrade: r.polymerGrade,
      mouldCode: r.mouldCode,
    }));

    const newSo: PlasticSalesOrder = {
      id: `SO-5${Math.floor(100 + Math.random() * 899)}`,
      orderType: 'Daily Sales Order',
      customer,
      customerGstin: '27AAACT2727Q1ZW',
      customerPoNumber,
      customerPoDate: orderDate,
      orderDate,
      requiredDeliveryDate: rows[0]?.deliveryDate || orderDate,
      linkType: 'Not Linked',
      salesperson: 'Ramesh Patel',
      currency: 'INR',
      paymentTerms: 'Net 45 Days PDC',
      priceList: 'Tier-1 Automotive OEM Matrix 2026',
      plant,
      fgStore,
      billingAddress: {
        line1: 'Industrial Zone',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411018',
        gstin: '27AAACT2727Q1ZW',
        placeOfSupply: '27-Maharashtra',
      },
      shippingAddress: {
        line1: 'Plant Dock 3',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411018',
        gstin: '27AAACT2727Q1ZW',
        dispatchPoint: 'Plant 1 Gate 2',
      },
      status: confirmed ? 'Confirmed' : 'Draft',
      creditStatus: remainingCreditAfterOrder >= 0 ? 'Approved' : 'Hold',
      creditLimit: 15000000,
      currentExposure: 6420000,
      availableCredit: customerCreditAvailable,
      deliveryStatus: 'Not Started',
      invoiceStatus: 'Uninvoiced',
      eInvoiceStatus: 'Pending',
      eWayBillStatus: 'Pending',
      taxableAmount: totalTaxable,
      cgstTotal: isInterState ? 0 : totalGst / 2,
      sgstTotal: isInterState ? 0 : totalGst / 2,
      igstTotal: isInterState ? totalGst : 0,
      cessTotal: 0,
      freightAmount: 3500,
      packingAmount: 1500,
      totalOrderValue,
      deliveredValue: 0,
      invoicedValue: 0,
      remainingValue: totalOrderValue,
      transportMode: 'Road',
      transporterName: 'VRL Logistics Ltd',
      transporterGstin: '27AABCV1234F1Z1',
      vehicleNumber: 'MH-14-GH-8821',
      incoterms: 'DAP - Delivered At Place',
      deliveryTerms: 'JIT Immediate Delivery',
      packagingInstructions: 'Corrugated cartons with poly liners',
      eInvoiceRequired: true,
      eWayBillRequired: isEwbMandatory,
      deliveryChallanAllowed: true,
      coaRequired: true,
      msdsRequired: false,
      batchTraceabilityRequired: true,
      lines,
      auditTrail: [
        {
          action: 'Created via Daily Quick Entry Sheet',
          user: 'Commercial Operations Team',
          timestamp: '2026-09-12 11:45',
        },
      ],
    };

    onSaveOrder(newSo, autoDelivery);
    showToast(`Quick Order ${newSo.id} generated successfully.`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#0F8B8D]/10 text-[#0F8B8D]">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-gray-900 font-['Space_Grotesk']">
              Daily Order Rapid Entry (High-Volume Call-Offs)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Designed for high-frequency OEM & FMCG daily purchase orders with instant stock check & keyboard flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDuplicateYesterday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5 text-gray-600" /> Duplicate Yesterday
          </button>
          <button
            onClick={handlePasteClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg shadow-2xs"
          >
            <Clipboard className="w-3.5 h-3.5 text-gray-600" /> Paste TSV
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
        <div>
          <label className="text-gray-500 font-medium">Customer *</label>
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900 font-semibold"
          >
            <option value="Tata Motors Passenger Vehicles Ltd">Tata Motors Passenger Vehicles Ltd</option>
            <option value="Marico FMCG Consumer Products">Marico FMCG Consumer Products</option>
            <option value="Bajaj Auto Ltd Chakan Works">Bajaj Auto Ltd Chakan Works</option>
            <option value="Maruti Suzuki India Ltd (Manesar)">Maruti Suzuki India Ltd (Manesar)</option>
          </select>
        </div>

        <div>
          <label className="text-gray-500 font-medium">Customer PO Number *</label>
          <input
            type="text"
            value={customerPoNumber}
            onChange={(e) => setCustomerPoNumber(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900 font-mono"
          />
        </div>

        <div>
          <label className="text-gray-500 font-medium">Order Date</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="text-gray-500 font-medium">Plant Facility</label>
          <select
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900"
          >
            <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub</option>
            <option value="Plant 2 - Chakan Packaging Plant">Plant 2 - Chakan Packaging</option>
          </select>
        </div>

        <div>
          <label className="text-gray-500 font-medium">Finished Goods Store</label>
          <select
            value={fgStore}
            onChange={(e) => setFgStore(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900"
          >
            <option value="FG-Automotive Cell">FG-Automotive Cell</option>
            <option value="FG-Main Warehouse">FG-Main Warehouse</option>
            <option value="FG-Export Hub">FG-Export Hub</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet-like Data Entry Grid */}
      <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="p-2.5">Row</th>
              <th className="p-2.5 min-w-[200px]">Item Code & Name</th>
              <th className="p-2.5">Stock Indicator</th>
              <th className="p-2.5 text-right w-24">Quantity</th>
              <th className="p-2.5 w-16">UOM</th>
              <th className="p-2.5 text-right w-24">Price (₹)</th>
              <th className="p-2.5 text-right">Taxable</th>
              <th className="p-2.5">Req Date</th>
              <th className="p-2.5">Batch Rule</th>
              <th className="p-2.5 text-center w-12">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, idx) => {
              const isShortage = row.qty > row.availableStock;
              const lineTaxable = row.qty * row.unitPrice;

              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-2.5 font-mono text-gray-500">{idx + 1}</td>

                  {/* Item Dropdown */}
                  <td className="p-2.5">
                    <select
                      value={row.itemCode}
                      onChange={(e) => handleItemSelect(idx, e.target.value)}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white text-gray-900 font-medium"
                    >
                      {CATALOG_ITEMS.map((cat) => (
                        <option key={cat.itemCode} value={cat.itemCode}>
                          {cat.itemCode} - {cat.itemName}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Customer Code: {row.customerItemCode} | {row.polymerGrade}
                    </div>
                  </td>

                  {/* Stock Indicator */}
                  <td className="p-2.5">
                    {isShortage ? (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Short (Avail: {row.availableStock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Stock: {row.availableStock.toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Qty Input */}
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                      className="w-24 text-right border border-gray-300 rounded p-1 font-bold text-gray-900 font-mono"
                    />
                  </td>

                  {/* UOM */}
                  <td className="p-2.5 font-semibold text-gray-600">{row.uom}</td>

                  {/* Price */}
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      value={row.unitPrice}
                      onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                      className="w-20 text-right border border-gray-300 rounded p-1 font-mono text-gray-900"
                    />
                  </td>

                  {/* Taxable */}
                  <td className="p-2.5 text-right font-mono font-semibold text-gray-900">
                    ₹{lineTaxable.toLocaleString()}
                  </td>

                  {/* Delivery Date */}
                  <td className="p-2.5">
                    <input
                      type="date"
                      value={row.deliveryDate}
                      onChange={(e) => {
                        const copy = [...rows];
                        copy[idx].deliveryDate = e.target.value;
                        setRows(copy);
                      }}
                      className="border border-gray-300 rounded p-1 text-xs"
                    />
                  </td>

                  {/* Batch Rule */}
                  <td className="p-2.5">
                    <select
                      value={row.batchPreference}
                      onChange={(e) => {
                        const copy = [...rows];
                        copy[idx].batchPreference = e.target.value;
                        setRows(copy);
                      }}
                      className="border border-gray-300 rounded p-1 text-xs bg-white text-gray-700"
                    >
                      <option value="FEFO Strict">FEFO Strict</option>
                      <option value="FIFO Standard">FIFO Standard</option>
                    </select>
                  </td>

                  {/* Delete */}
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="p-2.5 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F8B8D] hover:text-[#0c7072]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Another Product Row
          </button>
        </div>
      </div>

      {/* Bottom Summary Bar & Live Credit Calculation */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-gray-500">Total Items:</span>
            <strong className="text-gray-900 ml-1">{totalItems}</strong>
          </div>
          <div>
            <span className="text-gray-500">Total Qty:</span>
            <strong className="text-gray-900 ml-1 font-mono">{totalQuantity.toLocaleString()} PCS</strong>
          </div>
          <div>
            <span className="text-gray-500">Taxable:</span>
            <strong className="text-gray-900 ml-1 font-mono">₹{totalTaxable.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-gray-500">GST (18%):</span>
            <strong className="text-gray-900 ml-1 font-mono">₹{totalGst.toLocaleString()}</strong>
          </div>
          <div className="text-sm font-bold text-[#14213D]">
            <span>Total Value:</span>
            <strong className="font-mono ml-1">₹{totalOrderValue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-500">Post-Order Credit Headroom</div>
            <div
              className={`font-mono font-bold ${
                remainingCreditAfterOrder >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              ₹{(remainingCreditAfterOrder / 100000).toFixed(2)} Lakhs
            </div>
          </div>

          <div
            className={`px-2 py-1 rounded text-[11px] font-bold ${
              isEwbMandatory ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isEwbMandatory ? 'E-WAY BILL MANDATED (>₹50K)' : 'EWB EXEMPT'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-3">
        <button
          onClick={() => handleSave(false)}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          Save as Confirmed Order
        </button>
        <button
          onClick={() => handleSave(true, true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          <Truck className="w-4 h-4" /> Save & Create Delivery Note Immediately
        </button>
      </div>
    </div>
  );
};
