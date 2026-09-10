import React from 'react';

export type ProcurementBadgeType =
  | 'active'
  | 'pending_approval'
  | 'pending'
  | 'approved'
  | 'blocked'
  | 'preferred'
  | 'under_review'
  | 'inactive'
  | 'draft'
  | 'sent'
  | 'sent_to_supplier'
  | 'response_received'
  | 'partial_response'
  | 'closed'
  | 'awarded'
  | 'cancelled'
  | 'on_hold'
  | 'converted_rfq'
  | 'converted_po'
  | 'partially_received'
  | 'received'
  | 'partially_invoiced'
  | 'invoiced'
  | 'matched'
  | 'price_variance'
  | 'qty_variance'
  | 'no_grn'
  | 'disputed'
  | 'accepted'
  | 'partially_accepted'
  | 'rejected'
  | 'returned'
  | 'supplier_acknowledged'
  | 'credit_note_received'
  | 'replacement_received'
  | 'high'
  | 'medium'
  | 'low'
  | 'critical'
  | 'urgent'
  | string;

interface Props {
  status: ProcurementBadgeType;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}

export const ProcurementStatusBadge: React.FC<Props> = ({
  status,
  label,
  size = 'sm',
  pulse = false,
}) => {
  const norm = String(status).toLowerCase().replace(/[\s-]/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  // Gray = Draft / Inactive / Closed
  if (['draft', 'inactive', 'closed', 'cancelled', 'expired'].includes(norm)) {
    colorClasses = 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
    dotColor = 'bg-gray-400';
  }
  // Amber = Pending / Under Review / Partial / Price Variance / Urgent
  else if (
    [
      'pending',
      'pending_approval',
      'under_review',
      'supplier_reviewing',
      'partial_response',
      'partially_received',
      'partially_invoiced',
      'partially_accepted',
      'price_variance',
      'qty_variance',
      'medium',
      'expiring_soon',
      'open_suggestion',
    ].includes(norm)
  ) {
    colorClasses = 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
    dotColor = 'bg-amber-500';
  }
  // Green = Active / Approved / Received / Matched / Accepted / Preferred
  else if (
    [
      'active',
      'approved',
      'preferred',
      'received',
      'invoiced',
      'matched',
      'accepted',
      'awarded',
      'passed_qc',
      'scheduled',
      'paid',
      'resolved',
      'good_standing',
    ].includes(norm)
  ) {
    colorClasses = 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
    dotColor = 'bg-emerald-500';
  }
  // Blue / Teal = Sent / Converted / Processed
  else if (
    [
      'sent',
      'sent_to_supplier',
      'response_received',
      'converted_rfq',
      'converted_po',
      'supplier_acknowledged',
      'credit_note_received',
      'replacement_received',
      'mitigating',
      'low',
    ].includes(norm)
  ) {
    colorClasses = 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
    dotColor = 'bg-sky-500';
  }
  // Red = Blocked / Rejected / Disputed / Critical / High Risk
  else if (
    [
      'blocked',
      'rejected',
      'disputed',
      'failed_qc',
      'critical',
      'urgent',
      'high',
      'critical_shortage',
      'hold',
      'on_hold',
    ].includes(norm)
  ) {
    colorClasses = 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
    dotColor = 'bg-red-500';
  }
  // Purple = Special / Grade A / Custom
  else if (['grade_a', 'volume_contract', 'blanket_order'].includes(norm)) {
    colorClasses = 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]';
    dotColor = 'bg-purple-500';
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium tracking-tight',
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-sm px-3 py-1 font-semibold',
  }[size];

  const displayLabel =
    label ||
    status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} whitespace-nowrap transition-colors select-none`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          pulse ? 'animate-pulse' : ''
        }`}
      />
      {displayLabel}
    </span>
  );
};
