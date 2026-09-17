import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ShieldCheck,
  Truck,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  TrendingUp,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  StockTransferRecord,
  UserRolePerspective,
} from '../../types/stockTransferTypes';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { PaginationBar } from '../common/PaginationBar';

interface InterPlantTaxComplianceScreenProps {
  transfers?: StockTransferRecord[];
  currentUserRole?: UserRolePerspective;
  onSelectTransferForTracking?: (transfer: StockTransferRecord) => void;
  showToast?: (msg: string) => void;
}

// Memoized individual consignment row to avoid re-renders
const ConsignmentTableRow = memo(({
  transfer,
  onAudit,
}: {
  transfer: StockTransferRecord;
  onAudit: (t: StockTransferRecord) => void;
}) => {
  const log = transfer.logistics!;
  const isInterState = log.igstAmount > 0;

  return (
    <tr className="hover:bg-slate-50">
      <td className="py-3 px-3.5 font-mono font-bold text-indigo-700">
        {transfer.id}
      </td>
      <td className="py-3 px-3">
        <div className="font-bold text-slate-900">
          {transfer.fromPlantName.split('-')[1] || transfer.fromPlantName} &rarr;{' '}
          {transfer.toPlantName.split('-')[1] || transfer.toPlantName}
        </div>
        <div className="text-[11px] text-slate-500">
          {isInterState ? (
            <span className="text-indigo-700 font-semibold">Inter-State (IGST Applicable)</span>
          ) : (
            <span className="text-emerald-700 font-semibold">Intra-State (CGST + SGST)</span>
          )}
        </div>
      </td>
      <td className="py-3 px-3">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
          {log.taxDocType}
        </span>
      </td>
      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
        {log.distanceKm} KM
      </td>
      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
        ₹{log.assessableValue.toLocaleString('en-IN')}
      </td>
      <td className="py-3 px-3 text-right font-bold text-slate-700">
        18%
      </td>
      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
        {isInterState
          ? `₹${log.igstAmount.toLocaleString('en-IN')} (IGST)`
          : `₹${(log.cgstAmount + log.sgstAmount).toLocaleString('en-IN')} (C+S)`}
      </td>
      <td className="py-3 px-3">
        <div className="font-mono font-bold text-slate-900">{log.vehicleNumber}</div>
        <div className="text-[11px] text-slate-500 font-mono">
          EWB: {log.eWayBillNumber || 'Exempt (<50KM)'}
        </div>
      </td>
      <td className="py-3 px-3.5 text-right whitespace-nowrap">
        <button
          onClick={() => onAudit(transfer)}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
        >
          Audit Details
        </button>
      </td>
    </tr>
  );
});

export const InterPlantTaxComplianceScreen: React.FC<InterPlantTaxComplianceScreenProps> = ({
  transfers = [],
  currentUserRole = 'Logistics & Dispatch Manager',
  onSelectTransferForTracking = (_transfer?: StockTransferRecord) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [filterQuery, setFilterQuery] = useState<string>('');

  const debouncedQuery = useDebounce(filterQuery, 300);

  const safeTransfers = transfers || [];

  // Inter-plant records only
  const interPlantTransfers = useMemo(() => {
    return safeTransfers.filter((t) => t.transferType === 'INTER_PLANT' && t.logistics);
  }, [safeTransfers]);

  const filteredTransfers = useMemo(() => {
    return interPlantTransfers.filter((t) =>
      debouncedQuery === '' ||
      t.id.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      t.fromPlantName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      t.toPlantName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (t.logistics?.vehicleNumber && t.logistics.vehicleNumber.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
  }, [interPlantTransfers, debouncedQuery]);

  const { paginatedData: pagedTransfers, paginationProps } = usePagination(filteredTransfers, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  // Memoized Totals
  const totalTaxableValue = useMemo(() => {
    return interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.assessableValue || 0), 0);
  }, [interPlantTransfers]);

  const totalIgst = useMemo(() => {
    return interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.igstAmount || 0), 0);
  }, [interPlantTransfers]);

  const totalCgstSgst = useMemo(() => {
    return interPlantTransfers.reduce(
      (acc, t) => acc + (t.logistics?.cgstAmount || 0) + (t.logistics?.sgstAmount || 0),
      0
    );
  }, [interPlantTransfers]);

  const totalGrandTotal = useMemo(() => {
    return interPlantTransfers.reduce((acc, t) => acc + (t.logistics?.grandTotalValue || 0), 0);
  }, [interPlantTransfers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Statutory GST &amp; Logistics Bridge
            </span>
            <span className="text-xs text-slate-500 font-medium">Screen 4: Inter-Plant Compliance Engine</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Inter-Plant Logistics &amp; Tax Compliance Monitor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated assessable valuations, IGST/CGST calculations, HSN tax summaries, and E-Way Bill validity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported GST Delivery Challan summary spreadsheet.')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Export GSTR-1
          </button>
        </div>
      </div>

      {/* Tax Liability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Assessable Value (MTD)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalTaxableValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Calculated from Item Standard Costs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-indigo-700 font-medium">Total IGST (Inter-State)</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{totalIgst.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">Cross-Charge Input Tax Credit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-emerald-700 font-medium">CGST + SGST (Intra-State)</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalCgstSgst.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Delivery Challan Valuation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
          <span className="text-xs text-blue-800 font-bold">Total Statutory Challan Value</span>
          <div className="text-2xl font-black text-blue-900 mt-1">
            ₹{totalGrandTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-0.5">Full GST Audit Trail</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Transfer #, Plant, or Vehicle..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredTransfers.length}</strong> inter-plant consignment(s)
        </span>
      </div>

      {/* Inter-Plant Consignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-bold">Transfer #</th>
                <th className="py-3 px-3 font-bold">Route &amp; State Jurisdiction</th>
                <th className="py-3 px-3 font-bold">Doc Type</th>
                <th className="py-3 px-3 font-bold text-right">Distance</th>
                <th className="py-3 px-3 font-bold text-right">Assessable Value</th>
                <th className="py-3 px-3 font-bold text-right">GST Rate</th>
                <th className="py-3 px-3 font-bold text-right">IGST / (CGST+SGST)</th>
                <th className="py-3 px-3 font-bold">Vehicle &amp; E-Way Bill</th>
                <th className="py-3 px-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedTransfers.map((t) => (
                <ConsignmentTableRow
                  key={t.id}
                  transfer={t}
                  onAudit={onSelectTransferForTracking}
                />
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar {...paginationProps} itemName="consignments" />
      </div>
    </div>
  );
};
