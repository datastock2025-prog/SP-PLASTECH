import React, { useState } from 'react';
import { JournalEntry, Account, CostCenter } from '../../types';
import {
  BookOpen,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Printer,
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  journalEntries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  onCreateJE: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const JournalEntriesView: React.FC<Props> = ({
  journalEntries,
  accounts,
  costCenters,
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'draft' | 'reversed'>('all');

  const filteredJEs = journalEntries.filter((je) => {
    const matchesSearch =
      je.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      je.memo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (je.ref && je.ref.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || je.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateJEDrawer = () => {
    let memo = '';
    let ref = '';
    let date = new Date().toISOString().slice(0, 10);
    let lines: Array<{ account: string; desc: string; debit: number; credit: number; cc: string; tax: string }> = [
      { account: '5100', desc: 'Direct Material Consumption', debit: 50000, credit: 0, cc: 'CC-PROD-01', tax: '' },
      { account: '1310', desc: 'Raw Material Inventory - PP Resin', debit: 0, credit: 50000, cc: 'CC-WH-01', tax: '' },
    ];

    const renderForm = (currentLines: typeof lines) => {
      const totalDebit = currentLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = currentLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

      return (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#6B7280] font-semibold mb-1">Posting Date *</label>
              <input
                type="date"
                defaultValue={date}
                className="w-full px-3 py-1.5 border border-[#E4E0D6] rounded-lg"
                onChange={(e) => {
                  date = e.target.value;
                }}
              />
            </div>
            <div>
              <label className="block text-[#6B7280] font-semibold mb-1">Source Reference / Doc #</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-99, GR-8812"
                className="w-full px-3 py-1.5 border border-[#E4E0D6] rounded-lg font-mono"
                onChange={(e) => {
                  ref = e.target.value;
                }}
              />
            </div>
            <div>
              <label className="block text-[#6B7280] font-semibold mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full px-3 py-1.5 border border-[#E4E0D6] rounded-lg bg-[#F6F4EF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#6B7280] font-semibold mb-1">Memo / Narration *</label>
            <input
              type="text"
              placeholder="e.g. Accrual for plant electricity bill - August 2026"
              className="w-full px-3 py-2 border border-[#E4E0D6] rounded-lg"
              onChange={(e) => {
                memo = e.target.value;
              }}
            />
          </div>

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#14213D] uppercase tracking-wider text-[11px]">
                Double-Entry Posting Lines
              </span>
              <button
                type="button"
                className="text-[11px] text-[#0F8B8D] font-bold hover:underline flex items-center gap-1"
                onClick={() => {
                  currentLines.push({ account: '6100', desc: '', debit: 0, credit: 0, cc: '', tax: '' });
                  openDrawer(
                    'Post New General Ledger Journal Entry',
                    renderForm([...currentLines]),
                    renderFooter(currentLines)
                  );
                }}
              >
                <Plus className="w-3 h-3" /> Add Line
              </button>
            </div>

            <div className="border border-[#E4E0D6] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F4EF] text-[10px] uppercase text-[#6B7280]">
                  <tr>
                    <th className="p-2">GL Account</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Cost Center</th>
                    <th className="p-2 text-right">Debit (₹)</th>
                    <th className="p-2 text-right">Credit (₹)</th>
                    <th className="p-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {currentLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F4EF]/30">
                      <td className="p-1.5">
                        <select
                          value={line.account}
                          className="w-full p-1 border border-[#E4E0D6] rounded bg-white font-mono text-xs"
                          onChange={(e) => {
                            currentLines[idx].account = e.target.value;
                            openDrawer(
                              'Post New General Ledger Journal Entry',
                              renderForm([...currentLines]),
                              renderFooter(currentLines)
                            );
                          }}
                        >
                          {accounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={line.desc}
                          placeholder="Line description"
                          className="w-full p-1 border border-[#E4E0D6] rounded text-xs"
                          onChange={(e) => {
                            currentLines[idx].desc = e.target.value;
                          }}
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={line.cc}
                          className="w-full p-1 border border-[#E4E0D6] rounded bg-white text-xs"
                          onChange={(e) => {
                            currentLines[idx].cc = e.target.value;
                          }}
                        >
                          <option value="">None</option>
                          {costCenters.map((cc) => (
                            <option key={cc.code} value={cc.code}>
                              {cc.code}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={line.debit || ''}
                          placeholder="0.00"
                          className="w-full p-1 border border-[#E4E0D6] rounded text-right font-mono text-xs text-emerald-700"
                          onChange={(e) => {
                            currentLines[idx].debit = parseFloat(e.target.value) || 0;
                            if (parseFloat(e.target.value) > 0) currentLines[idx].credit = 0;
                            openDrawer(
                              'Post New General Ledger Journal Entry',
                              renderForm([...currentLines]),
                              renderFooter(currentLines)
                            );
                          }}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={line.credit || ''}
                          placeholder="0.00"
                          className="w-full p-1 border border-[#E4E0D6] rounded text-right font-mono text-xs text-rose-700"
                          onChange={(e) => {
                            currentLines[idx].credit = parseFloat(e.target.value) || 0;
                            if (parseFloat(e.target.value) > 0) currentLines[idx].debit = 0;
                            openDrawer(
                              'Post New General Ledger Journal Entry',
                              renderForm([...currentLines]),
                              renderFooter(currentLines)
                            );
                          }}
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        {currentLines.length > 2 && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              currentLines.splice(idx, 1);
                              openDrawer(
                                'Post New General Ledger Journal Entry',
                                renderForm([...currentLines]),
                                renderFooter(currentLines)
                              );
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F6F4EF] font-mono font-bold border-t border-[#E4E0D6]">
                  <tr>
                    <td colSpan={3} className="p-2 text-right">
                      Total Ledger Postings:
                    </td>
                    <td className="p-2 text-right text-emerald-700">
                      ₹{totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-right text-rose-700">
                      ₹{totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Balance Status Banner */}
          <div
            className={`p-3 rounded-lg flex items-center justify-between ${
              isBalanced
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span className="font-semibold">
                {isBalanced
                  ? 'Double-entry Balanced (Debits equal Credits)'
                  : `Out of Balance by ₹${Math.abs(totalDebit - totalCredit).toLocaleString('en-IN')}`}
              </span>
            </div>
            <span className="font-mono text-xs">
              Diff: ₹{Math.abs(totalDebit - totalCredit).toFixed(2)}
            </span>
          </div>
        </div>
      );
    };

    const renderFooter = (currentLines: typeof lines) => {
      const totalDebit = currentLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = currentLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

      return (
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-[#6B7280]">
            Voucher # will be auto-generated upon posting.
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF]"
              onClick={closeDrawer}
            >
              Cancel
            </button>
            <button
              disabled={!isBalanced}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm text-white ${
                isBalanced
                  ? 'bg-[#0F8B8D] hover:bg-[#0D7A7C] cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
              onClick={() => {
                if (!memo) {
                  showToast('Please provide a memo/narration for this journal entry');
                  return;
                }
                const newId = `JE-${new Date().getFullYear()}-${1000 + journalEntries.length + 1}`;
                const newEntry: JournalEntry = {
                  id: newId,
                  date,
                  ref,
                  memo,
                  currency: 'INR',
                  status: 'posted',
                  createdBy: 'Finance Specialist',
                  approvedBy: 'Priya Rao (CFO)',
                  lines: currentLines,
                };
                onCreateJE(newEntry);
                closeDrawer();
                showToast(`Journal Voucher ${newId} posted successfully!`);
              }}
            >
              Post to General Ledger
            </button>
          </div>
        </div>
      );
    };

    openDrawer(
      'Post New General Ledger Journal Entry',
      renderForm(lines),
      renderFooter(lines)
    );
  };

  const handleViewJEDetail = (je: JournalEntry) => {
    const totalDebit = je.lines.reduce((s, l) => s + (l.debit || 0), 0);

    openDrawer(
      `Journal Voucher: ${je.id}`,
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E4E0D6] space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-sm font-bold text-[#0F8B8D]">{je.id}</span>
              <h3 className="text-sm font-bold text-[#14213D] mt-0.5">{je.memo}</h3>
            </div>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                je.status === 'posted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : je.status === 'reversed'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {je.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E4E0D6] text-[11px]">
            <div>
              <span className="text-[#6B7280]">Posting Date:</span>
              <div className="font-mono font-semibold">{je.date}</div>
            </div>
            <div>
              <span className="text-[#6B7280]">Source Ref:</span>
              <div className="font-mono font-semibold">{je.ref || 'Direct GL'}</div>
            </div>
            <div>
              <span className="text-[#6B7280]">Created By:</span>
              <div className="font-semibold">{je.createdBy}</div>
            </div>
            <div>
              <span className="text-[#6B7280]">Approved By:</span>
              <div className="font-semibold">{je.approvedBy}</div>
            </div>
          </div>
        </div>

        {je.reversalOf && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>This journal is an automatic reversal of voucher <b>{je.reversalOf}</b>.</span>
          </div>
        )}

        <div className="border border-[#E4E0D6] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F4EF] text-[10px] uppercase text-[#6B7280]">
              <tr>
                <th className="p-2.5">Account Code &amp; Title</th>
                <th className="p-2.5">Line Narration</th>
                <th className="p-2.5">Cost Center</th>
                <th className="p-2.5 text-right">Debit (₹)</th>
                <th className="p-2.5 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {je.lines.map((l, idx) => {
                const acc = accounts.find((a) => a.code === l.account);
                return (
                  <tr key={idx} className="hover:bg-[#F6F4EF]/30">
                    <td className="p-2.5 font-mono">
                      <span className="font-bold text-[#0F8B8D]">{l.account}</span> - {acc?.name || l.desc}
                    </td>
                    <td className="p-2.5 text-[#6B7280]">{l.desc || je.memo}</td>
                    <td className="p-2.5">
                      {l.cc ? <span className="px-1.5 py-0.5 bg-[#F6F4EF] rounded font-mono text-[10px]">{l.cc}</span> : '-'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-semibold text-emerald-700">
                      {l.debit ? `₹${l.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-2.5 font-mono text-right font-semibold text-rose-700">
                      {l.credit ? `₹${l.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#F6F4EF] font-mono font-bold border-t border-[#E4E0D6]">
              <tr>
                <td colSpan={3} className="p-2.5 text-right">Voucher Total:</td>
                <td className="p-2.5 text-right text-emerald-700">₹{totalDebit.toLocaleString('en-IN')}</td>
                <td className="p-2.5 text-right text-rose-700">₹{totalDebit.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>,
      <div className="flex items-center justify-between w-full">
        <button
          className="px-3 py-1.5 text-xs bg-white border border-[#E4E0D6] rounded-lg hover:bg-[#F6F4EF] flex items-center gap-1.5"
          onClick={() => showToast(`Printing official voucher ${je.id}...`)}
        >
          <Printer className="w-3.5 h-3.5" /> Print Voucher
        </button>
        <button
          className="px-4 py-1.5 text-xs bg-[#14213D] text-white rounded-lg hover:bg-[#1f3158]"
          onClick={closeDrawer}
        >
          Done
        </button>
      </div>
    );
  };

  const handleReverseEntry = (je: JournalEntry) => {
    const revId = `JE-${new Date().getFullYear()}-REV-${journalEntries.length + 1}`;
    const revJE: JournalEntry = {
      id: revId,
      date: new Date().toISOString().slice(0, 10),
      ref: `REV-${je.id}`,
      memo: `1-Click Reversal of ${je.id}: ${je.memo}`,
      currency: je.currency,
      status: 'posted',
      createdBy: 'Finance Controller',
      approvedBy: 'Priya Rao (CFO)',
      reversalOf: je.id,
      lines: je.lines.map((l) => ({
        account: l.account,
        desc: `Reversal: ${l.desc}`,
        debit: l.credit,
        credit: l.debit,
        cc: l.cc,
        tax: l.tax,
      })),
    };
    onCreateJE(revJE);
    showToast(`Reversal voucher ${revId} posted to General Ledger`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; General Ledger Postings
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Journal Entries &amp; Vouchers
          </h1>
          <p className="text-xs text-[#6B7280]">
            GAAP &amp; IndAS compliant double-entry vouchers with auto-balancing, cost center absorption, and 1-click reversals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateJEDrawer}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0D7A7C] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> + New Journal Entry
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['all', 'posted', 'draft', 'reversed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#14213D] text-white'
                  : 'text-[#6B7280] hover:bg-[#F6F4EF]'
              }`}
            >
              {st === 'all' ? 'All Postings' : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search voucher #, memo, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#6B7280] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Posting Date</th>
                <th className="py-2.5 px-3">Memo / Narration</th>
                <th className="py-2.5 px-3">Source Ref</th>
                <th className="py-2.5 px-3">Lines</th>
                <th className="py-2.5 px-3 text-right">Debit / Credit Total</th>
                <th className="py-2.5 px-3">Created By</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {filteredJEs.map((je) => {
                const totalDebit = je.lines.reduce((s, l) => s + (l.debit || 0), 0);
                return (
                  <tr key={je.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">
                      {je.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">
                      {je.date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#14213D] max-w-sm">
                      {je.memo}
                      {je.reversalOf && (
                        <div className="text-[10px] text-rose-600 font-normal">
                          ↳ Reversal of {je.reversalOf}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">
                      {je.ref || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{je.lines.length} lines</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">
                      ₹{totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{je.createdBy}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          je.status === 'posted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : je.status === 'reversed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {je.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewJEDetail(je)}
                          className="px-2 py-1 text-[11px] font-semibold text-[#0F8B8D] hover:bg-[#DCF0EF] rounded transition-colors"
                        >
                          View
                        </button>
                        {je.status === 'posted' && (
                          <button
                            onClick={() => handleReverseEntry(je)}
                            title="1-Click Reverse Entry"
                            className="p-1 text-[#E8622C] hover:bg-orange-50 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
