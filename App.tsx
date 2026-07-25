import React, { Suspense, lazy } from 'react';
import LoginPage from './src/features/auth/pages/LoginPage';
import { ToastProvider } from './src/context/ToastContext';
import { DataProvider } from './src/context/DataContext';
import { FinanceDataProvider } from './src/context/FinanceDataContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConfirmationProvider } from './src/context/ConfirmationContext';

import AccessDeniedPage from './src/features/auth/pages/AccessDeniedPage';
import ChangePasswordPage from './src/features/auth/pages/ChangePasswordPage';

import LoadingSpinner from './src/components/ui/LoadingSpinner';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';

const AppLayout = lazy(() => import('./src/components/layout/AppLayout'));

const AppContent: React.FC = () => {
  const { isAuthenticated, accessDenied, needsPasswordChange, logout } = useAuth();


  // 1. Check Access Denied
  if (accessDenied) {
    return <AccessDeniedPage />;
  }

  // 2. Check Password Change Required
  if (needsPasswordChange) {
    return <ChangePasswordPage />;
  }

  // 3. Main Logic
  if (!isAuthenticated) {
    // If not authenticated (and not in special states), show Login
    return <LoginPage onLoginSuccess={() => { }} />;
  }

  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Chargement de l'application..." />}>
      <AppLayout onLogout={logout} />
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    // Filet racine (#17) : couvre ce que le boundary par vue d'AppLayout ne peut pas
    // atteindre — providers, coque, écrans hors session (Login / Accès refusé /
    // Changement de mot de passe). Volontairement HORS de l'arbre de providers :
    // son écran de repli ne doit dépendre d'aucun contexte pour s'afficher.
    <ErrorBoundary
      context="racine"
      title="L'application n'a pas pu démarrer"
      description="Une erreur inattendue a interrompu le chargement. Rechargez la page ; si le problème persiste, signalez-le au support avec l'heure exacte."
    >
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <FinanceDataProvider>
              <ConfirmationProvider>
                <AppContent />
              </ConfirmationProvider>
            </FinanceDataProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
