import React, { Suspense, useMemo } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import CardEmptyState from '../ui/CardEmptyState';
import { SkeletonDetail } from '../ui/Skeleton';
import { FicheEnPanneauContext } from '../../hooks/useFicheEnPanneau';

interface PanneauDeFicheProps {
    /** La fiche de l'objet ouvert — absente, le panneau invite à en choisir un. */
    children?: React.ReactNode;
    /** Ouvrir l'objet en pleine page, par son adresse propre. */
    onPleinePage?: () => void;
    /** Le panneau sans objet : il tient la colonne et dit quoi faire. */
    vide: { glyph: PhosphorGlyph; title: string; description: string };
    /** L'objet ouvert : quand il change, la nouvelle fiche arrive en fondu (26/09). */
    cle?: string | null;
}

/**
 * **Le second panneau d'une liste d'objets** (P2a, 25/09) — la fiche de l'objet touché,
 * ou l'invitation à en toucher un.
 *
 * La fiche est **la page elle-même** (`EquipmentDetailsPage`, `UserDetailsPage`…), rendue
 * sous `FicheEnPanneauContext` : `DetailTemplate` y pose un en-tête sans retour et une
 * seule colonne, le héro ses chiffres en ligne. Les mêmes cartes, les mêmes gestes : un
 * acte engagé depuis le panneau est l'acte de la fiche. Vide, le panneau tient la colonne
 * comme celui de Tâches — une vignette de 110 px à côté d'une liste se lisait comme un
 * oubli.
 */
const PanneauDeFiche: React.FC<PanneauDeFicheProps> = ({ children, onPleinePage, vide, cle }) => {
    const contexte = useMemo(() => ({ onPleinePage }), [onPleinePage]);

    if (!children) {
        return (
            <div className="bg-surface flex h-full flex-col rounded-xl">
                <CardEmptyState
                    glyph={vide.glyph}
                    title={vide.title}
                    description={vide.description}
                />
            </div>
        );
    }

    return (
        <FicheEnPanneauContext.Provider value={contexte}>
            {/* Une fiche en remplace une autre à la même place : elle arrive en fondu et de
                6 px (`mvt-contenu`), sans que la liste bouge. */}
            <div key={cle ?? undefined} className="mvt-contenu flex min-h-0 flex-1 flex-col">
                <Suspense fallback={<SkeletonDetail />}>{children}</Suspense>
            </div>
        </FicheEnPanneauContext.Provider>
    );
};

export default PanneauDeFiche;
