import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Lock,
  Globe,
  Clock,
  Smartphone,
  KeyRound,
  Users,
  Database,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Save,
  Radio,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Terminal,
  Activity,
  Zap,
  Check,
  X,
  Flame,
  Shield,
  Layers,
} from 'lucide-react';
import {
  MultiContextScopePolicy,
  RowLevelSecurityRule,
  BreakGlassRequest,
} from '../../types/admin';
import {
  mockMultiContextPolicies,
  mockRowLevelSecurityRules,
  mockBreakGlassRequests,
} from '../../data/mockAdminExtendedData';
import { mockAdminUsers, mockAdminRoles } from '../../data/mockAdminData';

interface AdminRbacSecurityMultiContextViewProps {
  showToast?: (msg: string) => void;
}

export const AdminRbacSecurityMultiContextView: React.FC<AdminRbacSecurityMultiContextViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState<
    'contexts' | 'rls' | 'guardrails' | 'breakglass' | 'sessions'
  >('contexts');

  // Context Policies State
  const [contexts, setContexts] = useState<MultiContextScopePolicy[]>(mockMultiContextPolicies);
  const [selectedContextId, setSelectedContextId] = useState<string>(contexts[0]?.id || '');
  const [rlsRules, setRlsRules] = useState<RowLevelSecurityRule[]>(mockRowLevelSecurityRules);
  const [breakGlassList, setBreakGlassList] = useState<BreakGlassRequest[]>(mockBreakGlassRequests);

  // New Break-Glass Modal State
  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState(false);
  const [newBreakGlass, setNewBreakGlass] = useState({
    ticketNumber: '',
    requestedBy: '',
    roleElevatedTo: 'SYS_SUPER_ADMIN',
    reason: '',
    targetPlant: 'Plant 1 - Chennai',
    validForHours: 2,
  });

  // Guardrail Configuration State
  const [guardrailSettings, setGuardrailSettings] = useState({
    enforceShiftHours: true,
    enforceSingleActiveSession: true,
    blockCrossPlantSimultaneousLogin: true,
    maxFailedAttempts: 5,
    lockoutMinutes: 30,
    mfaForRemoteAdmin: true,
    requireBreakGlassDualApproval: true,
  });

  // New RLS Rule Modal
  const [isNewRlsModalOpen, setIsNewRlsModalOpen] = useState(false);
  const [newRlsData, setNewRlsData] = useState({
    tableName: 'mfg_production_entries',
    ruleName: '',
    filterCondition: '`plant_id` = CURRENT_USER.active_plant_id',
    targetContext: 'All Plant Entities',
  });

  // Test RLS query evaluator state
  const [testUserContext, setTestUserContext] = useState(mockAdminUsers[1]?.id || '');
  const [evaluatedSqlResult, setEvaluatedSqlResult] = useState<string | null>(null);

  const selectedContext = contexts.find((c) => c.id === selectedContextId) || contexts[0];

  // Active Sessions Live Feed Mock
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'SES-991',
      userName: 'Rajesh Sharma',
      role: 'Plant Operations Manager',
      plant: 'Plant 1 - Chennai',
      ip: '192.168.10.14',
      device: 'Shopfloor HMI Station #04',
      loginTime: '08:14 AM',
      anomalyScore: 'Low (0.02)',
      status: 'Active',
    },
    {
      id: 'SES-992',
      userName: 'Priya Patel',
      role: 'Quality Director & QA Lead',
      plant: 'Plant 2 - Pune',
      ip: '192.168.20.88',
      device: 'Lab Spectrophotometer PC',
      loginTime: '08:45 AM',
      anomalyScore: 'Low (0.01)',
      status: 'Active',
    },
    {
      id: 'SES-993',
      userName: 'Amitabh Joshi',
      role: 'Lead DevOps & DBA',
      plant: 'Corporate HQ Mumbai (Break-Glass)',
      ip: '14.139.120.4',
      device: 'Secure Linux Admin Terminal',
      loginTime: '09:05 AM',
      anomalyScore: 'Elevated (0.64) - Break-Glass Session',
      status: 'Elevated',
    },
    {
      id: 'SES-994',
      userName: 'Suresh Patil',
      role: 'Shift Supervisor A',
      plant: 'Plant 1 - Chennai',
      ip: '192.168.10.92',
      device: 'Handheld RF Gun #12',
      loginTime: '06:02 AM',
      anomalyScore: 'Low (0.04)',
      status: 'Active',
    },
    {
      id: 'SES-995',
      userName: 'Vikram Mehta',
      role: 'Procurement Lead',
      plant: 'Corporate HQ Mumbai',
      ip: '172.16.4.19',
      device: 'Corporate Laptop (Dell Latitude)',
      loginTime: '09:12 AM',
      anomalyScore: 'Low (0.05)',
      status: 'Active',
    },
  ]);

  const handleToggleGeofence = (contextId: string) => {
    setContexts((prev) =>
      prev.map((c) => (c.id === contextId ? { ...c, enforceGeofence: !c.enforceGeofence } : c))
    );
    showToast('Updated plant geofence enforcement setting.');
  };

  const handleToggleMfa = (contextId: string) => {
    setContexts((prev) =>
      prev.map((c) => (c.id === contextId ? { ...c, mfaRequired: !c.mfaRequired } : c))
    );
    showToast('Updated multi-factor authentication requirement for context.');
  };

  const handleCreateBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreakGlass.ticketNumber || !newBreakGlass.reason) {
      showToast('Please specify the incident ticket number and justification.');
      return;
    }

    const req: BreakGlassRequest = {
      id: `BG-${Date.now().toString().slice(-4)}`,
      ticketNumber: newBreakGlass.ticketNumber.trim().toUpperCase(),
      requestedBy: newBreakGlass.requestedBy || 'Amitabh Joshi (Current Admin)',
      roleElevatedTo: newBreakGlass.roleElevatedTo,
      reason: newBreakGlass.reason.trim(),
      targetPlant: newBreakGlass.targetPlant,
      validForHours: newBreakGlass.validForHours,
      approvedBy: 'Dual Sign-Off: Kavita Iyer (IT Governance)',
      status: 'Active',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAt: new Date(Date.now() + newBreakGlass.validForHours * 3600000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setBreakGlassList([req, ...breakGlassList]);
    setIsBreakGlassModalOpen(false);
    setNewBreakGlass({
      ticketNumber: '',
      requestedBy: '',
      roleElevatedTo: 'SYS_SUPER_ADMIN',
      reason: '',
      targetPlant: 'Plant 1 - Chennai',
      validForHours: 2,
    });
    showToast(`Break-Glass superuser token issued for ticket ${req.ticketNumber}. Expires in ${req.validForHours}h.`);
  };

  const handleRevokeBreakGlass = (id: string) => {
    setBreakGlassList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Revoked' } : b))
    );
    showToast('Break-Glass elevated credentials immediately revoked and session terminated.');
  };

  const handleCreateRlsRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRlsData.ruleName) {
      showToast('Please provide a descriptive rule name.');
      return;
    }

    const newRule: RowLevelSecurityRule = {
      id: `RLS-${Date.now().toString().slice(-3)}`,
      tableName: newRlsData.tableName,
      ruleName: newRlsData.ruleName.trim(),
      applicableRoles: ['Shift Supervisor', 'Machine Operator', 'Plant Accountant'],
      filterCondition: newRlsData.filterCondition.trim(),
      targetContext: newRlsData.targetContext,
      isActive: true,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    setRlsRules([...rlsRules, newRule]);
    setIsNewRlsModalOpen(false);
    setNewRlsData({
      tableName: 'mfg_production_entries',
      ruleName: '',
      filterCondition: '`plant_id` = CURRENT_USER.active_plant_id',
      targetContext: 'All Plant Entities',
    });
    showToast(`Row-Level Security predicate attached to table "${newRule.tableName}".`);
  };

  const handleToggleRlsRule = (id: string) => {
    setRlsRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    showToast('Updated Row-Level Security rule status.');
  };

  const handleEvaluateRlsQuery = () => {
    const user = mockAdminUsers.find((u) => u.id === testUserContext) || mockAdminUsers[0];
    const generatedQuery = `SELECT * FROM mfg_work_orders 
WHERE \`plant_id\` = '${user.plantIds[0] || 'PLANT-01'}' 
  AND \`tenant_id\` = 'TENANT-REBOOT-PLASTICS'
  AND \`is_deleted\` = FALSE
ORDER BY \`created_at\` DESC 
/* Enforced by RLS Policy RLS-001 for User: ${user.fullName} (${user.roleName}) */`;

    setEvaluatedSqlResult(generatedQuery);
    showToast(`Evaluated RLS predicate for user ${user.fullName}.`);
  };

  const handleTerminateSession = (sessionId: string, userName: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast(`Terminated remote session ${sessionId} for user ${userName}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#0F8B8D]" />
            <span>Multi-Plant &amp; Contextual Access Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            RBAC Security &amp; Multi-Context Scope Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-plant data segregation, Row-Level Security (RLS) policies, CIDR network geofencing, shift access guardrails, and emergency Break-Glass escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBreakGlassModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <Flame className="w-4 h-4 text-rose-600" />
            Request Break-Glass Escalation
          </button>
          <button
            onClick={() => showToast('Multi-context security policy compiled and deployed to edge gateways.')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Deploy Policy
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('contexts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'contexts'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Multi-Context Scope &amp; Plant Isolation</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{contexts.length} Entities</span>
        </button>

        <button
          onClick={() => setActiveTab('rls')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'rls'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Row-Level Security (RLS) Partitioning</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {rlsRules.length} Rules
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guardrails')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'guardrails'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Contextual Guardrails &amp; Geofencing</span>
        </button>

        <button
          onClick={() => setActiveTab('breakglass')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'breakglass'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Emergency Break-Glass Protocol</span>
          {breakGlassList.filter((b) => b.status === 'Active').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
              1 Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Live Multi-Context Session Monitor</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MULTI-CONTEXT SCOPE & PLANT ISOLATION             */}
      {/* ========================================================= */}
      {activeTab === 'contexts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contexts.map((ctx) => (
              <div
                key={ctx.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                      {ctx.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ctx.dataIsolationLevel === 'Strict Partitioned'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ctx.dataIsolationLevel}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-2">{ctx.contextName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{ctx.location}</p>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Assigned Personnel:</span>
                      <strong className="text-slate-900">{ctx.assignedUsersCount} users</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Operating Hours:</span>
                      <strong className="text-slate-900">{ctx.operatingHours.split(' ')[0]}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Active Terminal Sessions:</span>
                      <span className="font-bold text-emerald-600">{ctx.activeSessions} online</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">CIDR Geofence:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleGeofence(ctx.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ctx.enforceGeofence ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {ctx.enforceGeofence ? 'Enforced' : 'Disabled'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Mandatory MFA:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleMfa(ctx.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ctx.mfaRequired ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {ctx.mfaRequired ? 'Enforced' : 'Optional'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cross-Plant Access Grant Matrix Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#0F8B8D]" />
                  Cross-Plant &amp; Multi-Entity Access Scope Grants
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View authorization boundaries for personnel with Single-Plant vs Multi-Plant Roaming vs Corporate Global Scope.
                </p>
              </div>
              <button
                onClick={() => showToast('Exporting Cross-Plant Access Scope Audit Report...')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export Scope Audit
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Role Designation</th>
                    <th className="py-2.5 px-3">Primary Home Plant</th>
                    <th className="py-2.5 px-3">Authorized Plant Scope</th>
                    <th className="py-2.5 px-3">Scope Boundary</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockAdminUsers.slice(0, 6).map((u) => {
                    const isGlobal = u.roleName === 'Super Administrator' || u.roleName === 'Finance Controller';
                    const isMulti = (u.plantNames || []).length > 1;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{u.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{u.roleName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{u.plantNames?.[0] || 'Plant 1 - Chennai'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.plantNames || ['Plant 1 - Chennai']).map((p) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono"
                              >
                                {p.split(' - ')[0]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isGlobal
                                ? 'bg-indigo-100 text-indigo-800'
                                : isMulti
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isGlobal ? 'Corporate Global' : isMulti ? 'Multi-Plant Roaming' : 'Single-Plant Locked'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => showToast(`Editing plant scope for ${u.fullName}...`)}
                            className="text-[#0F8B8D] hover:underline font-semibold"
                          >
                            Edit Scope
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ROW-LEVEL SECURITY (RLS) PARTITIONING              */}
      {/* ========================================================= */}
      {activeTab === 'rls' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active RLS Rules Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#0F8B8D]" />
                    Row-Level Security (RLS) Predicate Policies
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enforces database-level row filtering on SQL queries to prevent unauthorized cross-plant records visibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewRlsModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add RLS Rule
                </button>
              </div>

              <div className="space-y-3">
                {rlsRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rule.ruleName}</span>
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Table: {rule.tableName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRlsRule(rule.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {rule.isActive ? 'Active RLS' : 'Inactive'}
                      </button>
                    </div>

                    <div className="p-2.5 bg-slate-900 text-teal-300 font-mono text-[11px] rounded-lg">
                      WHERE {rule.filterCondition}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>Target Context: {rule.targetContext}</span>
                      <span>Enforced on: {rule.applicableRoles.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Live RLS Query Evaluator */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#0F8B8D]" />
                  Live RLS SQL Query Tester
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate how backend ORM injects row-level partition clauses for specific users.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evaluate for User</label>
                  <select
                    value={testUserContext}
                    onChange={(e) => setTestUserContext(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {mockAdminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roleName} - {u.plantNames?.[0] || 'Plant 1'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleEvaluateRlsQuery}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
                >
                  Compile &amp; Evaluate Query
                </button>

                {evaluatedSqlResult && (
                  <div className="space-y-2 pt-2 animate-fade-in">
                    <span className="font-bold text-slate-700">Rewritten SQL Output:</span>
                    <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-800">
                      {evaluatedSqlResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONTEXTUAL GUARDRAILS & GEOFENCING                 */}
      {/* ========================================================= */}
      {activeTab === 'guardrails' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-[#0F8B8D]" />
              <h2 className="text-sm font-bold text-slate-900">Shift &amp; Time-Window Guardrails</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={guardrailSettings.enforceShiftHours}
                  onChange={(e) =>
                    setGuardrailSettings({ ...guardrailSettings, enforceShiftHours: e.target.checked })
                  }
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Enforce Plant Shift Access Windows</span>
                  <span className="text-slate-500 text-[11px]">
                    Operators and line crews can only authenticate during their scheduled shift hours (+/- 15 min buffer).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={guardrailSettings.enforceSingleActiveSession}
                  onChange={(e) =>
                    setGuardrailSettings({
                      ...guardrailSettings,
                      enforceSingleActiveSession: e.target.checked,
                    })
                  }
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Single Active Terminal Session</span>
                  <span className="text-slate-500 text-[11px]">
                    Logging into a handheld scanner or terminal automatically kicks previous active web sessions.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={guardrailSettings.blockCrossPlantSimultaneousLogin}
                  onChange={(e) =>
                    setGuardrailSettings({
                      ...guardrailSettings,
                      blockCrossPlantSimultaneousLogin: e.target.checked,
                    })
                  }
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Block Simultaneous Cross-Plant Logins</span>
                  <span className="text-slate-500 text-[11px]">
                    Detects impossible travel anomaly when credentials are used from two physical plants within minutes.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-4 h-4 text-[#0F8B8D]" />
              <h2 className="text-sm font-bold text-slate-900">Plant Subnet &amp; Geofence Subnets</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Authorized Plant CIDR Subnets:</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-[#0F8B8D]">Plant 1 (Chennai):</span> 192.168.10.0/24
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-[#0F8B8D]">Plant 2 (Pune):</span> 192.168.20.0/24
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-[#0F8B8D]">Plant 3 (Ahmedabad):</span> 192.168.30.0/24
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-[#0F8B8D]">Corporate HQ:</span> 172.16.0.0/16
                  </div>
                </div>
              </div>

              <button
                onClick={() => showToast('Saved contextual guardrail & geofencing policies.')}
                className="w-full py-2.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold transition-colors"
              >
                Save Guardrail Configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: EMERGENCY BREAK-GLASS PROTOCOL                    */}
      {/* ========================================================= */}
      {activeTab === 'breakglass' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Emergency Superuser Break-Glass Privilege Escalation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Time-limited, auto-expiring privilege escalation for production line halts, database index rebuilds, and disaster recovery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBreakGlassModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                + Issue Emergency Token
              </button>
            </div>

            <div className="space-y-3">
              {breakGlassList.map((bg) => (
                <div
                  key={bg.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                    bg.status === 'Active'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{bg.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bg.status === 'Active'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {bg.status}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Target: {bg.targetPlant}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      Elevated Role: <span className="font-mono text-[#0F8B8D]">{bg.roleElevatedTo}</span> | Requested by: {bg.requestedBy}
                    </div>
                    <p className="text-slate-600 text-[11px]">{bg.reason}</p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Approved By: {bg.approvedBy} &bull; Valid: {bg.requestedAt} to {bg.expiresAt} ({bg.validForHours} Hours)
                    </div>
                  </div>

                  {bg.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleRevokeBreakGlass(bg.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold self-start md:self-auto shadow-xs"
                    >
                      Revoke Immediately
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LIVE MULTI-CONTEXT SESSION MONITOR                 */}
      {/* ========================================================= */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Live Multi-Plant Active Sessions &amp; Anomaly Watcher
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time visibility into active authenticated terminals across all injection molding plants and corporate offices.
              </p>
            </div>
            <button
              onClick={() => showToast('Refreshed active session telemetry across all plants.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Feed
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">User &amp; Role</th>
                  <th className="py-2.5 px-3">Plant Context</th>
                  <th className="py-2.5 px-3">Client IP &amp; Device</th>
                  <th className="py-2.5 px-3">Login Time</th>
                  <th className="py-2.5 px-3">Anomaly Score</th>
                  <th className="py-2.5 px-3 text-right">Kill Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSessions.map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{ses.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{ses.userName}</div>
                      <div className="text-[10px] text-slate-500">{ses.role}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{ses.plant}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div>{ses.ip}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{ses.device}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{ses.loginTime}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ses.status === 'Elevated'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ses.anomalyScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleTerminateSession(ses.id, ses.userName)}
                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px]"
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Request Break-Glass */}
      {isBreakGlassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              Emergency Break-Glass Escalation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Requires mandatory incident ticket reference and audit justification for superuser access token.
            </p>

            <form onSubmit={handleCreateBreakGlass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incident Ticket Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INC-2026-0907-04"
                  value={newBreakGlass.ticketNumber}
                  onChange={(e) => setNewBreakGlass({ ...newBreakGlass, ticketNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Plant Entity</label>
                <select
                  value={newBreakGlass.targetPlant}
                  onChange={(e) => setNewBreakGlass({ ...newBreakGlass, targetPlant: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="Plant 1 - Chennai">Plant 1 - Chennai</option>
                  <option value="Plant 2 - Pune">Plant 2 - Pune</option>
                  <option value="Plant 3 - Ahmedabad">Plant 3 - Ahmedabad</option>
                  <option value="Corporate HQ Mumbai">Corporate HQ Mumbai</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Elevation Validity Window</label>
                <select
                  value={newBreakGlass.validForHours}
                  onChange={(e) =>
                    setNewBreakGlass({ ...newBreakGlass, validForHours: parseInt(e.target.value) || 2 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value={1}>1 Hour (Quick Hotfix)</option>
                  <option value={2}>2 Hours (Standard Incident)</option>
                  <option value={4}>4 Hours (Complex Disaster Recovery)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incident Justification *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe technical emergency, machine lock, or recovery task..."
                  value={newBreakGlass.reason}
                  onChange={(e) => setNewBreakGlass({ ...newBreakGlass, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBreakGlassModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add RLS Rule */}
      {isNewRlsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Row-Level Security Rule</h3>
            <p className="text-xs text-slate-500 mb-4">
              Inject SQL WHERE filter predicate for target table partition.
            </p>

            <form onSubmit={handleCreateRlsRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Table Name</label>
                <select
                  value={newRlsData.tableName}
                  onChange={(e) => setNewRlsData({ ...newRlsData, tableName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                >
                  <option value="mfg_production_entries">mfg_production_entries</option>
                  <option value="inv_material_receipts">inv_material_receipts</option>
                  <option value="qa_inspection_lots">qa_inspection_lots</option>
                  <option value="fin_vendor_invoices">fin_vendor_invoices</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Entry Plant Isolation"
                  value={newRlsData.ruleName}
                  onChange={(e) => setNewRlsData({ ...newRlsData, ruleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SQL Predicate Condition *</label>
                <input
                  type="text"
                  required
                  value={newRlsData.filterCondition}
                  onChange={(e) => setNewRlsData({ ...newRlsData, filterCondition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewRlsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold"
                >
                  Save RLS Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
