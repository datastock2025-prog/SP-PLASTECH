import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { ExecutiveKpiItem } from '../../types/analyticsTypes';

interface KpiCardProps {
  kpi: ExecutiveKpiItem;
  onDrillDown?: (kpiId: string) => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({ kpi, onDrillDown }) => {
  const isPositive = (kpi.variancePct || 0) >= 0;
  const isDownGood = kpi.kpiCategory === 'QUALITY' || kpi.kpiName.toLowerCase().includes('defect') || kpi.kpiName.toLowerCase().includes('carbon');
  const isGood = isDownGood ? !isPositive : isPositive;

  return (
    <div
      onClick={() => onDrillDown?.(kpi.id)}
      className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-lg hover:border-[#0F8B8D]/40 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            {kpi.kpiCategory}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-bold">
            {kpi.trend === 'UP' ? (
              <span className={`flex items-center gap-0.5 ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{Math.abs(kpi.variancePct || 0)}%</span>
              </span>
            ) : kpi.trend === 'DOWN' ? (
              <span className={`flex items-center gap-0.5 ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{Math.abs(kpi.variancePct || 0)}%</span>
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                <span>0%</span>
              </span>
            )}
          </div>
        </div>

        <h3 className="text-xs font-semibold text-slate-600 mt-2 line-clamp-1 group-hover:text-[#0F8B8D] transition-colors">
          {kpi.kpiName}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {kpi.kpiUnit === '₹' ? `₹${(kpi.kpiValue / 100000).toFixed(1)}L` : kpi.kpiValue.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">{kpi.kpiUnit !== '₹' ? kpi.kpiUnit : ''}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Target: <strong className="text-slate-700 font-mono">{kpi.kpiTarget ? `${kpi.kpiTarget} ${kpi.kpiUnit !== '₹' ? kpi.kpiUnit : ''}` : 'N/A'}</strong></span>
        <span className="text-[#0F8B8D] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          Drill down <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
