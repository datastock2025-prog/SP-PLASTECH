import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import { SupplierContractRecord } from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { INITIAL_PROCUREMENT_CONTRACTS } from '../../data/procurementData';

interface Props {
  contracts?: SupplierContractRecord[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SupplierContractManagementView: React.FC<Props> = ({
  contracts = INITIAL_PROCUREMENT_CONTRACTS,
  onNavigate,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = contracts.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Supplier Contracts & Volume Agreements
          </h1>
          <p className="text-xs text-slate-500">
            Blanket purchase agreements, annual committed volume rebate tiers, and indexed pricing formulas
          </p>
        </div>

        <button
          onClick={() => showToast('Contract creation wizard opened')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Draft Supply Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((contract) => {
          const pct = Math.round((contract.releasedValue / (contract.totalCommittedValue || 1)) * 100);

          return (
            <div
              key={contract.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-[#0F8B8D] transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#14213D]">{contract.contractNumber}</span>
                    <ProcurementStatusBadge status={contract.status} size="xs" />
                  </div>
                  <h3 className="font-bold text-sm text-[#14213D] mt-1">{contract.title}</h3>
                  <div className="text-xs text-slate-500">{contract.supplierName} • {contract.contractType}</div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Value</div>
                  <div className="font-bold font-['Space_Grotesk'] text-[#14213D]">
                    ₹{(contract.totalCommittedValue / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
              </div>

              {/* Volume Utilization Meter */}
              <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Volume Released: {(contract.releasedQty || 0).toLocaleString()} / {(contract.totalCommittedQty || 0).toLocaleString()} {contract.uom || 'KG'}</span>
                  <span className="text-[#0F8B8D]">{pct}% Utilized</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#0F8B8D] h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Remaining Value: ₹{(contract.remainingValue / 100000).toFixed(2)} Lakhs
                </div>
              </div>

              {/* Terms & Dates */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>Validity: <strong>{contract.startDate} to {contract.endDate}</strong></div>
                <div>Index Base: <strong>{contract.indexedPricing ? 'Indexed (Platts/ICIS)' : 'Fixed Price'}</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
