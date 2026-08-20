import React, { useMemo, useState } from 'react';
import { CaretRight, DoorOpen, Info, MapPin, Plus, Warning } from '@phosphor-icons/react';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import ListRow from '../../../components/ui/ListRow';
import Modal from '../../../components/ui/Modal';
import ScreenState from '../../../components/ui/ScreenState';
import SelectField from '../../../components/ui/SelectField';
import { GLOSSARY } from '../../../constants/glossary';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ViewType } from '../../../types';
import { siteCodeOf } from '../lib/siteCode';

interface SiteDetailsPageProps {
    siteName: string;
    onBack: () => void;
    onViewChange: (view: ViewType) => void;
    /** Ouvre une liste **avec le site pour périmètre** — le renvoi de C2. */
    onNavigate: (path: string) => void;
}

/**
 * **La fiche d'un site — elle porte son état et *renvoie*** (planche 10.1, C2).
 *
 * *« La fiche porte ce que le site est (code, correspondant), ce qu'il contient — en
 * deux rangées de renvoi vers 04.1 et 05.1, jamais en liste recopiée — et ses
 * locaux. »* Le récapitulatif du produit affichait ses nombres **sans y mener** : la
 * faute de la seconde vérité, commise à moitié.
 *
 * L'écran n'existait pas : le récapitulatif vivait au bas de la cascade, et ne
 * s'allumait qu'une fois un **service** désigné — un niveau qui ne porte rien.
 */
const SiteDetailsPage: React.FC<SiteDetailsPageProps> = ({
    siteName,
    onBack,
    onViewChange,
    onNavigate,
}) => {
    const {
        locationData,
        equipment,
        users,
        serviceManagers,
        addLocation,
        renameLocation,
        deleteLocation,
    } = useData();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState(siteName);
    const [isAddLocalOpen, setIsAddLocalOpen] = useState(false);
    const [localName, setLocalName] = useState('');
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
    const [serviceName, setServiceName] = useState('');
    const [serviceManagerId, setServiceManagerId] = useState('');

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
    const services = useMemo(
        () => (locationData.services[siteName] || []) as string[],
        [locationData.services, siteName],
    );
    const code = useMemo(() => siteCodeOf(siteEquipment), [siteEquipment]);

    const neverServed = siteEquipment.length === 0 && siteUsers.length === 0;

    const managerOptions = useMemo(
        () => [
            { value: '', label: 'Aucun' },
            ...users.map((user) => ({ value: user.id, label: user.name })),
        ],
        [users],
    );

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

    const submitService = () => {
        const next = serviceName.trim();
        if (!next) return;
        if (!addLocation('service', next, siteName)) {
            showToast(`« ${next} » est déjà présent sur ce site.`, 'error');
            return;
        }
        showToast(`Service « ${next} » ajouté.`, 'success');
        setServiceName('');
        setServiceManagerId('');
        setIsAddServiceOpen(false);
    };

    /**
     * **Fermer un site vide n'efface rien** — il sort des sélecteurs, son nom reste
     * dans l'historique. C'est le seul cas où la suppression ne laisse aucun actif sans
     * lieu, et c'est pourquoi le geste n'existe que sur un site qui n'a jamais servi.
     */
    const closeSite = () => {
        if (locals.length > 0) {
            showToast(
                "Le site n'a pas pu être fermé — un local y est rattaché. Déplacez-le d'abord.",
                'error',
            );
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
                    supportingText={`Un local précise ${siteName} sans en être un autre — la salle serveurs est dedans.`}
                    required
                />
            </Modal>

            <Modal
                isOpen={isAddServiceOpen}
                onClose={() => setIsAddServiceOpen(false)}
                title="Ajouter un service présent"
                footer={
                    <>
                        <Button variant="outlined" onClick={() => setIsAddServiceOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={submitService}>
                            Ajouter
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <InputField
                        label="Nom du service"
                        name="service-name"
                        value={serviceName}
                        onChange={(event) => setServiceName(event.target.value)}
                        required
                    />
                    <SelectField
                        label="Correspondant"
                        name="service-manager"
                        value={serviceManagerId}
                        onChange={(event) => setServiceManagerId(event.target.value)}
                        options={managerOptions}
                    />
                </div>
            </Modal>

            <DetailTemplate
                /* Le fil d'Ariane prend la place du titre dans la barre : le nom du site
                   est porté par le porte-voix, à 28 px, juste dessous. */
                code={
                    <span className="text-text-secondary flex min-w-0 items-center gap-1 text-[13px] font-normal">
                        <span className="truncate">{GLOSSARY.LOCATIONS}</span>
                        <Icon glyph={CaretRight} size={18} className="text-text-muted" />
                        <span className="truncate">{country}</span>
                        <Icon glyph={CaretRight} size={18} className="text-text-muted" />
                        <span className="text-on-surface truncate font-medium">{siteName}</span>
                    </span>
                }
                onBack={onBack}
            >
                {/* LE PORTE-VOIX — le nom du site, et ce qu'un site décide. */}
                <div className="flex items-start gap-2.5 px-0.5">
                    <Icon glyph={MapPin} size={20} className="text-text-muted mt-1.5" />
                    <span className="min-w-0">
                        <b className="font-brand text-on-surface block text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {siteName}
                        </b>
                        <span className="text-text-secondary mt-[3px] block text-[13px] leading-[19px]">
                            {neverServed
                                ? "Ouvert, jamais équipé. Il figure pourtant dans tous les sélecteurs d'emplacement."
                                : "Un site est une adresse : c'est lui qui décide si une remise demande un transport."}
                        </span>
                    </span>
                </div>

                {/* CE QUE LE SITE EST */}
                <section className="rounded-card bg-surface shadow-elevation-1 divide-outline-variant divide-y p-4">
                    <div className="flex min-h-14 items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-on-surface text-[14px]">Code</span>
                            <span className="text-text-secondary text-[12px] leading-[17px]">
                                {code ? (
                                    <>
                                        porté par les codes d'actifs — LPT-
                                        <b className="text-on-surface font-medium">{code}</b>-01
                                    </>
                                ) : (
                                    "aucun code relevé — les codes d'actifs de ce site ne s'accordent pas"
                                )}
                            </span>
                        </div>
                        <span
                            className={
                                code
                                    ? 'text-on-surface shrink-0 text-[14px] font-medium'
                                    : 'text-text-muted shrink-0 text-[14px]'
                            }
                        >
                            {code || 'à relever'}
                        </span>
                    </div>
                    <div className="flex min-h-14 items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-on-surface text-[14px]">Correspondant</span>
                            <span className="text-text-secondary text-[12px] leading-[17px]">
                                personne à prévenir pour un transport ou un audit
                            </span>
                        </div>
                        <span className="text-text-muted shrink-0 text-[14px]">à désigner</span>
                    </div>
                </section>

                {/* CE QUE LE SITE CONTIENT — des **renvois**, pas des listes. */}
                <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">
                            Ce que le site contient
                        </h3>
                    </div>

                    {neverServed ? (
                        <>
                            <div className="bg-surface-container text-text-secondary flex gap-2.5 rounded-md px-3 py-[11px] text-[12px] leading-[17px]">
                                <Icon
                                    glyph={Warning}
                                    size={18}
                                    className="mt-px shrink-0 text-[var(--tk-color-st-ambre)]"
                                />
                                <span>
                                    <b className="text-on-surface font-medium">
                                        Rien n'y est localisé.
                                    </b>{' '}
                                    Aucun actif, aucun utilisateur — on peut pourtant y créer un
                                    équipement dès aujourd'hui.
                                </span>
                            </div>
                            <div className="border-outline-variant mt-3 flex flex-col gap-2.5 border-t pt-3">
                                <Button
                                    variant="filled"
                                    onClick={() => onViewChange('add_equipment')}
                                >
                                    Créer un équipement ici
                                </Button>
                                <Button variant="outlined" onClick={closeSite}>
                                    Fermer le site
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="divide-outline-variant divide-y">
                                <Button
                                    variant="text"
                                    onClick={() =>
                                        onNavigate(
                                            `/inventory/site/${encodeURIComponent(siteName)}`,
                                        )
                                    }
                                    className="flex min-h-14 w-full items-center justify-start gap-3 rounded-none px-0 py-2.5 text-left"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface block text-[14px]">
                                            {GLOSSARY.EQUIPMENT_PLURAL}
                                        </span>
                                        <span className="text-text-secondary block text-[12px] leading-[17px]">
                                            ouvre la liste des équipements, filtrée sur ce site
                                        </span>
                                    </span>
                                    <span className="text-on-surface shrink-0 text-[14px] font-medium tabular-nums">
                                        {siteEquipment.length}
                                    </span>
                                    <Icon
                                        glyph={CaretRight}
                                        size={20}
                                        className="text-text-secondary shrink-0"
                                    />
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={() =>
                                        onNavigate(`/users/site/${encodeURIComponent(siteName)}`)
                                    }
                                    className="flex min-h-14 w-full items-center justify-start gap-3 rounded-none px-0 py-2.5 text-left"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface block text-[14px]">
                                            {GLOSSARY.USER_PLURAL}
                                        </span>
                                        <span className="text-text-secondary block text-[12px] leading-[17px]">
                                            ouvre l'annuaire, filtré sur ce site
                                        </span>
                                    </span>
                                    <span className="text-on-surface shrink-0 text-[14px] font-medium tabular-nums">
                                        {siteUsers.length}
                                    </span>
                                    <Icon
                                        glyph={CaretRight}
                                        size={20}
                                        className="text-text-secondary shrink-0"
                                    />
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={() => onViewChange('audit')}
                                    className="flex min-h-14 w-full items-center justify-start gap-3 rounded-none px-0 py-2.5 text-left"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface block text-[14px]">
                                            Dernière campagne d'audit
                                        </span>
                                        <span className="text-text-secondary block text-[12px] leading-[17px]">
                                            aucune campagne n'a couvert ce site
                                        </span>
                                    </span>
                                    <span className="text-text-muted shrink-0 text-[14px]">—</span>
                                    <Icon
                                        glyph={CaretRight}
                                        size={20}
                                        className="text-text-secondary shrink-0"
                                    />
                                </Button>
                            </div>
                            <p className="text-text-secondary mt-[7px] px-0.5 text-[12px] leading-[17px]">
                                Trois <b className="text-on-surface font-medium">renvois</b>, pas
                                trois listes. Le seul inventaire du parc est celui des équipements :
                                un second, même filtré, serait une seconde vérité.
                            </p>
                        </>
                    )}
                </section>

                {/* LES LOCAUX — le quatrième niveau, facultatif. */}
                <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">Locaux</h3>
                        <span className="text-text-secondary text-[13px] tabular-nums">
                            {locals.length}
                        </span>
                    </div>
                    {locals.length > 0 ? (
                        <div>
                            {locals.map((local) => (
                                <ListRow
                                    key={local}
                                    vignette={<Icon glyph={DoorOpen} size={20} />}
                                    title={local}
                                    holder={`Local du ${siteName}`}
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
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary py-2 text-[12px] leading-[17px]">
                            Aucun local déclaré. Un local n'est pas obligatoire : il précise un site
                            quand une pièce mérite d'être nommée.
                        </p>
                    )}
                    <Button
                        variant="text"
                        onClick={() => setIsAddLocalOpen(true)}
                        className="border-outline-variant text-on-surface mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-none border-t pt-2 text-[14px] font-medium"
                    >
                        <Icon glyph={Plus} size={18} className="text-text-secondary" />
                        Ajouter un local
                    </Button>
                </section>

                {/* LES SERVICES PRÉSENTS — option A3 de la planche. Le service n'est plus
                    un niveau de l'arbre : il est la **conséquence** des personnes
                    rattachées au site. La planche le dessine en lecture seule ; il reste
                    tenable ici tant qu'aucun écran de 05.x ne le porte, sans quoi le
                    correspondant d'un service deviendrait injoignable. */}
                <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">
                            Services présents
                        </h3>
                        <span className="text-text-secondary text-[13px] tabular-nums">
                            {services.length}
                        </span>
                    </div>
                    <div className="divide-outline-variant divide-y">
                        {services.map((service) => {
                            const managerId = serviceManagers[service];
                            const manager = users.find((user) => user.id === managerId);
                            return (
                                <div
                                    key={service}
                                    className="flex min-h-14 items-center justify-between gap-3 py-2.5"
                                >
                                    <span className="text-on-surface min-w-0 flex-1 text-[14px]">
                                        {service}
                                    </span>
                                    <span className="text-text-secondary shrink-0 text-[12px]">
                                        {manager ? manager.name : 'aucun correspondant'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-text-secondary mt-[7px] px-0.5 text-[12px] leading-[17px]">
                        Un service n'est pas un lieu : il ne porte ni actif ni campagne, et il
                        n'ouvre rien. Il figure ici comme conséquence des personnes rattachées au
                        site, et sert de périmètre à une campagne d'audit.
                    </p>
                    <Button
                        variant="text"
                        onClick={() => setIsAddServiceOpen(true)}
                        className="border-outline-variant text-on-surface mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-none border-t pt-2 text-[14px] font-medium"
                    >
                        <Icon glyph={Plus} size={18} className="text-text-secondary" />
                        Ajouter un service présent
                    </Button>
                </section>

                {/* CE QUE LES ACTES ENGAGENT */}
                <section className="rounded-card bg-surface shadow-elevation-1 p-4">
                    <div className="bg-surface-container text-text-secondary flex gap-2.5 rounded-md px-3 py-[11px] text-[12px] leading-[17px]">
                        <Icon
                            glyph={Info}
                            size={18}
                            className="text-text-secondary mt-px shrink-0"
                        />
                        <span>
                            {neverServed ? (
                                <>
                                    <b className="text-on-surface font-medium">
                                        Fermer un site vide n'efface rien
                                    </b>{' '}
                                    — il sort des sélecteurs, son nom reste dans l'historique. C'est
                                    le seul cas où la suppression ne laisse aucun actif sans lieu.
                                </>
                            ) : (
                                <>
                                    Le site est ce qui décide qu'une remise{' '}
                                    <b className="text-on-surface font-medium">
                                        demande un transport
                                    </b>{' '}
                                    : renommer celui-ci est sans effet, le{' '}
                                    <b className="text-on-surface font-medium">supprimer</b>{' '}
                                    laisserait {siteEquipment.length} actif
                                    {siteEquipment.length > 1 ? 's' : ''} sans lieu.
                                </>
                            )}
                        </span>
                    </div>
                    <div className="border-outline-variant mt-3 border-t pt-3">
                        <Button
                            variant="outlined"
                            className="w-full"
                            onClick={() => {
                                setRenameValue(siteName);
                                setIsRenameOpen(true);
                            }}
                        >
                            Modifier le site
                        </Button>
                    </div>
                </section>
            </DetailTemplate>
        </>
    );
};

export default SiteDetailsPage;
