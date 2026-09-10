import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Play,
  Key,
  Globe,
  HardDrive,
  Printer,
  Shield,
  Zap,
} from 'lucide-react';
import { IntegrationConnector } from '../../types/admin';
import { mockIntegrations } from '../../data/mockAdminData';

interface AdminIntegrationsViewProps {
  showToast?: (msg: string) => void;
}

export const AdminIntegrationsView: React.FC<AdminIntegrationsViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>(mockIntegrations);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [configuringItem, setConfiguringItem] = useState<IntegrationConnector | null>(null);

  const handleTestConnection = (conn: IntegrationConnector) => {
    setTestingId(conn.id);
    setTimeout(() => {
      setTestingId(null);
      showToast(`Connection handshake with "${conn.name}" verified successfully. Ping: 28ms.`);
    }, 800);
  };

  const handleToggleActive = (id: string) => {
    setIntegrations((prev) =>
      prev.map((conn) => {
        if (conn.id === id) {
          const isConnected = conn.status === 'Connected';
          const nextStatus: IntegrationConnector['status'] = isConnected ? 'Disconnected' : 'Connected';
          showToast(`${conn.name} is now ${nextStatus === 'Connected' ? 'Active & Polling' : 'Disabled'}.`);
          return { ...conn, status: nextStatus };
        }
        return conn;
      })
    );
  };

  const getCategoryIcon = (category: IntegrationConnector['serviceCategory']) => {
    switch (category) {
      case 'Government Compliance':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'Hardware & IoT':
        return <HardDrive className="w-4 h-4 text-amber-600" />;
      case 'Messaging & Alerts':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      case 'ERP & Accounting':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      case 'Market Data':
        return <Sliders className="w-4 h-4 text-teal-600" />;
      default:
        return <Globe className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#0F8B8D]" />
            <span>Industrial IoT, Peripherals &amp; EDI Gateways</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">External System Connectors &amp; Hardware Interfaces</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage National Informatics Centre (NIC) GST e-Invoice APIs, weighbridge serial interfaces, thermal barcode printers, and biometric clocks.
          </p>
        </div>

        <button
          onClick={() => showToast('Dispatched test heartbeat ping across all peripheral interfaces.')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Poll All Hardware Nodes
        </button>
      </div>

      {/* Grid of Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((conn) => {
          const isTesting = testingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {getCategoryIcon(conn.serviceCategory)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{conn.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono">{conn.provider}</span>
                        <span className="text-slate-300">&middot;</span>
                        <span className="text-[10px] text-slate-500">{conn.syncFrequency}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      conn.status === 'Connected'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        conn.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {conn.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{conn.description}</p>

                {/* Connection Specs */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Protocol / Auth</span>
                    <span className="font-mono text-slate-700 text-[11px] font-medium">{conn.authType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Today's Transactions</span>
                    <span className="font-bold text-slate-900 text-[11px]">{conn.recordsSyncedToday.toLocaleString()} Dispatched</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Interface Endpoint</span>
                    <span className="font-mono text-slate-600 text-[10px] truncate block">{conn.endpointUrl}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  Last Sync: <span className="font-mono text-slate-600">{conn.lastSyncTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(conn.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      conn.status === 'Connected'
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {conn.status === 'Connected' ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfiguringItem(conn)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Configure Connector Parameters"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestConnection(conn)}
                    disabled={isTesting || conn.status !== 'Connected'}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs disabled:opacity-40 transition-colors"
                  >
                    <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Pinging...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Connector */}
      {configuringItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Configure {configuringItem.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update endpoint hostname, serial COM port credentials, or auth tokens.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast(`Settings updated for ${configuringItem.name}.`);
                setConfiguringItem(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Endpoint URI</label>
                <input
                  type="text"
                  defaultValue={configuringItem.endpointUrl}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Key / Token (Masked)</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfiguringItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
