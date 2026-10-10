import React from 'react';
import {
    DotsThreeVertical,
    DownloadSimple,
    Eye,
    Paperclip,
    Repeat,
    Warning,
    X,
} from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import Icon from '../../../components/ui/Icon';
import ListeDeFaits from '../../../components/ui/ListeDeFaits';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import Touche from '../../../components/ui/Touche';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import type { FinanceBudgetItem, FinanceExpense } from '../../../types';
import { EXPENSE_TYPE_LABELS, etatDuJustificatif } from '../lib/expensePresentation';
import { JAUGE } from '../../../lib/jauge';

/** Le geste d'un pied de panneau : 40 de haut, 16 d'intérieur, 14 en 500 (comme Tâches). */
const GESTE = 'h-10 min-h-10 gap-2 rounded-md px-4 text-ts-body leading-ts-body font-medium';

const dateLongue = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? iso
        : new Intl.DateTimeFormat('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          }).format(date);
};

/** « PDF », « Photo » — la sorte de pièce, lue sur son nom. */
const sorteDePiece = (nom: string): string => {
    const extension = nom.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(extension)) return 'Photo';
    return extension ? extension.toUpperCase() : 'Fichier';
};

interface CorpsDeLaDepenseProps {
    depense: FinanceExpense;
    poste: FinanceBudgetItem | null;
    devise: string;
    notationCompacte: boolean;
    /** Les gestes de la pièce à la mesure du doigt — la feuille du téléphone et de la tablette. */
    auDoigt?: boolean;
    onJoindre: () => void;
    onVoir: () => void;
    onTelecharger: () => void;
}

/**
 * **Ce qu'on vient vérifier d'une dépense** — le montant, la pièce, les faits, le poste.
 * Le panneau du bureau et la feuille du téléphone et de la tablette rendent le même corps
 * (10/10) : sous 840, la dépense s'ouvrait encore dans l'ancienne feuille — trois cartes
 * encadrées, « Ce que la machine a lu », l'imputation sous un triangle d'alerte et
 * « Supprimer » en rouge au pied.
 */
export const CorpsDeLaDepense: React.FC<CorpsDeLaDepenseProps> = ({
    depense,
    poste,
    devise,
    notationCompacte,
    auDoigt = false,
    onJoindre,
    onVoir,
    onTelecharger,
}) => {
    const n = (valeur: number) => formatNumber(valeur, notationCompacte);
    const justificatif = etatDuJustificatif(depense);
    const lectureIncertaine =
        justificatif === 'joint' &&
        (depense.extractionConfidence === 'medium' || depense.extractionConfidence === 'low');
    const nomDeLaPiece = depense.sourceFileName || 'Justificatif';
    const part =
        poste && poste.allocated > 0 ? Math.round((poste.spent / poste.allocated) * 100) : 0;
    const reste = poste ? poste.allocated - poste.spent : 0;
    const GESTE_DE_PIECE = cn(
        'text-ts-sub gap-1.5 px-2.5',
        auDoigt ? 'h-10 min-h-10' : 'h-8 min-h-8',
    );

    return (
        <>
            {/* Le montant, et l'état quand il y en a un. */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-baseline gap-1.5">
                    <b className="font-brand text-on-surface text-[2.125rem] leading-10 font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">
                        <ChiffreAnime valeur={n(depense.amount)} />
                    </b>
                    <span className="text-text-secondary text-ts-sub leading-ts-sub">
                        {depense.currencyCode || devise}
                    </span>
                </span>
                {depense.status === 'Pending' && (
                    <span className="text-ts-sub rounded-[4px] bg-[var(--tk-color-tint-ambre)] px-2 leading-6 font-medium text-[var(--tk-color-on-tint-ambre)]">
                        En attente
                    </span>
                )}
                {depense.status === 'Recurring' && (
                    <span className="text-text-secondary text-ts-sub leading-ts-sub flex items-center gap-1">
                        <Icon glyph={Repeat} size={18} />
                        Récurrente
                    </span>
                )}
            </div>

            {/* La pièce — l'aperçu, ou l'invitation à la joindre. */}
            <div className="flex flex-col gap-2.5">
                {justificatif === 'joint' ? (
                    <div className="border-outline-variant flex items-center gap-3.5 rounded-lg border p-3">
                        <span
                            aria-hidden="true"
                            className="border-outline-variant bg-surface flex h-[72px] w-14 shrink-0 flex-col gap-1 rounded-[4px] border px-[7px] pt-[9px] pb-[7px]"
                        >
                            <span className="bg-on-surface-variant block h-[5px] w-6 rounded-[1px]" />
                            <span className="bg-surface-muted-strong mt-1 block h-[3px] w-full" />
                            <span className="bg-surface-muted-strong block h-[3px] w-4/5" />
                            <span className="bg-surface-muted-strong block h-[3px] w-full" />
                            <span className="bg-surface-muted-strong block h-[3px] w-3/5" />
                            <span className="bg-outline mt-auto block h-1 w-[18px] self-end" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                {nomDeLaPiece}
                            </span>
                            <span className="text-text-secondary text-ts-sub leading-ts-sub block">
                                {sorteDePiece(nomDeLaPiece)} · justificatif joint
                            </span>
                        </span>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={onVoir}
                            className={GESTE_DE_PIECE}
                        >
                            <Icon glyph={Eye} size={18} />
                            Voir
                        </Button>
                        <Button
                            variant="outlined"
                            iconOnly
                            size="sm"
                            aria-label="Télécharger le justificatif"
                            onClick={onTelecharger}
                            className={cn(auDoigt ? 'h-10 w-10' : 'h-8 w-8')}
                        >
                            <Icon glyph={DownloadSimple} size={18} />
                        </Button>
                    </div>
                ) : (
                    <div className="border-outline-variant flex items-center gap-3.5 rounded-lg border border-dashed p-3">
                        <span className="bg-surface-container text-text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                            <Icon glyph={Paperclip} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-on-surface text-ts-body leading-ts-body block font-medium">
                                {justificatif === 'manquant'
                                    ? 'Aucun justificatif'
                                    : 'Justificatif facultatif'}
                            </span>
                        </span>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={onJoindre}
                            className={GESTE_DE_PIECE}
                        >
                            <Icon glyph={Paperclip} size={18} />
                            Joindre
                        </Button>
                    </div>
                )}
                {lectureIncertaine && (
                    <p className="text-ts-sub leading-ts-sub flex items-start gap-2 rounded-md bg-[var(--tk-color-tint-ambre)] px-3.5 py-2.5 text-[var(--tk-color-on-tint-ambre)]">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        <span>
                            <b className="font-semibold">
                                {depense.extractionConfidence === 'low'
                                    ? 'Lecture incertaine.'
                                    : 'Lecture partielle.'}
                            </b>{' '}
                            Comparez le montant et la date au document.
                        </span>
                    </p>
                )}
            </div>

            {/* Les faits de la facture — la liste commune à tous les détails (10/10). */}
            <ListeDeFaits
                label="Les faits de la facture"
                chiffres
                faits={[
                    ['Date de la facture', dateLongue(depense.date)],
                    [
                        'N° de facture',
                        depense.invoiceNumber || (
                            <span className="text-text-secondary">non renseigné</span>
                        ),
                    ],
                    ['Nature', EXPENSE_TYPE_LABELS[depense.type]],
                ]}
            />

            {/* Le poste, et ce qu'il y reste. */}
            {poste && (
                <section className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-text-secondary text-ts-sub leading-ts-sub min-w-0 truncate font-medium">
                            Le poste {poste.category}
                        </h3>
                        <span className="text-text-secondary text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                            <b className="text-on-surface font-semibold">{n(poste.spent)}</b> sur{' '}
                            {n(poste.allocated)}
                        </span>
                    </div>
                    <span className={cn('bg-surface-muted-strong block overflow-hidden', JAUGE)}>
                        <span
                            className={cn(
                                'mvt-jauge duration-medium2 ease-emphasized block h-full transition-[width]',
                                reste < 0
                                    ? 'bg-[var(--tk-color-st-orange)]'
                                    : 'bg-[var(--tk-color-st-vert)]',
                            )}
                            style={{ width: `${Math.min(100, part)}%` }}
                        />
                    </span>
                    <p className="text-text-secondary text-ts-sub leading-ts-sub">
                        {part} % consommés ·{' '}
                        {reste >= 0 ? (
                            <>
                                il reste{' '}
                                <b className="text-on-surface font-medium tabular-nums">
                                    {n(reste)} {devise}
                                </b>
                            </>
                        ) : (
                            <>
                                dépassé de{' '}
                                <b className="font-semibold text-[var(--tk-color-on-tint-orange)] tabular-nums">
                                    {n(-reste)} {devise}
                                </b>
                            </>
                        )}
                    </p>
                </section>
            )}
        </>
    );
};

interface PanneauDeDepenseProps {
    depense: FinanceExpense;
    /** Le poste qui a compté la dépense (`posteDeLaDepense`), s'il existe sur l'exercice. */
    poste: FinanceBudgetItem | null;
    devise: string;
    notationCompacte: boolean;
    /** Les marques de touches — sous un pointeur fin seulement. */
    touches: boolean;
    onFermer: () => void;
    onModifier: () => void;
    onMarquerPayee: () => void;
    onJoindre: () => void;
    onVoir: () => void;
    onTelecharger: () => void;
    onSupprimer: () => void;
}

/**
 * **La dépense ouverte, à côté du journal** (27/09) — le second volet des Dépenses au
 * bureau, là où le produit ouvrait une feuille à voile qui masquait la liste. Même forme que
 * le panneau de Tâches : l'en-tête (le poste en surtitre, le fournisseur, l'objet), puis ce
 * qu'on vient vérifier, et les gestes au pied.
 *
 * Ce qu'on vient vérifier, dans l'ordre :
 * 1. **le montant**, et son état s'il en a un — *payée* ne se marque pas, c'est la normale ;
 * 2. **la pièce** : l'aperçu et ses deux gestes, ou l'invitation à la joindre ; la lecture
 *    de la facture ne se signale que quand elle est incertaine (moyenne ou faible) ;
 * 3. **les faits** de la facture ;
 * 4. **le poste**, et ce qu'il y reste — une information, pas un avertissement : l'ancienne
 *    feuille la posait sous un triangle d'alerte.
 *
 * « Supprimer » quitte le pied pour le ⋮ : un geste destructif n'est pas le geste principal
 * d'une dépense qu'on relit. « Marquer payée » n'existe que sur une dépense en attente.
 */
const PanneauDeDepense: React.FC<PanneauDeDepenseProps> = ({
    depense,
    poste,
    devise,
    notationCompacte,
    touches,
    onFermer,
    onModifier,
    onMarquerPayee,
    onJoindre,
    onVoir,
    onTelecharger,
    onSupprimer,
}) => {
    const justificatif = etatDuJustificatif(depense);

    const actes: MenuItem[] = [
        ...(justificatif === 'joint'
            ? [{ id: 'remplacer', label: 'Remplacer le justificatif', onSelect: onJoindre }]
            : []),
        {
            id: 'supprimer',
            label: 'Supprimer',
            destructive: true,
            dividerBefore: justificatif === 'joint',
            onSelect: onSupprimer,
        },
    ];

    return (
        <div className="bg-surface @container flex h-full min-h-0 flex-col overflow-hidden rounded-xl">
            <div
                key={depense.id}
                className="mvt-contenu flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-5"
            >
                {/* L'en-tête — le poste, le fournisseur, l'objet. */}
                <div className="flex flex-col gap-1">
                    <div className="-mt-1.5 -mr-3 flex items-center justify-between gap-3">
                        <p className="text-text-secondary min-w-0 truncate text-[0.75rem] leading-4 font-medium tracking-[0.06em] uppercase">
                            {poste?.category ?? EXPENSE_TYPE_LABELS[depense.type]}
                        </p>
                        <span className="flex shrink-0 items-center gap-0.5">
                            <Menu
                                align="end"
                                floating
                                title={depense.supplier}
                                items={actes}
                                trigger={
                                    <Button
                                        variant="text"
                                        iconOnly
                                        size="sm"
                                        aria-label={`Autres actes sur ${depense.supplier}`}
                                        className="text-text-secondary h-8 w-8"
                                    >
                                        <Icon glyph={DotsThreeVertical} size={20} />
                                    </Button>
                                }
                            />
                            <Button
                                variant="text"
                                iconOnly
                                size="sm"
                                aria-label="Fermer la dépense"
                                aria-keyshortcuts="Escape"
                                onClick={onFermer}
                                className="text-text-secondary h-8 w-8"
                            >
                                <Icon glyph={X} size={20} />
                            </Button>
                        </span>
                    </div>
                    <h2 className="font-brand text-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em] text-pretty">
                        {depense.supplier}
                    </h2>
                    {depense.description?.trim() && (
                        <p className="text-text-secondary text-ts-body leading-ts-body">
                            {depense.description}
                        </p>
                    )}
                </div>

                <CorpsDeLaDepense
                    depense={depense}
                    poste={poste}
                    devise={devise}
                    notationCompacte={notationCompacte}
                    onJoindre={onJoindre}
                    onVoir={onVoir}
                    onTelecharger={onTelecharger}
                />
            </div>

            {/* Le pied — le clavier à gauche, les gestes à droite. */}
            <div className="border-outline-variant flex flex-wrap items-center gap-2.5 border-t px-5 py-3">
                {touches && (
                    <span className="text-text-tertiary hidden items-center gap-1 text-[0.75rem] leading-4 @min-[560px]:flex">
                        <Touche>J</Touche>
                        <Touche>K</Touche>
                        <span className="ml-0.5">dépense suivante</span>
                    </span>
                )}
                <span className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
                    <Button variant="outlined" className={GESTE} onClick={onModifier}>
                        Modifier
                    </Button>
                    {depense.status === 'Pending' && (
                        <Button variant="filled" className={GESTE} onClick={onMarquerPayee}>
                            Marquer payée
                        </Button>
                    )}
                </span>
            </div>
        </div>
    );
};

export default PanneauDeDepense;
