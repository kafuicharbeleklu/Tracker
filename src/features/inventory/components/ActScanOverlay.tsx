import React, { useState } from 'react';

import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import { codeDeLaLecture, codeProche, trouverParCode } from '../../../lib/lectureDeCode';
import type { Equipment } from '../../../types';

/**
 * **Le scan d'une feuille d'acte** — la seconde moitié de la ligne de choix de 17.4 :
 * *« Recherche et scan sur une ligne. »* On cherche par le nom quand on a la liste sous
 * les yeux, on scanne quand on a l'objet dans les mains.
 *
 * La vue recueille un code — lu par la caméra, ou saisi à la main (09/10) — et l'appelant
 * dit ce que ce code désigne. Un objet qui n'est pas
 * dans la liste des éligibles est **une lecture, pas un choix** : le viseur le nomme et
 * dit pourquoi il ne peut pas être pris, au lieu d'ouvrir un acte impossible.
 */
interface ActScanOverlayProps {
    /** Ce qui peut être choisi — la liste même que la feuille propose. */
    eligibles: Equipment[];
    tip: string;
    acceptLabel: string;
    onClose: () => void;
    onPick: (id: string) => void;
}

const ActScanOverlay: React.FC<ActScanOverlayProps> = ({
    eligibles,
    tip,
    acceptLabel,
    onClose,
    onPick,
}) => {
    const [hit, setHit] = useState<ScanHit | null>(null);

    const trouver = (code: string): Equipment | undefined => trouverParCode(eligibles, code);

    const lire = (code: string) => {
        const trouve = trouver(code);
        setHit({
            id: `scan_${Date.now()}`,
            code: codeDeLaLecture(code),
            detail: trouve
                ? `${trouve.name} · ${trouve.model}`
                : 'Aucun équipement de cette liste ne porte ce code',
            kind: trouve ? 'expected' : 'exception',
        });
    };

    return (
        /* Au-dessus de la feuille : le viseur prend l'écran, la feuille l'attend. */
        <div className="fixed inset-0 z-[110] bg-[var(--tk-color-inverse-surface)]">
            <ScanView
                mode="simple"
                onClose={onClose}
                tip={tip}
                hit={hit}
                acceptLabel={acceptLabel}
                onAccept={(lecture) => {
                    const trouve = trouver(lecture.code);
                    onClose();
                    if (trouve) onPick(trouve.id);
                }}
                onRetry={() => setHit(null)}
                onLecture={lire}
                reconnaitre={(code) => codeProche(eligibles, code)}
                onManualSubmit={lire}
            />
        </div>
    );
};

export default ActScanOverlay;
