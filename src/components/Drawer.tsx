import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  title,
  onClose,
  children,
  footer,
  width = 'max-w-[500px]'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen ${width} bg-white shadow-2xl flex flex-col transform transition-transform duration-200 ease-out`}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E4E0D6] flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-bold text-[#14213D] tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F6F4EF] hover:text-[#14213D] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-5 py-3.5 border-t border-[#E4E0D6] bg-[#FAFAF8] flex items-center justify-between shrink-0 gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
