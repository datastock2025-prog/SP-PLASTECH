import React from 'react';
import { ItemMaster } from '@/src/types';
import { History } from 'lucide-react';
import { useItemAuditHistory } from '../api/useMasterData';

export interface ItemAuditHistoryTabProps {
  item: ItemMaster;
  onOpenAuditVault: () => void;
}

export const ItemAuditHistoryTab: React.FC<ItemAuditHistoryTabProps> = ({ item, onOpenAuditVault }) => {
  const { data: dbLogs = [], isLoading } = useItemAuditHistory({ code: item.code });

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
            <History className="w-4 h-4 text-[#0F8B8D]" /> Live Immutable Change Audit Logs (PostgreSQL)
          </h3>
          <p className="text-xs text-gray-500">
            Realtime database ledger of modifications, specification updates, and approvals for {item.code}.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-ghost border cursor-pointer"
          onClick={onOpenAuditVault}
        >
          Open Full Audit Vault
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-gray-500 animate-pulse">
          Loading PostgreSQL audit logs...
        </div>
      ) : dbLogs.length > 0 ? (
        <div className="space-y-3">
          {dbLogs.map((log: any) => {
            const isApproved = log.action === 'APPROVE' || log.action === 'APPROVED';
            const isRejected = log.action === 'REJECT' || log.action === 'REJECTED';
            const isCreate = log.action === 'CREATE' || log.action === 'INSERT';

            return (
              <div key={log.id} className="timeline-item">
                <div
                  className="t-dot"
                  style={{
                    background: isApproved
                      ? 'var(--success)'
                      : isRejected
                      ? 'var(--danger)'
                      : isCreate
                      ? '#0F8B8D'
                      : 'var(--warning)',
                  }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#14213D]">
                      {log.action}: {log.changeSummary || log.notes || `Updated ${log.changed_fields?.join(', ') || item.code}`}
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-100 border text-slate-600">
                      {log.userRole || log.performed_by || 'admin'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {new Date(log.performed_at || log.timestamp || Date.now()).toLocaleString()} &bull; By: {log.performed_by || log.changedBy || 'System User'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="timeline-item">
          <div className="t-dot" style={{ background: 'var(--success)' }} />
          <div>
            <div className="t-text font-bold text-xs text-[#14213D]">Catalog SKU Baseline Active &bull; {item.code}</div>
            <div className="text-[11px] text-gray-500">
              {item.createdOn || 'Initial catalog release'} &bull; {item.name} &bull; Plant: {item.plant || '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
