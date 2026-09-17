import React, { useMemo, useState } from 'react';
import {
    CaretRight,
    DoorOpen,
    DotsThreeVertical,
    Hourglass,
    Info,
    MapPin,
    Plus,
} from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import ListRow from '../../../components/ui/ListRow';
import Modal from '../../../components/ui/Modal';
import ScreenState from '../../../components/ui/ScreenState';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import { ViewType } from '../../../types';
import { countryCodeOf } from '../lib/siteCode';
import Menu from '../../../components/ui/Menu';

interface SiteDetailsPageProps {
    siteName: string;
    onBack: () => void;
    onViewChange: (view: ViewType) => void;
    /** Ouvre une liste **avec le site pour périmètre** — le renvoi des trois `.hk`. */
    onNavigate: (path: string) => void;
}

/**
 * **La fiche d'un site — un héro qui renvoie** (planche 10.1, **passe sobre du
 * 03/09**, colonnes « Vue — la fiche d'un site » et « État — un site qui n'a jamais
 * servi »).
 *
 * *« Fil d'Ariane dans la barre, le site en héro avec ses trois nombres qui renvoient
 * (Actifs, Équipe, Inventaire filtrés), jamais une liste recopiée. Le correspondant
 * est ce qui manque. »*
 *
 * ## Ce que la passe sobre change, et pourquoi la planche le veut
 *
 * - **La fiche gagne un héro sombre.** Le porte-voix clair de la planche d'août — le
 *   nom du site posé dans la page, glyphe à gauche — disparaît. À sa place, la seule
 *   zone inversée de l'écran : l'étiquette « pays · code » en capitales à 12 px, le
 *   nom à 28 px, la phrase du site à 14 px, les nombres, le geste.
 * - **Les trois renvois entrent dans le héro**, en trois cases `.hk` — 22 px Archivo
 *   pour le nombre, 12 px pour son mot, un chevron. La carte « Ce que le site
 *   contient » et ses trois rangées disparaissent avec eux : *une information est
 *   soit dans le voile, soit dans une carte, jamais dans les deux.*
 * - **Ce ne sont pas les tuiles teintées de 04.2 / 05.2.** Ces deux planches-là
 *   sortent les chiffres du héro ; 10.1 les y garde, en cases translucides, parce
 *   qu'ici le chiffre **est un renvoi** et que le renvoi appartient au sujet. La
 *   planche de la page l'emporte sur la convention des voisines.
 * - **« Utilisateurs » devient « personnes », « dernière campagne d'audit » devient
 *   « inventaire ».** Ce sont les mots de la planche.
 * - **La carte de référence s'appelle « Référence »** et ses rangées perdent leur
 *   sous-ligne explicative : « Code pays », « Correspondant », « Dernier
 *   inventaire », chacune avec sa valeur à droite, en gris quand elle manque.
 * - **La carte « Services présents » disparaît.** *« Le service n'est pas un lieu, il
 *   reste un attribut de la personne. »* Le produit le rangeait ici ; l'arbre ne
 *   garde que la géographie.
 * - **« Modifier le site » remonte dans le héro** et la carte « Ce que les actes
 *   engagent » tombe avec le reste.
 * - **Aucune note dans l'écran** (R15). Les trois paragraphes qui plaidaient — les
 *   renvois plutôt que les listes, le service qui n'ouvre rien, le local facultatif —
 *   sont partis. Le seul texte qui reste est un fait : sur un site jamais servi, ce
 *   que « fermer » veut dire.
 *
 * ## Les écarts que ce portage ne peut pas lever seul
 *
 * - La barre porte un **menu ⋮** dans la planche ; rien n'y est dessiné, et le seul
 *   geste de la fiche est déjà dans le héro. Il n'est donc pas posé.
 * - Le héro de 10.1 n'est pas exprimable par `DetailHero` : ses qualifiants sont
 *   **cliquables** et vivent dans la bande, quand 04.2 les en a justement sortis. Il
 *   est donc dessiné ici, aux mesures de la planche.
 */
const SiteDetailsPage: React.FC<SiteDetailsPageProps> = ({
    siteName,
    onBack,
    onViewChange,
    onNavigate,
}) => {
    const { locationData, equipment, users, addLocation, renameLocation, deleteLocation } =
        useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState(siteName);
    const [isAddLocalOpen, setIsAddLocalOpen] = useState(false);
    const [localName, setLocalName] = useState('');

    const country = useMemo(
        () =>
            Object.entries(locationData.sites).find(([, siteNames]) =>
                (siteNames as string[]).includes(siteName),
            )?.[0],
        [locationData.sites, siteName],
    );

    const siteEquipment = useMemo(
        () => equipment.filter((item) => item.site === siteName),
        [equipment, siteName],
    );
    const siteUsers = useMemo(
        () => users.filter((user) => user.site === siteName),
        [users, siteName],
    );
    const locals = useMemo(
        () => (locationData.locals[siteName] || []) as string[],
        [locationData.locals, siteName],
    );

    /* Le code que porte l'étiquette du héro et la rangée « Code pays » : celui du
       **pays**, relevé sur les identifiants d'actifs. La planche d'août le lisait
       comme un code de site ; la passe sobre le remonte d'un cran. */
    const countryCode = useMemo(() => {
        if (!country) return undefined;
        const countrySites = new Set((locationData.sites[country] || []) as string[]);
        return countryCodeOf(
            equipment.filter((item) => Boolean(item.site) && countrySites.has(item.site as string)),
        );
    }, [country, locationData.sites, equipment]);

    const neverServed = siteEquipment.length === 0 && siteUsers.length === 0;

    if (!country) {
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

    const submitRename = () => {
        const next = renameValue.trim();
        if (!next || next === siteName) {
            setIsRenameOpen(false);
            return;
        }
        if (!renameLocation('site', siteName, next, country)) {
            showToast(`« ${next} » existe déjà dans ${country}.`, 'error');
            return;
        }
        showToast(`Site renommé « ${next} ».`, 'success');
        setIsRenameOpen(false);
        onBack();
    };

    const submitLocal = () => {
        const next = localName.trim();
        if (!next) return;
        if (!addLocation('local', next, siteName)) {
            showToast(`« ${next} » existe déjà dans ce site.`, 'error');
            return;
        }
        showToast(`Local « ${next} » ajouté.`, 'success');
        setLocalName('');
        setIsAddLocalOpen(false);
    };

    /**
     * **Fermer un site vide n'efface rien** — il sort des sélecteurs, son nom reste
     * dans l'historique. C'est le seul cas où la suppression ne laisse aucun actif sans
     * lieu, et c'est pourquoi le geste n'existe que sur un site qui n'a jamais servi.
     */
    const closeSite = () => {
        if (locals.length > 0) {
            showToast('Fermeture refusée : un local y est rattaché.', 'error');
            return;
        }
        requestConfirmation({
            title: `Fermer « ${siteName} » ?`,
            message:
                "Il sort des sélecteurs d'emplacement. Son nom reste dans l'historique, et aucun actif ne perd son lieu — il n'y en a aucun.",
            confirmText: 'Fermer le site',
            tone: 'destructive',
            onConfirm: () => {
                deleteLocation('site', siteName, country);
                showToast(`« ${siteName} » fermé.`, 'success');
                onBack();
            },
        });
    };

    /** `.hk` — un nombre, son mot, un chevron. Le nombre **est** le renvoi. */
    const relays: { key: string; value: React.ReactNode; label: string; onOpen: () => void }[] = [
        {
            key: 'assets',
            value: siteEquipment.length,
            label: 'actifs',
            onOpen: () => onNavigate(`/inventory/site/${encodeURIComponent(siteName)}`),
        },
        {
            key: 'people',
            value: siteUsers.length,
            label: 'personnes',
            onOpen: () => onNavigate(`/users/site/${encodeURIComponent(siteName)}`),
        },
        {
            key: 'audit',
            value: '—',
            label: 'inventaire',
            onOpen: () => onViewChange('audit'),
        },
    ];

    /**
     * Le héro de 10.1 — `.hero`, 22/20/20 de padding, la bande sombre de l'écran.
     *
     * Il est dessiné ici et non par `DetailHero` : la planche y met des qualifiants
     * **cliquables**, quand la passe sobre du 02/09 les a justement sortis de la bande
     * sur 04.2 et 05.2. Les deux formes ne peuvent pas cohabiter dans un même
     * composant sans qu'on tranche laquelle des deux planches fait loi — un arbitrage
     * qui ne se prend pas depuis une page.
     */
    const hero = (
        <section className="bg-inverse-surface text-inverse-on-surface rounded-xl px-5 pt-[22px] pb-5">
            <span className="text-on-nav-surface-variant block text-[12px] leading-4 font-medium tracking-[0.07em] uppercase">
                {countryCode ? `${country} · ${countryCode}` : country}
            </span>
            <span className="font-brand text-inverse-on-surface mt-1 block text-[28px] leading-8 font-semibold tracking-[-0.02em] text-pretty">
                {siteName}
            </span>
            <span className="text-on-nav-surface-variant mt-0.5 block text-[14px] leading-5">
                {neverServed
                    ? 'Ouvert, jamais équipé.'
                    : "Une adresse : c'est elle qui décide si une remise demande un transport."}
            </span>

            {neverServed && (
                /* `.bst` — l'état du site vide, dit par un glyphe **et** un mot (I3). */
                <span className="mt-4 inline-flex h-7 items-center gap-2 rounded-[4px] bg-white/10 px-2.5 text-[12px] leading-4 font-medium">
                    <Icon
                        glyph={Hourglass}
                        size={18}
                        className="text-[var(--tk-color-live-ambre)]"
                    />
                    Aucun actif, aucune personne
                </span>
            )}

            {!neverServed && (
                <div className="mt-5 flex gap-3">
                    {relays.map((relay) => (
                        /* La case passe par la primitive `Button`, jamais par un contrôle
                           natif : `check-ds-compliance` les refuse hors de
                           `src/components/ui/**`, et il a raison — un état de survol, un
                           anneau de focus et une cible de 48 px ne se réécrivent pas page
                           par page. `layout="card"` lui rend la hauteur libre et
                           l'alignement à gauche que `.hk` demande. */
                        <Button
                            key={relay.key}
                            variant="text"
                            layout="card"
                            onClick={relay.onOpen}
                            className="text-inverse-on-surface flex min-h-0 min-w-0 flex-1 flex-col items-start gap-0 rounded-[4px] bg-white/[0.08] px-3.5 py-3 hover:bg-white/[0.14]"
                        >
                            <span className="font-brand block text-[22px] leading-7 font-semibold tracking-[-0.015em] tabular-nums">
                                {relay.value}
                            </span>
                            <span className="text-on-nav-surface-variant mt-0.5 flex items-center gap-0.5 overflow-hidden text-[12px] leading-4 font-normal whitespace-nowrap">
                                {relay.label}
                                <Icon glyph={CaretRight} size={18} className="shrink-0" />
                            </span>
                        </Button>
                    ))}
                </div>
            )}

            {/* `.hact` — un geste sur un site servi, deux sur un site vide. */}
            <div className={cn('mt-5 grid gap-3', neverServed ? 'grid-cols-2' : 'grid-cols-1')}>
                {neverServed ? (
                    <>
                        <Button
                            variant="filled"
                            className="h-12 min-h-12 rounded-[4px] text-[16px]"
                            icon={<Icon glyph={Plus} size={20} />}
                            onClick={() => onViewChange('add_equipment')}
                        >
                            Créer un actif
                        </Button>
                        <Button
                            variant="text"
                            className="text-inverse-on-surface h-12 min-h-12 rounded-[4px] bg-white/[0.12] text-[16px] hover:bg-white/20"
                            onClick={closeSite}
                        >
                            Fermer le site
                        </Button>
                    </>
                ) : null}
            </div>
        </section>
    );

    /** `.ch` — le titre d'une carte, 17/24 en graisse moyenne, et son décompte. */
    const cardHeader = (title: string, count?: React.ReactNode) => (
        <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
            <h3 className="text-on-surface min-w-0 truncate text-[17px] leading-6 font-medium">
                {title}
            </h3>
            {count !== undefined && (
                <span className="text-text-secondary shrink-0 text-[14px] leading-5 tabular-nums">
                    {count}
                </span>
            )}
        </div>
    );

    /** `.rrow` — étiquette à gauche, valeur à droite, et un filet au-dessus. */
    /* `.rrow` de 10.1 — une valeur qui manque (`.v.q` : « à désigner », « jamais ») se lit en
       encre tertiaire ; elle tenait l'encre secondaire, celle de la clé (relevé du 13/09). */
    const referenceRow = (label: string, value: React.ReactNode, missing = false) => (
        <div className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6">
            <span className="text-text-secondary min-w-0 truncate">{label}</span>
            <span
                className={cn(
                    'shrink-0 text-right whitespace-nowrap',
                    missing ? 'text-text-tertiary' : 'text-on-surface',
                )}
            >
                {value}
            </span>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isRenameOpen}
                onClose={() => setIsRenameOpen(false)}
                title="Modifier le site"
                footer={
                    <>
                        <Button variant="outlined" onClick={() => setIsRenameOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitRename}>
                            Enregistrer
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Nom du site"
                    name="site-name"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    supportingText="Renommer un site est sans effet sur les actifs qui y sont localisés."
                    required
                />
            </Modal>

            <Modal
                isOpen={isAddLocalOpen}
                onClose={() => setIsAddLocalOpen(false)}
                title="Ajouter un local"
                footer={
                    <>
                        <Button variant="outlined" onClick={() => setIsAddLocalOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitLocal}>
                            Ajouter
                        </Button>
                    </>
                }
            >
                <InputField
                    label="Nom du local"
                    name="local-name"
                    value={localName}
                    onChange={(event) => setLocalName(event.target.value)}
                    supportingText={`Une salle dans ${siteName}.`}
                    required
                />
            </Modal>

            <DetailTemplate
                /* **Le nom commun, comme les trois autres fiches.** La barre portait un
                   fil d'Ariane en 14 sur 20 — « Emplacements › Togo › Lomé Siège » —, une
                   quatrième taille de caractère pour la même barre que Type (17/24),
                   Modèle (17/24) et Demande (17/24), et trois faits que le héro écrit
                   déjà juste dessous. `.tid .code` de 17.8 est **une ligne, Archivo 600,
                   17 sur 24**. */
                code="Site"
                onBack={onBack}
                /* Les deux actes du site descendent au ⋮, comme sur le type et le modèle :
                   ils vivaient dans le héro, où le geste primaire est déjà pris. */
                menu={
                    <Menu
                        align="end"
                        items={[
                            {
                                id: 'rename',
                                label: 'Modifier le site',
                                description: 'son nom ; les actifs gardent leur lieu',
                                onSelect: () => {
                                    setRenameValue(siteName);
                                    setIsRenameOpen(true);
                                },
                            },
                            {
                                id: 'close',
                                label: 'Fermer le site',
                                description:
                                    locals.length > 0
                                        ? `${locals.length} ${locals.length > 1 ? 'locaux' : 'local'} y ${locals.length > 1 ? 'sont' : 'est'} rattaché${locals.length > 1 ? 's' : ''}`
                                        : "il sort des sélecteurs d'emplacement",
                                destructive: true,
                                dividerBefore: true,
                                onSelect: closeSite,
                            },
                        ]}
                        trigger={
                            <Button
                                variant="text"
                                iconOnly
                                aria-label="Actes du site"
                                className="text-on-surface hover:bg-surface-container rounded-md"
                            >
                                <Icon glyph={DotsThreeVertical} size={20} />
                            </Button>
                        }
                    />
                }
                hero={hero}
            >
                {/* RÉFÉRENCE — ce que le site est, et ce qui lui manque. */}
                <section className="rounded-card bg-surface px-4 py-1">
                    {cardHeader('Référence')}
                    {referenceRow('Code pays', countryCode || 'à relever', !countryCode)}
                    {referenceRow('Correspondant', 'à désigner', true)}
                    {!neverServed && referenceRow('Dernier inventaire', 'jamais', true)}
                </section>

                {/* LES LOCAUX — le quatrième niveau, facultatif, et le seul endroit du
                    produit où ils se tiennent : la liste de 10.1 ne les porte plus.

                    La carte **ne paraît pas sur un site vide qui n'a aucun local** : la
                    planche ne la dessine pas sur la colonne de Kara, et une carte vide
                    n'aurait à offrir que la phrase « aucun local déclaré » — exactement
                    la note que R15 retire. Le geste ne se perd pas pour autant : la
                    feuille du FAB de 10.1 ouvre « Un local » et fait choisir son site. */}
                {(!neverServed || locals.length > 0) && (
                    <section className="rounded-card bg-surface px-4 py-1">
                        {cardHeader('Locaux', locals.length)}
                        {locals.length > 0 && (
                            <div className="border-outline-variant border-t">
                                {locals.map((local) => {
                                    /* `item.service` n'existe pas sur `Equipment` : le
                                       compte valait **0 sur tous les locaux**. Le champ
                                       est `local` — le même que 16.1 compte. */
                                    const localAssets = siteEquipment.filter(
                                        (item) => item.local === local,
                                    ).length;
                                    return (
                                        <ListRow
                                            key={local}
                                            vignette={<Icon glyph={DoorOpen} size={20} />}
                                            title={local}
                                            holder={`${localAssets} actif${localAssets > 1 ? 's' : ''}`}
                                            onOpen={() => {
                                                requestConfirmation({
                                                    title: `Supprimer le local « ${local} » ?`,
                                                    message:
                                                        'Le local disparaît du site. Les actifs qui le portaient restent localisés sur le site.',
                                                    confirmText: 'Supprimer le local',
                                                    tone: 'destructive',
                                                    onConfirm: () => {
                                                        deleteLocation('local', local, siteName);
                                                        showToast(
                                                            `Local « ${local} » supprimé.`,
                                                            'success',
                                                        );
                                                    },
                                                });
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {/* `.more` — 48 px, un filet au-dessus, centré. */}
                        <Button
                            variant="text"
                            onClick={() => setIsAddLocalOpen(true)}
                            className="border-outline-variant text-on-surface flex min-h-12 w-full items-center justify-center gap-2 rounded-none border-t text-[15px] font-medium"
                        >
                            <Icon glyph={Plus} size={18} className="text-text-secondary" />
                            Ajouter un local
                        </Button>
                    </section>
                )}

                {neverServed && (
                    /* `.warn` — **hors carte**, sur fond de surface : ce que « fermer »
                       veut dire. C'est le seul texte que la passe sobre garde ici, parce
                       que c'est un fait sur un acte, pas une leçon sur l'écran. */
                    <div className="bg-surface text-text-secondary flex gap-3 rounded-[4px] px-4 py-3 text-[14px] leading-5">
                        <Icon glyph={Info} size={18} className="mt-px shrink-0" />
                        <span>
                            Fermer un site vide le retire des sélecteurs ; son nom reste dans
                            l'historique.
                        </span>
                    </div>
                )}
            </DetailTemplate>
        </>
    );
};

export default SiteDetailsPage;
