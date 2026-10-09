import React, { useMemo } from 'react';
import { Warning } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import CloseButton from '../../../components/ui/CloseButton';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import Touche from '../../../components/ui/Touche';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useJournalComplet } from '../../../hooks/useJournalComplet';
import { cn } from '../../../lib/utils';
import type { ApprovalStatus } from '../../../types';
import { NATURE_MOT, daysSince, type Task } from '../lib/file';
import { parcoursDeLaDemande, type Registres } from '../../history/lib/journal';
import {
    FilDeLaDemande,
    INTITULE,
    SignaturesDeLaDemande,
} from '../../history/components/ParcoursDeDemande';
import { useDossierDeTache } from '../hooks/useDossierDeTache';
import DetailDeTache from './DetailDeTache';
import ExamenDeMachine from './ExamenDeMachine';

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
    refus: EtatDuRefus;
    onRefus: (etat: EtatDuRefus) => void;
    /** L'acte principal — valider, remettre, confirmer, ouvrir. */
    onPrincipal: () => void;
    /** Refuser, le motif écrit. */
    onRefuser: () => void;
    onAnnulerDemande?: () => void;
    onRelancer?: () => void;
    /** Ignorer une machine remontée — la collecte. */
    onIgnorer?: () => void;
    /** Ouvrir la fiche d'un actif — les candidats d'une collecte. */
    onOuvrirActif?: (id: string) => void;
    /**
     * **Où il se pose** (08/10). `panneau` — la colonne de droite du bureau. `feuille` — la
     * feuille du téléphone : la même tâche, le même détail, une croix pour fermer, un pied qui
     * reste en bas pendant qu'on fait défiler, deux gestes au doigt.
     */
    surface?: 'panneau' | 'feuille';
    /** Fermer la feuille — `surface="feuille"`. */
    onFermer?: () => void;
    /**
     * Refuser **ailleurs** : au téléphone, le refus passe par la feuille d'acte (motif et
     * attestation, 17.4) plutôt que par le motif du pied.
     */
    onDemanderRefus?: () => void;
}

/** Le libellé du geste principal, tel que le pied l'écrit. */
export const libelleDuPrincipal = (tache: Task): string | null => {
    if (tache.transition) {
        return tache.force
            ? `${tache.action ?? 'Valider'} à sa place`
            : (tache.action ?? 'Valider');
    }
    /* L'unité se choisit dans « Remettre l'équipement », pas dans le détail (08/10). */
    if (tache.assign) return 'Remettre';
    if (tache.reception) return tache.action ?? 'Confirmer';
    /* L'examen est dans le panneau : le geste est l'import (08/10). */
    if (tache.deviceId) return 'Importer au parc';
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
    refus,
    onRefus,
    onPrincipal,
    onRefuser,
    onAnnulerDemande,
    onRelancer,
    onIgnorer,
    onOuvrirActif,
    surface = 'panneau',
    onFermer,
    onDemanderRefus,
}) => {
    const enFeuille = surface === 'feuille';
    const { approvals, equipment, users, events, detectedDevices } = useData();
    useJournalComplet();
    const { user: currentUser } = useAccessControl();

    const demande = useMemo(
        () => approvals.find((item) => item.id === tache.approvalId) ?? null,
        [approvals, tache.approvalId],
    );
    const beneficiaire = useMemo(
        () => users.find((person) => person.id === demande?.beneficiaryId) ?? null,
        [users, demande?.beneficiaryId],
    );

    /** Ce qui peut être remis pour cette demande : même catégorie, le site d'abord. */

    /* **Le parcours, celui de l'historique** (08/10) — la frise à points en 13 de la maquette
       du 26/09 racontait la demande autrement que la fiche de l'historique et l'écran de la
       demande ; les trois lisent maintenant le même parcours, avec les mêmes pièces. */
    const registres = useMemo<Registres>(
        () => ({
            equipment: new Map(equipment.map((item) => [item.id, item])),
            approvals: new Map(approvals.map((item) => [item.id, item])),
        }),
        [equipment, approvals],
    );
    const parcours = useMemo(
        () =>
            demande
                ? parcoursDeLaDemande(demande.id, events, registres, users, currentUser?.id)
                : null,
        [demande, events, registres, users, currentUser?.id],
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

    /* Une réparation, un retour, une remise, une réception : leur dossier (08/10). */
    const dossier = useDossierDeTache(tache);
    /* Une collecte : la machine remontée, examinée ici comme ailleurs au téléphone. */
    const machine = tache.deviceId
        ? (detectedDevices.find((device) => device.id === tache.deviceId) ?? null)
        : null;

    const principal = libelleDuPrincipal(tache);
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
              `demandée ${ilYA(demande.createdAt)} par ${demande.requesterName}`,
              validePar ? `validée par ${validePar}` : null,
          ]
              .filter(Boolean)
              .join(' · ')
        : (dossier?.sousLigne ?? [tache.who, tache.context].filter(Boolean).join(' · '));

    /** Le geste d'un pied de panneau : 40 de haut, 16 d'intérieur, 14 en 500 (maquette). Au
        téléphone, la taille du doigt (`Button` par défaut). */
    const GESTE = enFeuille
        ? ''
        : 'h-10 min-h-10 gap-2 rounded-md px-4 text-[0.875rem] leading-5 font-medium';

    return (
        <div
            className={
                enFeuille
                    ? '@container flex flex-col'
                    : 'bg-surface @container flex h-full min-h-0 flex-col overflow-hidden rounded-xl'
            }
        >
            <div
                key={tache.id}
                className={
                    enFeuille
                        ? 'mvt-contenu flex flex-col gap-4.5 pb-4'
                        : 'mvt-contenu flex min-h-0 flex-1 flex-col gap-4.5 overflow-y-auto overscroll-contain px-5 py-5'
                }
            >
                {/* L'en-tête — la nature et l'urgence, l'objet et pour qui, puis qui l'a
                    demandé et qui l'a validé. Dans la feuille, la croix à droite. */}
                <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
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
                        <p className="text-text-secondary text-[0.8125rem] leading-5">
                            {sousLigne}
                        </p>
                    </div>
                    {enFeuille && onFermer && <CloseButton onClick={onFermer} />}
                </div>

                {/* Ce qu'un autre doit faire, et que le super administrateur peut forcer. */}
                {tache.force && (
                    <p className="flex items-start gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-3.5 py-2.5 text-[0.8125rem] leading-[1.125rem] text-[var(--tk-color-on-tint-ambre)]">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        Attend {tache.force}. Vous pouvez agir à sa place.
                    </p>
                )}

                {/* Un dossier porte ses motifs dans son parcours. */}
                {(tache.reason || (!dossier && tache.quote)) && (
                    <blockquote className="bg-surface-container text-on-surface text-ts-body leading-ts-body rounded-md px-3.5 py-2.5 italic">
                        «&nbsp;{tache.reason || tache.quote}&nbsp;»
                    </blockquote>
                )}

                {dossier && <DetailDeTache dossier={dossier} />}
                {machine && (
                    <ExamenDeMachine
                        machine={machine}
                        onOuvrirActif={(id) => onOuvrirActif?.(id)}
                    />
                )}

                {/* Le parcours et ses signatures — les pièces de l'historique. Pas de liste des
                    parties prenantes (08/10) : le parcours nomme déjà chacune, avec son rôle. */}
                {parcours && (
                    <section>
                        <h3 className={INTITULE}>Le parcours de la demande</h3>
                        <FilDeLaDemande parcours={parcours} />
                    </section>
                )}
                {parcours && (
                    <SignaturesDeLaDemande
                        etapes={parcours.etapes}
                        registres={registres}
                        titre={<h3 className={INTITULE}>Les signatures</h3>}
                    />
                )}
            </div>

            {/* Le pied — il reste en bas du panneau, quoi qu'il y ait au-dessus. Dans la feuille,
                il colle au bas pendant qu'on fait défiler le parcours. */}
            {refus.ouvert && tache.refusal && !enFeuille ? (
                <form
                    className="border-outline-variant flex flex-col gap-3 border-t px-5 pt-4 pb-5"
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
                <div
                    className={cn(
                        'border-outline-variant flex flex-wrap items-center gap-2.5 border-t',
                        enFeuille
                            ? 'bg-surface sticky bottom-0 -mx-5 -mb-3 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]'
                            : 'px-5 py-3',
                    )}
                >
                    {touches && (
                        <span className="text-text-tertiary hidden items-center gap-3 text-[0.75rem] leading-4 @min-[560px]:flex">
                            <span className="flex items-center gap-1">
                                <Touche>J</Touche>
                                <Touche>K</Touche>
                                <span className="ml-0.5">tâche suivante</span>
                            </span>
                        </span>
                    )}
                    <span
                        className={cn(
                            enFeuille
                                ? 'duo-de-pied w-full gap-3'
                                : 'ml-auto flex flex-wrap items-center justify-end gap-2.5',
                        )}
                    >
                        {tache.remind && onRelancer && (
                            <Button variant="outlined" className={GESTE} onClick={onRelancer}>
                                Relancer
                            </Button>
                        )}
                        {onIgnorer && (
                            <Button variant="outlined" className={GESTE} onClick={onIgnorer}>
                                Ignorer
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
                                onClick={
                                    onDemanderRefus ?? (() => onRefus({ ouvert: true, motif: '' }))
                                }
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
