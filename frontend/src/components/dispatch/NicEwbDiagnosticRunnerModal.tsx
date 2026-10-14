// ============================================================================
// NIC E-Way Bill 12-Point Test Suite & Diagnostic Runner Modal
// Interactive test cockpit for TEST-001 through TEST-012 with JSON inspector
// ============================================================================

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  X,
  Code,
  AlertTriangle,
  Server,
  Key,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Activity,
  Terminal,
  Cpu,
} from 'lucide-react';
import { NicTestScenarioId, NicTestSuiteResult, NicEnvironment } from '../../types/nicEwbTypes';
import { nicEwbService } from '../../services/nic/nicEwbService';
import { nicSecurityEngine } from '../../services/nic/nicSecurityEngine';

interface NicEwbDiagnosticRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

const ALL_TEST_SCENARIOS: { id: NicTestScenarioId; name: string; category: string }[] = [
  { id: 'TEST-001', name: 'TEST-001: Success E-Way Bill Generation', category: 'Core Happy Path' },
  { id: 'TEST-002', name: 'TEST-002: Invalid GSTIN (NIC-101)', category: 'Schema & Master Data' },
  { id: 'TEST-003', name: 'TEST-003: Invalid HSN Tariff Code (NIC-205)', category: 'Schema & Master Data' },
  { id: 'TEST-004', name: 'TEST-004: Invalid Postal PIN Code (NIC-238)', category: 'Schema & Master Data' },
  { id: 'TEST-005', name: 'TEST-005: Invalid Vehicle Number (NIC-305)', category: 'Transport Validation' },
  { id: 'TEST-006', name: 'TEST-006: Duplicate Document Number (NIC-105)', category: 'State & Uniqueness' },
  { id: 'TEST-007', name: 'TEST-007: Token Expired & Auto-Renewal (NIC-401)', category: 'Security & Auth' },
  { id: 'TEST-008', name: 'TEST-008: Invalid Client / Credentials (NIC-403)', category: 'Security & Auth' },
  { id: 'TEST-009', name: 'TEST-009: NIC Server Unavailable (NIC-503)', category: 'Resilience & Offline' },
  { id: 'TEST-010', name: 'TEST-010: Gateway Timeout (ERR-TIMEOUT)', category: 'Resilience & SLA' },
  { id: 'TEST-011', name: 'TEST-011: Arithmetic Valuation Mismatch (NIC-210)', category: 'Tax Valuation' },
  { id: 'TEST-012', name: 'TEST-012: Cancellation Window Failure (NIC-312)', category: 'Lifecycle Management' },
];

export const NicEwbDiagnosticRunnerModal: React.FC<NicEwbDiagnosticRunnerModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  if (!isOpen) return null;

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningTestId, setRunningTestId] = useState<NicTestScenarioId | null>(null);
  const [results, setResults] = useState<Record<string, NicTestSuiteResult>>({});
  const [expandedTestId, setExpandedTestId] = useState<string | null>('TEST-001');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Configuration Modal tab
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configEnv, setConfigEnv] = useState<NicEnvironment>(nicEwbService.getEnvironment());
  const [apiKey, setApiKey] = useState('GSP_SEC_KEY_PREPROD_2026_SANDBOX_READY');
  const [clientGstin, setClientGstin] = useState(nicEwbService.getCredentials().gstin);
  const [clientId, setClientId] = useState(nicEwbService.getCredentials().clientId);

  const passedCount = Object.values(results).filter((r) => r.status === 'PASSED').length;
  const failedCount = Object.values(results).filter((r) => r.status === 'FAILED').length;
  const totalCount = ALL_TEST_SCENARIOS.length;

  const handleRunSingleTest = async (testId: NicTestScenarioId) => {
    setRunningTestId(testId);
    try {
      const result = await nicEwbService.runDiagnosticTest(testId);
      setResults((prev) => ({ ...prev, [testId]: result }));
      setExpandedTestId(testId);
      showToast(`🎯 Executed ${testId}: ${result.status}`);
    } catch (err: any) {
      showToast(`❌ Error running ${testId}: ${err.message}`);
    } finally {
      setRunningTestId(null);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    setResults({});
    try {
      await nicEwbService.runFullTestSuite((result) => {
        setResults((prev) => ({ ...prev, [result.testId]: result }));
      });
      showToast(`🎉 12-Point Test Suite execution complete!`);
    } catch (err: any) {
      showToast(`❌ Test Suite run error: ${err.message}`);
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleSaveConfig = () => {
    nicEwbService.setCredentials({
      environment: configEnv,
      gstin: clientGstin,
      clientId: clientId,
    });
    setShowConfigModal(false);
    showToast(`⚙️ Saved NIC configuration in ${configEnv} mode.`);
  };

  const handleCopyJson = (data: any, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    showToast('📋 Copied raw JSON payload to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A4D68] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300 border border-white/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  NIC Standard v1.03 Engine
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Mode: {configEnv} (Sandbox Ready)
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                NIC E-Way Bill 12-Point Test Suite &amp; Sandbox Diagnostics
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-cyan-200 rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Sandbox Key &amp; Config</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Metric Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRunningAll}
              onClick={handleRunAllTests}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {isRunningAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Executing 12 Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-cyan-200" />
                  <span>Run All 12 Test Scenarios</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setResults({})}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear Results
            </button>
          </div>

          {/* Test Status Counters */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-bold">
              Executed: <strong className="text-slate-900">{Object.keys(results).length} / {totalCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{passedCount} Passed</span>
            </span>
            {failedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                <span>{failedCount} Failed</span>
              </span>
            )}
          </div>
        </div>

        {/* Test List Cockpit */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 flex-1">
          {ALL_TEST_SCENARIOS.map((sc) => {
            const res = results[sc.id];
            const isRunning = runningTestId === sc.id || (isRunningAll && !res);
            const isExpanded = expandedTestId === sc.id;

            return (
              <div key={sc.id} className="pt-3 first:pt-0">
                <div
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    res
                      ? res.status === 'PASSED'
                        ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                        : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setExpandedTestId(isExpanded ? null : sc.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {isRunning ? (
                          <RefreshCw className="w-5 h-5 text-cyan-600 animate-spin" />
                        ) : res ? (
                          res.status === 'PASSED' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-400">
                            &bull;
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-slate-900">{sc.id}</span>
                          <span className="text-xs font-bold text-slate-800">{sc.name.split(':')[1] || sc.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {sc.category}
                          </span>
                        </div>
                        {res && (
                          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                            {res.validationNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {res && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {res.executionTimeMs}ms
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black uppercase ${
                              res.status === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isRunning || isRunningAll}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunSingleTest(sc.id);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current text-cyan-600" />
                        <span>Run</span>
                      </button>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && res && (
                    <div
                      className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Request Payload */}
                        <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-[11px] overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <Code className="w-3.5 h-3.5 text-cyan-400" />
                              Simulated NIC Request Payload
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyJson(res.rawRequest, `${sc.id}-req`)}
                              className="text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `${sc.id}-req` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === `${sc.id}-req` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <pre className="mt-2 overflow-x-auto max-h-48 text-[11px] text-cyan-300">
                            {JSON.stringify(res.rawRequest, null, 2)}
                          </pre>
                        </div>

                        {/* Response Payload */}
                        <div className="bg-slate-950 rounded-xl p-3 text-slate-200 font-mono text-[11px] overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              <Server className="w-3.5 h-3.5 text-emerald-400" />
                              NIC Gateway Envelope &amp; Error Code ({res.nicErrorCode || '200 OK'})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyJson(res.rawResponse, `${sc.id}-res`)}
                              className="text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `${sc.id}-res` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === `${sc.id}-res` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <pre className="mt-2 overflow-x-auto max-h-48 text-[11px] text-emerald-300">
                            {JSON.stringify(res.rawResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            NIC Pre-Production Architecture: <strong className="text-slate-800">Zero-Code Switch Ready</strong>. When sandbox credentials arrive, only update config keys.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>

      {/* Config & Sandbox Key Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">NIC Sandbox &amp; Production Gateway Config</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl text-cyan-950">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  <span>Zero-Code Integration Guarantee</span>
                </p>
                <p className="text-[11px] text-cyan-800">
                  Once your official NIC Sandbox credentials are provided by NIC/GSP, paste them here and change the mode to <strong>SANDBOX</strong>. No other module code changes are needed.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Environment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MOCK', 'SANDBOX', 'PRODUCTION'] as NicEnvironment[]).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setConfigEnv(env)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        configEnv === env
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NIC Taxpayer GSTIN</label>
                <input
                  type="text"
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">GSP Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NIC Sandbox AppKey / Client Secret</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 text-xs"
                  placeholder="Paste Sandbox API Key when received..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
