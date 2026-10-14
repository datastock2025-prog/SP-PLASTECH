import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Eye,
} from 'lucide-react';
import { HrSafetyIncident, HrPpeIssueRecord, HrPpeInventoryItem } from '../../types';

interface HrSafetyPpeViewProps {
  incidents: HrSafetyIncident[];
  ppeIssues: HrPpeIssueRecord[];
  ppeInventory: HrPpeInventoryItem[];
  onAddIncident: (incident: HrSafetyIncident) => void;
  showToast: (msg: string) => void;
}

export const HrSafetyPpeView: React.FC<HrSafetyPpeViewProps> = ({
  incidents,
  ppeIssues,
  ppeInventory,
  onAddIncident,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'ppe_inventory' | 'ppe_issued'>('incidents');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLogIncidentOpen, setIsLogIncidentOpen] = useState(false);
  const [isIssuePpeOpen, setIsIssuePpeOpen] = useState(false);

  // New Incident Form State
  const [incEmp, setIncEmp] = useState('EMP-1002 (Amit Deshmukh)');
  const [incType, setIncType] = useState<'Near Miss' | 'First Aid' | 'Lost Time Injury' | 'Hazard Observed'>('Near Miss');
  const [incSeverity, setIncSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [incLocation, setIncLocation] = useState('Mold Setting Station 02');
  const [incDesc, setIncDesc] = useState('');
  const [incCapa, setIncCapa] = useState('');

  const filteredIncidents = incidents.filter((i) => {
    return (
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredPpeIssues = ppeIssues.filter((p) => {
    return (
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ppeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: HrSafetyIncident = {
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      incidentDate: new Date().toISOString().slice(0, 10),
      location: incLocation,
      employeeId: incEmp.split(' ')[0],
      employeeName: incEmp.split('(')[1]?.replace(')', '') || 'Amit Deshmukh',
      incidentType: incType,
      severity: incSeverity,
      title: incDesc.slice(0, 50) || 'Safety Observation Incident',
      description: incDesc || 'Detailed safety incident log.',
      correctiveAction: incCapa || 'Immediate SOP refresher conducted.',
      status: 'Open Investigation',
      reportedBy: 'Shift Supervisor',
    };
    onAddIncident(newInc);
    showToast(`Safety Incident logged successfully with ID ${newInc.id}. EHS team notified.`);
    setIsLogIncidentOpen(false);
    setIncDesc('');
    setIncCapa('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>EHS Safety Incidents &amp; PPE Issuance Tracking</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                142 Days Zero-LTI
              </span>
            </h2>
            <p className="text-slate-500">
              OSHA &amp; ISO 45001 safety logging, near-miss CAPA actions, PPE inventory replenishment, and expiry alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'incidents' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incidents &amp; Near-Miss ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('ppe_inventory')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'ppe_inventory' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PPE Stock Master ({ppeInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('ppe_issued')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'ppe_issued' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Issued PPE Roster ({ppeIssues.length})
            </button>
          </div>

          {activeTab === 'incidents' ? (
            <button
              onClick={() => setIsLogIncidentOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Safety Incident</span>
            </button>
          ) : (
            <button
              onClick={() => setIsIssuePpeOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-bold hover:bg-[#0c7072] transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue PPE to Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident, location, worker name, PPE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
          />
        </div>
      </div>

      {/* 1. Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {filteredIncidents.map((inc) => (
            <div key={inc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                      {inc.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.severity === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : inc.severity === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {inc.severity} Severity
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-700">{inc.incidentType}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#14213D] mt-1.5">{inc.title}</h3>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    inc.status === 'Resolved & Closed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inc.status}
                </span>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {inc.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 font-semibold">Location &amp; Date</span>
                  <div className="font-bold text-slate-800">{inc.location} ({inc.incidentDate})</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 font-semibold">Involved Worker</span>
                  <div className="font-bold text-slate-800">{inc.employeeName} ({inc.employeeId})</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 font-semibold">Reported By</span>
                  <div className="font-bold text-slate-800">{inc.reportedBy}</div>
                </div>
              </div>

              {inc.correctiveAction && (
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-0.5">
                  <span className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">
                    Corrective &amp; Preventive Action (CAPA):
                  </span>
                  <div className="text-xs">{inc.correctiveAction}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. PPE Inventory Tab */}
      {activeTab === 'ppe_inventory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ppeInventory.map((item) => {
            const isLowStock = item.currentStock <= item.reorderThreshold;
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {item.code}
                  </span>
                  {isLowStock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                      Low Stock Alert
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Adequate Stock
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#14213D]">{item.name}</h4>
                  <div className="text-[11px] text-slate-500 font-mono">Standard: {item.standard}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">In Stock</span>
                    <div className="text-base font-bold text-[#14213D]">{item.currentStock} {item.unit}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px]">Threshold</span>
                    <div className="text-sm font-bold text-slate-600">{item.reorderThreshold} {item.unit}</div>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Replenishment Purchase Order triggered for ${item.name}`)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-xs"
                >
                  Create Requisition
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Issued PPE Roster Tab */}
      {activeTab === 'ppe_issued' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff / Code</th>
                  <th className="p-3">PPE Equipment Name</th>
                  <th className="p-3">Size Specification</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Replacement Due Date</th>
                  <th className="p-3">Condition Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPpeIssues.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{p.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.employeeId}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{p.ppeName}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{p.size}</td>
                    <td className="p-3 font-mono text-slate-600">{p.issueDate}</td>
                    <td className="p-3 font-mono font-semibold text-indigo-700">{p.replacementDueDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'Replacement Due'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => showToast(`Replacement issued for ${p.ppeName} to ${p.employeeName}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 transition cursor-pointer"
                      >
                        Re-issue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Safety Incident Modal */}
      {isLogIncidentOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateIncident} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Log EHS Safety Incident / Near-Miss</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Incident Category</label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Near Miss">Near Miss</option>
                    <option value="First Aid">First Aid Incident</option>
                    <option value="Lost Time Injury">Lost Time Injury (LTI)</option>
                    <option value="Hazard Observed">Hazard / Unsafe Condition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Severity Level</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Location / Machine Line</label>
                <input
                  type="text"
                  required
                  value={incLocation}
                  onChange={(e) => setIncLocation(e.target.value)}
                  placeholder="e.g. Mold Setting Bay 2, Hydraulic Line 4"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Incident Description &amp; Root Cause</label>
                <textarea
                  rows={2}
                  required
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Describe what occurred, root cause, and immediate containment..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Corrective &amp; Preventive Action (CAPA)</label>
                <textarea
                  rows={2}
                  value={incCapa}
                  onChange={(e) => setIncCapa(e.target.value)}
                  placeholder="Action to prevent recurrence (e.g. mechanical interlock installed, retraining)..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogIncidentOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition cursor-pointer"
              >
                Submit Incident Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Issue PPE Modal */}
      {isIssuePpeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0F8B8D]" />
              <span>Issue PPE Equipment to Staff</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option>EMP-1001 (Suresh Patil - Shift A)</option>
                  <option>EMP-1002 (Amit Deshmukh - Shift B)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Item</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option>Steel Toe Safety Shoes S3</option>
                  <option>High-Heat Nitrile Gloves</option>
                  <option>Safety Eyewear / Goggles UV400</option>
                  <option>Industrial Hard Hat / Helmet EN397</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size</label>
                  <input type="text" defaultValue="UK 8" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Lifespan (Months)</label>
                  <input type="number" defaultValue="12" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsIssuePpeOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('PPE item successfully deducted from inventory and allocated to worker profile.');
                  setIsIssuePpeOpen(false);
                }}
                className="px-4 py-2 bg-[#0F8B8D] text-white rounded-lg font-bold hover:bg-[#0c7072] transition cursor-pointer"
              >
                Issue PPE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
