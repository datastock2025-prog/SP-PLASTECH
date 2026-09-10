import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  Zap,
  HardDrive,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Power,
} from 'lucide-react';

interface IntegrationConnectorExtended {
  id: string;
  name: string;
  category: 'Shopfloor Hardware (OPC-UA / IoT)' | 'Enterprise ERP / EDI' | 'Government Tax Portals' | 'Laboratory Instrumentation';
  protocol: string;
  endpoint: string;
  status: 'Online' | 'Degraded' | 'Offline';
  latencyMs: number;
  lastSync: string;
  dailyTransactions: number;
  description: string;
}

const mockConnectors: IntegrationConnectorExtended[] = [
  {
    id: 'INT-01',
    name: 'Euromap 63 / 77 Injection Molding OPC-UA Server',
    category: 'Shopfloor Hardware (OPC-UA / IoT)',
    protocol: 'OPC-UA / TCP Port 4840',
    endpoint: 'opc.tcp://192.168.20.1:4840/InjectionShopfloor',
    status: 'Online',
    latencyMs: 12,
    lastSync: '10 seconds ago',
    dailyTransactions: 48920,
    description: 'High-speed cyclic data stream capturing mold closing times, cavity pressure transducers, and melt temperatures from 24 presses.',
  },
  {
    id: 'INT-02',
    name: 'Avery Weigh-Tronix Silo & Truck Weighbridge',
    category: 'Shopfloor Hardware (OPC-UA / IoT)',
    protocol: 'RS-485 Modbus over IP',
    endpoint: '192.168.10.80:502',
    status: 'Online',
    latencyMs: 18,
    lastSync: '1 min ago',
    dailyTransactions: 340,
    description: 'Direct gross, tare, and net weighment capture for incoming bulk polymer tankers and finished product container shipments.',
  },
  {
    id: 'INT-03',
    name: 'X-Rite Ci7800 Benchtop Color Spectrophotometer',
    category: 'Laboratory Instrumentation',
    protocol: 'RESTful USB Agent / Webhook',
    endpoint: 'http://localhost:8088/api/cielab/read',
    status: 'Online',
    latencyMs: 5,
    lastSync: '3 mins ago',
    dailyTransactions: 120,
    description: 'Transfers color coordinate readings (L*, a*, b*, Delta-E) directly into the Quality batch release inspector.',
  },
  {
    id: 'INT-04',
    name: 'NIC GST e-Invoice & Automated E-Way Bill Dispatch',
    category: 'Government Tax Portals',
    protocol: 'HTTPS REST API (GSP Cleartax Gateway)',
    endpoint: 'https://api.einvoice1.gst.gov.in/v1.03/GenerateIRN',
    status: 'Online',
    latencyMs: 145,
    lastSync: 'Just now',
    dailyTransactions: 1850,
    description: 'Generates 64-character Invoice Reference Number (IRN) and signed QR codes automatically upon invoice posting.',
  },
  {
    id: 'INT-05',
    name: 'Tata Motors & Maruti Suzuki Automotive EDI 850 / 856 ASN',
    category: 'Enterprise ERP / EDI',
    protocol: 'AS2 Encrypted EDI Stream',
    endpoint: 'as2://tata-motors.supplyline.in:4080',
    status: 'Online',
    latencyMs: 82,
    lastSync: '5 mins ago',
    dailyTransactions: 420,
    description: 'Ingests hourly JIS (Just-In-Sequence) releases and transmits electronic dispatch Advance Shipping Notices (ASN).',
  },
];

interface AdminIntegrationManagementViewProps {
  showToast?: (msg: string) => void;
}

export const AdminIntegrationManagementView: React.FC<AdminIntegrationManagementViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [connectors, setConnectors] = useState<IntegrationConnectorExtended[]>(mockConnectors);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestConnection = (id: string, name: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      showToast(`Ping test successful for "${name}": 0% packet loss.`);
    }, 800);
  };

  const handleToggleConnector = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === 'Online' ? 'Offline' : 'Online';
          showToast(`Connector "${c.name}" switched to ${next}.`);
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#0F8B8D]" />
            <span>Connected Systems, Industrial IoT &amp; EDI Gateways</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Integration Management Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Euromap 63/77 injection machine OPC-UA servers, spectrophotometers, weighbridges, automotive OEM EDI, and NIC GST e-invoicing pipelines.
          </p>
        </div>

        <button
          onClick={() => showToast('Opened new peripheral connector integration wizard.')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Integration Connector
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#0F8B8D] uppercase tracking-wider">
                    {conn.category}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 mt-0.5">{conn.name}</h3>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">{conn.protocol}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      conn.status === 'Online'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        conn.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    {conn.status}
                  </span>

                  <button
                    onClick={() => handleToggleConnector(conn.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="Toggle Service Power"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{conn.description}</p>

              {/* Endpoint spec */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs text-slate-700 truncate">
                {conn.endpoint}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Roundtrip Latency</span>
                  <span className="font-mono font-bold text-slate-800">{conn.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Daily Volume</span>
                  <span className="font-mono font-bold text-slate-800">{conn.dailyTransactions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Last Handshake</span>
                  <span className="text-slate-800">{conn.lastSync}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleTestConnection(conn.id, conn.name)}
                disabled={testingId === conn.id}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingId === conn.id ? 'animate-spin' : ''}`} />
                {testingId === conn.id ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={() => showToast(`Opened endpoint parameter configuration for ${conn.name}`)}
                className="text-xs font-semibold text-[#0F8B8D] hover:underline"
              >
                Configure Parameters
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
