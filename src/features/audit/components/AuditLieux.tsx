import React from 'react';
import { DoorOpen, MapPin } from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import ScreenState from '../../../components/ui/ScreenState';
import { buildRowKey, PlaceAuditRow } from '../placeAudit';
import type { ChoixDuLieu } from './AuditOverview';
import RangeeDeLieu from './RangeeDeLieu';

interface AuditLieuxProps {
    pays: string;
    /** Les sites du pays, ou les locaux du site ouvert — ce que le panneau montrait en part. */
    choix: ChoixDuLieu | null;
    onBack?: () => void;
    onOpenPlace: (row: PlaceAuditRow) => void;
    onStartPlace: (row: PlaceAuditRow) => void;
}

/**
 * **Tous les lieux d'un choix** (09/10) — `/audit/lieux/<pays>` et
 * `/audit/lieux/<pays>/<site>`.
 *
 * Au bureau, le panneau de l'inventaire montre les sites d'un pays, puis les locaux d'un
 * site. Sa carte défilait dans sa hauteur ; elle montre désormais ce qui tient et renvoie
 * ici pour le reste, comme la fiche d'un site renvoie à la page de ses locaux. Les rangées
 * sont les mêmes, et mènent au même endroit : un site à ses locaux, un local à sa campagne.
 */
const AuditLieux: React.FC<AuditLieuxProps> = ({
    pays,
    choix,
    onBack,
    onOpenPlace,
    onStartPlace,
}) => {
    const rangees = choix ? (choix.site ? choix.locaux : choix.sites) : [];

    if (!choix || (!choix.site && choix.sites.length === 0)) {
        return (
            <ScreenState
                icon={MapPin}
                title="Aucun lieu à compter"
                description={`« ${pays} » n'a aucun site au statut retenu.`}
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir à l’inventaire
                    </Button>
                }
            />
        );
    }

    const compte = choix.site
        ? `${choix.locauxComptes} ${choix.locauxComptes > 1 ? 'locaux' : 'local'}`
        : `${choix.sites.length} site${choix.sites.length > 1 ? 's' : ''}`;

    return (
        <DetailTemplate code={choix.site ? 'Locaux' : 'Sites'} onBack={onBack}>
            <section className="rounded-card bg-surface px-4 py-1">
                <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                        {choix.site ?? choix.pays}
                    </h3>
                    <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                        {compte} · {choix.totaux.expected} attendu
                        {choix.totaux.expected > 1 ? 's' : ''}
                    </span>
                </div>
                {rangees.length > 0 ? (
                    rangees.map((row, index) => (
                        <RangeeDeLieu
                            key={buildRowKey(row)}
                            row={row}
                            index={index}
                            niveau={choix.site ? 'local' : 'site'}
                            onOuvrir={onOpenPlace}
                            onLancer={onStartPlace}
                        />
                    ))
                ) : (
                    <CardEmptyState
                        glyph={DoorOpen}
                        title="Aucun local dans ce site"
                        description="Il se compte d'un seul tenant."
                    />
                )}
            </section>
        </DetailTemplate>
    );
};

export default AuditLieux;
