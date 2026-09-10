import React from 'react';

export type SalesBadgeType =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'reviewing'
  | 'accepted'
  | 'lost'
  | 'expired'
  | 'converted'
  | 'confirmed'
  | 'allocated'
  | 'in_production'
  | 'ready_to_ship'
  | 'partially_delivered'
  | 'delivered'
  | 'invoiced'
  | 'partially_invoiced'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'credit_hold'
  | 'credit_blocked'
  | 'good_standing'
  | 'near_limit'
  | 'over_limit'
  | 'high'
  | 'medium'
  | 'low'
  | string;

interface Props {
  status: SalesBadgeType;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}

export const SalesStatusBadge: React.FC<Props> = ({
  status,
  label,
  size = 'sm',
  pulse = false,
}) => {
  const norm = String(status).toLowerCase().replace(/[\s-]/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  // Exact color schema from STEP-20:
  // Gray = Draft/Inactive
  if (['draft', 'inactive', 'closed', 'not_started', 'not_billed'].includes(norm)) {
    colorClasses = 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    dotColor = 'bg-gray-400';
  }
  // Amber = Pending / Warning / Near Limit / Reviewing
  else if (
    ['pending', 'pending_approval', 'under_review', 'near_limit', 'reviewing', 'delayed', 'partially_allocated', 'awaiting_production', 'awaiting_purchase'].includes(norm)
  ) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  }
  // Blue = In Progress / Sent / Confirmed / Partially Delivered
  else if (['sent', 'confirmed', 'in_transit', 'dispatched', 'customer_ship', 'customer_reviewing'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500';
  }
  // Cyan = Allocated / Planned / Picking / Packed
  else if (['allocated', 'planned', 'picking', 'packed', 'fully_allocated'].includes(norm)) {
    colorClasses = 'bg-cyan-50 text-cyan-800 border-cyan-200';
    dotColor = 'bg-cyan-500';
  }
  // Purple = Production / Quality Related / Converted
  else if (
    ['in_production', 'converted', 'under_inspection', 'quality_hold', 'disposition_pending'].includes(norm)
  ) {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
    dotColor = 'bg-purple-500';
  }
  // Teal = Ready to Ship / Customer Confirmed
  else if (['ready_to_ship', 'customer_confirmed', 'ready_to_bill'].includes(norm)) {
    colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
    dotColor = 'bg-teal-500';
  }
  // Green = Completed / Approved / Accepted / Delivered / Invoiced / Paid / Good Standing
  else if (['approved', 'accepted', 'delivered', 'invoiced', 'paid', 'good_standing', 'completed', 'active'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }
  // Red = Blocked / Cancelled / Overdue / Rejected / Lost / Credit Hold / Over Limit
  else if (
    ['credit_hold', 'credit_blocked', 'rejected', 'lost', 'expired', 'overdue', 'cancelled', 'over_limit', 'disputed', 'payment_default', 'high_risk'].includes(norm)
  ) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  }

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs font-semibold'
      : 'px-2 py-0.5 text-[11px] font-medium';

  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} whitespace-nowrap tracking-tight`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      <span>{displayLabel}</span>
    </span>
  );
};
