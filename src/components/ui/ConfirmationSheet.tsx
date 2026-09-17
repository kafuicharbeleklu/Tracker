import React, { useEffect, useId, useRef, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

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
 * **C4 — la réversibilité se dit dans le sous-titre** (passe du 06/09). « Irréversible. »
 * ou « Réversible : … », sous le titre, et rien d'autre : c'est la seule différence
 * entre sortir du parc et suspendre du point de vue de la personne, donc c'est la
 * première chose lue. Elle vivait en ligne rouge **sous le corps**, c'est-à-dire après
 * la décision.
 *
 * ## La forme est celle des pages
 *
 * Relevé du 06/09 : les pages qui confirment — la fiche d'une personne, la campagne
 * d'inventaire, Mon compte — portaient toutes la même feuille, et cette planche en
 * dessinait une autre. Le canon est celui des pages, et il tient en quatre blocs :
 * le **titre** qui porte le verbe et son sous-titre de réversibilité, l'**objet** en
 * rangée, **« Ce que cela change »** dans un creux, le **motif** quand il est dû. Deux
 * verbes de même largeur en pied.
 *
 * Ce qui disparaît : le **cercle-icône** de tête, qui illustrait une décision au lieu
 * de la dire, et la ligne rouge à part.
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

/** `.fixed` — l'objet de l'acte, nommé en rangée. */
export interface ConfirmationSubject {
    /** La vignette de 40 : un glyphe, des initiales. */
    vignette?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
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
    /**
     * La phrase de réversibilité, quand l'acte se défait : *« Réversible : “Réactiver”
     * redevient le geste de la fiche. »* Un acte irréversible n'en a pas besoin, il dit
     * « Irréversible. » de lui-même.
     */
    reversibleNote?: string;
    /** L'objet de l'acte, en rangée — `.fixed` de la planche. */
    subject?: ConfirmationSubject;
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
    reversibleNote,
    subject,
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

    /* C4 — la réversibilité, première chose lue sous le titre. */
    const reversibility = irreversible ? 'Irréversible.' : reversibleNote;

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
                        ? 'rounded-card shadow-dialog w-[440px]'
                        : 'rounded-t-card shadow-sheet w-full',
                    'animate-in fade-in duration-200',
                    !asDialog && 'slide-in-from-bottom-4 duration-300',
                )}
            >
                {/* La poignée dit qu'on peut refermer d'un geste — un dialogue, lui, n'en a pas. */}
                {!asDialog && (
                    <span
                        aria-hidden="true"
                        className="bg-outline-variant mx-auto mt-2 mb-1.5 h-1 w-9 rounded-xs"
                    />
                )}

                {/* `.sttl` — le titre porte le verbe, le sous-titre la réversibilité. */}
                <div className="px-5 pt-1">
                    <h2
                        id={titleId}
                        className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em] text-pretty"
                    >
                        {title}
                    </h2>
                    {reversibility && (
                        <p
                            className={cn(
                                'mt-1 text-[14px] leading-5',
                                irreversible ? 'text-danger' : 'text-on-surface-variant',
                            )}
                        >
                            {reversibility}
                        </p>
                    )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3">
                    {/* `.fixed` — l'objet, nommé. Une rangée, pas « cet élément ». */}
                    {subject && (
                        <div className="flex items-center gap-3 py-2">
                            {subject.vignette && (
                                <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    {subject.vignette}
                                </span>
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[16px] leading-6">
                                    {subject.title}
                                </span>
                                {subject.subtitle && (
                                    <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                        {subject.subtitle}
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* `.conseq` — ce qui aura changé, et ce qui est conservé. */}
                    {(message || (details && details.length > 0)) && (
                        <div className="bg-surface-container flex flex-col gap-2.5 rounded-[4px] px-4 py-3">
                            <p className="text-on-surface-variant text-[12px] leading-4 font-medium">
                                Ce que cela change
                            </p>
                            {message && (
                                <p className="text-on-surface text-[14px] leading-5">{message}</p>
                            )}
                            {details?.map((detail) => (
                                <p
                                    key={detail.label}
                                    className="text-on-surface flex items-center gap-3 text-[14px] leading-5"
                                >
                                    {detail.icon && (
                                        <span className="bg-surface text-on-surface-variant flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                                            <Icon glyph={detail.icon} size={18} />
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">{detail.label}</span>
                                    <b className="font-medium tabular-nums">{detail.value}</b>
                                </p>
                            ))}
                        </div>
                    )}

                    {reason && (
                        <div>
                            <label
                                htmlFor={`${titleId}-reason`}
                                className="text-on-surface-variant mb-2 block text-[12px] leading-4 font-medium"
                            >
                                {reason.label}
                                {reason.required && (
                                    <span className="text-text-tertiary font-normal">
                                        {' '}
                                        obligatoire
                                    </span>
                                )}
                            </label>
                            {/* `.field.long` — le creux, sans filet, 96 de haut, 16 sur 24. */}
                            <textarea
                                id={`${titleId}-reason`}
                                value={reasonInput}
                                onChange={(event) => setReasonInput(event.target.value)}
                                placeholder={reason.placeholder}
                                className="bg-surface-container text-on-surface placeholder:text-on-surface-variant focus-visible:ring-focus-ring min-h-24 w-full rounded-[4px] border-0 px-3.5 py-3 text-[16px] leading-6 outline-none focus-visible:ring-2"
                            />
                            {reason.hint && (
                                <p className="text-on-surface-variant mt-2 text-[14px] leading-5">
                                    {reason.hint}
                                </p>
                            )}
                        </div>
                    )}

                    {confirmKeyword && (
                        <div>
                            <label
                                htmlFor={`${titleId}-keyword`}
                                className="text-on-surface-variant mb-2 block text-[12px] leading-4 font-medium"
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
                                className="bg-surface-container text-on-surface focus-visible:ring-focus-ring min-h-12 w-full rounded-[4px] border-0 px-3.5 text-[16px] leading-6 outline-none focus-visible:ring-2"
                            />
                        </div>
                    )}

                    {error && <InlineError>{error}</InlineError>}
                </div>

                {/* `.sfoot` — deux verbes de même largeur, 12 d'écart, un filet au-dessus. */}
                <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="!rounded-[4px]"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={tone === 'destructive' ? 'danger' : 'tonal'}
                        onClick={() => onConfirm(reason ? reasonInput : undefined)}
                        disabled={keywordBlocked || reasonBlocked || isLoading}
                        loading={isLoading}
                        className="!rounded-[4px]"
                    >
                        {error ? 'Réessayer' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationSheet;
