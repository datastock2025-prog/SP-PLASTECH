import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Laptop,
  Clock,
  Key,
  Ban,
  Download,
  RefreshCw,
} from 'lucide-react';
import { SecurityLoginAuditRecord, loginAuditRecords } from '../../data/adminExtendedData';
import { useAdminLoginAudit } from '../../hooks/useAdmin';

interface AdminLoginSecurityAuditViewProps {
  showToast?: (msg: string) => void;
}

export const AdminLoginSecurityAuditView: React.FC<AdminLoginSecurityAuditViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { data: serverRecords = [], isLoading } = useAdminLoginAudit();
  const [records, setRecords] = useState<SecurityLoginAuditRecord[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    if (serverRecords.length > 0) {
      setRecords(serverRecords);
    }
  }, [serverRecords]);

  const filtered = records.filter((r) => {
    const matchSearch =
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.ipAddress.includes(search) ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || r.riskScore === riskFilter;
    return matchSearch && matchRisk;
  });

  const handleBlockIp = (ip: string) => {
    showToast(`IP ${ip} added to perimeter firewall blocklist.`);
  };

  return (
    <div className="min-w-0 space-y-4 pb-8">
      {/* Header */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Cybersecurity Telemetry &amp; Access Forensics</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Login &amp; Security Audit</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Monitor real-time login sessions, MFA verification challenges, failed password attempts, and anomalous brute-force attacks across shopfloor kiosks and administrative consoles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => showToast('Exported security access forensic logs (CSV).')}
          >
            <Download aria-hidden="true" />
            Export Audit Trail
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => showToast('Refreshed real-time login audit stream.')}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            <RefreshCw aria-hidden="true" />
            Live Refresh
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* Filter / Search Bar */}
      <Card className="rounded-md border-slate-200 shadow-none">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search by IP, email, username, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search security audit records"
            className="h-10 pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="mr-1 shrink-0 text-xs font-medium text-slate-500">Risk</span>
          {['ALL', 'Low', 'Medium', 'High'].map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={riskFilter === r ? 'secondary' : 'outline'}
              onClick={() => setRiskFilter(r)}
              aria-pressed={riskFilter === r}
              className={`h-8 shrink-0 px-2.5 text-xs ${
                riskFilter === r
                  ? 'bg-teal-50 text-teal-800 hover:bg-teal-50'
                  : 'text-slate-600'
              }`}
            >
              {r === 'ALL' ? 'All risks' : r}
            </Button>
          ))}
        </div>
        </CardContent>
      </Card>

      {/* Security Audit Table */}
      <Card className="overflow-hidden rounded-md border-slate-200 shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Authentication events</h3>
          <Badge variant="outline">{filtered.length} records</Badge>
        </div>
        <CardContent className="p-0">
          <div className="space-y-3 p-3 md:hidden">
            {isLoading && <p className="py-6 text-center text-sm text-slate-500">Loading security events…</p>}
            {!isLoading && filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No audit records match these filters.</p>}
            {filtered.map((rec) => (
              <article key={rec.id} className="min-w-0 space-y-3 rounded-md border border-slate-200 p-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-slate-900">{rec.fullName}</h4>
                    <p className="truncate text-xs text-slate-500">{rec.userEmail}</p>
                  </div>
                  <Badge variant={rec.riskScore === 'High' ? 'destructive' : 'outline'} className={rec.riskScore === 'Medium' ? 'shrink-0 border-amber-300 bg-amber-50 text-amber-800' : 'shrink-0'}>
                    {rec.riskScore} risk
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="min-w-0"><span className="block text-slate-400">Timestamp</span><span className="font-mono text-slate-700">{rec.timestamp}</span></div>
                  <div className="min-w-0"><span className="block text-slate-400">IP address</span><span className="break-all font-mono text-slate-700">{rec.ipAddress}</span></div>
                  <div className="min-w-0"><span className="block text-slate-400">Location</span><span className="text-slate-700">{rec.geoLocation}</span></div>
                  <div className="min-w-0"><span className="block text-slate-400">Authentication</span><span className="text-slate-700">{rec.authMethod}</span></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <Badge variant="outline" className={rec.status === 'Successful Login' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : rec.status === 'MFA Challenge Failed' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 font-mono text-rose-800'}>
                    {rec.status}
                  </Badge>
                  {rec.riskScore === 'High' ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => handleBlockIp(rec.ipAddress)} aria-label={`Block IP ${rec.ipAddress}`} className="border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100">
                      <Ban aria-hidden="true" /> Block IP
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => showToast(`Session verified for ${rec.userEmail}.`)} className="text-slate-600">
                      Inspect
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[920px] text-left text-xs">
              <TableHeader className="bg-slate-50 text-slate-500">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Identity / Email</TableHead>
                  <TableHead>IP Address &amp; Location</TableHead>
                  <TableHead>Auth Method</TableHead>
                  <TableHead>Event Outcome</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Defense Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/80">
                    <TableCell className="whitespace-nowrap font-mono text-slate-600">{rec.timestamp}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{rec.fullName}</div>
                      <div className="text-xs text-slate-500">{rec.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold text-slate-800">{rec.ipAddress}</div>
                      <div className="text-xs text-slate-400">{rec.geoLocation}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{rec.authMethod}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={rec.status === 'Successful Login' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : rec.status === 'MFA Challenge Failed' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 font-mono text-rose-800'}>{rec.status}</Badge>
                    </TableCell>
                    <TableCell><Badge variant={rec.riskScore === 'High' ? 'destructive' : 'outline'} className={rec.riskScore === 'Medium' ? 'border-amber-300 bg-amber-50 text-amber-800' : ''}>{rec.riskScore}</Badge></TableCell>
                    <TableCell className="text-right">
                      {rec.riskScore === 'High' ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => handleBlockIp(rec.ipAddress)} aria-label={`Block IP ${rec.ipAddress}`} className="border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100">
                          <Ban aria-hidden="true" /> Block IP
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="ghost" onClick={() => showToast(`Session verified for ${rec.userEmail}.`)} className="text-slate-600">Inspect</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
