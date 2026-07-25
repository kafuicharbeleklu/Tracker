import React from 'react';
import Button from './Button';
import MaterialIcon from './MaterialIcon';
import { EmptyState } from './EmptyState';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    /** Titre de l'écran d'erreur. */
    title?: string;
    /** Explication affichée sous le titre. */
    description?: string;
    /**
     * Étiquette de contexte injectée dans le log console (ex. « vue: finance »),
     * pour distinguer un plantage de page d'un plantage de coque applicative.
     */
    context?: string;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * Filet de sécurité React (AUDIT_MOBILE #17).
 *
 * Sans lui, la moindre exception de rendu dans une page démonte tout l'arbre React
 * et laisse un écran BLANC : sur mobile, sans console, l'utilisateur n'a aucun moyen
 * de comprendre ni de repartir. Le boundary transforme ce cas en écran lisible avec
 * une sortie explicite.
 *
 * Portée volontairement limitée : aucun service de télémétrie, seulement un
 * `console.error` (les erreurs locales existantes — validations de champ, toasts,
 * `BusinessRuleDecision` — restent inchangées ; un boundary ne capte QUE les
 * exceptions de rendu, jamais les rejets de promesse ni les handlers d'événement).
 *
 * Remontage : le boundary ne se réinitialise pas seul. Les appelants lui donnent une
 * `key` liée à la navigation (cf. `AppLayout`), ce qui rend la coque de navigation
 * suffisante pour sortir d'une page cassée sans recharger.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const scope = this.props.context ? ` [${this.props.context}]` : '';
        console.error(`[ErrorBoundary]${scope}`, error, errorInfo.componentStack);
    }

    render() {
        const { error } = this.state;
        if (!error) {
            return this.props.children;
        }

        const {
            title = 'Une erreur est survenue',
            description = "Cette page n'a pas pu s'afficher. Rechargez l'application ; si le problème persiste, signalez-le au support avec l'heure exacte.",
        } = this.props;

        return (
            <div
                role="alert"
                data-testid="error-boundary-fallback"
                className="flex h-full min-h-[60vh] w-full items-center justify-center p-page-sm medium:p-page"
            >
                <div className="w-full max-w-md">
                    <EmptyState
                        icon="error"
                        title={title}
                        description={description}
                        action={
                            <Button
                                variant="filled"
                                size="lg"
                                icon={<MaterialIcon name="refresh" size={18} />}
                                onClick={() => window.location.reload()}
                            >
                                Recharger
                            </Button>
                        }
                    />

                    {/* Détail technique réservé au dev : inutile — voire anxiogène — en production. */}
                    {import.meta.env.DEV && (
                        <details className="mt-6 rounded-md border border-outline-variant bg-surface-container px-3 py-2">
                            <summary className="cursor-pointer text-label-medium text-on-surface-variant">
                                Détail technique (dev)
                            </summary>
                            <pre className="mt-2 overflow-x-auto text-body-small text-on-surface-variant">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
