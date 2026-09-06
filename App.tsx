import React, { Suspense, lazy } from 'react';
import LoginPage from './src/features/auth/pages/LoginPage';
import { ToastProvider } from './src/context/ToastContext';
import { DataProvider } from './src/context/DataContext';
import { FinanceDataProvider } from './src/context/FinanceDataContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConfirmationProvider } from './src/context/ConfirmationContext';
import { useData } from './src/context/DataContext';
import { useFinanceData } from './src/context/FinanceDataContext';

import AccessDeniedPage from './src/features/auth/pages/AccessDeniedPage';
import FirstLoginPage from './src/features/auth/pages/FirstLoginPage';

import LoadingSpinner from './src/components/ui/LoadingSpinner';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { useRouter } from './src/hooks/useRouter';

import MobileFrame from './src/components/layout/MobileFrame';

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
    const { isHydrating: isDataHydrating } = useData();
    const { isHydrating: isFinanceHydrating } = useFinanceData();
    const { routeSegments, navigate } = useRouter();

    /*
     * 0. La documentation — `#/documentation/ui-flow-map`, où mène « Aide et support » du
     * menu de compte (planche 03.1). Elle se monte DANS l'arbre de providers, avant la
     * porte d'authentification : hors de l'arbre, l'ouvrir démontait `AuthProvider`, et
     * comme la session de démonstration ne vit qu'en mémoire, en revenir renvoyait à
     * l'écran de connexion. Une rangée d'un menu de compte ne déconnecte pas.
     */
    if (routeSegments[0] === 'documentation' && routeSegments[1] === 'ui-flow-map') {
        return (
            <ErrorBoundary context="documentation" title="La documentation n'a pas pu s'afficher">
                <Suspense
                    fallback={
                        <LoadingSpinner fullScreen text="Chargement de la documentation..." />
                    }
                >
                    <DocumentationExplorerPage />
                </Suspense>
            </ErrorBoundary>
        );
    }

    /*
     * 1. L'invitation — `#/invite/<jeton>`, avant la porte d'authentification (02.2) :
     * la personne n'a pas encore de session, le lien est sa seule clé. La page reste
     * montée quand la session s'ouvre à l'écran 2 ; c'est elle qui décide de la sortie.
     */
    if (routeSegments[0] === 'invite') {
        return <FirstLoginPage token={routeSegments[1] ?? ''} />;
    }

    if (isDataHydrating || isFinanceHydrating) {
        return <LoadingSpinner fullScreen text="Chargement des données Firebase..." />;
    }

    // 2. Check Access Denied
    if (accessDenied) {
        return <AccessDeniedPage />;
    }

    // 3. Un compte hérité qui doit définir son mot de passe sans lien : le même écran 2.
    if (needsPasswordChange) {
        return <FirstLoginPage />;
    }

    // 4. Main Logic
    if (!isAuthenticated) {
        /*
         * La session ouverte, la route repart de l'accueil. Sans cela, une arrivée par
         * un lien direct (`#/login`, `#/invite/…` consommé) laissait le fragment tel
         * quel : la coque le résolvait en vue inconnue, et la première chose que voyait
         * une personne qui venait de se connecter était « Cette page n'existe plus ».
         */
        return <LoginPage onLoginSuccess={() => navigate('/')} />;
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

    if (isDesignSystemRoute) {
        return (
            <ErrorBoundary
                context="design-system"
                title="La galerie du design system n'a pas pu s'afficher"
            >
                <Suspense
                    fallback={<LoadingSpinner fullScreen text="Chargement du design system..." />}
                >
                    <DesignSystemGalleryPage />
                </Suspense>
            </ErrorBoundary>
        );
    }

    return (
        // Filet racine (#17) : couvre ce que le boundary par vue d'AppLayout ne peut pas
        // atteindre — providers, coque, écrans hors session (Login / Accès refusé /
        // Première connexion). Volontairement HORS de l'arbre de providers :
        // son écran de repli ne doit dépendre d'aucun contexte pour s'afficher.
        <ErrorBoundary
            context="racine"
            title="L'application n'a pas pu démarrer"
            description="Une erreur inattendue a interrompu le chargement. Rechargez la page ; si le problème persiste, signalez-le au support avec l'heure exacte."
        >
            {/* Le cadre du téléphone enveloppe TOUT le produit, connexion comprise :
                c'est ce qui fait que l'écran de connexion et l'application ont la même
                dimension, ce qu'ils n'avaient pas. */}
            <MobileFrame>
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
            </MobileFrame>
        </ErrorBoundary>
    );
};

export default App;
