import React from 'react';
import { ItemMaster, ApprovalStatus } from '@/src/types';
import { Edit2, Factory, History, Copy, Layers, Trash2 } from 'lucide-react';
import { getItemStockData } from '@/src/hooks/useWarehouse';

export const renderRoutingBadge = (item: ItemMaster) => {
  const t = (item.type || '').toLowerCase();
  const c = (item.cat || '').toLowerCase();
  const r = (item.routingDestination || '').toUpperCase();
  const wh = (item.wh || '').toUpperCase();
  const dest = (item.destinationStore || '').toUpperCase();

  // Priority 1: WIP routing (Check WIP first and default for Finished Goods unless explicitly DOL)
  if (r === 'WIP' || item.isWip || dest.includes('WIP') || wh.includes('WIP') || t === 'semi-finished good' || c === 'wip' || (!r && (t === 'finished good' || c === 'fg'))) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs">
        WIP
      </span>
    );
  }

  // Priority 2: ASSEMBLY routing
  if (r === 'ASSEMBLY' || item.isAssembly || c === 'assembly' || dest.includes('ASSEMBLY') || wh.includes('ASM')) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-300 shadow-2xs">
        ASSEMBLY
      </span>
    );
  }

  // Priority 3: DEFLASH routing
  if (r === 'DEFLASH' || item.isDeflash || c === 'deflash' || dest.includes('DEFLASH') || wh.includes('DFL')) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
        DEFLASH
      </span>
    );
  }

  // Priority 4: DOL -> FG routing (Only when explicitly configured as DOL)
  if (r === 'DOL' || item.isDol || r === 'FG') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
        DOL &rarr; FG
      </span>
    );
  }

  // Priority 5: Raw Material
  if (t === 'raw material' || t === 'regrind' || c === 'rm') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
        RM &rarr; STORE
      </span>
    );
  }

  // Priority 6: Masterbatch
  if (t === 'masterbatch' || t === 'colorant' || t === 'additive' || c === 'mb') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
        MB &rarr; STORE
      </span>
    );
  }

  // Priority 7: Spare Part
  if (t === 'spare part' || c === 'asset') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        SPARE &rarr; ASSET
      </span>
    );
  }

  // Priority 8: Packaging
  if (t === 'packaging material' || c === 'packaging') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        STORE &rarr; PACK
      </span>
    );
  }

  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
      {item.routingDestination || 'STORE'}
    </span>
  );
};

export interface ItemMasterGridRowProps {
  item: ItemMaster;
  isSelected: boolean;
  onToggleSelect: (code: string, checked: boolean) => void;
  onNavigateDetail: (code: string) => void;
  onOpenAudit: (item: ItemMaster) => void;
  onQuickModify: (item: ItemMaster) => void;
  onCloneItem: (item: ItemMaster) => void;
  onOpenMfgBomWizard: (item: ItemMaster) => void;
  onDeleteItem: (item: ItemMaster) => void;
  renderStatusBadge: (status: string) => React.ReactNode;
  renderApprovalBadge: (approval: ApprovalStatus, itm?: ItemMaster) => React.ReactNode;
  renderRoutingBadgeCustom?: (item: ItemMaster) => React.ReactNode;
}

export const ItemMasterGridRow = React.memo<ItemMasterGridRowProps>(function ItemMasterGridRow({
  item,
  isSelected,
  onToggleSelect,
  onNavigateDetail,
  onOpenAudit,
  onQuickModify,
  onCloneItem,
  onOpenMfgBomWizard,
  onDeleteItem,
  renderStatusBadge,
  renderApprovalBadge,
  renderRoutingBadgeCustom,
}) {
  const isFg = item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
  const cycle = Number(item.standardCycleTime ?? item.cycleTime ?? 0);
  const cavities = Number(item.cavityCount ?? (item.moldToolId ? 1 : 0));
  const partWt = Number(item.partWeightGrams ?? item.netWeightGrams ?? 0);
  const runnerWt = Number(item.runnerWeightGrams ?? 0);
  const shotWt = item.shotWeightGrams || (partWt > 0 ? Number((partWt + runnerWt).toFixed(2)) : 0);
  const hourlyOutput = cycle > 0 && cavities > 0 ? Math.round((3600 / cycle) * cavities) : 0;
  const stockData = getItemStockData(item);
  const badgeRenderer = renderRoutingBadgeCustom || renderRoutingBadge;

  return (
    <tr
      key={item.code}
      className={`item-master-grid-row hover:bg-[#F0F6FF] transition-colors cursor-pointer group ${
        isSelected ? 'bg-teal-50/40' : ''
      }`}
      onClick={() => onNavigateDetail(item.code)}
      title="Click to view detailed item master info, tooling specs, BOM usage & documents"
    >
      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(item.code, e.target.checked)}
          className="rounded text-[#0F8B8D]"
        />
      </td>

      <td className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-[#0F8B8D]">{item.code}</span>
          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-600 transition-opacity" />
        </div>
      </td>

      <td className="p-3">
        <div className="font-bold text-[#14213D] flex items-center gap-1.5 group-hover:text-[#0F8B8D] transition-colors">
          {item.icon && typeof item.icon === 'string' && item.icon.length <= 3 && (
            <span className="text-sm">{item.icon}</span>
          )}
          <span>{item.name}</span>
        </div>
        <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 flex-wrap mt-0.5">
          <span>{item.cat}</span>
          {item.resinType && (
            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded">
              {item.resinType}
            </span>
          )}
          {badgeRenderer(item)}
        </div>
      </td>

      <td className="p-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-xs">
          <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[140px]">{item.plant || '—'}</span>
        </div>
      </td>

      <td className="p-3 text-right font-semibold text-[#14213D] font-mono">
        {stockData.onHand}
      </td>
      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
        {stockData.available}
      </td>
      <td className="p-3 font-mono text-xs text-[#6B7280]">{item.wh}</td>
      <td className="p-3 text-center">{renderStatusBadge(item.status)}</td>
      <td className="p-3 text-center">{renderApprovalBadge(item.approval, item)}</td>

      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="item-master-grid-actions flex items-center justify-end gap-1">
          <button
            className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded transition-colors"
            title="View Item Change & Approval Ledger (When, Who Raised, Who Approved)"
            onClick={() => onOpenAudit(item)}
          >
            <History className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </button>
          <button
            className="p-1 text-[#6B7280] hover:text-[#E8622C] hover:bg-orange-50 rounded transition-colors"
            title="Quick Modify SKU & Tooling"
            onClick={() => onQuickModify(item)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-[#6B7280] hover:text-[#0066CC] hover:bg-blue-50 rounded transition-colors"
            title="Clone / Duplicate Item"
            onClick={() => onCloneItem(item)}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded transition-colors"
            title="Create / View Manufacturing BOM"
            onClick={() => onOpenMfgBomWizard(item)}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete SKU"
            onClick={() => onDeleteItem(item)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.item === next.item) return true;
  return (
    prev.item.code === next.item.code &&
    prev.item.name === next.item.name &&
    prev.item.status === next.item.status &&
    prev.item.approval === next.item.approval &&
    prev.item.type === next.item.type &&
    prev.item.cat === next.item.cat &&
    prev.item.plant === next.item.plant &&
    prev.item.wh === next.item.wh &&
    prev.item.stock === next.item.stock &&
    (prev.item as any).allocated === (next.item as any).allocated &&
    prev.item.moldToolId === next.item.moldToolId &&
    prev.item.cycleTime === next.item.cycleTime &&
    prev.item.partWeightGrams === next.item.partWeightGrams &&
    prev.item.runnerWeightGrams === next.item.runnerWeightGrams &&
    prev.item.shotWeightGrams === next.item.shotWeightGrams &&
    prev.item.cavityCount === next.item.cavityCount &&
    prev.item.standardCycleTime === next.item.standardCycleTime &&
    prev.item.netWeightGrams === next.item.netWeightGrams
  );
});
