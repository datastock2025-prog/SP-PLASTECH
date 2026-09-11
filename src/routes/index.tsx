import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../shared/layouts/AuthLayout';
import { RequireAuth } from '../shared/components/RequireAuth';
import { LoginScreen } from '../features/auth';
import { HomeView } from '../features/dashboard';
import { ReactArchitectureGuide } from '../features/architecture';
import { PromptBuilder } from '../features/ai';
import { AuthUser } from '../types';

interface AppRoutesProps {
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser, plantId: string, shiftId: string) => void;
  lastLoggedOutUser: AuthUser | null;
  children: React.ReactNode;
}

/**
 * Centralized Routing Module (Rule 4: Centralized & Nested Layouts)
 * Separates public routes (AuthLayout) from protected routes (RequireAuth + App Shell)
 */
export const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUser,
  onLogin,
  lastLoggedOutUser,
  children,
}) => {
  return (
    <Routes>
      {/* Public Routes with AuthLayout */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to="/" replace />
          ) : (
            <AuthLayout>
              <LoginScreen onLogin={onLogin} lastLoggedOutUser={lastLoggedOutUser} />
            </AuthLayout>
          )
        }
      />

      {/* Protected Routes guarded by RequireAuth */}
      <Route
        path="/*"
        element={
          <RequireAuth
            currentUser={currentUser}
            fallback={
              <AuthLayout>
                <LoginScreen onLogin={onLogin} lastLoggedOutUser={lastLoggedOutUser} />
              </AuthLayout>
            }
          >
            {children}
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
