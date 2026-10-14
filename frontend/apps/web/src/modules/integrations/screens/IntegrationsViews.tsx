import React, { useState } from 'react';
import {
  Cpu,
  Globe,
  Radio,
  Zap,
  HardDrive,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { AdminIntegrationsView } from '../components/AdminIntegrationsView';
import { AdminIntegrationManagementView } from '../components/AdminIntegrationManagementView';

interface IntegrationsViewsProps {
  currentView?: string;
  onNavigate?: (view: string, params?: any) => void;
  showToast?: (message: string) => void;
}

export const IntegrationsViews: React.FC<IntegrationsViewsProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState<'connectors' | 'management'>('management');

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Integration Gateway & IoT Hub</h2>
            <p className="text-xs text-slate-500">Government GST/NIC, Euromap 63/77 OPC-UA, EDI & Webhooks</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('management')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'management'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Connected Gateways
          </button>
          <button
            onClick={() => setActiveTab('connectors')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'connectors'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Service Connectors
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'management' ? (
        <AdminIntegrationManagementView />
      ) : (
        <AdminIntegrationsView showToast={showToast} />
      )}
    </div>
  );
};

export default IntegrationsViews;
