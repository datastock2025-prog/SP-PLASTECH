import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './shared/providers/QueryProvider';
import { SecurityErrorBoundary, AuthProvider, TenantProvider } from './security';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <QueryProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryProvider>
        </TenantProvider>
      </AuthProvider>
    </SecurityErrorBoundary>
  </StrictMode>,
);
