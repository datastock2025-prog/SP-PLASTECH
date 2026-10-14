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
    <div className="min-h-screen w-full bg-[#030712] overflow-x-hidden">
      {children || <Outlet />}
    </div>
  );
};

export default AuthLayout;

