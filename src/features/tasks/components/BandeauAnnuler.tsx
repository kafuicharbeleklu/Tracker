import React from 'react';

import Button from '../../../components/ui/Button';

interface BandeauAnnulerProps {
    message: string;
    /** Change à chaque décision : le bandeau repart. */
    cle: number;
    onAnnuler: () => void;
    /** Au bureau, le bouton annonce son raccourci (Z). */
    touches: boolean;
}

/**
 * **Le bandeau d'une décision qui se défait encore** (26/09) — tel que la maquette de la
 * refonte le dessine : une surface inversée, rayon 4, le message en 14 et « Annuler » en
 * jaune, 600. Il vit **à part du snackbar** : le snackbar attend son tour, et un « Annuler »
 * qui arriverait après l'écriture ne défait plus rien. Z annule au clavier, comme dans Gmail.
 */
const BandeauAnnuler: React.FC<BandeauAnnulerProps> = ({ message, cle, onAnnuler, touches }) => (
    <div className="pointer-events-none fixed right-4 bottom-[calc(var(--tk-size-bottom-bar,0px)+max(16px,env(safe-area-inset-bottom,0px)+8px))] left-4 z-[105] flex justify-center">
        <div
            key={cle}
            role="status"
            aria-live="polite"
            className="bg-inverse-surface text-inverse-on-surface mvt-barre pointer-events-auto flex max-w-[560px] min-w-0 items-center gap-3.5 rounded-md py-1 pr-1.5 pl-3.5 shadow-[0_6px_20px_rgba(10,25,29,0.28)]"
        >
            <p className="text-ts-body leading-ts-body min-w-0 flex-1 py-1.5 break-words">
                {message}
            </p>
            <Button
                variant="text"
                size="sm"
                onClick={onAnnuler}
                aria-keyshortcuts={touches ? 'Z' : undefined}
                className="text-primary hover:text-primary h-8 min-h-8 shrink-0 px-2 text-[0.875rem] leading-5 font-semibold hover:bg-white/[0.08]"
            >
                Annuler
            </Button>
        </div>
    </div>
);

export default BandeauAnnuler;
