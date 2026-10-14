import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  FlaskConical,
  MessageSquareWarning,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Sparkles,
  Search,
  Filter,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
  PhoneCall,
  Send,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  mockLeads,
  mockOpportunities,
  mockAccounts,
  mockQuotations,
  mockSampleRequests,
  mockCustomerComplaints,
  mockActivities,
} from '../../data/mockCrmData';

interface CrmDashboardViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

const COLORS = ['#0F8B8D', '#E8622C', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export const CrmDashboardView: React.FC<CrmDashboardViewProps> = ({ onNavigate, showToast }) => {
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Month (Sep 2026)');

  // Calculations
  const totalLeads = mockLeads.length;
  const newLeadsToday = mockLeads.filter(l => l.status === 'New').length;
  const qualifiedLeads = mockLeads.filter(l => l.status === 'Qualified').length;
  const openOpps = mockOpportunities.filter(o => o.status === 'Open');
  const pipelineValue = openOpps.reduce((acc, curr) => acc + curr.expectedValue, 0);
  const quotationsSent = mockQuotations.length;
  const wonOpps = mockOpportunities.filter(o => o.status === 'Won').length;
  const lostOpps = mockOpportunities.filter(o => o.status === 'Lost').length;
  const openComplaints = mockCustomerComplaints.filter(c => c.status !== 'Closed').length;
  const overdueFollowUps = mockActivities.filter(a => a.status === 'Pending' && a.dueDate <= '2026-09-01').length;
  const samplesPending = mockSampleRequests.filter(s => s.status !== 'Sample Approved' && s.status !== 'Closed').length;
  const topCustomerRevenue = mockAccounts.reduce((acc, curr) => acc + curr.totalRevenueYtd, 0);

  // Chart data
  const pipelineStageData = [
    { stage: 'Qualification', count: 1, value: 3.45 },
    { stage: 'Tech Discuss', count: 1, value: 24.0 },
    { stage: 'Sample Sub', count: 1, value: 9.8 },
    { stage: 'Quote Sent', count: 1, value: 18.5 },
    { stage: 'Negotiation', count: 1, value: 12.4 },
    { stage: 'Won', count: 1, value: 7.8 },
  ];

  const productCategoryData = [
    { name: 'Custom Molded Parts', value: 50.9, color: '#0F8B8D' },
    { name: 'Color Masterbatch', value: 16.3, color: '#E8622C' },
    { name: 'Finished Bottles/Caps', value: 25.8, color: '#6366F1' },
    { name: 'Raw Polymers', value: 7.0, color: '#10B981' },
  ];

  const leadSourceData = [
    { name: 'PlastIndia Expo', leads: 24, converted: 18 },
    { name: 'Website RFP', leads: 32, converted: 14 },
    { name: 'Direct Referral', leads: 19, converted: 16 },
    { name: 'Trade Fair', leads: 15, converted: 11 },
    { name: 'Cold Call', leads: 8, converted: 2 },
  ];

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Commercial & Customer Lifecycle
            </span>
            <span className="text-xs text-slate-500">Live Telemetry • Sep 2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">CRM Executive Command Tower</h1>
          <p className="text-sm text-slate-600">
            End-to-end management of polymer leads, custom tooling opportunities, RFQs, sample trials, and complaints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>Today (01 Sep 2026)</option>
            <option>This Week</option>
            <option>This Month (Sep 2026)</option>
            <option>Q3 FY2026-27</option>
            <option>Full Year FY2026-27</option>
          </select>

          <button
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick CRM Actions
          </button>
        </div>
      </div>

      {/* Quick Action Drawer Dropdown */}
      {quickActionOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-gradient-to-r from-teal-50/70 via-slate-50 to-orange-50/70 p-4 rounded-xl border border-teal-200 shadow-xs">
          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmLeadList'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-teal-100 text-teal-700 rounded-md mb-2">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">New Lead</span>
            <span className="text-[10px] text-slate-500">Capture RFQ</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmOpportunityPipeline'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-md mb-2">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">New Opportunity</span>
            <span className="text-[10px] text-slate-500">Add to Pipeline</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmAccountList'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md mb-2">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">New Account</span>
            <span className="text-[10px] text-slate-500">Client 360</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmCustomerInquiry'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-amber-100 text-amber-700 rounded-md mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Capture RFQ</span>
            <span className="text-[10px] text-slate-500">Polymer Specs</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmQuotationManagement'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-purple-100 text-purple-700 rounded-md mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Create Quote</span>
            <span className="text-[10px] text-slate-500">Price & Margin</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmSampleRequest'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md mb-2">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Sample Trial</span>
            <span className="text-[10px] text-slate-500">Mold Specimen</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmComplaintManagement'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-rose-100 text-rose-700 rounded-md mb-2">
              <MessageSquareWarning className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Log Complaint</span>
            <span className="text-[10px] text-slate-500">NCR / CAPA</span>
          </button>

          <button
            onClick={() => { setQuickActionOpen(false); onNavigate('crmActivityManagement'); }}
            className="flex flex-col items-center p-3 bg-white hover:bg-teal-50 border border-slate-200 rounded-lg text-center transition-all hover:scale-[1.02]"
          >
            <div className="p-2 bg-cyan-100 text-cyan-700 rounded-md mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Log Activity</span>
            <span className="text-[10px] text-slate-500">Call / Meeting</span>
          </button>
        </div>
      )}

      {/* 14 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        <div
          onClick={() => onNavigate('crmLeadList')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Total Leads</span>
            <Users className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{totalLeads}</div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
            <span>+{newLeadsToday} new today</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('crmLeadList', { filter: 'Qualified' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Qualified Leads</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">{qualifiedLeads}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Score &gt; 75 pts</div>
        </div>

        <div
          onClick={() => onNavigate('crmOpportunityPipeline')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Open Opportunities</span>
            <Target className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-indigo-900">{openOpps.length}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">In active funnel</div>
        </div>

        <div
          onClick={() => onNavigate('crmOpportunityPipeline')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Pipeline Value</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(pipelineValue)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Weighted: ₹4.82 Cr</div>
        </div>

        <div
          onClick={() => onNavigate('crmQuotationManagement')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Quotes Sent</span>
            <FileText className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{quotationsSent}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">Avg Margin 23.6%</div>
        </div>

        <div
          onClick={() => onNavigate('crmOpportunityPipeline', { filter: 'Won' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Deals Won / Lost</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            <span className="text-emerald-600">{wonOpps}</span> / <span className="text-rose-600">{lostOpps}</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Win Rate 66.7%</div>
        </div>

        <div
          onClick={() => onNavigate('crmSampleRequest')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Samples Pending</span>
            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700">{samplesPending}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Trial GD&T sign-off</div>
        </div>

        <div
          onClick={() => onNavigate('crmComplaintManagement')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Open Complaints</span>
            <MessageSquareWarning className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700">{openComplaints}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">1 Critical (SLA 24h)</div>
        </div>

        <div
          onClick={() => onNavigate('crmActivityManagement', { filter: 'Overdue' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Overdue Follow-ups</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">{overdueFollowUps}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requires outreach</div>
        </div>

        <div
          onClick={() => onNavigate('crmAccountList')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Active Accounts</span>
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{mockAccounts.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Key OEMs: 4</div>
        </div>

        <div
          onClick={() => onNavigate('crmAccountList')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">YTD Invoiced</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(topCustomerRevenue)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">+18.4% vs FY25</div>
        </div>

        <div
          onClick={() => onNavigate('crmAccountList', { filter: 'CreditRisk' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Credit Exposure</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">₹8.2 Cr</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">1 near credit ceiling</div>
        </div>

        <div
          onClick={() => onNavigate('crmQuotationManagement', { filter: 'Expiring' })}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Quotes Expiring</span>
            <Clock className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-700">2</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Expiring in &lt; 15 days</div>
        </div>

        <div
          onClick={() => onNavigate('crmCustomerSegmentation')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Customer CSAT</span>
            <Award className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-teal-700">4.8 / 5.0</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Health index: 92%</div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline by Stage Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Sales Pipeline by Funnel Stage</h2>
              <p className="text-xs text-slate-500">Value in ₹ Lakhs across plastic molding & masterbatch opportunities</p>
            </div>
            <button
              onClick={() => onNavigate('crmOpportunityPipeline')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View Kanban Board <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`₹${val} Lakhs`, 'Deal Value']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#0F8B8D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Interest / Opportunity Mix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Mix by Category</h2>
              <p className="text-xs text-slate-500">Share of pipeline opportunity volume</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {productCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {productCategoryData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High-Priority Opportunities */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              High-Value Opportunities
            </h3>
            <span className="text-xs font-semibold text-teal-600 cursor-pointer" onClick={() => onNavigate('crmOpportunityPipeline')}>
              View All
            </span>
          </div>

          <div className="space-y-3">
            {mockOpportunities.slice(0, 3).map((opp) => (
              <div
                key={opp.id}
                onClick={() => onNavigate('crmOpportunityDetail', { oppId: opp.id })}
                className="p-3 bg-slate-50 hover:bg-teal-50/50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opp.opportunityName}</div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>{opp.accountName}</span>
                      <span>•</span>
                      <span className="font-semibold text-teal-700">{formatCurrency(opp.expectedValue)}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                    {opp.stage}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Owner: {opp.salesperson}</span>
                  <span>Close: {opp.expectedCloseDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Sample Approvals & Trial Results */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              Sample Trials & GD&T Approvals
            </h3>
            <span className="text-xs font-semibold text-teal-600 cursor-pointer" onClick={() => onNavigate('crmSampleRequest')}>
              View All
            </span>
          </div>

          <div className="space-y-3">
            {mockSampleRequests.map((smp) => (
              <div
                key={smp.id}
                onClick={() => onNavigate('crmSampleRequest')}
                className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{smp.customerName}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{smp.itemDescription}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    smp.status === 'Sample Approved' ? 'bg-emerald-100 text-emerald-700' :
                    smp.status === 'Trial In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {smp.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Part: {smp.customerPartNumber || 'N/A'}</span>
                  <span>Qty: {smp.sampleQuantity} {smp.uom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Follow-ups & SLA Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Customer Action & SLA Alerts
            </h3>
            <span className="text-xs font-semibold text-teal-600 cursor-pointer" onClick={() => onNavigate('crmActivityManagement')}>
              View Agenda
            </span>
          </div>

          <div className="space-y-3">
            {mockCustomerComplaints.map((cmp) => (
              <div
                key={cmp.id}
                onClick={() => onNavigate('crmComplaintManagement')}
                className="p-3 bg-rose-50/60 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-rose-900">{cmp.customerName}</div>
                    <div className="text-[11px] text-rose-800 mt-0.5">{cmp.complaintType} ({cmp.batchLotNumber})</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-200 text-rose-900">
                    {cmp.severity}
                  </span>
                </div>
                <div className="text-[10px] text-rose-700 mt-2 flex items-center justify-between">
                  <span>SLA Due: {cmp.slaDueDate}</span>
                  <span className="font-semibold">{cmp.status}</span>
                </div>
              </div>
            ))}

            {mockActivities.slice(0, 1).map((act) => (
              <div
                key={act.id}
                onClick={() => onNavigate('crmActivityManagement')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">{act.subject}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    {act.activityType}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Assigned: {act.assignedTo}</span>
                  <span>Due: {act.dueDate} {act.dueTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
