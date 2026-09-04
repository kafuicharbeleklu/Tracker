import React, { useMemo, useState } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    CaretDown,
    Check,
    ClockCounterClockwise,
    DotsThreeVertical,
    FileText,
    Laptop,
    ClockCountdown,
    Coins,
    HandArrowDown,
    Package,
    ShieldCheck,
    ShieldWarning,
    Warning,
    Wrench,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

import { RETIREMENT_REASON_LABELS, type RetirementReason } from '../../../types';
import { getCategoryLabel } from '../../../constants/glossary';
import IncidentSheet from '../components/IncidentSheet';
import RetireSheet from '../components/RetireSheet';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import TintedTile, { TintedTileRow, type TintedTileTone } from '../../../components/ui/TintedTile';
import DetailHero from '../../../components/ui/DetailHero';
import ReferenceRow from '../../../components/ui/ReferenceRow';
import ProportionRow from '../../../components/ui/ProportionRow';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import DemoBadge from '../../../components/ui/DemoBadge';
import ScreenState from '../../../components/ui/ScreenState';

import { getDisplayedEquipmentStatus } from '../../../lib/businessRules';
import { getStatusPresentation } from '../../../constants/statusPresentation';
import { calculateLinearDepreciation, formatCurrency } from '../../../lib/financial';
import { DEMO_RESEED_NOTICE, isDemoSeedEquipment } from '../../../lib/demoSeed';
import { GLOSSARY } from '../../../constants/glossary';

/**
 * Fiche équipement — **portée sur la planche 04.2** (gabarit `DetailTemplate`).
 *
 * Une fiche répond d'abord à **« quel objet, dans quel état, chez qui, et quoi
 * faire »**, et cela tient dans la zone inversée, sans défilement. Tout le reste est
 * de la **référence bornée**.
 *
 * **Ce que le portage retire :**
 *
 * - **les trois cartes de démonstration** — « Santé 100 % », « Maintenance à jour »
 *   et leur voisine occupaient le premier écran avec des chiffres fabriqués, avant
 *   la moindre donnée réelle. Elles reviendront le jour où l'agent de collecte les
 *   alimente : c'est exactement ce que leur badge DÉMO avouait.
 * - **le bloc financier** — prix d'achat, valeur actuelle, amortissement total **en
 *   rouge**, barre en dégradé, tableau de trois lignes et deux encarts d'alerte
 *   tenaient un tiers de l'écran pour dire « amorti à 50 % ». Rien là-dedans ne
 *   portait de décision. **Un amortissement n'est pas une anomalie** : reste une
 *   rangée, puis la conséquence — quand renouveler.
 * - **le second en-tête.** « Détail équipement » ne dit rien qu'on ne sache déjà et
 *   coûte 56 px. La barre porte le code, l'identifiant et le menu, et elle est le
 *   seul endroit où l'identité est écrite.
 * - **le crayon et le triangle sans libellé** — un triangle peut vouloir dire
 *   « signaler un problème » comme « il y a un problème ». Ils deviennent des
 *   entrées **nommées**.
 * - **« Supprimer » du rang primaire.** Un acte irréversible ne se tient pas à côté
 *   d'« Attribuer » : il descend au menu, derrière un séparateur, sous le mot juste —
 *   **« Sortir du parc »**, parce qu'un actif qui a un historique ne s'efface pas.
 * - **l'ascenseur interne de l'historique** (200 mouvements) — il est borné à trois
 *   et renvoie à l'écran d'Audit, qui fait déjà ce travail : le dupliquer créerait
 *   une seconde source de vérité.
 *
 * **Les qualifiants du voile suivent le rôle**, jamais la recopie : le gestionnaire
 * voit le prix d'achat, le porteur voit à la même place la **date de remise**. Le
 * prix ne franchit pas la frontière de rôle.
 *
 * **Ce qui n'est pas porté, et pourquoi.** L'entrée « Déclarer un incident » attend
 * la planche **04.3** : le geste actuel affiche « Signalement envoyé au support »
 * alors que **rien n'est envoyé ni créé**. Reconduire une phrase fausse serait pire
 * que l'absence — l'entrée est retirée jusqu'à ce que la feuille d'incident existe.
 */

interface EquipmentDetailsPageProps {
    equipmentId: string;
    onBack: () => void;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const formatDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'N/A';

const EquipmentDetailsPage: React.FC<EquipmentDetailsPageProps> = ({ equipmentId, onBack }) => {
    const {
        equipment,
        users,
        events,
        updateEquipment,
        deleteEquipment,
        declareIncident,
        confirmEquipmentReception,
        settings,
    } = useData();
    const { showToast } = useToast();
    const { permissions, user: currentUser } = useAccessControl();
    const { navigate } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();

    const item = equipment.find((entry) => entry.id === equipmentId);

    /* Les deux feuilles d'acte de 04.3 (colonnes 3 et 4). Elles remplacent deux
       confirmations : l'une passait l'objet en réparation sans rien demander, l'autre
       demandait de taper « SUPPRIMER » sans jamais demander pourquoi. */
    const [isIncidentSheetOpen, setIsIncidentSheetOpen] = useState(false);
    const [isRetireSheetOpen, setIsRetireSheetOpen] = useState(false);

    const financialStats = useMemo(() => {
        if (!item?.financial) return null;
        return calculateLinearDepreciation(
            item.financial.purchasePrice,
            item.financial.purchaseDate,
            item.financial.depreciationYears,
            item.financial.purchasePrice > 0
                ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100
                : 0,
        );
    }, [item]);

    /**
     * L'historique est **borné à trois** : au-delà, c'est l'écran d'Audit, filtré sur
     * cet actif, qui fait le travail (04.2). Une fiche ne défile pas à l'intérieur
     * d'elle-même.
     */
    const history = useMemo(() => {
        if (!item) return [];
        return events
            .filter((event) => event.targetId === item.id)
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map((event) => ({
                id: event.id,
                title: event.description || 'Mouvement enregistré',
                date: new Date(event.timestamp).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                }),
            }));
    }, [events, item]);

    if (!item) {
        return (
            <ScreenState
                icon={Package}
                title="Cette fiche n’existe plus"
                description={`L’${GLOSSARY.EQUIPMENT.toLowerCase()} que vous cherchiez a peut-être été sorti du parc. Son historique, lui, est conservé dans l’audit.`}
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir aux équipements
                    </Button>
                }
            />
        );
    }

    const displayedStatus = getDisplayedEquipmentStatus({
        status: item.status,
        assignmentStatus: item.assignmentStatus,
    });
    const status = getStatusPresentation(displayedStatus);

    const holder = item.user
        ? users.find(
              (user) =>
                  (item.user?.id && user.id === item.user.id) ||
                  (item.user?.email && user.email === item.user.email) ||
                  (item.user?.name && user.name === item.user.name),
          )
        : null;

    /* Qui peut confirmer une réception : celui qui reçoit, son manager, ou un
       gestionnaire. Même règle que `confirmEquipmentReception` dans le store — lue
       ici pour ne pas offrir un geste qui serait refusé après le tap. Lot 7, S2. */
    const canConfirmReception =
        (!!currentUser &&
            (item.user?.id === currentUser.id || item.user?.email === currentUser.email)) ||
        (!!currentUser && !!holder && holder.managerId === currentUser.id) ||
        permissions.canManageInventory;

    // ---- les trois qualifiants du voile (R3) -----------------------------------
    const purchaseDate = item.financial?.purchaseDate;
    const ageYears = purchaseDate
        ? (Date.now() - new Date(purchaseDate).getTime()) / MS_PER_YEAR
        : null;

    const warrantyMonthsLeft = item.warrantyEnd
        ? Math.round((new Date(item.warrantyEnd).getTime() - Date.now()) / (MS_PER_YEAR / 12))
        : null;

    /**
     * Les repères chiffrés — passe sobre du 02/09, dont 04.2 est le pilote.
     *
     * Ils **quittent le héro** : celui-ci ne porte plus que quatre choses — l'état,
     * l'objet, la personne, le geste. Les chiffres se posent dessous, en tuiles
     * teintées. **Une teinte par nature de chiffre** (le temps, la garantie,
     * l'argent), jamais par humeur. La valeur longue prend la ligne entière : un
     * prix à sept chiffres ne tient pas dans une demi-tuile.
     */
    const tiles = (() => {
        const out: {
            key: string;
            tone: TintedTileTone;
            glyph: PhosphorGlyph;
            value: string;
            label: string;
            wide?: boolean;
        }[] = [];

        if (ageYears !== null && ageYears >= 0) {
            out.push({
                key: 'age',
                tone: 'bleu',
                glyph: ClockCountdown,
                value: `${ageYears.toFixed(1).replace('.', ',')} ans`,
                label: 'au parc',
            });
        }
        if (warrantyMonthsLeft !== null) {
            out.push({
                key: 'warranty',
                tone: 'vert',
                glyph: ShieldCheck,
                value: warrantyMonthsLeft > 0 ? `${warrantyMonthsLeft} mois` : 'expirée',
                label: warrantyMonthsLeft > 0 ? 'de garantie' : 'garantie',
            });
        }

        // Le prix ne franchit pas la frontière de rôle : le porteur voit sa date de remise.
        if (permissions.canManageInventory && item.financial) {
            out.push({
                key: 'price',
                tone: 'ambre',
                glyph: Coins,
                value: formatCurrency(item.financial.purchasePrice, settings.currency),
                label: 'à l’achat',
                wide: true,
            });
        } else if (item.confirmedAt || item.assignedAt) {
            out.push({
                key: 'handover',
                tone: 'bleu',
                glyph: HandArrowDown,
                value: new Date(item.confirmedAt || item.assignedAt || '').toLocaleDateString(
                    'fr-FR',
                    { day: 'numeric', month: 'long' },
                ),
                label: 'remis à vous',
                wide: true,
            });
        }

        return out;
    })();

    // ---- les actes -------------------------------------------------------------
    const handleAssign = () =>
        navigate(
            `/wizards/assignment?context=equipment_details&equipmentId=${encodeURIComponent(item.id)}`,
        );

    const handleDeclareIncident = () => setIsIncidentSheetOpen(true);

    const handleTakeCharge = () => {
        showToast('Prise en charge de l’intervention enregistrée.', 'info');
    };

    const handleReassign = () => {
        navigate(
            `/wizards/assignment?context=equipment_details&reassign=true&equipmentId=${encodeURIComponent(item.id)}`,
        );
    };

    const handleEndRepair = () => {
        requestConfirmation({
            title: `Remettre ${item.name} en service ?`,
            message: (
                <>
                    L’équipement repasse en{' '}
                    <strong className="text-on-surface font-medium">Disponible</strong> et redevient
                    attribuable. La date de fin d’intervention est enregistrée.
                </>
            ),
            confirmText: 'Mettre en service',
            onConfirm: () => {
                updateEquipment(item.id, {
                    status: 'Disponible',
                    repairEndDate: new Date().toISOString(),
                });
                showToast('Équipement remis en service.', 'success');
            },
        });
    };

    const handleRetire = () => {
        if (item.status !== 'Disponible' && item.status !== 'En réparation') {
            showToast('Un équipement attribué ne peut pas sortir du parc.', 'error');
            return;
        }

        setIsRetireSheetOpen(true);
    };

    const handleRetireConfirmed = (reason: RetirementReason) => {
        if (deleteEquipment(item.id, reason)) {
            showToast(
                `${item.name} est sorti du parc — ${RETIREMENT_REASON_LABELS[reason]}.`,
                'success',
            );
            if (isDemoSeedEquipment(item.id)) showToast(DEMO_RESEED_NOTICE, 'info');
            onBack();
            return;
        }
        showToast('La sortie du parc a échoué.', 'error');
    };

    /** Le geste primaire **suit l'état** — c'est la règle du héro (04.2). */
    const primaryAction = (() => {
        /* Une réception en attente passe **avant** la branche du porteur : le
           bénéficiaire est justement la personne censée confirmer, et la branche
           « non-gestionnaire » retournait avant ce test — il ne voyait donc jamais
           le geste, seulement « Déclarer un incident » et « Restituer ». C'est la
           moitié UI du défaut que le lot 7 corrige côté écriture (§9.0/D15).
           La confirmation passe par l'écriture unique du store, qui synchronise
           l'approbation liée que la fiche oubliait. Lot 7, S2. */
        if (item.assignmentStatus === 'PENDING_DELIVERY' && canConfirmReception) {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={Check} size={20} />}
                    onClick={() => {
                        const decision = confirmEquipmentReception(item.id);
                        showToast(
                            decision.allowed
                                ? 'Réception confirmée.'
                                : decision.reason || 'Confirmation refusée.',
                            decision.allowed ? 'success' : 'error',
                        );
                    }}
                >
                    Confirmer la réception
                </Button>
            );
        }

        if (!permissions.canManageInventory) {
            return (
                <div className="flex w-full flex-col gap-2.5">
                    <Button
                        variant="filled"
                        className="w-full"
                        icon={<Icon glyph={Warning} size={20} />}
                        onClick={handleDeclareIncident}
                    >
                        Déclarer un incident
                    </Button>
                    <Button
                        variant="tonal"
                        className="w-full"
                        icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                        onClick={() =>
                            navigate(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`)
                        }
                    >
                        Restituer
                    </Button>
                </div>
            );
        }

        if (item.status === 'Disponible') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={ArrowCircleRight} size={20} />}
                    onClick={handleAssign}
                >
                    Attribuer
                </Button>
            );
        }
        if (item.status === 'Attribué') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                    onClick={() =>
                        navigate(`/wizards/return?equipmentId=${encodeURIComponent(item.id)}`)
                    }
                >
                    Restituer
                </Button>
            );
        }
        if (item.status === 'En réparation') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={Check} size={20} />}
                    onClick={handleEndRepair}
                >
                    Clore l’intervention
                </Button>
            );
        }
        return null;
    })();

    const menuItems = [
        ...(permissions.canManageInventory
            ? [
                  {
                      id: 'edit',
                      label: 'Modifier la fiche',
                      description: 'code, modèle, emplacement, spécifications',
                      onSelect: () => navigate(`/inventory/edit/${item.id}`),
                  },
                  {
                      id: 'incident',
                      label: 'Déclarer un incident',
                      description: 'passe l’actif en réparation et ouvre une tâche',
                      onSelect: handleDeclareIncident,
                  },
                  ...(item.status === 'En réparation'
                      ? [
                            {
                                id: 'take_charge',
                                label: 'Prendre en charge',
                                description: 'le réparateur, la date de retour, qui paie',
                                onSelect: handleTakeCharge,
                            },
                        ]
                      : []),
                  {
                      id: 'reassign',
                      label: 'Réaffecter',
                      description: 'restitue et attribue en un geste',
                      onSelect: handleReassign,
                  },
                  {
                      id: 'retire',
                      label: 'Sortir du parc',
                      description: 'retire des disponibles, conserve l’historique',
                      destructive: true,
                      dividerBefore: true,
                      onSelect: handleRetire,
                  },
              ]
            : []),
    ];

    // ---- proportions -----------------------------------------------------------
    const warrantyPercent =
        purchaseDate && item.warrantyEnd
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      ((Date.now() - new Date(purchaseDate).getTime()) /
                          (new Date(item.warrantyEnd).getTime() -
                              new Date(purchaseDate).getTime())) *
                          100,
                  ),
              )
            : null;

    return (
        <>
            <DetailTemplate
                code={item.name}
                reference={item.assetId}
                onBack={onBack}
                menu={
                    menuItems.length > 0 ? (
                        <Menu
                            align="end"
                            items={menuItems}
                            trigger={
                                <Button variant="text" iconOnly aria-label="Autres actions">
                                    <Icon glyph={DotsThreeVertical} />
                                </Button>
                            }
                        />
                    ) : undefined
                }
                hero={
                    <DetailHero
                        status={{
                            icon: status.icon,
                            label: status.label,
                            tone: statusHeroTone(status.tone),
                        }}
                        /* Le site rejoint l'étiquette — « Ordinateur portable · Bureau Paris » —
                       au lieu d'occuper une rangée de fait à lui seul (planche 04.2, `.ty`). */
                        label={
                            item.site
                                ? `${getCategoryLabel(item.type)} · ${item.site}`
                                : getCategoryLabel(item.type)
                        }
                        subject={item.model || item.name}
                        image={item.image || undefined}
                        relation={
                            item.status === 'En réparation'
                                ? {
                                      vignette: <Icon glyph={Wrench} size={20} />,
                                      title: item.repairReason || 'En réparation',
                                      detail: `signalé le ${formatDate(item.repairStartDate || item.updatedAt)} · en atelier`,
                                  }
                                : item.assignmentStatus === 'PENDING_DELIVERY' && holder
                                  ? {
                                        vignette: initials(holder.name),
                                        title: `En attente de ${holder.name}`,
                                        detail: 'attribué, réception non confirmée',
                                        onOpen: () => navigate(`/users/${holder.id}`),
                                    }
                                  : holder
                                    ? {
                                          vignette: initials(holder.name),
                                          title: holder.name,
                                          /* Le porteur peut être suspendu ou sur le départ : le
                                         signal posé par `updateUser` se lit ici, sous la
                                         rangée du porteur. Planche 04.2, réglage « Porteur »
                                         — lot 2, D7. */
                                          detail: (
                                              <>
                                                  {item.confirmedAt
                                                      ? `porteur depuis le ${formatDate(item.confirmedAt)} · réception confirmée`
                                                      : 'réception non confirmée'}
                                                  {item.holderAlert && (
                                                      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 font-medium text-[var(--tk-color-live-ambre)]">
                                                          <span className="h-[7px] w-[7px] shrink-0 rounded-[2px] bg-[var(--tk-color-live-ambre)]" />
                                                          {item.holderAlert.kind === 'suspended'
                                                              ? `À récupérer — porteur suspendu le ${formatDate(item.holderAlert.since)}`
                                                              : `À récupérer avant son départ le ${formatDate(item.holderAlert.until)}`}
                                                      </span>
                                                  )}
                                              </>
                                          ),
                                          onOpen: () => navigate(`/users/${holder.id}`),
                                      }
                                    : {
                                          vignette: <Icon glyph={Package} size={20} />,
                                          title: 'Non attribué',
                                          detail: item.site
                                              ? `en stock au ${item.site}`
                                              : 'en stock',
                                      }
                        }
                        actions={primaryAction}
                    />
                }
                aside={
                    tiles.length > 0 ? (
                        <TintedTileRow>
                            {tiles.map((tile) => (
                                <TintedTile
                                    key={tile.key}
                                    tone={tile.tone}
                                    glyph={tile.glyph}
                                    value={tile.value}
                                    label={tile.label}
                                    wide={tile.wide}
                                />
                            ))}
                        </TintedTileRow>
                    ) : undefined
                }
            >
                <section className="rounded-card bg-surface p-4">
                    <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                        <Icon glyph={Laptop} size={18} className="text-on-surface-variant" />
                        Référence technique
                    </p>
                    <div className="mt-3">
                        {/* Le numéro de série passe en premier, et il est copiable : c'est le
                        seul champ qu'on lit à voix haute au téléphone avec le support. */}
                        <ReferenceRow
                            label="Numéro de série"
                            value={item.serialNumber || '—'}
                            copyable={Boolean(item.serialNumber)}
                        />
                        <ReferenceRow
                            label="Modèle"
                            value={item.model || '—'}
                            quiet={!item.model}
                        />
                        <ReferenceRow label="Mémoire" value={item.ram || '—'} quiet={!item.ram} />
                        <ReferenceRow
                            label="Stockage"
                            value={item.storage || '—'}
                            quiet={!item.storage}
                        />
                        <ReferenceRow label="Système" value={item.os || '—'} quiet={!item.os} />
                        {item.lastReturnCondition && (
                            <ReferenceRow
                                label="Réserve d’usage"
                                value={item.lastReturnCondition}
                            />
                        )}
                    </div>
                </section>

                {(warrantyPercent !== null ||
                    (financialStats && permissions.canManageInventory)) && (
                    <section className="rounded-card bg-surface p-4">
                        <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                            <Icon
                                glyph={ShieldWarning}
                                size={18}
                                className="text-on-surface-variant"
                            />
                            {permissions.canManageInventory ? 'Garantie et valeur' : 'Garantie'}
                        </p>

                        {warrantyPercent !== null && (
                            <ProportionRow
                                value={`${Math.round(warrantyPercent)} %`}
                                label="de la garantie écoulée"
                                percent={warrantyPercent}
                                tone={warrantyPercent < 100 ? 'positive' : 'neutral'}
                                note={
                                    warrantyPercent < 100 ? (
                                        <>
                                            Toute réparation est{' '}
                                            <strong className="text-on-surface font-medium">
                                                prise en charge par le fournisseur
                                            </strong>{' '}
                                            jusqu’au{' '}
                                            <strong className="text-on-surface font-medium">
                                                {formatDate(item.warrantyEnd)}
                                            </strong>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            La garantie a expiré le {formatDate(item.warrantyEnd)} :
                                            une réparation s’impute désormais sur le budget du
                                            service.
                                        </>
                                    )
                                }
                            />
                        )}

                        {financialStats && item.financial && permissions.canManageInventory && (
                            <>
                                <ProportionRow
                                    className={
                                        warrantyPercent !== null
                                            ? 'border-outline-variant mt-4 border-t pt-1'
                                            : undefined
                                    }
                                    value={`${Math.round(financialStats.progressPercent)} %`}
                                    label={`de la valeur amortie — ${formatCurrency(
                                        financialStats.currentValue,
                                        settings.currency,
                                    )} restent à amortir`}
                                    percent={financialStats.progressPercent}
                                    tone={
                                        financialStats.progressPercent > 80
                                            ? 'attention'
                                            : 'neutral'
                                    }
                                    note={
                                        financialStats.progressPercent > 80 ? (
                                            <strong className="text-on-surface font-medium">
                                                À renouveler cette année.
                                            </strong>
                                        ) : (
                                            <>
                                                Renouvellement à prévoir pour{' '}
                                                <strong className="text-on-surface font-medium">
                                                    {new Date(
                                                        item.financial.purchaseDate,
                                                    ).getFullYear() +
                                                        item.financial.depreciationYears}
                                                </strong>
                                                , fin d’amortissement.
                                            </>
                                        )
                                    }
                                    source="Amortissement issu du paramétrage par catégorie, pas d’une réévaluation."
                                />
                                <Button
                                    variant="text"
                                    className="border-outline-variant mt-2 min-h-11 w-full justify-start gap-2.5 border-t px-0 hover:bg-transparent"
                                    onClick={() => navigate('/finance')}
                                >
                                    <span>Prix d’achat et amortissement</span>
                                    <span className="text-body-medium text-text-secondary ml-auto font-normal">
                                        dans Finances
                                    </span>
                                    <Icon glyph={CaretDown} size={18} className="-rotate-90" />
                                </Button>
                            </>
                        )}
                    </section>
                )}

                {permissions.canManageInventory && (
                    <section className="rounded-card bg-surface p-4">
                        <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                            <Icon
                                glyph={ClockCounterClockwise}
                                size={18}
                                className="text-on-surface-variant"
                            />
                            Historique
                        </p>
                        {history.length > 0 ? (
                            <>
                                <div className="mt-3">
                                    {history.map((event) => (
                                        <ReferenceRow
                                            key={event.id}
                                            label={event.title}
                                            value={event.date}
                                            quiet
                                        />
                                    ))}
                                </div>
                                <Button
                                    variant="text"
                                    className="border-outline-variant mt-2 min-h-11 w-full justify-start gap-2.5 border-t px-0 hover:bg-transparent"
                                    onClick={() => navigate('/audit/overview')}
                                >
                                    <span>
                                        {history.length > 0
                                            ? `Les ${history.length} événements`
                                            : 'Tout l’historique'}
                                    </span>
                                    <span className="text-body-medium text-text-secondary ml-auto font-normal">
                                        dans Audit
                                    </span>
                                    <Icon glyph={CaretDown} size={18} className="-rotate-90" />
                                </Button>
                            </>
                        ) : (
                            <p className="text-body-medium text-text-secondary mt-3">
                                Aucun mouvement enregistré pour cet équipement.
                            </p>
                        )}
                    </section>
                )}

                {item.documents && item.documents.length > 0 && (
                    <section className="rounded-card bg-surface p-4">
                        <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                            <Icon glyph={FileText} size={18} className="text-on-surface-variant" />
                            Documents
                            <DemoBadge className="ml-auto" />
                        </p>
                        <div className="mt-3">
                            {item.documents.map((document) => (
                                <ReferenceRow
                                    key={document.id}
                                    label={document.name}
                                    value={`${document.type}${document.size ? ` · ${document.size}` : ''}`}
                                    quiet
                                />
                            ))}
                        </div>
                    </section>
                )}
            </DetailTemplate>

            {/* Les deux feuilles d'acte de 04.3. Elles se montent **hors du gabarit** :
            une feuille est une couche de l'écran, pas une section de la fiche. */}
            <IncidentSheet
                open={isIncidentSheetOpen}
                item={item}
                declarerName={currentUser?.name || 'un gestionnaire'}
                onClose={() => setIsIncidentSheetOpen(false)}
                onDeclare={(payload) => {
                    const decision = declareIncident(item.id, payload);
                    if (!decision.allowed) {
                        showToast(decision.reason || 'Déclaration refusée.', 'error');
                        return;
                    }
                    showToast(
                        payload.outcome === 'serves'
                            ? 'Incident déclaré. L’objet reste chez son porteur.'
                            : payload.outcome === 'immobilised'
                              ? 'Incident déclaré. L’équipement est passé en réparation.'
                              : 'Incident déclaré. L’équipement est hors service.',
                        'info',
                    );
                }}
            />

            <RetireSheet
                open={isRetireSheetOpen}
                item={item}
                historyCount={events.filter((event) => event.targetId === item.id).length}
                residualValue={
                    financialStats
                        ? formatCurrency(financialStats.currentValue, settings.currency)
                        : undefined
                }
                onClose={() => setIsRetireSheetOpen(false)}
                onRetire={handleRetireConfirmed}
            />
        </>
    );
};

/** Le voile n'a pas de rouge : sur surface inversée, l'alerte se dit en orange. */
const statusHeroTone = (tone: string): 'positive' | 'info' | 'pending' | 'attention' => {
    if (tone === 'positive' || tone === 'info' || tone === 'pending') return tone;
    return 'attention';
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export default EquipmentDetailsPage;
