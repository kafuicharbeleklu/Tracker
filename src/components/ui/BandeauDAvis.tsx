import React from 'react';
import { BellRinging, X } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **Le bandeau d'un avis** (08/10) — en haut de l'écran, comme une notification de
 * messagerie : ce qu'un autre appareil vient de faire et qui vous concerne. Il a la matière
 * du snackbar (17.5) — surface inverse, ombre portée — mais pas sa place : le snackbar répond
 * à un geste qu'on vient de faire, en bas ; l'avis arrive sans qu'on ait rien fait, en haut.
 *
 * Deux formes : l'avis lui-même (`avis`), et l'invitation à recevoir les notifications du
 * système (`invitation`), demandée une fois par appareil.
 */

const SURFACE = cn(
    'pointer-events-auto flex w-full max-w-[28rem] min-w-0 rounded-lg',
    'bg-inverse-surface text-inverse-on-surface',
    'shadow-[0_6px_20px_rgba(10,25,29,0.28)]',
    'animate-in fade-in slide-in-from-top-4 duration-300',
);

const GESTE =
    'min-h-10 rounded-md px-2.5 text-[0.875rem] leading-5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-current';

interface BandeauDAvisProps {
    avis?: { id: string; titre: string; corps: string } | null;
    /** Toucher l'avis : ouvrir ce qu'il annonce. */
    onOuvrir?: () => void;
    onFermer?: () => void;
    invitation?: { texte: string; onPlusTard: () => void; onActiver: () => void } | null;
}

const BandeauDAvis: React.FC<BandeauDAvisProps> = ({ avis, onOuvrir, onFermer, invitation }) => {
    if (!avis && !invitation) return null;
    return (
        <div className="pointer-events-none fixed inset-x-3 top-[max(12px,env(safe-area-inset-top,0px)+8px)] z-[115] flex justify-center">
            {avis ? (
                <div
                    key={avis.id}
                    role="status"
                    aria-live="assertive"
                    className={cn(SURFACE, 'items-center gap-3 p-2 pl-3.5')}
                >
                    {/* Le bandeau entier ouvre, comme une notification qu'on touche. */}
                    <button
                        type="button"
                        onClick={onOuvrir}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none"
                    >
                        <span className="mvt-pop bg-inverse-primary/20 text-inverse-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                            <Icon glyph={BellRinging} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-ts-body leading-ts-body block font-medium">
                                {avis.titre}
                            </span>
                            <span className="text-ts-sub leading-ts-sub block truncate opacity-80">
                                {avis.corps}
                            </span>
                        </span>
                    </button>
                    <button
                        type="button"
                        aria-label="Fermer l’avis"
                        onClick={onFermer}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md opacity-80 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
                    >
                        <Icon glyph={X} size={18} />
                    </button>
                </div>
            ) : invitation ? (
                <div
                    role="dialog"
                    aria-label="Alertes de tâches"
                    className={cn(SURFACE, 'flex-col gap-2 p-3.5')}
                >
                    <p className="text-ts-sub leading-ts-sub">{invitation.texte}</p>
                    <span className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={invitation.onPlusTard}
                            className={cn(GESTE, 'opacity-80 hover:opacity-100')}
                        >
                            Plus tard
                        </button>
                        <button
                            type="button"
                            onClick={invitation.onActiver}
                            className={cn(GESTE, 'text-inverse-primary hover:opacity-80')}
                        >
                            Activer
                        </button>
                    </span>
                </div>
            ) : null}
        </div>
    );
};

export default BandeauDAvis;
