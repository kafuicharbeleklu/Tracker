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
import { useRouter } from './src/hooks/useRouter';

const AppLayout = lazy(() => import('./src/components/layout/AppLayout'));

/**
 * Vitrine du design system — `#/dev/design-system`.
 *
 * Montée AVANT l'arbre de providers et avant la porte d'authentification : elle
 * n'instancie que des primitives, ne lit aucune donnée métier, et doit rester
 * consultable sans session (c'est un outil de conception, pas une page de l'app).
 * Le `import()` est placé DANS la condition, pas seulement son usage : `lazy()` au
 * niveau du module aurait fait émettre le chunk quand même (vérifié — 37 ko de code
 * mort dans `dist/`). `import.meta.env.DEV` étant statiquement faux au build de
 * production, la branche entière disparaît et le chunk n'est plus généré.
 */
const DesignSystemGalleryPage = import.meta.env.DEV
  ? lazy(() => import('./src/features/dev/pages/DesignSystemGalleryPage'))
  : null;
const DocumentationExplorerPage = lazy(
  () => import('./src/features/documentation/pages/DocumentationExplorerPage'),
);

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
  const { routeSegments } = useRouter();
  const isDesignSystemRoute =
    DesignSystemGalleryPage !== null &&
    routeSegments[0] === 'dev' &&
    routeSegments[1] === 'design-system';

  const isDocumentationRoute =
    routeSegments[0] === 'documentation' && routeSegments[1] === 'ui-flow-map';

  if (isDocumentationRoute) {
    return (
      <ErrorBoundary context="documentation" title="La documentation n'a pas pu s'afficher">
        <Suspense fallback={<LoadingSpinner fullScreen text="Chargement de la documentation..." />}>
          <DocumentationExplorerPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDesignSystemRoute) {
    return (
      <ErrorBoundary context="design-system" title="La galerie du design system n'a pas pu s'afficher">
        <Suspense fallback={<LoadingSpinner fullScreen text="Chargement du design system..." />}>
          <DesignSystemGalleryPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

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
