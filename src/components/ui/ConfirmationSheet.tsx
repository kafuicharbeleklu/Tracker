import React, { useEffect, useId, useRef, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { Trash } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import InlineError from './InlineError';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';
import { cn } from '../../lib/utils';

/**
 * Confirmation — planche **17.2** (composant partagé, 9 écrans).
 *
 * **Une feuille, jamais une boîte centrée** — sous 840 px. Elle monte du bas, donc
 * elle arrive sous le pouce, et ses deux gestes sont à portée sans changer de main.
 * **Au-dessus de 840 px, la même vue devient un dialogue** (§2.43) : mêmes champs,
 * même pied, même ordre — une feuille qui monte du bas suppose un pouce, au clavier
 * elle traverse l'écran pour deux phrases.
 *
 * **C1 — le sujet est nommé.** « Supprimer Latitude 5540 du parc ? », jamais
 * « supprimer cet élément ». Sur une sélection, c'est le compte qui nomme :
 * « Refuser les 5 demandes ? »
 *
 * **C2 — le corps dit la conséquence**, pas l'action répétée en plus long : ce que
 * l'utilisateur veut savoir, c'est ce qui aura changé après. **Ce qui est conservé se
 * dit aussi** — l'historique, les équipements détenus, les mouvements.
 *
 * **C3 — le bouton porte le verbe.** « Supprimer », « Suspendre », « Refuser ».
 * Jamais « OK » ni « Confirmer », qui obligent à relire la question pour savoir ce
 * qu'on approuve. Le **rouge est réservé à l'irréversible** ; le réversible est
 * sombre — c'est `irreversible` qui décide, pas l'appelant.
 *
 * **C4 — l'irréversible le dit.** Une ligne, en rouge, sous le corps : c'est la
 * seule différence entre supprimer et suspendre du point de vue de l'utilisateur,
 * donc elle doit être la plus visible.
 *
 * Et quand l'acte échoue, c'est la règle 1 de **17.1** qui prend la suite : la
 * feuille **reste ouverte**, le motif saisi **reste écrit**, l'erreur se pose
 * au-dessus du pied et le geste primaire devient « Réessayer ».
 */

export interface ConfirmationDetail {
    icon?: PhosphorGlyph;
    label: string;
    value: React.ReactNode;
}

export interface ConfirmationReason {
    /** Le micro-libellé du champ — « Motif du refus — obligatoire ». */
    label: string;
    placeholder?: string;
    /** Un motif obligatoire arme le geste : sans lui, il ne part pas. */
    required?: boolean;
    /** Ce que le destinataire recevra, dit à l'écran : le motif est transmis tel quel. */
    hint?: React.ReactNode;
}

interface ConfirmationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    /** C1 — nomme le sujet, et se termine par un point d'interrogation. */
    title: string;
    /** C2 — la conséquence : ce qui aura changé, et ce qui est conservé. */
    message: React.ReactNode;
    /** C3 — le verbe de l'acte. */
    confirmText?: string;
    cancelText?: string;
    /**
     * C3 — la couleur du geste. `destructive` = le rouge, que le registre **réserve
     * à l'irréversible** ; `neutral` = le sombre, pour tout ce qui se défait.
     * Suspendre un compte est réversible, donc jamais rouge (LEXIQUE §5).
     */
    tone?: 'destructive' | 'neutral';
    /**
     * C4 — l'irréversible **le dit**, en une ligne rouge sous le corps. Séparé de
     * `tone` à dessein : la phrase est une affirmation sur l'acte, et on ne la
     * déduit pas d'une couleur héritée. Un acte rouge qui ne déclare pas
     * `irreversible` est un acte dont la couleur reste à instruire.
     */
    irreversible?: boolean;
    /** Le pictogramme du cercle de tête. Corbeille par défaut. */
    icon?: PhosphorGlyph;
    /** Les faits qui pèsent sur la décision, en rangées de référence. */
    details?: ConfirmationDetail[];
    /** Le motif, quand l'acte en réclame un. */
    reason?: ConfirmationReason;
    /** Mot-clé à retaper pour armer le geste (garde héritée, conservée). */
    confirmKeyword?: string;
    isLoading?: boolean;
    /** L'acte a échoué : la feuille reste ouverte et le dit (17.1, règle 1). */
    error?: string | null;
}

const ConfirmationSheet: React.FC<ConfirmationSheetProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    tone = 'neutral',
    irreversible = false,
    icon = Trash,
    details,
    reason,
    confirmKeyword,
    isLoading = false,
    error = null,
}) => {
    const [keywordInput, setKeywordInput] = useState('');
    const [reasonInput, setReasonInput] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const asDialog = useMediaQuery(MEDIA.expandedUp);

    useEffect(() => {
        if (!isOpen) return;
        // La saisie ne se vide qu'à l'ouverture : un échec ne fait pas retaper (17.1).
        setKeywordInput('');
        setReasonInput('');
        previousFocus.current = document.activeElement as HTMLElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusables = (): HTMLElement[] => {
            const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            return nodes ? Array.from(nodes) : [];
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            // Le clavier ne sort pas d'un modal : sans piège, la tabulation part
            // dans la page voilée, où plus rien n'est atteignable à la souris.
            if (event.key !== 'Tab') return;
            const items = focusables();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        requestAnimationFrame(() => {
            panelRef.current
                ?.querySelector<HTMLElement>(
                    'textarea, input, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                )
                ?.focus();
        });

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previousFocus.current?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const keywordBlocked = confirmKeyword
        ? keywordInput.trim().toLowerCase() !== confirmKeyword.toLowerCase()
        : false;
    const reasonBlocked = reason?.required ? reasonInput.trim().length === 0 : false;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex justify-center',
                asDialog ? 'items-center' : 'items-end',
            )}
        >
            <div
                className="bg-scrim/[0.42] absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'bg-surface relative flex max-h-[97%] flex-col pb-3.5',
                    asDialog
                        ? 'rounded-card shadow-elevation-4 w-[440px]'
                        : 'rounded-t-card shadow-elevation-3 w-full',
                    'animate-in fade-in duration-200',
                    !asDialog && 'slide-in-from-bottom-4 duration-300',
                )}
            >
                {/* La poignée dit qu'on peut refermer d'un geste — un dialogue, lui, n'en a pas. */}
                {!asDialog && (
                    <span
                        aria-hidden="true"
                        className="bg-outline-variant mx-auto mt-2 mb-1.5 h-1 w-9 rounded-full"
                    />
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2">
                    <span
                        className={cn(
                            'mb-3.5 flex h-12 w-12 items-center justify-center rounded-full',
                            tone === 'destructive'
                                ? 'bg-danger-light text-danger'
                                : 'bg-surface-container text-on-surface-variant',
                        )}
                    >
                        <Icon glyph={icon} size={20} />
                    </span>

                    <h2
                        id={titleId}
                        className="font-brand text-on-surface text-[22px] leading-[27px] font-semibold tracking-tight"
                    >
                        {title}
                    </h2>

                    <p className="text-body-medium text-text-secondary mt-2">{message}</p>

                    {details && details.length > 0 && (
                        <div className="border-outline-variant mt-3.5 border-t">
                            {details.map((detail) => (
                                <div
                                    key={detail.label}
                                    className="border-outline-variant text-body-medium text-text-secondary flex min-h-11 items-center gap-2.5 border-t first:border-t-0"
                                >
                                    {detail.icon && (
                                        <Icon
                                            glyph={detail.icon}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                    )}
                                    {detail.label}
                                    <b className="text-on-surface ml-auto font-medium tabular-nums">
                                        {detail.value}
                                    </b>
                                </div>
                            ))}
                        </div>
                    )}

                    {reason && (
                        <div className="mt-3.5">
                            <label
                                htmlFor={`${titleId}-reason`}
                                className="text-label-small text-on-surface-variant mb-1.5 block tracking-wider uppercase"
                            >
                                {reason.label}
                            </label>
                            <textarea
                                id={`${titleId}-reason`}
                                value={reasonInput}
                                onChange={(event) => setReasonInput(event.target.value)}
                                placeholder={reason.placeholder}
                                className="border-outline bg-surface text-body-large text-on-surface focus-visible:ring-focus-ring min-h-24 w-full rounded-md border p-3 leading-[21px] outline-none focus-visible:ring-2"
                            />
                            {reason.hint && (
                                <p className="text-body-small text-text-secondary mt-1.5">
                                    {reason.hint}
                                </p>
                            )}
                        </div>
                    )}

                    {confirmKeyword && (
                        <div className="mt-3.5">
                            <label
                                htmlFor={`${titleId}-keyword`}
                                className="text-body-small text-text-secondary mb-1.5 block"
                            >
                                Tapez{' '}
                                <b className="text-on-surface font-medium">{confirmKeyword}</b> pour
                                confirmer
                            </label>
                            <input
                                id={`${titleId}-keyword`}
                                type="text"
                                value={keywordInput}
                                onChange={(event) => setKeywordInput(event.target.value)}
                                placeholder={confirmKeyword}
                                className="border-outline bg-surface text-body-large text-on-surface focus-visible:ring-focus-ring min-h-12 w-full rounded-md border px-3 outline-none focus-visible:ring-2"
                            />
                        </div>
                    )}

                    {/* C4 — la seule différence visible entre supprimer et suspendre. */}
                    {irreversible && (
                        <p className="text-body-medium text-danger mt-3 font-medium">
                            Cette action est irréversible.
                        </p>
                    )}

                    {error && <InlineError className="mt-3">{error}</InlineError>}
                </div>

                <div className="border-outline-variant mt-4 flex items-center gap-3 border-t px-5 pt-4">
                    <Button variant="text" onClick={onClose} disabled={isLoading} className="px-1">
                        {cancelText}
                    </Button>
                    <Button
                        variant={tone === 'destructive' ? 'danger' : 'tonal'}
                        onClick={() => onConfirm(reason ? reasonInput : undefined)}
                        disabled={keywordBlocked || reasonBlocked || isLoading}
                        loading={isLoading}
                        className="flex-1"
                    >
                        {error ? 'Réessayer' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationSheet;
