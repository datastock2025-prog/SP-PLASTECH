import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Copy,
  Check,
  X,
  Lock,
  Users,
  Save,
  Eye,
  FilePlus,
  Edit,
  Trash2,
  CheckCircle,
  Download,
  Upload,
  Play,
  FlaskConical,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  GitBranch,
  KeyRound,
  FileText,
  Building,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Shield,
  Zap,
} from 'lucide-react';
import {
  AdminRole,
  ModulePermission,
  RoleSimulationScenario,
  SimulationVerdict,
  SodConflictRule,
  SodViolation,
} from '../../types/admin';
import {
  mockAdminRoles,
  mockAdminUsers,
} from '../../data/mockAdminData';
import {
  mockSodRules,
  mockSodViolations,
  mockSimulationScenarios,
  mockMultiContextPolicies,
} from '../../data/mockAdminExtendedData';

interface AdminRolesViewProps {
  showToast?: (msg: string) => void;
  initialTab?: 'matrix' | 'simulator' | 'sod' | 'hierarchy';
}

export const AdminRolesView: React.FC<AdminRolesViewProps> = ({
  showToast = (_msg: string) => {},
  initialTab = 'matrix',
}) => {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator' | 'sod' | 'hierarchy'>(initialTab);
  const [roles, setRoles] = useState<AdminRole[]>(mockAdminRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Actions
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCloningRole, setIsCloningRole] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    code: '',
    description: '',
    template: 'Blank',
  });

  // -------------------------------------------------------------
  // Simulator Sandbox State
  // -------------------------------------------------------------
  const [simSubjectType, setSimSubjectType] = useState<'user' | 'role' | 'multi_role'>('user');
  const [simSelectedUserId, setSimSelectedUserId] = useState<string>(mockAdminUsers[0]?.id || '');
  const [simSelectedRoleId, setSimSelectedRoleId] = useState<string>(mockAdminRoles[1]?.id || '');
  const [simMultiRoleIds, setSimMultiRoleIds] = useState<string[]>([mockAdminRoles[1]?.id, mockAdminRoles[2]?.id]);
  const [simSelectedPlant, setSimSelectedPlant] = useState<string>('PLANT_CHE_01');
  const [simSelectedShift, setSimSelectedShift] = useState<string>('Shift A (06:00 - 14:00)');
  const [simIpAddress, setSimIpAddress] = useState<string>('192.168.10.45');
  const [simModule, setSimModule] = useState<string>('Manufacturing & MES');
  const [simAction, setSimAction] = useState<keyof ModulePermission>('approve');
  const [simResource, setSimResource] = useState<string>('Work Order Line Authorization & Mold Setup');
  const [simCustomAmount, setSimCustomAmount] = useState<number>(250000);
  const [simulationResult, setSimulationResult] = useState<SimulationVerdict | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // What-if Sandbox Overrides
  const [sandboxOverrides, setSandboxOverrides] = useState<Record<string, Partial<ModulePermission>>>({});

  // SoD Rules State
  const [sodRules, setSodRules] = useState<SodConflictRule[]>(mockSodRules);
  const [sodViolations, setSodViolations] = useState<SodViolation[]>(mockSodViolations);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const modulesData = [
    { name: 'Master Data', category: 'General', desc: 'Resin items, additive grades, packaging SKUs, supplier codes' },
    { name: 'Engineering & BOM', category: 'Operations', desc: 'Multi-level BOM formulas, mold tooling, masterbatch % ratios' },
    { name: 'Manufacturing & MES', category: 'Operations', desc: 'Work order dispatch, shift logging, scrap reconciliation, line halts' },
    { name: 'Inventory & Warehouse', category: 'Operations', desc: 'Silo balances, regrind lot transfers, bin pick/pack queues' },
    { name: 'Procurement & Sourcing', category: 'Commercial', desc: 'Purchase requisitions, polymer contracts, Platts indexing, RFQs' },
    { name: 'Sales & Commercial', category: 'Commercial', desc: 'Customer 360, OEM quotations, margin simulator, dispatch orders' },
    { name: 'Finance & Accounting', category: 'Governance', desc: 'General ledger, cost center absorption, AP/AR, GST tax invoices' },
    { name: 'Quality & Laboratory', category: 'Quality/Safety', desc: 'IQC/IPQC inspections, 8D CAPA, COA releases, melt flow tests' },
    { name: 'MEP & Plant Utilities', category: 'Operations', desc: 'Chiller loop telemetry, compressed air, power metering, boiler PM' },
    { name: 'Human Resources', category: 'Governance', desc: 'Biometric punches, shift rosters, IATF skill matrix, overtime payroll' },
    { name: 'Supply Chain Control', category: 'Commercial', desc: 'S&OP matrix, multimodal track & trace, supplier risk scorecard' },
    { name: 'CRM & Client 360', category: 'Commercial', desc: 'Lead pipeline, RMA returns, customer credit limit overrides' },
    { name: 'Admin & System Config', category: 'Governance', desc: 'Global parameters, security policies, backup restore, user groups' },
  ];

  const filteredModules = modulesData.filter((mod) => {
    const matchCat = moduleCategoryFilter === 'ALL' || mod.category === moduleCategoryFilter;
    const matchSearch =
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // -------------------------------------------------------------
  // Permission Matrix Handlers
  // -------------------------------------------------------------
  const handleTogglePermission = (moduleName: string, action: keyof ModulePermission) => {
    if (selectedRole.isSystemRole && selectedRole.code === 'SYS_SUPER_ADMIN') {
      showToast('Super Administrator permissions are immutable and cannot be restricted.');
      return;
    }

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const currentPerms = role.permissions[moduleName] || {
            view: false,
            create: false,
            edit: false,
            delete: false,
            approve: false,
            export: false,
          };
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [moduleName]: {
                ...currentPerms,
                [action]: !currentPerms[action],
              },
            },
          };
        }
        return role;
      })
    );
  };

  const handleToggleAllRow = (moduleName: string, enable: boolean) => {
    if (selectedRole.isSystemRole && selectedRole.code === 'SYS_SUPER_ADMIN') return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [moduleName]: {
                view: enable,
                create: enable,
                edit: enable,
                delete: enable,
                approve: enable,
                export: enable,
              },
            },
          };
        }
        return role;
      })
    );
  };

  const handleToggleColumn = (action: keyof ModulePermission, enable: boolean) => {
    if (selectedRole.isSystemRole && selectedRole.code === 'SYS_SUPER_ADMIN') return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const newPerms = { ...role.permissions };
          modulesData.forEach((mod) => {
            newPerms[mod.name] = {
              ...(newPerms[mod.name] || {
                view: false,
                create: false,
                edit: false,
                delete: false,
                approve: false,
                export: false,
              }),
              [action]: enable,
            };
          });
          return { ...role, permissions: newPerms };
        }
        return role;
      })
    );
    showToast(`Bulk ${enable ? 'granted' : 'revoked'} "${action.toUpperCase()}" privilege for ${selectedRole.name}.`);
  };

  const handleGrantAll = () => {
    if (selectedRole.isSystemRole && selectedRole.code === 'SYS_SUPER_ADMIN') return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const newPerms: Record<string, ModulePermission> = {};
          modulesData.forEach((mod) => {
            newPerms[mod.name] = {
              view: true,
              create: true,
              edit: true,
              delete: true,
              approve: true,
              export: true,
            };
          });
          return { ...role, permissions: newPerms };
        }
        return role;
      })
    );
    showToast(`Granted all module permissions to ${selectedRole.name}.`);
  };

  const handleRevokeAll = () => {
    if (selectedRole.isSystemRole && selectedRole.code === 'SYS_SUPER_ADMIN') {
      showToast('Super Admin role cannot be blanked out.');
      return;
    }
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const newPerms: Record<string, ModulePermission> = {};
          modulesData.forEach((mod) => {
            newPerms[mod.name] = {
              view: false,
              create: false,
              edit: false,
              delete: false,
              approve: false,
              export: false,
            };
          });
          return { ...role, permissions: newPerms };
        }
        return role;
      })
    );
    showToast(`Revoked all permissions for ${selectedRole.name}.`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleData.name) {
      showToast('Please enter a role name.');
      return;
    }

    let basePerms: Record<string, ModulePermission> = {};
    if (newRoleData.template === 'Plant Supervisor') {
      modulesData.forEach((m) => {
        basePerms[m.name] = {
          view: true,
          create: ['Manufacturing & MES', 'Inventory & Warehouse'].includes(m.name),
          edit: ['Manufacturing & MES', 'Inventory & Warehouse'].includes(m.name),
          delete: false,
          approve: ['Manufacturing & MES'].includes(m.name),
          export: true,
        };
      });
    } else if (newRoleData.template === 'Quality Inspector') {
      modulesData.forEach((m) => {
        basePerms[m.name] = {
          view: true,
          create: m.name === 'Quality & Laboratory',
          edit: m.name === 'Quality & Laboratory',
          delete: false,
          approve: m.name === 'Quality & Laboratory',
          export: true,
        };
      });
    } else if (newRoleData.template === 'Read Only Auditor') {
      modulesData.forEach((m) => {
        basePerms[m.name] = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          approve: false,
          export: true,
        };
      });
    } else {
      modulesData.forEach((m) => {
        basePerms[m.name] = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          approve: false,
          export: false,
        };
      });
    }

    const newRole: AdminRole = {
      id: `ROLE-${Date.now().toString().slice(-4)}`,
      name: newRoleData.name.trim(),
      code: newRoleData.code.trim().toUpperCase() || `ROLE_${newRoleData.name.replace(/\s+/g, '_').toUpperCase()}`,
      description: newRoleData.description.trim() || 'Custom plant operational profile',
      isSystemRole: false,
      userCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      permissions: basePerms,
    };

    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setIsCreatingRole(false);
    setNewRoleData({ name: '', code: '', description: '', template: 'Blank' });
    showToast(`Custom role "${newRole.name}" created with template "${newRoleData.template}".`);
  };

  const handleCloneRole = () => {
    const clonedRole: AdminRole = {
      id: `ROLE-${Date.now().toString().slice(-4)}`,
      name: `${selectedRole.name} (Copy)`,
      code: `${selectedRole.code}_COPY`,
      description: `Cloned snapshot from ${selectedRole.name}`,
      isSystemRole: false,
      userCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      permissions: JSON.parse(JSON.stringify(selectedRole.permissions)),
    };
    setRoles([...roles, clonedRole]);
    setSelectedRoleId(clonedRole.id);
    showToast(`Cloned role "${selectedRole.name}" into "${clonedRole.name}".`);
  };

  const handleExportMatrixJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(roles, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `rbac_permission_matrix_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Exported RBAC Permission Matrix definition as JSON.');
  };

  // -------------------------------------------------------------
  // Live Simulator Engine Execution
  // -------------------------------------------------------------
  const handleRunSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      let targetRoles: AdminRole[] = [];
      let subjectName = '';

      if (simSubjectType === 'user') {
        const user = mockAdminUsers.find((u) => u.id === simSelectedUserId) || mockAdminUsers[0];
        subjectName = `${user.fullName} (${user.designation})`;
        const matchingRole = roles.find((r) => r.id === user.roleId) || roles[0];
        targetRoles = [matchingRole];
      } else if (simSubjectType === 'role') {
        const role = roles.find((r) => r.id === simSelectedRoleId) || roles[0];
        subjectName = `Role: ${role.name}`;
        targetRoles = [role];
      } else {
        targetRoles = roles.filter((r) => simMultiRoleIds.includes(r.id));
        subjectName = `Composite (${targetRoles.map((r) => r.name).join(' + ')})`;
      }

      // Check Super Admin
      const hasSuperAdmin = targetRoles.some((r) => r.code === 'SYS_SUPER_ADMIN');

      // Check module permission across target roles (or sandbox override)
      const hasActionPerm = targetRoles.some((r) => {
        const effectivePerms = {
          ...(r.permissions[simModule] || {}),
          ...(sandboxOverrides[simModule] || {}),
        };
        return !!effectivePerms[simAction];
      });

      // Context Check (e.g. IP Geofence & Shift)
      const contextPolicy = mockMultiContextPolicies.find((c) => c.code === simSelectedPlant) || mockMultiContextPolicies[0];
      const isWhitelistedIp = contextPolicy.ipSubnets.some((subnet) => simIpAddress.startsWith(subnet.split('/')[0].slice(0, 7)));

      // Commercial threshold check
      const requiresCommercialDualAuth =
        simModule === 'Procurement & Sourcing' &&
        simAction === 'approve' &&
        simCustomAmount > 500000 &&
        !hasSuperAdmin;

      // Verdict Evaluation
      let verdict: 'PERMIT' | 'DENY' | 'REQUIRES_DUAL_AUTH' | 'MFA_STEP_UP_REQUIRED' = 'DENY';
      let reason = '';
      let policyPath = '';

      if (hasSuperAdmin) {
        if (!isWhitelistedIp && contextPolicy.enforceGeofence) {
          verdict = 'MFA_STEP_UP_REQUIRED';
          reason = 'Super Administrator authenticating from outside designated plant CIDR subnet requires TOTP step-up verification.';
          policyPath = 'Policy: SEC_GEOFENCE_STEPUP -> SuperAdmin Exception';
        } else {
          verdict = 'PERMIT';
          reason = 'Unrestricted Super Administrator system policy granted access.';
          policyPath = 'Policy: SYS_SUPER_ADMIN_WILDCARD';
        }
      } else if (requiresCommercialDualAuth) {
        verdict = 'REQUIRES_DUAL_AUTH';
        reason = `Requested PO Approval amount (₹${simCustomAmount.toLocaleString()}) exceeds localized single-signature threshold limit (₹5,00,000). Second controller authorization required.`;
        policyPath = 'Policy: COMMERCIAL_THRESHOLD_MATRIX -> Tier 2 Approval Rule';
      } else if (hasActionPerm) {
        verdict = 'PERMIT';
        reason = `Action "${simAction.toUpperCase()}" on module "${simModule}" is explicitly permitted under role assignment.`;
        policyPath = `Policy: RBAC_MATRIX_RULE -> Role [${targetRoles.map((r) => r.code).join(', ')}] -> ${simModule}.${simAction}`;
      } else {
        verdict = 'DENY';
        reason = `Action "${simAction.toUpperCase()}" is revoked or not granted for resource "${simResource}" in module "${simModule}".`;
        policyPath = `Policy: RBAC_DEFAULT_DENY -> Missing privilege ${simModule}.${simAction}`;
      }

      const conditions = [
        {
          name: 'RBAC Privilege Check',
          passed: hasSuperAdmin || hasActionPerm,
          detail: `Module: ${simModule} | Action: ${simAction.toUpperCase()} | Granted in role definition: ${hasActionPerm ? 'YES' : 'NO'}`,
        },
        {
          name: 'Plant Context & Geofence Fencing',
          passed: isWhitelistedIp || !contextPolicy.enforceGeofence,
          detail: `Target Plant: ${contextPolicy.contextName} | Client IP: ${simIpAddress} | Subnet Match: ${isWhitelistedIp ? 'MATCHED' : 'EXTERNAL'}`,
        },
        {
          name: 'Commercial Dollar/Rupee Ceiling Limit',
          passed: !requiresCommercialDualAuth,
          detail: `Transaction Value: ₹${simCustomAmount.toLocaleString()} | Single-Signer Cap: ₹5,00,000`,
        },
        {
          name: 'Separation of Duties (SoD) Conflict Scan',
          passed: true,
          detail: 'No active toxic role pairing detected for simulated action.',
        },
      ];

      setSimulationResult({
        verdict,
        matchedRole: targetRoles.map((r) => r.name).join(', '),
        reason,
        policyPath,
        evaluatedAt: new Date().toLocaleTimeString(),
        conditionsChecked: conditions,
      });

      setIsSimulating(false);
      showToast(`Simulation completed: Result is ${verdict}`);
    }, 450);
  };

  const handleApplyScenario = (scenario: RoleSimulationScenario) => {
    setSimSubjectType('role');
    if (scenario.roleIds[0]) {
      setSimSelectedRoleId(scenario.roleIds[0]);
    }
    setSimSelectedPlant(scenario.plantId === 'PLANT-01' ? 'PLANT_CHE_01' : 'PLANT_PUN_02');
    setSimSelectedShift(scenario.shift);
    setSimModule(scenario.module);
    setSimResource(scenario.resource);
    setSimAction(scenario.action as keyof ModulePermission);
    showToast(`Loaded test scenario: "${scenario.name}". Click "Run Simulation" to execute.`);
  };

  const handleToggleSandboxOverride = (moduleName: string, action: keyof ModulePermission) => {
    setSandboxOverrides((prev) => {
      const current = prev[moduleName] || {};
      const nextVal = !current[action];
      return {
        ...prev,
        [moduleName]: {
          ...current,
          [action]: nextVal,
        },
      };
    });
    showToast(`What-If Sandbox: Overrode [${moduleName}.${action}] temporary status.`);
  };

  const handleClearSandboxOverrides = () => {
    setSandboxOverrides({});
    showToast('Cleared all temporary What-If sandbox overrides.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Role-Based Access Control &amp; Sandbox Security</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            RBAC Permission Matrix &amp; Role Simulator Sandbox
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular CRUD &amp; approval rights across 13 enterprise ERP modules, test what-if authorizations in the live simulator sandbox, and enforce Separation of Duties (SoD).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreatingRole(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-[#0F8B8D]" />
            Create Role
          </button>
          <button
            onClick={handleCloneRole}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
            Clone Selected
          </button>
          <button
            onClick={handleExportMatrixJson}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Matrix
          </button>
          <button
            onClick={() => showToast(`Synchronized and committed permissions for role: ${selectedRole.name}. Policy deployed.`)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Granular Permission Matrix</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">13 Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'simulator'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Role Simulator Sandbox</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
            Live Testing
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sod')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'sod'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Separation of Duties (SoD)</span>
          {sodViolations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
              {sodViolations.length} Violations
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'hierarchy'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Role Hierarchy &amp; Assignments</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GRANULAR PERMISSION MATRIX                         */}
      {/* ========================================================= */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Roles Selector & Quick Preset */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Defined Roles</span>
                <span className="text-[11px] font-mono text-slate-400">{roles.length} Total</span>
              </div>

              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {roles.map((r) => {
                  const isSelected = r.id === selectedRoleId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-slate-900 shadow-xs ring-1 ring-[#0F8B8D]/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-slate-900">{r.name}</div>
                        {r.isSystemRole ? (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            System
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{r.description}</div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {r.userCount} assigned users
                        </span>
                        <span className="font-mono text-slate-400">{r.code}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Bulk Policy Actions Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#0F8B8D]" />
                Role Bulk Presets
              </div>
              <p className="text-[11px] text-slate-500">
                Apply bulk operational permission baselines to {selectedRole.name}.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGrantAll}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-center"
                >
                  Grant All Access
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-center"
                >
                  Revoke All Access
                </button>
              </div>
            </div>
          </div>

          {/* Right 3 Columns: Granular Permission Matrix Table */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Active Role Meta Banner */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900">{selectedRole.name}</h2>
                  <span className="font-mono text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {selectedRole.code}
                  </span>
                  {selectedRole.isSystemRole && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                      <Lock className="w-3 h-3" />
                      Protected Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search module..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 w-36 focus:w-48 transition-all focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <select
                  value={moduleCategoryFilter}
                  onChange={(e) => setModuleCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Operations">Operations</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Governance">Governance</option>
                  <option value="Quality/Safety">Quality &amp; Lab</option>
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">ERP Module &amp; Domain</th>
                    {/* View Column with Toggle All */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('view', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('view', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    {/* Create Column */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <FilePlus className="w-3.5 h-3.5 text-slate-500" /> Create
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('create', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('create', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    {/* Edit Column */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('edit', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('edit', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    {/* Delete Column */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Delete
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('delete', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('delete', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    {/* Approve Column */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-500" /> Approve
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('approve', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('approve', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    {/* Export Column */}
                    <th className="py-3 px-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          <Download className="w-3.5 h-3.5 text-slate-500" /> Export
                        </span>
                        <div className="flex gap-1 text-[9px] font-normal normal-case">
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('export', true)}
                            className="hover:underline text-emerald-700"
                          >
                            All
                          </button>
                          <span>/</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn('export', false)}
                            className="hover:underline text-rose-700"
                          >
                            None
                          </button>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[90px]">Row Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredModules.map((mod) => {
                    const perm = selectedRole.permissions[mod.name] || {
                      view: false,
                      create: false,
                      edit: false,
                      delete: false,
                      approve: false,
                      export: false,
                    };

                    const allActive =
                      perm.view && perm.create && perm.edit && perm.delete && perm.approve && perm.export;

                    return (
                      <tr key={mod.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-xs">{mod.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{mod.desc}</div>
                        </td>

                        {/* View */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'view')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.view
                                ? 'bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle View Permission"
                          >
                            {perm.view ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Create */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'create')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.create
                                ? 'bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Create Permission"
                          >
                            {perm.create ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Edit */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'edit')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.edit
                                ? 'bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Edit Permission"
                          >
                            {perm.edit ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Delete */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'delete')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.delete
                                ? 'bg-rose-100 text-rose-800 font-bold hover:bg-rose-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Delete Permission"
                          >
                            {perm.delete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Approve */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'approve')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.approve
                                ? 'bg-indigo-100 text-indigo-800 font-bold hover:bg-indigo-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Approve Permission"
                          >
                            {perm.approve ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Export */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.name, 'export')}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              perm.export
                                ? 'bg-teal-100 text-teal-800 font-bold hover:bg-teal-200'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title="Toggle Export Permission"
                          >
                            {perm.export ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Bulk Row Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAllRow(mod.name, !allActive)}
                            title={allActive ? 'Revoke All for this module' : 'Grant All for this module'}
                            className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                          >
                            {allActive ? 'Clear Row' : 'Grant All'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
                Privilege policies are cryptographically hashed and enforced at both frontend UI guards and API edge controllers.
              </span>
              <button
                onClick={() => showToast(`Successfully committed permissions for role: ${selectedRole.name}. Policy applied across active sessions.`)}
                className="px-4 py-2 rounded-lg bg-[#0F8B8D] text-white font-semibold hover:bg-[#0c7274] transition-colors shadow-xs"
              >
                Commit &amp; Synchronize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ROLE SIMULATOR & PERMISSION SANDBOX                */}
      {/* ========================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Simulator Controls & Target Config */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Test Subject & Context Selection */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FlaskConical className="w-4 h-4 text-[#0F8B8D]" />
                <h2 className="text-sm font-bold text-slate-900">1. Select Test Subject &amp; Context</h2>
              </div>

              {/* Subject Type Picker */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evaluate Access By</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSimSubjectType('user')}
                      className={`py-1.5 rounded-md font-semibold text-center transition-colors ${
                        simSubjectType === 'user' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      User Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSubjectType('role')}
                      className={`py-1.5 rounded-md font-semibold text-center transition-colors ${
                        simSubjectType === 'role' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Single Role
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSubjectType('multi_role')}
                      className={`py-1.5 rounded-md font-semibold text-center transition-colors ${
                        simSubjectType === 'multi_role' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Multi-Role
                    </button>
                  </div>
                </div>

                {/* Dynamic Subject Selector */}
                {simSubjectType === 'user' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Employee Account</label>
                    <select
                      value={simSelectedUserId}
                      onChange={(e) => setSimSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                      {mockAdminUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} — {u.roleName} ({u.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {simSubjectType === 'role' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Role Profile</label>
                    <select
                      value={simSelectedRoleId}
                      onChange={(e) => setSimSelectedRoleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {simSubjectType === 'multi_role' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Composite Roles (Overlapping)</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                      {roles.map((r) => {
                        const isChecked = simMultiRoleIds.includes(r.id);
                        return (
                          <label key={r.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSimMultiRoleIds([...simMultiRoleIds, r.id]);
                                } else {
                                  setSimMultiRoleIds(simMultiRoleIds.filter((id) => id !== r.id));
                                }
                              }}
                              className="rounded text-[#0F8B8D]"
                            />
                            <span className="text-[11px] font-medium text-slate-800">{r.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Context: Plant & Shift */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Plant Context</label>
                    <select
                      value={simSelectedPlant}
                      onChange={(e) => setSimSelectedPlant(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    >
                      <option value="PLANT_CHE_01">Plant 1 - Chennai</option>
                      <option value="PLANT_PUN_02">Plant 2 - Pune</option>
                      <option value="PLANT_AHM_03">Plant 3 - Ahmedabad</option>
                      <option value="CORP_MUM_HQ">Corporate HQ Mumbai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Operating Shift</label>
                    <select
                      value={simSelectedShift}
                      onChange={(e) => setSimSelectedShift(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    >
                      <option value="Shift A (06:00 - 14:00)">Shift A (Morning)</option>
                      <option value="Shift B (14:00 - 22:00)">Shift B (Afternoon)</option>
                      <option value="Shift C (22:00 - 06:00)">Shift C (Night)</option>
                      <option value="General">General Corporate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Simulated Client IP Address</label>
                  <input
                    type="text"
                    value={simIpAddress}
                    onChange={(e) => setSimIpAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                    placeholder="e.g. 192.168.10.45"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Tests CIDR subnet whitelisting &amp; geofence rules.
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Target Action & Resource */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-[#0F8B8D]" />
                <h2 className="text-sm font-bold text-slate-900">2. Define Target Action &amp; Parameters</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target ERP Module</label>
                  <select
                    value={simModule}
                    onChange={(e) => setSimModule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    {modulesData.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Action</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as (keyof ModulePermission)[]).map(
                      (act) => {
                        const isSelected = simAction === act;
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setSimAction(act)}
                            className={`py-2 px-2 rounded-lg border text-xs font-bold capitalize transition-all ${
                              isSelected
                                ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {act}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Business Resource</label>
                  <input
                    type="text"
                    value={simResource}
                    onChange={(e) => setSimResource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    placeholder="e.g. Work Order Release &amp; Line Allocation"
                  />
                </div>

                {simModule === 'Procurement & Sourcing' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Purchase Order Value (₹ INR)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={simCustomAmount}
                      onChange={(e) => setSimCustomAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Single-sign authority limit threshold is ₹5,00,000.
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0F8B8D] to-[#14213D] text-white font-bold text-xs shadow-md hover:opacity-95 transition-all"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Evaluating Policy AST &amp; Guardrails...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Execute Live Authorization Simulation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Pre-Configured Test Scenarios */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900">Standard Test Scenarios</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Click any benchmark scenario to immediately load and evaluate boundary test parameters.
                </p>

                <div className="space-y-2">
                  {mockSimulationScenarios.map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => handleApplyScenario(scen)}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0F8B8D] hover:bg-teal-50/50 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{scen.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            scen.expectedVerdict === 'PERMIT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : scen.expectedVerdict === 'DENY'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Exp: {scen.expectedVerdict}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{scen.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* What-If Sandbox Active Indicators */}
              {Object.keys(sandboxOverrides).length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between">
                  <span className="font-semibold">
                    {Object.keys(sandboxOverrides).length} Temporary What-If Overrides Active
                  </span>
                  <button
                    onClick={handleClearSandboxOverrides}
                    className="underline text-amber-900 font-bold hover:text-amber-950"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Verdict & Deep Evaluation Inspector */}
          {simulationResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Simulation Decision Result
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-extrabold shadow-xs ${
                        simulationResult.verdict === 'PERMIT'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : simulationResult.verdict === 'DENY'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : simulationResult.verdict === 'REQUIRES_DUAL_AUTH'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {simulationResult.verdict === 'PERMIT' && <CheckCircle className="w-4 h-4" />}
                      {simulationResult.verdict === 'DENY' && <X className="w-4 h-4" />}
                      {simulationResult.verdict === 'REQUIRES_DUAL_AUTH' && <Users className="w-4 h-4" />}
                      {simulationResult.verdict === 'MFA_STEP_UP_REQUIRED' && <Lock className="w-4 h-4" />}
                      {simulationResult.verdict}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Evaluated at {simulationResult.evaluatedAt}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evaluated Subject</span>
                  <div className="text-xs font-bold text-slate-800 mt-1">{simulationResult.matchedRole}</div>
                </div>
              </div>

              {/* Reason Explanation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0F8B8D]" />
                  Evaluation Narrative &amp; Rule Trace
                </div>
                <p className="text-slate-700">{simulationResult.reason}</p>
                <div className="font-mono text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                  {simulationResult.policyPath}
                </div>
              </div>

              {/* Conditions Breakdown Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Authorization Guardrail Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simulationResult.conditionsChecked.map((cond, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        cond.passed
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{cond.name}</span>
                        {cond.passed ? (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                            <Check className="w-3 h-3" /> PASS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-extrabold">
                            <X className="w-3 h-3" /> RESTRICTED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono mt-1">{cond.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* What-If Permission Playground Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  What-If Interactive Sandbox Playground
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Temporarily toggle permissions here to see instant simulation impact without modifying live database records.
                </p>
              </div>

              {Object.keys(sandboxOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSandboxOverrides}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold self-start"
                >
                  Clear Sandbox Overrides
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {modulesData.slice(0, 6).map((m) => {
                const basePerm = selectedRole.permissions[m.name] || {};
                const override = sandboxOverrides[m.name] || {};
                const isOverridden = Object.keys(override).length > 0;

                return (
                  <div
                    key={m.name}
                    className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                      isOverridden ? 'bg-amber-50/40 border-amber-300' : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{m.name}</span>
                      {isOverridden && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                          Sandbox Modified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as (keyof ModulePermission)[]).map(
                        (act) => {
                          const val = override[act] !== undefined ? override[act] : basePerm[act];
                          return (
                            <button
                              key={act}
                              type="button"
                              onClick={() => handleToggleSandboxOverride(m.name, act)}
                              className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-all ${
                                val
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-200/80 text-slate-400 hover:bg-slate-300'
                              }`}
                            >
                              {act}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SEPARATION OF DUTIES (SoD) CONFLICT MATRIX         */}
      {/* ========================================================= */}
      {activeTab === 'sod' && (
        <div className="space-y-6">
          {/* Active SoD Violations Alert Banner */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Active Separation of Duties (SoD) Violations</h2>
                  <p className="text-xs text-slate-500">
                    Detected personnel holding conflicting dual-custody privileges in violation of IATF 16949 and SOX 404 standards.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {sodViolations.length} Active Findings
              </span>
            </div>

            <div className="space-y-3">
              {sodViolations.map((vio) => (
                <div
                  key={vio.id}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{vio.userName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({vio.userEmail})</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          vio.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : vio.severity === 'HIGH'
                            ? 'bg-amber-500 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {vio.severity}
                      </span>
                    </div>
                    <div className="font-semibold text-rose-900">{vio.ruleName}</div>
                    <div className="text-slate-600 text-[11px]">
                      <strong className="text-slate-800">Assigned Roles:</strong> {vio.rolesAssigned.join(' + ')}
                    </div>
                    <div className="text-slate-500 text-[11px] pt-1">
                      <strong className="text-slate-700">Mitigating Control:</strong> {vio.mitigatingControl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => showToast(`Remediation ticket dispatched to Head of HR & Plant Manager for ${vio.userName}.`)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Remediate Role
                    </button>
                    <button
                      onClick={() => showToast(`Exception sign-off logged under audit record for ${vio.userName}.`)}
                      className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-lg font-semibold"
                    >
                      Approve Exception
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SoD Policy Rules Library */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
                Enforced Toxic Combination Rules
              </h2>
              <span className="text-xs text-slate-400">{sodRules.length} Rules Enforced</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sodRules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                      {rule.regulatoryStandard}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{rule.description}</p>
                  <div className="p-2 bg-white rounded border border-slate-200 text-[11px] space-y-1">
                    <div className="font-semibold text-slate-700">Conflicting Actions:</div>
                    <ul className="list-disc list-inside text-slate-500">
                      {rule.conflictingActions.map((act, i) => (
                        <li key={i}>
                          {act.module} &rarr; <span className="font-mono font-bold">{act.action.toUpperCase()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ROLE HIERARCHY & ASSIGNMENTS                      */}
      {/* ========================================================= */}
      {activeTab === 'hierarchy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#0F8B8D]" />
                Enterprise Role Inheritance Hierarchy
              </h2>
              <span className="text-xs text-slate-400">Layered Authorization Model</span>
            </div>

            {/* Visual Tree */}
            <div className="space-y-4 text-xs">
              {/* Level 1 */}
              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Level 1: System Super Administrator</span>
                  <span className="font-mono text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">
                    SYS_SUPER_ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Global root tenant authority. Unrestricted read/write/delete/approval across all plants and modules.
                </p>
              </div>

              {/* Connector */}
              <div className="w-0.5 h-4 bg-slate-300 ml-8" />

              {/* Level 2: Executive & Directors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-1">
                  <div className="font-bold text-slate-900">Level 2A: Plant Operations Manager</div>
                  <p className="text-[11px] text-slate-600">
                    Full supervisory authority over shop floor MES, machine tooling, shift rosters, and maintenance.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-1">
                  <div className="font-bold text-slate-900">Level 2B: Quality &amp; Lab Director</div>
                  <p className="text-[11px] text-slate-600">
                    Authority over IATF quality plans, 8D CAPA, raw material incoming inspection, and batch release.
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className="w-0.5 h-4 bg-slate-300 ml-8" />

              {/* Level 3: Department Officers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-4">
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="font-bold text-slate-800">Finance Controller</div>
                  <p className="text-[10px] text-slate-500">General Ledger &amp; Tax Invoices</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="font-bold text-slate-800">Procurement Lead</div>
                  <p className="text-[10px] text-slate-500">PO Requisitions &amp; Contracts</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="font-bold text-slate-800">SCM Logistics Planner</div>
                  <p className="text-[10px] text-slate-500">MRP &amp; Multimodal Freight</p>
                </div>
              </div>

              {/* Connector */}
              <div className="w-0.5 h-4 bg-slate-300 ml-8" />

              {/* Level 4: Line Execution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700">Shift Supervisor &amp; Crew Lead</div>
                  <p className="text-[10px] text-slate-500">Production Entry, Mold Changeover, Scrap Logging</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-700">Machine Operator &amp; RF Gun Scanner</div>
                  <p className="text-[10px] text-slate-500">Terminal Production Entry &amp; Silo Loading</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: User Assignment Count Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Assigned User Breakdown</h2>
              <span className="text-xs text-slate-400">{mockAdminUsers.length} Users</span>
            </div>

            <div className="space-y-2 text-xs">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{r.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{r.code}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0F8B8D]">{r.userCount}</span>
                    <span className="text-[10px] text-slate-400 ml-1">users</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Role */}
      {isCreatingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Create Custom RBAC Role</h3>
            <p className="text-xs text-slate-500 mb-4">
              Define a tailored access profile for specific plant operational responsibilities.
            </p>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Display Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                  placeholder="e.g. Masterbatch Compounder & Lab Tech"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Unique Code</label>
                <input
                  type="text"
                  value={newRoleData.code}
                  onChange={(e) => setNewRoleData({ ...newRoleData, code: e.target.value })}
                  placeholder="e.g. ROLE_MB_TECH"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Baseline Template Preset</label>
                <select
                  value={newRoleData.template}
                  onChange={(e) => setNewRoleData({ ...newRoleData, template: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="Blank">Blank (Read-only starter)</option>
                  <option value="Plant Supervisor">Plant Supervisor (Mfg &amp; Warehouse CRUD)</option>
                  <option value="Quality Inspector">Quality Inspector (QA Lab Full CRUD)</option>
                  <option value="Read Only Auditor">Read Only Auditor (View All + Export)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  placeholder="Responsibilities, approvals, and scope..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
