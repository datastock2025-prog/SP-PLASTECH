import React, { useState } from 'react';
import { Account, JournalEntry } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Tag,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

interface Props {
  accounts: Account[];
  journalEntries?: JournalEntry[];
  onUpdateAccount: (acc: Account) => void;
  onCreateAccount?: (acc: Account) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const ChartOfAccountsView: React.FC<Props> = ({
  accounts,
  journalEntries = [],
  onUpdateAccount,
  onCreateAccount,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const filteredAccounts = accounts.filter((acc) => {
    const matchesTab = activeTab === 'All' || acc.type === activeTab;
    const matchesSearch =
      acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.sub.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalsByType = {
    Asset: accounts.filter((a) => a.type === 'Asset').reduce((s, a) => s + (a.balance || 0), 0),
    Liability: accounts.filter((a) => a.type === 'Liability').reduce((s, a) => s + (a.balance || 0), 0),
    Equity: accounts.filter((a) => a.type === 'Equity').reduce((s, a) => s + (a.balance || 0), 0),
    Revenue: accounts.filter((a) => a.type === 'Revenue').reduce((s, a) => s + (a.balance || 0), 0),
    Expense: accounts.filter((a) => a.type === 'Expense').reduce((s, a) => s + (a.balance || 0), 0),
  };

  const handleOpenNewAccountDrawer = () => {
    let newCode = '';
    let newName = '';
    let newType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' = 'Expense';
    let newSub = 'Overhead';
    let newParent = '';
    let isTax = false;
    let isCC = true;

    openDrawer(
      'Create New General Ledger Account',
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">GL Account Code *</label>
          <input
            type="text"
            placeholder="e.g. 5150, 6300"
            className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg font-mono"
            onChange={(e) => {
              newCode = e.target.value;
            }}
          />
          <p className="text-[10px] text-[#6B7280] mt-1">
            Standard: 1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx COGS, 6xxx Operating Exp.
          </p>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Account Title / Name *</label>
          <input
            type="text"
            placeholder="e.g. Mold Maintenance &amp; Tooling Repairs"
            className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg"
            onChange={(e) => {
              newName = e.target.value;
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Account Classification *</label>
            <select
              defaultValue={newType}
              className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg bg-white"
              onChange={(e) => {
                newType = e.target.value as any;
              }}
            >
              <option value="Asset">Asset (1xxx)</option>
              <option value="Liability">Liability (2xxx)</option>
              <option value="Equity">Equity (3xxx)</option>
              <option value="Revenue">Revenue (4xxx)</option>
              <option value="Expense">Expense (5xxx / 6xxx)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Subgroup Category</label>
            <input
              type="text"
              defaultValue={newSub}
              placeholder="e.g. COGS, Direct Labor, Overhead"
              className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                newSub = e.target.value;
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[#6B7280] font-semibold mb-1">Parent Group Account (Optional)</label>
          <select
            defaultValue=""
            className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg bg-white"
            onChange={(e) => {
              newParent = e.target.value;
            }}
          >
            <option value="">None (Top Level Root)</option>
            {accounts
              .filter((a) => a.sub === 'Group')
              .map((g) => (
                <option key={g.code} value={g.code}>
                  {g.code} - {g.name}
                </option>
              ))}
          </select>
        </div>

        <div className="p-3 bg-[#F6F4EF] rounded-lg space-y-2 border border-[#E4E0D6]">
          <div className="text-[11px] font-bold text-[#14213D]">Controlling &amp; Tax Rules</div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={isCC}
                onChange={(e) => {
                  isCC = e.target.checked;
                }}
              />
              <span>Require Cost Center tagging</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={isTax}
                onChange={(e) => {
                  isTax = e.target.checked;
                }}
              />
              <span>Subject to GST Tax</span>
            </label>
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2">
        <button
          className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
          onClick={closeDrawer}
        >
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C]"
          onClick={() => {
            if (!newCode || !newName) {
              showToast('Please enter both code and account name');
              return;
            }
            const newAcc: Account = {
              code: newCode,
              name: newName,
              type: newType,
              sub: newSub,
              parent: newParent || null,
              currency: 'INR',
              tax: isTax,
              cc: isCC,
              status: 'active',
              balance: 0,
            };
            if (onCreateAccount) {
              onCreateAccount(newAcc);
            } else {
              onUpdateAccount(newAcc);
            }
            closeDrawer();
            showToast(`GL Account ${newCode} - ${newName} created`);
          }}
        >
          Save Account
        </button>
      </div>
    );
  };

  const handleViewLedger = (acc: Account) => {
    const matchingEntries = journalEntries.filter((je) =>
      je.lines.some((l) => l.account === acc.code)
    );

    openDrawer(
      `Ledger History: ${acc.code} - ${acc.name}`,
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#F6F4EF] rounded-lg border border-[#E4E0D6]">
          <div>
            <div className="text-[10px] text-[#6B7280] uppercase font-bold">Category</div>
            <div className="font-semibold text-[#14213D]">{acc.type}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6B7280] uppercase font-bold">Subgroup</div>
            <div className="font-semibold text-[#14213D]">{acc.sub}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6B7280] uppercase font-bold">Current Balance</div>
            <div className="font-mono font-bold text-[#0F8B8D]">₹{acc.balance.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6B7280] uppercase font-bold">Status</div>
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {acc.status}
            </span>
          </div>
        </div>

        <div className="border border-[#E4E0D6] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#F6F4EF]/50 font-bold border-b border-[#E4E0D6] text-xs">
            Direct Journal Postings ({matchingEntries.length})
          </div>
          {matchingEntries.length === 0 ? (
            <div className="p-6 text-center text-[#6B7280]">
              No individual journal voucher postings found in current active period.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F4EF] text-[10px] uppercase text-[#6B7280]">
                <tr>
                  <th className="p-2">JE #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Memo</th>
                  <th className="p-2 text-right">Debit</th>
                  <th className="p-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {matchingEntries.map((je) => {
                  const line = je.lines.find((l) => l.account === acc.code);
                  return (
                    <tr key={je.id}>
                      <td className="p-2 font-mono text-[#0F8B8D]">{je.id}</td>
                      <td className="p-2 font-mono text-[11px]">{je.date}</td>
                      <td className="p-2 text-[#14213D]">{line?.desc || je.memo}</td>
                      <td className="p-2 font-mono text-right text-emerald-700">
                        {line?.debit ? `₹${line.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 font-mono text-right text-rose-700">
                        {line?.credit ? `₹${line.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>,
      <div className="flex justify-end">
        <button className="px-4 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]" onClick={closeDrawer}>
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; General Ledger Master
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Chart of Accounts (COA)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Standard 5-class account hierarchy with real-time balance tracking, tax flags, and cost center absorption rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exporting Chart of Accounts to CSV/Excel...')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E4E0D6] rounded-lg text-[#14213D] hover:bg-[#F6F4EF] flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export COA
          </button>
          <button
            onClick={handleOpenNewAccountDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + New GL Account
          </button>
        </div>
      </div>

      {/* Account Class Totals Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">1xxx Assets</div>
          <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
            ₹{(totalsByType.Asset / 100000).toFixed(1)} L
          </div>
          <div className="text-[10px] text-[#0F8B8D]">Debit balance</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">2xxx Liabilities</div>
          <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
            ₹{(totalsByType.Liability / 100000).toFixed(1)} L
          </div>
          <div className="text-[10px] text-amber-600">Credit balance</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">3xxx Equity</div>
          <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
            ₹{(totalsByType.Equity / 100000).toFixed(1)} L
          </div>
          <div className="text-[10px] text-purple-600">Capital accounts</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">4xxx Revenue</div>
          <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
            ₹{(totalsByType.Revenue / 100000).toFixed(1)} L
          </div>
          <div className="text-[10px] text-emerald-600">Operating sales</div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E4E0D6] shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#6B7280]">5/6xxx Expenses</div>
          <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
            ₹{(totalsByType.Expense / 100000).toFixed(1)} L
          </div>
          <div className="text-[10px] text-[#E8622C]">COGS &amp; Overheads</div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#14213D] text-white'
                  : 'text-[#6B7280] hover:bg-[#F6F4EF]'
              }`}
            >
              {tab === 'All' ? 'All Classes' : `${tab}s`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code or account title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Subgroup</th>
                <th className="py-2.5 px-3">Cost Center</th>
                <th className="py-2.5 px-3">GST Tax</th>
                <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {filteredAccounts.map((acc) => {
                const isGroup = acc.sub === 'Group';
                return (
                  <tr
                    key={acc.code}
                    className={`hover:bg-[#F6F4EF]/50 transition-colors ${
                      isGroup ? 'bg-[#F6F4EF]/30 font-bold text-[#14213D]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">
                      {acc.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D]">
                      {acc.parent ? <span className="text-[#6B7280] mr-1.5 font-normal">↳</span> : null}
                      {acc.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.type === 'Asset'
                            ? 'bg-blue-50 text-blue-700'
                            : acc.type === 'Liability'
                            ? 'bg-amber-50 text-amber-700'
                            : acc.type === 'Equity'
                            ? 'bg-purple-50 text-purple-700'
                            : acc.type === 'Revenue'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-[#E8622C]'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{acc.sub}</td>
                    <td className="py-2.5 px-3">
                      {acc.cc ? (
                        <span className="text-[10px] bg-teal-50 text-[#0F8B8D] px-1.5 py-0.5 rounded font-mono">
                          CC Enabled
                        </span>
                      ) : (
                        <span className="text-[#6B7280] text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {acc.tax ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                          GST Taxable
                        </span>
                      ) : (
                        <span className="text-[#6B7280] text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      {isGroup ? '-' : `₹${acc.balance.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleViewLedger(acc)}
                        className="px-2 py-1 text-[11px] font-semibold text-[#0F8B8D] hover:bg-[#DCF0EF] rounded transition-colors"
                      >
                        View Ledger
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
  );
};
