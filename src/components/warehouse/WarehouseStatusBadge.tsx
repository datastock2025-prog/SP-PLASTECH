import React from 'react';

interface Props {
  status: string;
  size?: 'xs' | 'sm' | 'md';
}

export const WarehouseStatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const getStyle = (st: string) => {
    const s = st.toLowerCase().replace(/ /g, '_');
    switch (s) {
      case 'in_stock':
      case 'released':
      case 'completed':
      case 'matched':
      case 'shipped':
      case 'reconciled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'low_stock':
      case 'picking':
      case 'in_progress':
      case 'dispatched':
      case 'partially_received':
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'out_of_stock':
      case 'variance_flagged':
      case 'scrap_destroy':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'in_quarantine':
      case 'pending_disposition':
      case 'quality_check':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      case 'staged':
      case 'allocated':
      case 'reserved':
        return 'bg-teal-50 text-teal-700 border-teal-200';

      case 'pending':
      case 'scheduled':
      case 'assigned':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatText = (st: string) => {
    return st
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const sizeCls =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeCls} ${getStyle(
        status
      )} transition-colors`}
    >
      {formatText(status)}
    </span>
  );
};
