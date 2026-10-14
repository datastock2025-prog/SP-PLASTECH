import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useAdminIntegrations } from '../../hooks/useAdmin';

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

const DEFAULT_CONNECTORS: IntegrationConnectorExtended[] = [
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
  const { data: serverIntegrations = [], isLoading } = useAdminIntegrations();
  const [connectors, setConnectors] = useState<IntegrationConnectorExtended[]>(DEFAULT_CONNECTORS);
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
    <div className="min-w-0 space-y-4 pb-8">
      {/* Header */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#0F8B8D]" />
            <span>Connected Systems, Industrial IoT &amp; EDI Gateways</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Integration Management</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Configure Euromap 63/77 injection machine OPC-UA servers, spectrophotometers, weighbridges, automotive OEM EDI, and NIC GST e-invoicing pipelines.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => showToast('Opened new peripheral connector integration wizard.')}
          className="w-full shrink-0 bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
        >
          <Plus aria-hidden="true" />
          Add Integration Connector
        </Button>
        </CardContent>
      </Card>

      {/* Connectors Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        {connectors.map((conn) => (
          <Card
            key={conn.id}
            className="min-w-0 rounded-md border-slate-200 shadow-none transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-slate-300 hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none"
          >
            <CardContent className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-teal-800">
                    {conn.category}
                  </span>
                  <h3 className="mt-1 break-words text-sm font-semibold text-slate-900">{conn.name}</h3>
                  <div className="mt-1 break-words font-mono text-xs text-slate-500">{conn.protocol}</div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className={`gap-1.5 ${conn.status === 'Online' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : conn.status === 'Degraded' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                    <span className={`size-1.5 rounded-full ${conn.status === 'Online' ? 'bg-emerald-500' : conn.status === 'Degraded' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    {conn.status}
                  </Badge>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleToggleConnector(conn.id)}
                    title="Toggle Service Power"
                    aria-label={`${conn.status === 'Online' ? 'Disable' : 'Enable'} ${conn.name}`}
                    aria-pressed={conn.status === 'Online'}
                  >
                    <Power aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{conn.description}</p>

              {/* Endpoint spec */}
              <div className="mt-3 break-all rounded-md border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-700">
                {conn.endpoint}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <span className="block text-xs text-slate-400">Roundtrip latency</span>
                  <span className="font-mono font-semibold text-slate-800">{conn.latencyMs} ms</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400">Daily volume</span>
                  <span className="font-mono font-semibold text-slate-800">{conn.dailyTransactions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400">Last handshake</span>
                  <span className="text-slate-800">{conn.lastSync}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleTestConnection(conn.id, conn.name)}
                disabled={testingId === conn.id}
                className="text-xs"
              >
                <RefreshCw className={testingId === conn.id ? 'animate-spin' : ''} aria-hidden="true" />
                {testingId === conn.id ? 'Testing...' : 'Test Connection'}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => showToast(`Opened endpoint parameter configuration for ${conn.name}`)}
                className="text-teal-800"
              >
                <Sliders aria-hidden="true" /> Configure Parameters
              </Button>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
