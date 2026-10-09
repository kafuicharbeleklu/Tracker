import React, { useMemo, useState } from 'react';
import { DoorOpen, DotsThreeVertical, Hourglass, Plus } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import Menu from '../../../components/ui/Menu';
import { PiedDeCarte, ToutVoir } from '../../../components/ui/ToutVoir';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { JAUGE_RANGEE } from '../../../lib/jauge';
import { cn } from '../../../lib/utils';

/**
 * **Les locaux d'un site** (08/10) — ce que la fiche du site en montre, et la page qui les
 * porte tous (`/locations/site/<site>/locaux`).
 *
 * La carte « Locaux » défilait dans sa hauteur (`ListeBornee`) : neuf locaux, une liste dans
 * la liste. Elle montre désormais les plus fournis et renvoie au reste, comme « Derniers
 * événements » à l'accueil renvoie à l'historique. Les deux écrans lisent les mêmes rangées et
 * les mêmes gestes d'ici.
 */

export interface RangeeDeLocal {
    /** `null` — la rangée des actifs du site qu'aucun local ne porte. */
    local: string | null;
    count: number;
    /** Sa part des actifs du site, en %. */
    part: number;
}

/** Combien la fiche du site en montre avant de renvoyer à la page des locaux. */
export const LOCAUX_SUR_LA_FICHE = 4;
/** Au bureau, en tuiles : deux rangs de trois, la tuile d'ajout comprise. */
export const TUILES_SUR_LA_FICHE = 5;

export const useLocauxDuSite = (siteName: string) => {
    const { locationData, equipment, deleteLocation } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const locals = useMemo(
        () => (locationData.locals[siteName] || []) as string[],
        [locationData.locals, siteName],
    );
    const siteEquipment = useMemo(
        () => equipment.filter((item) => item.site === siteName),
        [equipment, siteName],
    );
    /** Les actifs du site qu'aucun local ne porte. */
    const sansLocal = useMemo(
        () => siteEquipment.filter((item) => !item.local || !locals.includes(item.local)).length,
        [siteEquipment, locals],
    );

    /* Les plus fournis d'abord — la fiche en montre le haut ; la rangée « Sans local »
       ferme la liste. */
    const rangees = useMemo<RangeeDeLocal[]>(() => {
        const part = (count: number) =>
            siteEquipment.length > 0 ? Math.round((count / siteEquipment.length) * 100) : 0;
        const deLocaux = locals
            .map((local) => {
                const count = siteEquipment.filter((item) => item.local === local).length;
                return { local, count, part: part(count) };
            })
            .sort((a, b) => b.count - a.count || a.local.localeCompare(b.local, 'fr'));
        return sansLocal > 0
            ? [...deLocaux, { local: null, count: sansLocal, part: part(sansLocal) }]
            : deLocaux;
    }, [locals, siteEquipment, sansLocal]);

    const supprimerLocal = (local: string) =>
        requestConfirmation({
            title: `Supprimer le local « ${local} » ?`,
            message:
                'Le local disparaît du site. Les actifs qui le portaient restent localisés sur le site.',
            confirmText: 'Supprimer le local',
            tone: 'destructive',
            onConfirm: () => {
                deleteLocation('local', local, siteName);
                showToast(`Local « ${local} » supprimé.`, 'success');
            },
        });

    return { locals, siteEquipment, sansLocal, rangees, supprimerLocal };
};

/**
 * **Le local, sa part du parc, et son ⋮** (24/09). La rangée ouvre **ses** actifs — elle
 * ouvrait ceux du site entier, jusqu'au 09/10 ;
 * supprimer passe au ⋮, nommé. Un ruban dit la part du parc que porte le local, et la
 * dernière rangée ce qui n'est rangé nulle part. `item.local` est le champ que 16.1 compte.
 */
export const RangeesDeLocaux: React.FC<{
    rangees: readonly RangeeDeLocal[];
    /** Ouvrir les actifs de la rangée : son local, ou `null` pour ce qui n'est rangé nulle part. */
    onOuvrir: (local: string | null) => void;
    onSupprimer: (local: string) => void;
}> = ({ rangees, onOuvrir, onSupprimer }) => (
    <ul className="border-outline-variant border-t">
        {rangees.map(({ local, count, part }) => (
            /* **La surbrillance d'un bord à l'autre** (09/10) : la rangée partait du bord gauche
               de la carte et s'arrêtait avant le ⋮ — un éclairage bancal. Elle couvre désormais
               toute la largeur ; le ⋮ se pose dessus, à droite, et la rangée lui garde sa place
               (`pr-12`). Les comptes s'alignent du même coup : la rangée « Sans local » les
               décalait de 8. */
            <li
                key={local ?? '—'}
                className="border-outline-variant relative flex items-center border-t first:border-t-0"
            >
                <Button
                    variant="text"
                    layout="card"
                    onClick={() => onOuvrir(local)}
                    className="-mx-4 flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-none py-3 pr-12 pl-4 text-left font-normal"
                >
                    <span
                        className={cn(
                            'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center',
                            local
                                ? 'bg-surface-container text-on-surface-variant'
                                : 'bg-tint-ambre text-on-tint-ambre',
                        )}
                    >
                        <Icon glyph={local ? DoorOpen : Hourglass} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                            <span className="text-on-surface text-ts-body leading-ts-body min-w-0 truncate">
                                {local ?? 'Sans local'}
                            </span>
                            <span className="text-on-surface-variant text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                {count} actif{count > 1 ? 's' : ''}
                            </span>
                        </span>
                        <span
                            className={cn(
                                'bg-surface-container mt-2 block overflow-hidden',
                                JAUGE_RANGEE,
                            )}
                        >
                            <span
                                className={cn(
                                    'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                    'block h-full',
                                    local
                                        ? 'bg-on-surface-variant'
                                        : 'bg-[var(--tk-color-st-ambre)]',
                                )}
                                style={{ width: `${part}%` }}
                            />
                        </span>
                    </span>
                </Button>
                {local && (
                    <span className="absolute top-1/2 -right-3 -translate-y-1/2">
                        <Menu
                            align="end"
                            floating
                            title={local}
                            items={[
                                {
                                    id: 'supprimer',
                                    label: 'Supprimer le local',
                                    description:
                                        count > 0 ? 'ses actifs restent sur le site' : undefined,
                                    destructive: true,
                                    onSelect: () => onSupprimer(local),
                                },
                            ]}
                            trigger={
                                <Button variant="text" iconOnly aria-label={`Actes sur ${local}`}>
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    </span>
                )}
            </li>
        ))}
    </ul>
);

/**
 * **Au bureau, les locaux en tuiles** (23/09) — trois de front : le nom, ce qu'il porte, et
 * son ⋮ ; la première tuile ajoute.
 */
export const TuilesDeLocaux: React.FC<{
    rangees: readonly RangeeDeLocal[];
    onAjouter: () => void;
    onSupprimer: (local: string) => void;
}> = ({ rangees, onAjouter, onSupprimer }) => (
    <ul className="grid grid-cols-3 gap-3">
        <li>
            <Button
                variant="text"
                onClick={onAjouter}
                className="border-outline-variant text-on-surface text-ts-control h-full min-h-24 w-full flex-col gap-1.5 rounded-md border border-dashed font-medium"
            >
                <Icon glyph={Plus} size={20} className="text-text-secondary" />
                Ajouter un local
            </Button>
        </li>
        {rangees.map(({ local, count }) =>
            local ? (
                <li
                    key={local}
                    className="bg-surface-container relative flex min-h-24 flex-col justify-between rounded-md p-3"
                >
                    <span className="flex items-start gap-2 pr-8">
                        <Icon
                            glyph={DoorOpen}
                            size={20}
                            className="text-on-surface-variant mt-0.5 shrink-0"
                        />
                        <span className="text-on-surface text-ts-body leading-ts-body min-w-0 truncate">
                            {local}
                        </span>
                    </span>
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                        {count} actif{count > 1 ? 's' : ''}
                    </span>
                    <span className="absolute top-1.5 right-1.5">
                        <Menu
                            align="end"
                            floating
                            title={local}
                            items={[
                                {
                                    id: 'supprimer',
                                    label: 'Supprimer le local',
                                    onSelect: () => onSupprimer(local),
                                },
                            ]}
                            trigger={
                                <Button
                                    variant="text"
                                    iconOnly
                                    size="sm"
                                    aria-label={`Actes sur ${local}`}
                                >
                                    <Icon glyph={DotsThreeVertical} size={20} />
                                </Button>
                            }
                        />
                    </span>
                </li>
            ) : null,
        )}
    </ul>
);

/**
 * **Le pied de la carte** — `.more` : 48 px, un filet au-dessus. Ajouter, et, quand la carte
 * n'en montre qu'une partie, « Tous les locaux » vers leur page.
 */
export const PiedDesLocaux: React.FC<{
    onAjouter?: () => void;
    total: number;
    onTous?: () => void;
}> = ({ onAjouter, total, onTous }) => (
    <PiedDeCarte>
        {onAjouter && (
            <Button
                variant="text"
                onClick={onAjouter}
                className="text-on-surface text-ts-control -ml-2 min-h-12 gap-2 px-2 font-medium"
            >
                <Icon glyph={Plus} size={20} className="text-text-secondary" />
                Ajouter un local
            </Button>
        )}
        {onTous && <ToutVoir libelle="Tous les locaux" total={total} onOuvrir={onTous} />}
    </PiedDeCarte>
);

/** La feuille « Ajouter un local » — un champ, deux gestes (17.x, 00.5). */
export const FeuilleAjoutLocal: React.FC<{
    siteName: string;
    open: boolean;
    onClose: () => void;
}> = ({ siteName, open, onClose }) => {
    const { addLocation } = useData();
    const { showToast } = useToast();
    const [nom, setNom] = useState('');

    const ajouter = () => {
        const next = nom.trim();
        if (!next) return;
        if (!addLocation('local', next, siteName)) {
            showToast(`« ${next} » existe déjà dans ce site.`, 'error');
            return;
        }
        showToast(`Local « ${next} » ajouté.`, 'success');
        setNom('');
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={onClose} title="Ajouter un local">
            <div className="flex flex-col gap-4">
                <InputField
                    label="Nom du local"
                    name="local-name"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                    supportingText={`Une salle dans ${siteName}.`}
                    required
                />
                <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="ghost" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={ajouter}>
                        Ajouter
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};
