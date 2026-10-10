import React, { useState } from 'react';
import { DoorOpen, MapPin } from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ScreenState from '../../../components/ui/ScreenState';
import { useData } from '../../../context/DataContext';
import ListActionFab from '../../../components/ui/ListActionFab';
import { FeuilleAjoutLocal, RangeesDeLocaux, useLocauxDuSite } from '../components/LocauxDuSite';
import { adresseDuLocal } from '../../../lib/perimetreDuParc';

interface SiteLocauxPageProps {
    siteName: string;
    onBack: () => void;
    onNavigate: (path: string) => void;
}

/**
 * **Les locaux d'un site, tous** (08/10) — `/locations/site/<site>/locaux`.
 *
 * La fiche du site en montre les plus fournis et renvoie ici pour le reste, comme la carte
 * « Derniers événements » de l'accueil renvoie à l'historique : la carte ne défile plus dans
 * sa hauteur. Ici, chaque local, sa part des actifs du site, son ⋮, et la rangée de ce
 * qu'aucun local ne porte.
 */
const SiteLocauxPage: React.FC<SiteLocauxPageProps> = ({ siteName, onBack, onNavigate }) => {
    const { locationData } = useData();
    const { locals, siteEquipment, rangees, supprimerLocal } = useLocauxDuSite(siteName);
    const [ajoutOuvert, setAjoutOuvert] = useState(false);

    const existe = Object.values(locationData.sites).some((sites) =>
        (sites as string[]).includes(siteName),
    );
    if (!existe) {
        return (
            <ScreenState
                icon={MapPin}
                title="Site introuvable"
                description="Ce site n'existe plus dans le référentiel géographique."
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir aux emplacements
                    </Button>
                }
            />
        );
    }

    return (
        <>
            <FeuilleAjoutLocal
                siteName={siteName}
                open={ajoutOuvert}
                onClose={() => setAjoutOuvert(false)}
            />
            <DetailTemplate
                code="Locaux"
                onBack={onBack}
                /* L'acte d'ajout est dans l'en-tête (10/10), plus au pied de la carte. */
                fab={
                    <ListActionFab
                        label="local"
                        actions={[
                            {
                                id: 'add-local',
                                label: 'Ajouter un local',
                                icon: 'add',
                                onSelect: () => setAjoutOuvert(true),
                            },
                        ]}
                    />
                }
            >
                <section className="rounded-card bg-surface px-4 py-1">
                    <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                        <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                            {siteName}
                        </h3>
                        <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                            {locals.length} {locals.length > 1 ? 'locaux' : 'local'} ·{' '}
                            {siteEquipment.length} actif{siteEquipment.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    {rangees.length > 0 ? (
                        <RangeesDeLocaux
                            rangees={rangees}
                            onOuvrir={(local) => onNavigate(adresseDuLocal(siteName, local))}
                            onSupprimer={supprimerLocal}
                        />
                    ) : (
                        <CardEmptyState
                            glyph={DoorOpen}
                            title="Aucun local"
                            description="Les actifs de ce site ne sont rangés dans aucune salle."
                        />
                    )}
                </section>
            </DetailTemplate>
        </>
    );
};

export default SiteLocauxPage;
