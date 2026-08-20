import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

export type SnackbarVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface SnackbarMessage {
    id: string;
    message: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
    variant?: SnackbarVariant;
}

interface SnackbarProps {
    messages: SnackbarMessage[];
    onDismiss: (id: string) => void;
    className?: string;
}

/**
 * Les quatre natures du composant partagé 17.5.
 *
 * La nature se lit d'abord au GLYPHE ; la couleur n'en est que le renfort (I3,
 * §0.3) — quatre natures qui ne différeraient que par la teinte n'en feraient
 * qu'une pour qui ne distingue pas les teintes, et à l'impression.
 *
 * Les quatre encres sont les VARIANTES VIVES du socle (`--tk-color-live-*`) et
 * non les encres de statut : sur la surface inversée, `--tk-color-st-*` ne tient
 * pas le contraste. `default` reste un alias d'`info` — les appels qui ne
 * précisent pas de nature en émettent une.
 */
const VARIANT_NATURE: Record<SnackbarVariant, { glyph: typeof Info; tone: string }> = {
    default: { glyph: Info, tone: 'text-[var(--tk-color-live-bleu)]' },
    info: { glyph: Info, tone: 'text-[var(--tk-color-live-bleu)]' },
    success: { glyph: CheckCircle, tone: 'text-[var(--tk-color-live-vert)]' },
    warning: { glyph: Warning, tone: 'text-[var(--tk-color-live-ambre)]' },
    error: { glyph: XCircle, tone: 'text-[var(--tk-color-live-orange)]' },
};

/**
 * Le retour transitoire — composant partagé `17.5`.
 *
 * **La question qui tranche la forme** est « qui doit agir, et quand ? ».
 * *Personne* — l'acte a échoué ou abouti, rien n'est perdu, la vue n'a pas
 * changé : c'est ici. *Un champ précis est en cause* : message au champ, sous ce
 * champ, et nulle part ailleurs. *L'utilisateur, tout de suite* : feuille.
 *
 * **Ce que le composant garantit** : surface inversée `--tk-color-inverse-surface`,
 * rayon `8` (le cran de surface, R11), au-dessus de la barre du bas et jamais
 * dessus, effacement à **4 s**, et **un seul message à l'écran** — le suivant
 * attend son tour, il ne s'empile pas. L'action est **facultative** et n'apparaît
 * que si elle existe vraiment.
 *
 * **Pas de croix.** La planche n'en dessine pas : un retour transitoire s'efface
 * seul, et une cible de fermeture sur un objet qui vit 4 s coûte plus qu'elle ne
 * rend. Retirée le 20/08 en portant `02.1`.
 *
 * **Règle d'écriture, opposable :** ≤ 60 signes, une proposition, un verbe.
 * Au-delà, ce n'est pas un retour transitoire — c'est que le tri a été mal fait.
 */
const Snackbar: React.FC<SnackbarProps> = ({ messages, onDismiss, className }) => {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = messages[0];

    const handleDismiss = useCallback(() => {
        if (!current || closing) return;
        setClosing(true);
    }, [current, closing]);

    const handleAnimationEnd = useCallback(() => {
        if (closing && current) {
            setVisible(false);
            setClosing(false);
            onDismiss(current.id);
        }
    }, [closing, current, onDismiss]);

    // Show new message
    useEffect(() => {
        if (current && !visible && !closing) {
            setVisible(true);
            setClosing(false);
        }
    }, [current, visible, closing]);

    // Auto-dismiss timer
    useEffect(() => {
        if (!current || !visible || closing) return;

        const duration = current.duration ?? 4000;
        if (duration <= 0) return; // No auto-dismiss

        timerRef.current = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [current, visible, closing, handleDismiss]);

    if (!visible || !current) return null;

    const nature = VARIANT_NATURE[current.variant ?? 'default'] ?? VARIANT_NATURE.default;

    return (
        <div
            className={cn(
                'pointer-events-none fixed z-[110] flex justify-center',
                // 12 px d'air sur les bords en compact, comme la planche.
                'expanded:right-4 expanded:left-4 right-3 left-3',
                /* Au-dessus de la barre du bas, jamais dessus, et jamais au-dessus d'une
                   barre absente : l'écart se calcule sur la hauteur réellement publiée par
                   le layout. 12 px d'air quand il n'y a pas de barre (le cas `.snk.nonav`
                   de la planche, celui de la connexion), 68 px quand il y en a une.
                   L'offset fixe de 6 rem posait le snackbar À CHEVAL sur la rangée des
                   comptes de démo de 02.1 — relevé le 20/08. */
                'bottom-[calc(var(--tk-size-bottom-bar,0px)+max(12px,env(safe-area-inset-bottom,0px)+8px))]',
                className,
            )}
        >
            <div
                role="status"
                aria-live="polite"
                onAnimationEnd={handleAnimationEnd}
                className={cn(
                    'pointer-events-auto flex w-full min-w-0 items-center gap-3 rounded-lg py-3 pr-3 pl-[14px]',
                    'bg-inverse-surface text-inverse-on-surface',
                    'shadow-[0_6px_20px_rgba(10,25,29,0.28)]',
                    'expanded:w-auto expanded:min-w-[344px] expanded:max-w-[560px]',
                    closing
                        ? 'animate-out fade-out slide-out-to-bottom-4 duration-150'
                        : 'animate-in fade-in slide-in-from-bottom-4 duration-300',
                )}
            >
                {/* La nature, portée par le glyphe — la couleur n'est que son renfort (I3). */}
                <Icon glyph={nature.glyph} size={20} className={nature.tone} />

                <p className="min-w-0 flex-1 text-[13px] leading-[18px] break-words">
                    {current.message}
                </p>

                {/* L'action est facultative : elle n'apparaît que si elle existe vraiment. */}
                {current.action && (
                    <button
                        type="button"
                        onClick={() => {
                            current.action?.onClick();
                            handleDismiss();
                        }}
                        className={cn(
                            'text-inverse-primary min-h-9 shrink-0 rounded-md px-2 text-[13px] font-medium',
                            'duration-short4 transition-opacity outline-none hover:opacity-80',
                            'focus-visible:ring-2 focus-visible:ring-current',
                        )}
                    >
                        {current.action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Snackbar;
