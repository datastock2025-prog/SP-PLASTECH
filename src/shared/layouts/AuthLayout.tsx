import React from 'react';
import { Outlet } from 'react-router-dom';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

/**
 * Public Layout Wrapper
 * Houses unauthenticated views (Login, Password Reset, PIN entry)
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#14213D] flex flex-col justify-between selection:bg-[#E8622C] selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        {children || <Outlet />}
      </main>
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-white/5">
        Reboot ERP &bull; Industrial Polymer Execution & Manufacturing Platform &bull; ISO 9001 / IATF 16949 Certified
      </footer>
    </div>
  );
};

export default AuthLayout;
