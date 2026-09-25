import React from 'react';
import { ArrowClockwise, Check, Copy, House, WarningCircle } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';

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
    /** L'heure de l'incident — ce que le support demandera en premier. */
    survenueA: Date | null;
    /** Le relevé vient d'être copié pour le support. */
    copie: boolean;
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
    state: ErrorBoundaryState = { error: null, survenueA: null, copie: false };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { error, survenueA: new Date() };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const scope = this.props.context ? ` [${this.props.context}]` : '';
        console.error(`[ErrorBoundary]${scope}`, error, errorInfo.componentStack);
    }

    render() {
        const { error, survenueA } = this.state;
        if (!error) {
            return this.props.children;
        }

        /*
          **L'écran d'erreur, sobre** (24/09). Il empruntait la forme des états d'écran : une
          pastille de 96, un titre centré, deux boutons empilés, l'heure en note de pied. Le
          commanditaire le voulait « plus sobre, mais élégant ». Il devient une **colonne de
          lecture** de 480, alignée à gauche, sans fond ni pastille : un repère de 20, le
          titre à la mesure des pages (28 sur 32), la phrase ; puis, sous un filet, **les
          deux faits que le support demandera** — quand, et sur quelle page — et de quoi les
          copier d'un geste ; enfin les deux sorties, côte à côte dès 600.
        */
        const {
            title = 'Cette page n’a pas pu s’afficher',
            description = 'Rechargez-la. Si cela recommence, signalez-le au support avec les informations ci-dessous.',
        } = this.props;

        const heure = survenueA
            ? `${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(survenueA)} à ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(survenueA)}`
            : null;
        const page = window.location.hash.replace(/^#/, '') || '/';

        const copier = () => {
            const releve = [
                'Tracker — erreur d’affichage',
                heure ? `Survenu le ${heure}` : null,
                `Page ${page}`,
                error.message ? `Message : ${error.message}` : null,
            ]
                .filter(Boolean)
                .join('\n');
            navigator.clipboard
                ?.writeText(releve)
                .then(() => {
                    this.setState({ copie: true });
                    window.setTimeout(() => this.setState({ copie: false }), 2400);
                })
                .catch(() => undefined);
        };

        const fait = (terme: string, valeur: React.ReactNode) => (
            <div className="border-outline-variant flex min-h-11 items-baseline gap-4 border-t py-2.5">
                <dt className="text-on-surface-variant text-ts-sub leading-ts-sub w-20 shrink-0">
                    {terme}
                </dt>
                <dd className="text-on-surface text-ts-sub leading-ts-sub min-w-0 flex-1 truncate tabular-nums">
                    {valeur}
                </dd>
            </div>
        );

        return (
            <div
                role="alert"
                data-testid="error-boundary-fallback"
                className="flex h-full min-h-[60vh] w-full flex-1 items-center justify-center px-5 py-12"
            >
                <div className="w-full max-w-[480px]">
                    <Icon
                        glyph={WarningCircle}
                        size={20}
                        className="text-[var(--tk-color-st-orange)]"
                    />
                    <h1 className="font-brand text-on-surface text-ts-page leading-ts-page mt-4 font-semibold tracking-[-0.02em] text-balance">
                        {title}
                    </h1>
                    <p className="text-on-surface-variant text-ts-body leading-ts-body mt-3 text-pretty">
                        {description}
                    </p>

                    <dl className="border-outline-variant mt-8 border-b">
                        {heure && fait('Survenu', `le ${heure}`)}
                        {fait('Page', <span className="font-mono text-[0.8125rem]">{page}</span>)}
                    </dl>
                    <Button
                        variant="text"
                        size="sm"
                        onClick={copier}
                        icon={<Icon glyph={this.state.copie ? Check : Copy} size={18} />}
                        className="text-on-surface-variant hover:text-on-surface mt-2 -ml-2 px-2"
                    >
                        {this.state.copie ? 'Copié' : 'Copier pour le support'}
                    </Button>

                    <div className="medium:flex-row mt-8 flex flex-col gap-3">
                        <Button
                            variant="filled"
                            icon={<Icon glyph={ArrowClockwise} size={20} />}
                            onClick={() => window.location.reload()}
                        >
                            Recharger la page
                        </Button>
                        <Button
                            variant="outlined"
                            icon={<Icon glyph={House} size={20} />}
                            onClick={() => {
                                window.location.hash = '/';
                                window.location.reload();
                            }}
                        >
                            Revenir à l’accueil
                        </Button>
                    </div>

                    {/* Le détail technique, **au développement seulement** : en production
                        il serait illisible, et inquiétant. */}
                    {import.meta.env.DEV && (
                        <details className="mt-10">
                            <summary className="text-text-tertiary cursor-pointer text-[0.75rem] leading-4">
                                Détail technique
                            </summary>
                            <pre className="bg-surface-container text-on-surface-variant mt-2 overflow-x-auto rounded-md p-3 text-[0.75rem] leading-4 whitespace-pre-wrap">
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
