import React, { useMemo, useState } from 'react';
import {
    CaretRight,
    ClipboardText,
    DoorOpen,
    DotsThreeVertical,
    Hash,
    Hourglass,
    Info,
    Laptop,
    MapPin,
    Plus,
    UserCircle,
    UsersThree,
} from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import FactRow from '../../../components/ui/FactRow';
import { Consequences, FormNote } from '../../../components/ui/FormParts';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import ScreenState from '../../../components/ui/ScreenState';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../lib/utils';
import { ViewType } from '../../../types';
import { countryCodeOf } from '../lib/siteCode';
import Menu from '../../../components/ui/Menu';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';

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
    /* Les locaux en tuiles quand la fiche a ses deux colonnes (≥ 1280). */
    const enGrille = useMediaQuery(MEDIA.twoColumn);
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
    /** Les actifs du site qu'aucun local ne porte. */
    const sansLocal = siteEquipment.filter(
        (item) => !item.local || !locals.includes(item.local),
    ).length;

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
        /* La fiche suit le nouveau nom : l'adresse portait l'ancien. */
        onNavigate(`/locations/site/${encodeURIComponent(next)}`);
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
            {/* `.hero .ty` — 12 sur 16, capitales espacées de 0,07em, **sans graisse**,
                comme le sur-titre de `DetailHero` ; il portait 500. */}
            <span className="text-on-nav-surface-variant block text-[0.75rem] leading-4 tracking-[0.07em] uppercase">
                {countryCode ? `${country} · ${countryCode}` : country}
            </span>
            <span className="font-brand text-inverse-on-surface text-ts-page leading-ts-page mt-1 block font-semibold tracking-[-0.02em] text-pretty">
                {siteName}
            </span>
            <span className="text-on-nav-surface-variant text-ts-sub leading-ts-sub mt-0.5 block">
                {/* Un fait, pas une maxime (24/09) : la phrase disait à quoi sert une
                    adresse, la même sur tous les sites. */}
                {neverServed
                    ? 'Ouvert, jamais équipé.'
                    : [
                          locals.length === 0
                              ? 'aucun local'
                              : `${locals.length} ${locals.length > 1 ? 'locaux' : 'local'}`,
                          sansLocal > 0
                              ? `${sansLocal} actif${sansLocal > 1 ? 's' : ''} sans local`
                              : siteEquipment.length > 0 && locals.length > 0
                                ? 'chaque actif a son local'
                                : null,
                      ]
                          .filter(Boolean)
                          .join(' · ')
                          .replace(/^./, (c) => c.toUpperCase())}
            </span>

            {neverServed && (
                /* `.bst` — l'état du site vide, dit par un glyphe **et** un mot (I3). */
                <span className="mt-4 inline-flex h-7 items-center gap-2 rounded-[4px] bg-white/10 px-2.5 text-[0.75rem] leading-4 font-medium">
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
                            <span className="font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] tabular-nums">
                                {relay.value}
                            </span>
                            <span className="text-on-nav-surface-variant mt-0.5 flex items-center gap-0.5 overflow-hidden text-[0.75rem] leading-4 font-normal whitespace-nowrap">
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
                            className="text-ts-body h-12 min-h-12 rounded-[4px]"
                            icon={<Icon glyph={Plus} size={20} />}
                            onClick={() => onViewChange('add_equipment')}
                        >
                            Créer un actif
                        </Button>
                        <Button
                            variant="text"
                            className="text-inverse-on-surface text-ts-body h-12 min-h-12 rounded-[4px] bg-white/[0.12] hover:bg-white/20"
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
    /** Supprimer un local — confirmé, ses actifs restent localisés sur le site. */
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

    const cardHeader = (title: string, count?: React.ReactNode) => (
        <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
            <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 truncate font-medium">
                {title}
            </h3>
            {count !== undefined && (
                <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                    {count}
                </span>
            )}
        </div>
    );

    /** `.rrow` — étiquette à gauche, valeur à droite, et un filet au-dessus. */
    /* `.rrow` de 10.1 — une valeur qui manque (`.v.q` : « à désigner », « jamais ») se lit en
       encre tertiaire ; elle tenait l'encre secondaire, celle de la clé (relevé du 13/09). */
    return (
        <>
            {/* **Un acte court tient dans une feuille** (17.x, 00.5) : elle monte du bas
                au téléphone, se centre à 560 au-delà de 600, et son pied porte deux
                colonnes égales. Les deux actes tenaient dans un `Modal` — au téléphone,
                un écran entier pour un champ de texte. */}
            {/* **Renommer, et dire ce qui suit** (24/09). La feuille s'appelait « Modifier
                le site » pour un seul champ, et promettait « sans effet sur les actifs » —
                ce qui était vrai, et c'était le défaut : les actifs et les personnes
                gardaient l'ancien nom et sortaient du site. Le renommage les emporte
                désormais (`renameLocation`), et la feuille le dit avant le geste. */}
            <BottomSheet
                open={isRenameOpen}
                onClose={() => setIsRenameOpen(false)}
                title="Renommer le site"
                subtitle={countryCode ? `${country} · ${countryCode}` : country}
            >
                <div className="flex flex-col gap-4">
                    <InputField
                        label="Nom du site"
                        name="site-name"
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        error={
                            renameValue.trim() !== siteName &&
                            ((locationData.sites[country] || []) as string[]).includes(
                                renameValue.trim(),
                            )
                                ? `« ${renameValue.trim()} » existe déjà dans ${country}.`
                                : undefined
                        }
                        required
                        autoFocus
                    />
                    <Consequences
                        label="Ce qui suit le nouveau nom"
                        lines={[
                            {
                                glyph: Laptop,
                                tint: 'bleu',
                                content: `${siteEquipment.length} actif${siteEquipment.length > 1 ? 's' : ''}, qui restent sur ce site`,
                            },
                            {
                                glyph: UsersThree,
                                tint: 'bleu',
                                content: `${siteUsers.length} personne${siteUsers.length > 1 ? 's' : ''} rattachée${siteUsers.length > 1 ? 's' : ''} au site`,
                            },
                            {
                                glyph: DoorOpen,
                                tint: 'bleu',
                                content: `${locals.length} ${locals.length > 1 ? 'locaux' : 'local'}`,
                            },
                        ]}
                    />
                    <FormNote>L'historique garde l'ancien nom sur les faits passés.</FormNote>

                    {/* `.sfoot` — deux colonnes égales, filet au-dessus. */}
                    <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="filled"
                            onClick={submitRename}
                            disabled={!renameValue.trim() || renameValue.trim() === siteName}
                        >
                            Renommer
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            <BottomSheet
                open={isAddLocalOpen}
                onClose={() => setIsAddLocalOpen(false)}
                title="Ajouter un local"
            >
                <div className="flex flex-col gap-4">
                    <InputField
                        label="Nom du local"
                        name="local-name"
                        value={localName}
                        onChange={(event) => setLocalName(event.target.value)}
                        supportingText={`Une salle dans ${siteName}.`}
                        required
                    />

                    <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={() => setIsAddLocalOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitLocal}>
                            Ajouter
                        </Button>
                    </div>
                </div>
            </BottomSheet>

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
                                label: 'Renommer le site',
                                description: 'actifs, personnes et locaux suivent',
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
                                <Icon glyph={DotsThreeVertical} size="geste" />
                            </Button>
                        }
                    />
                }
                hero={hero}
            >
                {/* LES LOCAUX — le quatrième niveau, facultatif, et le seul endroit du
                    produit où ils se tiennent : la liste de 10.1 ne les porte plus.

                    La carte **ne paraît pas sur un site vide qui n'a aucun local** : la
                    planche ne la dessine pas sur la colonne de Kara, et une carte vide
                    n'aurait à offrir que la phrase « aucun local déclaré » — exactement
                    la note que R15 retire. Le geste ne se perd pas pour autant : la
                    feuille du FAB de 10.1 ouvre « Un local » et fait choisir son site. */}
                {(!neverServed || locals.length > 0) && enGrille ? (
                    /*
                      **Au bureau, les locaux en grille** (23/09 : « Locaux est trop long »).
                      Neuf locaux faisaient neuf rangées de 64 sous le héro — 600 px pour
                      lire des noms et des comptes. Ils deviennent des tuiles de trois de
                      front : le nom, ce qu'il porte, et son ⋮ ; la dernière tuile ajoute.
                      Le geste de la rangée était « supprimer » : un clic sur un local
                      ouvrait une confirmation de suppression. Il passe au ⋮, nommé.
                    */
                    <section data-colonne="gauche" className="rounded-card bg-surface px-4 pb-4">
                        {cardHeader('Locaux', locals.length)}
                        <ul className="mt-1 grid grid-cols-3 gap-3">
                            {locals.map((local) => {
                                const localAssets = siteEquipment.filter(
                                    (item) => item.local === local,
                                ).length;
                                return (
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
                                            {localAssets} actif{localAssets > 1 ? 's' : ''}
                                        </span>
                                        <span className="absolute top-1.5 right-1.5">
                                            <Menu
                                                align="end"
                                                title={local}
                                                items={[
                                                    {
                                                        id: 'supprimer',
                                                        label: 'Supprimer le local',
                                                        onSelect: () => supprimerLocal(local),
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
                                );
                            })}
                            <li>
                                <Button
                                    variant="text"
                                    onClick={() => setIsAddLocalOpen(true)}
                                    className="border-outline-variant text-on-surface text-ts-control h-full min-h-24 w-full flex-col gap-1.5 rounded-md border border-dashed font-medium"
                                >
                                    <Icon glyph={Plus} size={20} className="text-text-secondary" />
                                    Ajouter un local
                                </Button>
                            </li>
                        </ul>
                    </section>
                ) : (
                    (!neverServed || locals.length > 0) && (
                        <section
                            data-colonne="gauche"
                            className="rounded-card bg-surface px-4 py-1"
                        >
                            {cardHeader('Locaux', locals.length)}
                            {(locals.length > 0 || sansLocal > 0) && (
                                /* **Le local, sa part du parc, et son ⋮** (24/09). La rangée
                                   ouvrait, au toucher, la confirmation de suppression : le geste
                                   le plus naturel sur une liste menait à l'acte le plus rare.
                                   Elle ouvre à présent les actifs du site ; supprimer passe au
                                   ⋮, nommé. Un ruban dit la part du parc que porte le local, et
                                   une dernière rangée ce qui n'est rangé nulle part. `item.local`
                                   est le champ que 16.1 compte (`item.service` n'existe pas). */
                                <ul className="border-outline-variant border-t">
                                    {[
                                        ...locals.map((local) => ({
                                            local,
                                            count: siteEquipment.filter(
                                                (item) => item.local === local,
                                            ).length,
                                        })),
                                        ...(sansLocal > 0
                                            ? [{ local: null, count: sansLocal }]
                                            : []),
                                    ].map(({ local, count }) => {
                                        const part =
                                            siteEquipment.length > 0
                                                ? Math.round((count / siteEquipment.length) * 100)
                                                : 0;
                                        return (
                                            <li
                                                key={local ?? '—'}
                                                className="border-outline-variant flex items-center gap-1 border-t first:border-t-0"
                                            >
                                                <Button
                                                    variant="text"
                                                    layout="card"
                                                    onClick={() =>
                                                        onNavigate(
                                                            `/inventory/site/${encodeURIComponent(siteName)}`,
                                                        )
                                                    }
                                                    className="-ml-4 flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-none py-3 pl-4 text-left font-normal"
                                                >
                                                    <span
                                                        className={cn(
                                                            'rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center',
                                                            local
                                                                ? 'bg-surface-container text-on-surface-variant'
                                                                : 'bg-tint-ambre text-on-tint-ambre',
                                                        )}
                                                    >
                                                        <Icon
                                                            glyph={local ? DoorOpen : Hourglass}
                                                            size={20}
                                                        />
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
                                                        <span className="bg-surface-container mt-2 block h-1.5 overflow-hidden rounded-full">
                                                            <span
                                                                className={cn(
                                                                    'block h-full rounded-full',
                                                                    local
                                                                        ? 'bg-on-surface-variant'
                                                                        : 'bg-[var(--tk-color-st-ambre)]',
                                                                )}
                                                                style={{ width: `${part}%` }}
                                                            />
                                                        </span>
                                                    </span>
                                                </Button>
                                                {local ? (
                                                    <Menu
                                                        align="end"
                                                        title={local}
                                                        items={[
                                                            {
                                                                id: 'supprimer',
                                                                label: 'Supprimer le local',
                                                                description:
                                                                    count > 0
                                                                        ? 'ses actifs restent sur le site'
                                                                        : undefined,
                                                                destructive: true,
                                                                onSelect: () =>
                                                                    supprimerLocal(local),
                                                            },
                                                        ]}
                                                        trigger={
                                                            <Button
                                                                variant="text"
                                                                iconOnly
                                                                aria-label={`Actes sur ${local}`}
                                                                className="-mr-3 shrink-0"
                                                            >
                                                                <Icon
                                                                    glyph={DotsThreeVertical}
                                                                    size={20}
                                                                />
                                                            </Button>
                                                        }
                                                    />
                                                ) : (
                                                    <span className="w-9 shrink-0" aria-hidden />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            {/* `.more` — 48 px, un filet au-dessus, centré. */}
                            <Button
                                variant="text"
                                onClick={() => setIsAddLocalOpen(true)}
                                className="border-outline-variant text-on-surface text-ts-control flex min-h-12 w-full items-center justify-center gap-2 rounded-none border-t font-medium"
                            >
                                <Icon glyph={Plus} size={20} className="text-text-secondary" />
                                Ajouter un local
                            </Button>
                        </section>
                    )
                )}

                {/* RÉFÉRENCE — ce que le site est, et ce qui lui manque. Sous les locaux
                    depuis le 24/09 : deux de ses trois rangées sont le plus souvent vides,
                    elle ne doit pas passer avant ce que le site contient. */}
                <section className="rounded-card bg-surface px-4 py-1">
                    {cardHeader('Référence')}
                    {/* La même rangée que les référentiels (24/09) : le fait en titre, ce
                        qu'il est dessous ; un fait manquant s'éteint. */}
                    <FactRow
                        glyph={Hash}
                        tint={countryCode ? 'bleu' : undefined}
                        muted={!countryCode}
                        title={countryCode || 'à relever'}
                        subtitle="code pays"
                    />
                    <FactRow glyph={UserCircle} muted title="à désigner" subtitle="correspondant" />
                    {!neverServed && (
                        <FactRow
                            glyph={ClipboardText}
                            muted
                            title="jamais"
                            subtitle="dernier inventaire"
                            onOpen={() => onViewChange('audit')}
                        />
                    )}
                </section>

                {neverServed && (
                    /* `.warn` — **hors carte**, sur fond de surface : ce que « fermer »
                       veut dire. C'est le seul texte que la passe sobre garde ici, parce
                       que c'est un fait sur un acte, pas une leçon sur l'écran. */
                    <div className="bg-surface text-text-secondary text-ts-sub leading-ts-sub flex gap-3 rounded-[4px] px-4 py-3">
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
