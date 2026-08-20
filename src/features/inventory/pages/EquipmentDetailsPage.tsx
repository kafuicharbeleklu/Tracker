import React, { useMemo } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    CaretDown,
    Check,
    ClockCounterClockwise,
    DotsThreeVertical,
    FileText,
    Laptop,
    MapPin,
    Package,
    ShieldWarning,
    User,
    Warning,
    Wrench,
} from '@phosphor-icons/react';

import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero, {
    type DetailMetric,
    type DetailMetrics,
} from '../../../components/ui/DetailHero';
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
    const { equipment, users, events, updateEquipment, deleteEquipment, settings } = useData();
    const { showToast } = useToast();
    const { permissions } = useAccessControl();
    const { navigate } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();

    const item = equipment.find((entry) => entry.id === equipmentId);

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

    // ---- les trois qualifiants du voile (R3) -----------------------------------
    const purchaseDate = item.financial?.purchaseDate;
    const ageYears = purchaseDate
        ? (Date.now() - new Date(purchaseDate).getTime()) / MS_PER_YEAR
        : null;

    const warrantyMonthsLeft = item.warrantyEnd
        ? Math.round((new Date(item.warrantyEnd).getTime() - Date.now()) / (MS_PER_YEAR / 12))
        : null;

    const metrics: DetailMetrics | undefined = (() => {
        const facts: DetailMetric[] = [];

        if (ageYears !== null && ageYears >= 0) {
            facts.push({ value: `${ageYears.toFixed(1).replace('.', ',')} ans`, label: 'au parc' });
        }
        if (warrantyMonthsLeft !== null) {
            facts.push({
                value: warrantyMonthsLeft > 0 ? `${warrantyMonthsLeft} mois` : 'expirée',
                label: warrantyMonthsLeft > 0 ? 'de garantie' : 'garantie',
            });
        }

        // Le prix ne franchit pas la frontière de rôle : le porteur voit sa date de remise.
        if (permissions.canManageInventory && item.financial) {
            facts.push({
                value: formatCurrency(item.financial.purchasePrice, settings.currency),
                label: 'à l’achat',
            });
        } else if (item.confirmedAt || item.assignedAt) {
            facts.push({
                value: new Date(item.confirmedAt || item.assignedAt || '').toLocaleDateString(
                    'fr-FR',
                    {
                        day: 'numeric',
                        month: 'short',
                    },
                ),
                label: 'remis',
            });
        }

        if (facts.length === 0) return undefined;
        return facts.slice(0, 3) as unknown as DetailMetrics;
    })();

    // ---- les actes -------------------------------------------------------------
    const handleAssign = () =>
        navigate(
            `/wizards/assignment?context=equipment_details&equipmentId=${encodeURIComponent(item.id)}`,
        );

    const handleDeclareIncident = () => {
        requestConfirmation({
            title: `Déclarer un incident sur ${item.name} ?`,
            message: (
                <>
                    L’équipement passera en statut{' '}
                    <strong className="text-on-surface font-medium">En réparation</strong> et une
                    tâche de maintenance sera ouverte.
                </>
            ),
            confirmText: 'Déclarer l’incident',
            onConfirm: () => {
                updateEquipment(item.id, {
                    status: 'En réparation',
                    repairStartDate: new Date().toISOString(),
                });
                showToast('Incident déclaré. L’équipement est passé en réparation.', 'info');
            },
        });
    };

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

        requestConfirmation({
            title: `Sortir ${item.name} du parc ?`,
            message: (
                <>
                    L’équipement disparaît de l’inventaire et des rapports.{' '}
                    <strong className="text-on-surface font-medium">
                        Son historique est conservé
                    </strong>{' '}
                    et restera consultable depuis le journal d’audit.
                </>
            ),
            tone: 'destructive',
            irreversible: true,
            confirmText: 'Sortir du parc',
            confirmKeyword: 'SUPPRIMER',
            details: [
                ...(holder ? [{ icon: User, label: 'Détenu par', value: holder.name }] : []),
                ...(financialStats
                    ? [
                          {
                              icon: ShieldWarning,
                              label: 'Valeur résiduelle',
                              value: formatCurrency(financialStats.currentValue, settings.currency),
                          },
                      ]
                    : []),
            ],
            onConfirm: () => {
                if (deleteEquipment(item.id)) {
                    showToast(`${item.name} est sorti du parc.`, 'success');
                    if (isDemoSeedEquipment(item.id)) showToast(DEMO_RESEED_NOTICE, 'info');
                    onBack();
                    return;
                }
                showToast('La sortie du parc a échoué.', 'error');
            },
        });
    };

    /** Le geste primaire **suit l'état** — c'est la règle du héro (04.2). */
    const primaryAction = (() => {
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
                        onClick={() => navigate('/wizards/return')}
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
                    onClick={() => navigate('/wizards/return')}
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
        if (item.assignmentStatus === 'PENDING_CONFIRMATION' || item.status === 'En attente') {
            return (
                <Button
                    variant="filled"
                    className="w-full"
                    icon={<Icon glyph={Check} size={20} />}
                    onClick={() => {
                        updateEquipment(item.id, {
                            assignmentStatus: 'CONFIRMED',
                            confirmedAt: new Date().toISOString(),
                        });
                        showToast('Réception confirmée.', 'success');
                    }}
                >
                    Confirmer la réception
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
                    label={item.type}
                    subject={item.model || item.name}
                    metrics={metrics}
                    image={item.image || undefined}
                    facts={item.site ? [{ icon: MapPin, children: item.site }] : undefined}
                    relation={
                        item.status === 'En réparation'
                            ? {
                                  vignette: <Icon glyph={Wrench} size={20} />,
                                  title: item.repairReason || 'En réparation',
                                  detail: `signalé le ${formatDate(item.repairStartDate || item.updatedAt)} · en atelier`,
                              }
                            : item.assignmentStatus === 'PENDING_CONFIRMATION' && holder
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
                                      detail: item.confirmedAt
                                          ? `porteur depuis le ${formatDate(item.confirmedAt)} · réception confirmée`
                                          : 'réception non confirmée',
                                      onOpen: () => navigate(`/users/${holder.id}`),
                                  }
                                : {
                                      vignette: <Icon glyph={Package} size={20} />,
                                      title: 'Non attribué',
                                      detail: item.site ? `en stock au ${item.site}` : 'en stock',
                                  }
                    }
                    actions={primaryAction}
                />
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
                    <ReferenceRow label="Modèle" value={item.model || '—'} quiet={!item.model} />
                    <ReferenceRow label="Mémoire" value={item.ram || '—'} quiet={!item.ram} />
                    <ReferenceRow
                        label="Stockage"
                        value={item.storage || '—'}
                        quiet={!item.storage}
                    />
                    <ReferenceRow label="Système" value={item.os || '—'} quiet={!item.os} />
                    {item.lastReturnCondition && (
                        <ReferenceRow label="Réserve d’usage" value={item.lastReturnCondition} />
                    )}
                </div>
            </section>

            {(warrantyPercent !== null || (financialStats && permissions.canManageInventory)) && (
                <section className="rounded-card bg-surface p-4">
                    <p className="text-body-medium text-on-surface mb-1 flex items-center gap-2.5 font-medium">
                        <Icon glyph={ShieldWarning} size={18} className="text-on-surface-variant" />
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
                                        La garantie a expiré le {formatDate(item.warrantyEnd)} : une
                                        réparation s’impute désormais sur le budget du service.
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
                                tone={financialStats.progressPercent > 80 ? 'attention' : 'neutral'}
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
                                                ).getFullYear() + item.financial.depreciationYears}
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
                                onClick={() =>
                                    navigate(`/audit?targetId=${encodeURIComponent(item.id)}`)
                                }
                            >
                                <span>
                                    {history.length > 0
                                        ? `Les ${history.length} événements`
                                        : 'Tout l’historique'}
                                </span>
                                <span className="text-body-medium text-text-secondary ml-auto font-normal">
                                    dans Audit, filtré sur cet actif
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
