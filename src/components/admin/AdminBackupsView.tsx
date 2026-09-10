import React, { useState } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Clock,
  Cloud,
  FileCheck,
  AlertTriangle,
  Play,
  Lock,
} from 'lucide-react';
import { BackupRecord } from '../../types/admin';
import { mockBackupRecords } from '../../data/mockAdminData';

interface AdminBackupsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminBackupsView: React.FC<AdminBackupsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [backups, setBackups] = useState<BackupRecord[]>(mockBackupRecords);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<BackupRecord | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: `BAK-${Date.now().toString().slice(-4)}`,
        backupCode: `SNAP-MANUAL-${Date.now().toString().slice(-6)}`,
        backupType: 'Full Database Snapshot',
        fileSizeBytes: 4890000000,
        fileSizeFormatted: '4.89 GB',
        creationTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        storageTarget: 'AWS S3 (Primary EU/AP)',
        status: 'Completed',
        verifiedChecksum: true,
        retentionUntil: '2027-09-04',
        triggeredBy: 'Admin Manual',
      };
      setBackups([newBackup, ...backups]);
      setIsCreatingSnapshot(false);
      showToast('Hot database snapshot completed and uploaded to geo-redundant S3 vault.');
    }, 1000);
  };

  const handleDownload = (b: BackupRecord) => {
    showToast(`Signed download link dispatched for ${b.backupCode}. Valid for 15 minutes.`);
  };

  const handleSimulateRestore = (b: BackupRecord) => {
    setRestoringBackup(b);
    setConfirmText('');
  };

  const handleExecuteRestore = () => {
    if (confirmText !== 'RESTORE') {
      showToast('Please type RESTORE to confirm sandbox rollback.');
      return;
    }
    showToast(`Dispatched test restore of ${restoringBackup?.backupCode} to isolated staging replica.`);
    setRestoringBackup(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Database className="w-4 h-4 text-[#0F8B8D]" />
            <span>Disaster Recovery &amp; Business Continuity (BCP)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Database Snapshots &amp; Point-in-Time Recovery</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PostgreSQL 16 HA snapshots, continuous Write-Ahead Log (WAL) archiving, and cross-region S3 encrypted vaults.
          </p>
        </div>

        <button
          onClick={handleCreateSnapshot}
          disabled={isCreatingSnapshot}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isCreatingSnapshot ? 'animate-spin' : ''}`} />
          {isCreatingSnapshot ? 'Executing Snapshot...' : 'Trigger Hot Snapshot Now'}
        </button>
      </div>

      {/* RTO / RPO Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recovery Point Objective (RPO)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">15 Minutes</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Continuous WAL streaming</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recovery Time Objective (RTO)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">&lt; 45 Minutes</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Automated container failover</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Storage Vault Usage</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">42.8 GB</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">90-day retention policy</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Integrity Verification</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">100% Tested</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Last integrity check: 3h ago</span>
        </div>
      </div>

      {/* Backup Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Historical Snapshot Catalog</h2>
          <span className="text-xs text-slate-500">Algorithm: Zstandard (zstd -19) &middot; AES-256 SSE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Snapshot Identifier</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Compressed Size</th>
                <th className="py-3 px-4">Storage Target</th>
                <th className="py-3 px-4">Created Timestamp</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      {b.backupCode}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm">
                      Retention until: {b.retentionUntil}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {b.backupType}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.triggeredBy}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {b.fileSizeFormatted}
                  </td>

                  <td className="py-3.5 px-4 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-slate-400" />
                      {b.storageTarget}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {b.creationTimestamp}
                  </td>

                  <td className="py-3.5 px-4">
                    {b.verifiedChecksum ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> In Progress
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownload(b)}
                        title="Download S3 Archive"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSimulateRestore(b)}
                        title="Simulate Restore to Staging Sandbox"
                        className="p-1.5 rounded hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Restore Sandbox Simulation */}
      {restoringBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">Point-in-Time Restore Simulation</h3>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              You are requesting a test restoration of snapshot:
              <br />
              <strong className="font-mono text-slate-900 text-[11px] mt-1 block">{restoringBackup.backupCode}</strong>
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1 mb-4">
              <strong>Isolated Environment Safeguard:</strong> This operation targets a sandboxed read-only replica cluster. Production databases will NOT be overwritten.
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">
                Type <strong className="text-rose-600 font-mono">RESTORE</strong> to confirm staging initialization:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setRestoringBackup(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText !== 'RESTORE'}
                onClick={handleExecuteRestore}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                Execute Sandbox Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
