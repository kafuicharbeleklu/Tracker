import React, { useMemo } from 'react';
import { ArrowSquareOut, Warning } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import Touche from '../../../components/ui/Touche';
import { getCategoryLabel } from '../../../constants/glossary';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import {
    formatCurrency,
    formatNumber,
    getBudgetCategoryByExpenseType,
} from '../../../lib/financial';
import { NOM_SUR_UNE_LIGNE } from '../../../lib/nomLong';
import { cn } from '../../../lib/utils';
import type { ApprovalStatus, Equipment } from '../../../types';
import { NATURE_MOT, dateLabel, daysSince, type Task } from '../lib/file';
import { etapesDeLaFrise } from '../lib/parcours';
import { ageDeLObjet, unitesARemettre } from '../lib/unites';

/**
 * **Les motifs courants d'un refus** — une puce remplit le motif, qui reste modifiable.
 * Le demandeur le lira tel quel : ce sont des phrases, pas des codes.
 */
const MOTIFS_COURANTS: Record<string, string[]> = {
    'WAITING_MANAGER_APPROVAL>Rejected': [
        'Son équipement actuel suffit',
        'Budget épuisé sur ce poste',
        'Demande en double',
        'À revoir au prochain exercice',
    ],
    'WAITING_IT_PROCESSING>Rejected': [
        'Aucune unité ne convient',
        'Demande en double',
        'Hors de la politique d’équipement',
    ],
    'WAITING_DOTATION_APPROVAL>WAITING_IT_PROCESSING': [
        'L’unité proposée ne convient pas',
        'Un autre modèle est attendu',
    ],
    'PENDING_DELIVERY>Rejected': [
        'Objet jamais reçu',
        'Objet endommagé',
        'Ce n’est pas le modèle demandé',
    ],
};

type TonDuFait = 'ok' | 'att' | 'neutre';

const TON: Record<TonDuFait, string> = {
    ok: 'text-[var(--tk-color-st-vert)]',
    att: 'text-[var(--tk-color-st-ambre)]',
    neutre: 'text-on-surface-variant',
};

interface Fait {
    cle: string;
    libelle: string;
    valeur: string;
    note?: string;
    ton?: TonDuFait;
}

export interface EtatDuRefus {
    ouvert: boolean;
    motif: string;
    /** Le motif manquait au moment de refuser : le champ le dit. */
    manque?: boolean;
}

interface PanneauDeTacheProps {
    tache: Task;
    /** Les marques des touches — au bureau, sous un pointeur fin. */
    touches: boolean;
    /** L'unité choisie pour une remise. */
    unite: string | null;
    onUnite: (id: string) => void;
    refus: EtatDuRefus;
    onRefus: (etat: EtatDuRefus) => void;
    /** L'acte principal — valider, remettre, confirmer, ouvrir. */
    onPrincipal: () => void;
    /** Refuser, le motif écrit. */
    onRefuser: () => void;
    /** L'écran de la demande (06.5). */
    onDetail?: () => void;
    onAnnulerDemande?: () => void;
    onRelancer?: () => void;
}

/** Le libellé du geste principal, tel que le pied l'écrit. */
export const libelleDuPrincipal = (tache: Task, uniteChoisie: Equipment | null): string | null => {
    if (tache.transition) {
        return tache.force
            ? `${tache.action ?? 'Valider'} à sa place`
            : (tache.action ?? 'Valider');
    }
    if (tache.assign) return uniteChoisie ? `Remettre ${uniteChoisie.name}` : 'Choisir et remettre';
    if (tache.reception) return tache.action ?? 'Confirmer';
    if (tache.deviceId) return 'Examiner';
    if (tache.target && tache.targetId) return tache.action ?? 'Ouvrir la fiche';
    return null;
};

/**
 * **Le panneau de décision** — 03.3 au bureau, refondu le 26/09.
 *
 * Il portait le motif et une ligne de contexte, puis deux boutons de même poids ; 400 px
 * restaient vides dessous. Il montre désormais **ce qui fait le oui ou le non** sans
 * quitter la file :
 *
 * - **les faits** — ce que ça coûte et ce qu'il reste sur la ligne du budget, ce qu'il y a
 *   en stock, ce que la personne détient déjà ;
 * - **l'unité à remettre**, choisie sur place quand l'informatique remet ;
 * - **le parcours** — qui a déjà validé, qui a la main ;
 * - un pied qui reste en bas : **un seul acte appuyé**, « Refuser » en second, et le motif
 *   du refus qui s'écrit dans le pied (motifs courants, texte libre).
 *
 * Les touches (J/K, A, R, Entrée) se lisent dans le pied, au bureau seulement.
 */
const PanneauDeTache: React.FC<PanneauDeTacheProps> = ({
    tache,
    touches,
    unite,
    onUnite,
    refus,
    onRefus,
    onPrincipal,
    onRefuser,
    onDetail,
    onAnnulerDemande,
    onRelancer,
}) => {
    const { approvals, equipment, users, settings, events } = useData();
    const { financeBudgets } = useFinanceData();
    const { user: currentUser, permissions } = useAccessControl();

    const demande = useMemo(
        () => approvals.find((item) => item.id === tache.approvalId) ?? null,
        [approvals, tache.approvalId],
    );
    const beneficiaire = useMemo(
        () => users.find((person) => person.id === demande?.beneficiaryId) ?? null,
        [users, demande?.beneficiaryId],
    );

    /** Ce qui peut être remis pour cette demande : même catégorie, le site d'abord. */
    const unites = useMemo<Equipment[]>(
        () => (demande ? unitesARemettre(equipment, demande, beneficiaire?.site) : []),
        [equipment, demande, beneficiaire?.site],
    );

    const faits = useMemo<Fait[]>(() => {
        /* Les faits servent à décider : une demande close, ou qui attend quelqu'un d'autre
           sans geste possible ici, ne les montre pas. */
        const aDecider = Boolean(tache.transition || tache.assign || tache.refusal);
        if (!demande || demande.status === 'PENDING_DELIVERY' || !aDecider) return [];
        const out: Fait[] = [];
        const categorie = getCategoryLabel(demande.equipmentCategory).toLowerCase();

        /* Le coût, et ce qu'il reste sur la ligne du matériel — pour qui lit la finance. */
        const ligne = permissions.canViewFinance
            ? financeBudgets
                  .find((budget) => budget.year === new Date().getFullYear())
                  ?.items.find(
                      (item) => item.category === getBudgetCategoryByExpenseType('Purchase'),
                  )
            : undefined;
        const reste = ligne ? ligne.allocated - ligne.spent : null;
        const cout = demande.estimatedCost;
        out.push({
            cle: 'cout',
            libelle: 'Coût estimé',
            valeur:
                typeof cout === 'number' ? formatCurrency(cout, settings.currency) : 'Non chiffré',
            note:
                ligne && reste !== null
                    ? `${ligne.category} : ${formatNumber(reste)} restants`
                    : undefined,
            ton:
                reste !== null && typeof cout === 'number'
                    ? cout > reste
                        ? 'att'
                        : 'ok'
                    : 'neutre',
        });

        if (demande.status === 'WAITING_DOTATION_APPROVAL') {
            const proposee = equipment.find((item) => item.id === demande.assignedEquipmentId);
            const age = proposee ? ageDeLObjet(proposee) : null;
            out.push({
                cle: 'proposee',
                libelle: 'Unité proposée',
                valeur: demande.assignedEquipmentName ?? 'Aucune',
                note: [proposee?.model, age?.mot].filter(Boolean).join(' · ') || undefined,
                ton: 'neutre',
            });
        } else {
            const site = beneficiaire?.site;
            const auSite = site
                ? unites.filter((item) => item.site === site).length
                : unites.length;
            const ailleurs = unites.length - auSite;
            out.push({
                cle: 'stock',
                libelle: 'En stock',
                valeur:
                    unites.length === 0
                        ? 'Aucune unité'
                        : `${auSite} unité${auSite > 1 ? 's' : ''}`,
                note:
                    unites.length === 0
                        ? 'à commander'
                        : [
                              site ? `au ${site}` : null,
                              auSite === 0 && ailleurs > 0 ? `${ailleurs} ailleurs` : null,
                          ]
                              .filter(Boolean)
                              .join(' · ') || undefined,
                ton: unites.length === 0 || auSite === 0 ? 'att' : 'ok',
            });
        }

        const detenus = equipment.filter((item) => item.user?.id === demande.beneficiaryId);
        const pareils = detenus
            .filter((item) => item.type === demande.equipmentCategory)
            .sort((a, b) => (ageDeLObjet(b)?.ans ?? 0) - (ageDeLObjet(a)?.ans ?? 0));
        const plusAncien = pareils[0];
        const ageAncien = plusAncien ? ageDeLObjet(plusAncien) : null;
        out.push({
            cle: 'detient',
            libelle: 'Détient déjà',
            valeur:
                pareils.length > 0
                    ? `${pareils.length} ${categorie}${pareils.length > 1 ? 's' : ''}`
                    : 'Rien de tel',
            note: plusAncien
                ? [plusAncien.name, ageAncien?.mot].filter(Boolean).join(' · ')
                : detenus.length > 0
                  ? `${detenus.length} objet${detenus.length > 1 ? 's' : ''} en tout`
                  : 'aucun objet',
            ton: ageAncien && ageAncien.ans >= 3 ? 'att' : 'neutre',
        });
        return out;
    }, [
        demande,
        tache.transition,
        tache.assign,
        tache.refusal,
        beneficiaire?.site,
        equipment,
        financeBudgets,
        permissions.canViewFinance,
        settings.currency,
        unites,
    ]);

    const manager = useMemo(
        () =>
            beneficiaire?.managerId
                ? users.find((person) => person.id === beneficiaire.managerId)
                : undefined,
        [users, beneficiaire?.managerId],
    );

    /* La frise de la maquette ; auteurs et heures viennent du journal. */
    const frise = useMemo(
        () =>
            demande
                ? etapesDeLaFrise({
                      demande,
                      users,
                      evenements: events,
                      nomDuManager: manager?.name,
                  })
                : null,
        [demande, users, events, manager?.name],
    );

    /* Qui a validé — la trace du journal, jamais une supposition. */
    const validePar = useMemo(() => {
        if (!demande) return undefined;
        return [...events]
            .reverse()
            .find(
                (event) =>
                    event.targetType === 'APPROVAL' &&
                    event.targetId === demande.id &&
                    event.metadata?.from === 'WAITING_MANAGER_APPROVAL' &&
                    event.metadata?.to === 'WAITING_IT_PROCESSING',
            )?.actorName;
    }, [demande, events]);

    const uniteChoisie = unites.find((item) => item.id === unite) ?? null;
    const principal = libelleDuPrincipal(tache, uniteChoisie);
    const motifs =
        demande && tache.refusal
            ? (MOTIFS_COURANTS[`${demande.status}>${tache.refusal.nextStatus as ApprovalStatus}`] ??
              [])
            : [];
    const verbeDuRefus = tache.refusal?.nextStatus === 'Rejected' ? 'Refuser' : 'Renvoyer';

    /** « aujourd'hui », « hier », « il y a 6 j ». */
    const ilYA = (iso?: string) => {
        const jours = daysSince(iso ?? null);
        if (jours === null) return '';
        if (jours === 0) return 'aujourd’hui';
        if (jours === 1) return 'hier';
        return `il y a ${jours} j`;
    };

    const sousLigne = demande
        ? [
              beneficiaire?.department,
              beneficiaire?.site,
              tache.scope === 'history'
                  ? `${tache.context} le ${dateLabel(tache.since)}${tache.decidedBy ? ` par ${tache.decidedBy}` : ''}`
                  : `demandée ${ilYA(demande.createdAt)} par ${demande.requesterName}`,
              tache.scope !== 'history' && validePar ? `validée par ${validePar}` : null,
          ]
              .filter(Boolean)
              .join(' · ')
        : [tache.who, tache.context].filter(Boolean).join(' · ');

    /** Le geste d'un pied de panneau : 40 de haut, 16 d'intérieur, 14 en 500 (maquette). */
    const GESTE = 'h-10 min-h-10 gap-2 rounded-md px-4 text-[0.875rem] leading-5 font-medium';

    return (
        <div className="bg-surface @container flex h-full min-h-0 flex-col overflow-hidden rounded-xl">
            <div
                key={tache.id}
                className="mvt-contenu flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto overscroll-contain px-6 py-5"
            >
                {/* L'en-tête — la nature et l'urgence, l'objet et pour qui, puis qui l'a
                    demandé et qui l'a validé. */}
                <div className="flex flex-col gap-1">
                    <p className="text-text-secondary flex items-center gap-2.5 text-[0.75rem] leading-4 font-medium tracking-[0.06em] uppercase">
                        {NATURE_MOT[tache.nature]}
                        {tache.urgent && (
                            <span className="flex items-center gap-1 text-[0.6875rem] leading-4 font-semibold tracking-normal text-[var(--tk-color-st-rouge)] normal-case">
                                <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 rounded-full bg-[var(--tk-color-st-rouge)]"
                                />
                                Urgent
                            </span>
                        )}
                    </p>
                    <h2 className="font-brand text-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em] text-pretty">
                        {tache.title}
                        {demande &&
                            ` pour ${demande.beneficiaryId === currentUser?.id ? 'vous' : demande.beneficiaryName}`}
                    </h2>
                    <p className="text-text-secondary text-[0.8125rem] leading-5">{sousLigne}</p>
                </div>

                {/* Ce qu'un autre doit faire, et que le super administrateur peut forcer. */}
                {tache.force && (
                    <p className="flex items-start gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.125rem] text-[var(--tk-color-on-tint-ambre)]">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        Attend {tache.force}. Vous pouvez agir à sa place.
                    </p>
                )}

                {(tache.reason || tache.quote) && (
                    <blockquote className="bg-surface-container text-on-surface text-ts-body leading-ts-body rounded-md px-3.5 py-2.5 italic">
                        «&nbsp;{tache.reason || tache.quote}&nbsp;»
                    </blockquote>
                )}

                {/* Les faits de la décision — trois cartes côte à côte dès 520 de panneau ; en
                    deçà, une seule carte à trois lignes. */}
                {faits.length > 0 && (
                    <dl className="border-outline-variant divide-outline-variant grid grid-cols-1 divide-y rounded-md border @min-[520px]:grid-cols-3 @min-[520px]:gap-2.5 @min-[520px]:divide-y-0 @min-[520px]:rounded-none @min-[520px]:border-0">
                        {faits.map((fait) => (
                            <div
                                key={fait.cle}
                                className="@min-[520px]:border-outline-variant flex min-w-0 items-start justify-between gap-3 px-3 py-2.5 @min-[520px]:flex-col @min-[520px]:justify-start @min-[520px]:gap-0.5 @min-[520px]:rounded-md @min-[520px]:border"
                            >
                                <dt className="text-text-secondary pt-0.5 text-[0.75rem] leading-4 @min-[520px]:pt-0">
                                    {fait.libelle}
                                </dt>
                                <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right @min-[520px]:items-start @min-[520px]:text-left">
                                    <span className="text-on-surface text-[0.9375rem] leading-5 font-semibold tabular-nums">
                                        {fait.valeur}
                                    </span>
                                    {fait.note && (
                                        <span
                                            className={cn(
                                                'text-[0.75rem] leading-4',
                                                TON[fait.ton ?? 'neutre'],
                                            )}
                                        >
                                            {fait.note}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}

                {/* L'unité à remettre — choisie ici ; la feuille de remise l'atteste. */}
                {tache.assign && (
                    <section>
                        <h3 className="text-text-secondary mb-1.5 text-[0.75rem] leading-4 font-medium">
                            Unité à remettre
                        </h3>
                        {unites.length > 0 ? (
                            <div
                                role="radiogroup"
                                aria-label="Unité à remettre"
                                className="flex flex-col gap-1.5"
                            >
                                {unites.slice(0, 4).map((item) => {
                                    const choisie = item.id === unite;
                                    const age = ageDeLObjet(item);
                                    const recue = item.financial?.purchaseDate
                                        ? new Date(item.financial.purchaseDate)
                                        : null;
                                    return (
                                        <Button
                                            key={item.id}
                                            variant="text"
                                            layout="card"
                                            role="radio"
                                            aria-checked={choisie}
                                            onClick={() => onUnite(item.id)}
                                            className={cn(
                                                'h-auto min-h-0 w-full items-center gap-2.5 rounded-md border px-3 py-2 text-[0.8125rem] leading-[1.125rem] font-normal',
                                                'duration-short4 transition-[border-color,box-shadow,background-color]',
                                                choisie
                                                    ? 'border-inverse-surface shadow-[inset_0_0_0_1px_var(--tk-color-inverse-surface)]'
                                                    : 'border-outline-variant hover:bg-surface-container/50',
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'h-4 w-4 shrink-0 rounded-full transition-[border-width]',
                                                    choisie
                                                        ? 'border-inverse-surface border-[5px]'
                                                        : 'border-outline border-[1.5px]',
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    'text-text-secondary flex-1',
                                                    NOM_SUR_UNE_LIGNE,
                                                )}
                                            >
                                                <b className="text-on-surface font-semibold">
                                                    {item.name}
                                                </b>
                                                {[
                                                    item.model !== demande?.equipmentModel
                                                        ? item.model
                                                        : null,
                                                    item.site,
                                                    recue && !Number.isNaN(recue.getTime())
                                                        ? `reçue le ${recue.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', ...(recue.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })}`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .map((morceau) => ` · ${morceau}`)
                                                    .join('')}
                                            </span>
                                            {age && (
                                                <span className="text-text-secondary shrink-0 tabular-nums">
                                                    {age.mot}
                                                </span>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-[0.8125rem] leading-[1.125rem]">
                                Aucune unité disponible de ce type. La feuille de remise permet d’en
                                choisir une autre.
                            </p>
                        )}
                    </section>
                )}

                {/* La frise du parcours — une étape par ligne, un point par étape. */}
                {frise && (
                    <section>
                        <h3 className="text-text-secondary mb-1.5 text-[0.75rem] leading-4 font-medium">
                            Parcours
                        </h3>
                        <ol className="border-outline-variant ml-1.5 flex flex-col border-l-2 pl-3.5">
                            {frise.map((etape, index) => (
                                <li
                                    key={index}
                                    aria-current={etape.etat === 'ici' ? 'step' : undefined}
                                    className={cn(
                                        'relative py-[3px] text-[0.8125rem] leading-[1.125rem]',
                                        etape.etat === 'ici'
                                            ? 'text-on-surface font-medium'
                                            : etape.etat === 'arret'
                                              ? 'text-[var(--tk-color-st-rouge)]'
                                              : 'text-text-secondary',
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'absolute top-2 -left-5 h-2.5 w-2.5 rounded-full border-2',
                                            etape.etat === 'franchie'
                                                ? 'border-[var(--tk-color-st-vert)] bg-[var(--tk-color-st-vert)]'
                                                : etape.etat === 'ici'
                                                  ? 'bg-primary border-on-surface'
                                                  : etape.etat === 'arret'
                                                    ? 'border-[var(--tk-color-st-rouge)] bg-[var(--tk-color-st-rouge)]'
                                                    : 'bg-surface border-outline',
                                        )}
                                    />
                                    {etape.texte}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* Au doigt, pas de touche Entrée à rappeler : la porte vers la demande est écrite. */}
                {onDetail && !touches && (
                    <Button
                        variant="text"
                        onClick={onDetail}
                        icon={<Icon glyph={ArrowSquareOut} size={18} />}
                        className="border-outline-variant text-on-surface min-h-12 w-full justify-start gap-2 rounded-none border-t px-0"
                    >
                        Ouvrir le détail de la demande
                    </Button>
                )}
            </div>

            {/* Le pied — il reste en bas du panneau, quoi qu'il y ait au-dessus. */}
            {refus.ouvert && tache.refusal ? (
                <form
                    className="border-outline-variant flex flex-col gap-3 border-t px-6 pt-4 pb-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!refus.motif.trim()) {
                            onRefus({ ...refus, manque: true });
                            document.getElementById('motif-du-refus')?.focus();
                            return;
                        }
                        onRefuser();
                    }}
                >
                    <label
                        htmlFor="motif-du-refus"
                        className="text-text-secondary text-[0.75rem] leading-4 font-medium"
                    >
                        Motif — {tache.refusal.requesterName} le lira tel quel
                    </label>
                    {motifs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {motifs.map((motif) => (
                                <FacetChip
                                    key={motif}
                                    dense
                                    label={motif}
                                    selected={refus.motif === motif}
                                    onClick={() => {
                                        onRefus({ ouvert: true, motif });
                                        document.getElementById('motif-du-refus')?.focus();
                                    }}
                                    className="min-h-8"
                                />
                            ))}
                        </div>
                    )}
                    <TextArea
                        id="motif-du-refus"
                        autoFocus
                        value={refus.motif}
                        onChange={(event) => onRefus({ ouvert: true, motif: event.target.value })}
                        onKeyDown={(event) => {
                            /* Ctrl/⌘ + Entrée refuse ; Échap referme le pied, pas la tâche. */
                            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                event.currentTarget.form?.requestSubmit();
                            } else if (event.key === 'Escape') {
                                event.preventDefault();
                                event.stopPropagation();
                                onRefus({ ouvert: false, motif: '' });
                            }
                        }}
                        rows={2}
                        placeholder="Écrire le motif…"
                        error={
                            refus.manque
                                ? 'Le motif est obligatoire : c’est le seul texte que la personne recevra.'
                                : undefined
                        }
                        className="min-h-16"
                    />
                    <div className="flex items-center justify-end gap-2.5">
                        <Button
                            variant="text"
                            className={GESTE}
                            onClick={() => onRefus({ ouvert: false, motif: '' })}
                        >
                            Garder la demande
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            className={cn(
                                GESTE,
                                'bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90',
                            )}
                        >
                            {verbeDuRefus}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="border-outline-variant flex flex-wrap items-center gap-2.5 border-t px-6 py-3">
                    {touches && (
                        <span className="text-text-tertiary hidden items-center gap-3 text-[0.75rem] leading-4 @min-[560px]:flex">
                            <span className="flex items-center gap-1">
                                <Touche>J</Touche>
                                <Touche>K</Touche>
                                <span className="ml-0.5">tâche suivante</span>
                            </span>
                            {onDetail && (
                                <Button
                                    variant="text"
                                    size="sm"
                                    onClick={onDetail}
                                    aria-keyshortcuts="Enter"
                                    className="text-text-tertiary hover:text-on-surface h-auto min-h-0 gap-1 p-0 text-[0.75rem] leading-4 font-normal hover:bg-transparent"
                                >
                                    <Touche>↵</Touche>
                                    <span className="ml-0.5">détail</span>
                                </Button>
                            )}
                        </span>
                    )}
                    <span className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
                        {tache.remind && onRelancer && (
                            <Button variant="outlined" className={GESTE} onClick={onRelancer}>
                                Relancer
                            </Button>
                        )}
                        {tache.cancel && onAnnulerDemande && (
                            <Button variant="outlined" className={GESTE} onClick={onAnnulerDemande}>
                                Annuler ma demande
                            </Button>
                        )}
                        {tache.refusal && (
                            <Button
                                variant="outlined"
                                className={GESTE}
                                onClick={() => onRefus({ ouvert: true, motif: '' })}
                                aria-keyshortcuts={touches ? 'R' : undefined}
                            >
                                {verbeDuRefus}
                                {touches && <Touche>R</Touche>}
                            </Button>
                        )}
                        {principal && (
                            <Button
                                variant="filled"
                                className={GESTE}
                                onClick={onPrincipal}
                                aria-keyshortcuts={touches ? 'A' : undefined}
                            >
                                {principal}
                                {touches && (
                                    <Touche className="border-b border-black/20 text-current opacity-70">
                                        A
                                    </Touche>
                                )}
                            </Button>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
};

export default PanneauDeTache;
