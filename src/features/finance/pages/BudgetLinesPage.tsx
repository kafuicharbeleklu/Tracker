import React, { useState } from 'react';
import {
    ArrowLeft,
    Check,
    CheckCircle,
    DotsThreeVertical,
    Plus,
    WarningCircle,
} from '@phosphor-icons/react';

import AmountField from '../../../components/ui/AmountField';
import Button from '../../../components/ui/Button';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import Modal from '../../../components/ui/Modal';
import SegmentedButton from '../../../components/ui/SegmentedButton';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import type { FinanceBudgetItem, FinanceExpenseType } from '../../../types';

/**
 * **15.2 — Lignes du budget : ajuster les enveloppes.**
 *
 * *« Ce qu'on projette, et la seule limite qui s'y oppose. »* Chaque poste porte son
 * enveloppe et son consommé ; le total se compare à l'enveloppe de l'exercice. **Une
 * ligne ne descend pas sous ce qu'elle a déjà dépensé** — c'est la seule règle, et elle
 * se dit **sur la ligne fautive**, pas en tête de page.
 *
 * Le produit ouvrait à la place « Définir le Budget Annuel », une boîte générique : un
 * sélecteur d'import, trois lignes pré-remplies d'exemple, un bouton « Valider le Budget »
 * — et aucune trace du consommé, donc aucun moyen de voir qu'on ramenait une enveloppe
 * sous ce qu'elle avait déjà payé. Cette boîte reste le chemin d'un **nouvel exercice**
 * (et de l'import d'un fichier) ; l'ajustement des lignes existantes est ici.
 *
 * - **Téléphone** : la barre à retour et « Enregistrer », le héro sombre (l'enveloppe, ce
 *   qui est réparti, l'état), puis la carte des lignes — nom, consommé sur enveloppe, ⋮,
 *   jauge, étiquette et restant ; le refus en une phrase sous la ligne.
 * - **Bureau** : le patron de 04.1, mais **le tableau s'édite** — six colonnes (ligne et
 *   famille, consommé, enveloppe en champ, jauge, restant, ⋮), et **le pied totalise**.
 *   Annuler et Enregistrer dans l'en-tête ; le héro devient le sous-titre.
 *
 * La page enregistre : les montants forment un ensemble (exception déclarée à la règle
 * du geste, comme les identifiants d'une source de collecte en 14.1). L'enregistrement
 * reste offert quand une ligne est refusée : c'est la ligne qui bloque, pas la page.
 *
 * *Écart assumé* : 15.2 écrit « Supprimer · 18 dépenses ». Le produit ne rattache pas
 * encore une dépense à sa ligne (relevé du 10/09) ; la suppression se ferme donc dès que
 * la ligne **a consommé**, et le dit ainsi.
 */

interface Ligne {
    cle: string;
    category: string;
    /** L'enveloppe tapée, en chiffres nus. */
    montant: string;
    spent: number;
    type: FinanceExpenseType;
    capitalization?: 'CAPEX' | 'OPEX';
}

interface BudgetLinesPageProps {
    year: number;
    onBack: () => void;
}

const versLigne = (item: FinanceBudgetItem, index: number): Ligne => ({
    cle: `${index}-${item.category}`,
    category: item.category,
    montant: String(Math.round(item.allocated)),
    spent: item.spent,
    type: item.type,
    capitalization: item.capitalization,
});

/** La nature comptable d'un nom de poste — la même lecture que la saisie d'un exercice. */
const natureDe = (category: string): FinanceExpenseType => {
    const bas = category.toLowerCase();
    if (bas.includes('licence') || bas.includes('logiciel') || bas.includes('software'))
        return 'License';
    if (bas.includes('cloud') || bas.includes('hébergement') || bas.includes('infrastructure'))
        return 'Cloud';
    if (bas.includes('maintenance') || bas.includes('service')) return 'Service';
    return 'Purchase';
};

type Dialogue =
    | { type: 'montant'; cle: string }
    | { type: 'renommer'; cle: string }
    | { type: 'ajouter' }
    | null;

const BudgetLinesPage: React.FC<BudgetLinesPageProps> = ({ year, onBack }) => {
    const bureau = useMediaQuery(MEDIA.expandedUp);
    const { settings } = useData();
    const { financeBudgets, upsertFinanceBudget } = useFinanceData();
    const { showToast } = useToast();
    const n = (v: number) => formatNumber(v, settings.compactNotation);

    const exercice = financeBudgets.find((budget) => budget.year === year);
    const [lignes, setLignes] = useState<Ligne[]>(() => (exercice?.items ?? []).map(versLigne));
    const [dialogue, setDialogue] = useState<Dialogue>(null);
    const [brouillon, setBrouillon] = useState({ nom: '', montant: '', cap: 'OPEX' });

    const reparti = lignes.reduce((somme, l) => somme + (Number(l.montant) || 0), 0);
    const consomme = lignes.reduce((somme, l) => somme + l.spent, 0);
    /* L'enveloppe de l'exercice. Un exercice sans enveloppe déclarée prend ce qui est
       réparti : il n'a pas de « libre » à dire. */
    const enveloppe = exercice?.totalAllocated || reparti;
    const libre = enveloppe - reparti;
    const refusees = lignes.filter((l) => (Number(l.montant) || 0) < l.spent);

    const mettreAJour = (cle: string, patch: Partial<Ligne>) =>
        setLignes((prev) => prev.map((l) => (l.cle === cle ? { ...l, ...patch } : l)));

    const actes = (ligne: Ligne): MenuItem[] => [
        ...(bureau
            ? []
            : [
                  {
                      id: 'montant',
                      label: 'Modifier le montant',
                      onSelect: () => {
                          setBrouillon((b) => ({ ...b, montant: ligne.montant }));
                          setDialogue({ type: 'montant', cle: ligne.cle });
                      },
                  },
              ]),
        {
            id: 'renommer',
            label: 'Renommer',
            onSelect: () => {
                setBrouillon((b) => ({ ...b, nom: ligne.category }));
                setDialogue({ type: 'renommer', cle: ligne.cle });
            },
        },
        {
            id: 'bascule',
            label: ligne.capitalization === 'CAPEX' ? 'Passer en OPEX' : 'Passer en CAPEX',
            onSelect: () =>
                mettreAJour(ligne.cle, {
                    capitalization: ligne.capitalization === 'CAPEX' ? 'OPEX' : 'CAPEX',
                }),
        },
        {
            id: 'supprimer',
            label: 'Supprimer',
            disabled: ligne.spent > 0,
            description: ligne.spent > 0 ? 'déjà consommée' : undefined,
            onSelect: () => setLignes((prev) => prev.filter((l) => l.cle !== ligne.cle)),
        },
    ];

    const enregistrer = () => {
        if (refusees.length > 0) {
            showToast(
                `${refusees.length} ligne${refusees.length > 1 ? 's' : ''} à corriger avant d'enregistrer.`,
                'warning',
            );
            return;
        }
        upsertFinanceBudget({
            year,
            status: exercice?.status ?? (year < new Date().getFullYear() ? 'Clôturé' : 'En cours'),
            totalAllocated: Math.max(enveloppe, reparti),
            items: lignes.map((l) => ({
                category: l.category,
                type: l.type,
                allocated: Number(l.montant) || 0,
                spent: l.spent,
                capitalization: l.capitalization,
            })),
            sourceFileName: exercice?.sourceFileName,
        });
        showToast(`Lignes du budget ${year} enregistrées.`, 'success');
        onBack();
    };

    const valider = () => {
        if (!dialogue) return;
        if (dialogue.type === 'ajouter') {
            const nom = brouillon.nom.trim();
            if (!nom) return;
            setLignes((prev) => [
                ...prev,
                {
                    cle: `nouvelle-${Date.now()}`,
                    category: nom,
                    montant: brouillon.montant,
                    spent: 0,
                    type: natureDe(nom),
                    capitalization: brouillon.cap as 'CAPEX' | 'OPEX',
                },
            ]);
        } else if (dialogue.type === 'renommer') {
            const nom = brouillon.nom.trim();
            if (nom) mettreAJour(dialogue.cle, { category: nom });
        } else {
            mettreAJour(dialogue.cle, { montant: brouillon.montant });
        }
        setDialogue(null);
    };

    /** Le restant d'une ligne et ce qu'il dit. */
    const lire = (ligne: Ligne) => {
        const montant = Number(ligne.montant) || 0;
        const restant = montant - ligne.spent;
        const part = montant > 0 ? (ligne.spent / montant) * 100 : ligne.spent > 0 ? 100 : 0;
        return { montant, restant, part, ko: restant < 0, epuisee: restant === 0 && montant > 0 };
    };

    const etiquette = (ligne: Ligne) =>
        ligne.capitalization ? (
            <span className="bg-surface-container text-on-surface-variant inline-flex h-5 items-center rounded-[4px] px-1.5 text-[0.75rem] leading-4 font-medium">
                {ligne.capitalization}
            </span>
        ) : null;

    const menuDe = (ligne: Ligne) => (
        <Menu
            align="end"
            floating
            title={ligne.category}
            items={actes(ligne)}
            trigger={
                <Button variant="text" iconOnly aria-label={`Actes sur ${ligne.category}`}>
                    <Icon glyph={DotsThreeVertical} size={20} />
                </Button>
            }
        />
    );

    const sousTitre = `Exercice ${year} · enveloppe ${n(enveloppe)} ${settings.currency} · ${n(reparti)} répartis, ${
        libre > 0 ? `${n(libre)} libres` : libre === 0 ? 'rien de libre' : `${n(-libre)} au-delà`
    }`;

    const vide = (
        <CardEmptyState
            glyph={Plus}
            title="Aucune ligne pour cet exercice"
            description="Chaque poste porte une enveloppe ; les dépenses s'y imputent ensuite."
            action={
                <Button variant="tonal" onClick={() => setDialogue({ type: 'ajouter' })}>
                    Ajouter une ligne
                </Button>
            }
        />
    );

    // ---- bureau --------------------------------------------------------------------
    const tableau = (
        <div className="rounded-card bg-surface overflow-hidden">
            <table className="w-full table-fixed border-collapse text-left text-[0.875rem] leading-5">
                <colgroup>
                    <col />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '170px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '190px' }} />
                    <col style={{ width: '48px' }} />
                </colgroup>
                <thead>
                    <tr className="border-outline-variant text-on-surface-variant h-10 border-b text-[0.75rem] leading-4 font-medium">
                        <th className="px-2.5 pl-4">Ligne</th>
                        <th className="px-2.5 text-right">Consommé</th>
                        <th className="px-2.5 text-right">Enveloppe</th>
                        <th className="px-2.5">
                            <span className="sr-only">Part consommée</span>
                        </th>
                        <th className="px-2.5 text-right">Restant</th>
                        <th>
                            <span className="sr-only">Actes</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {lignes.map((ligne) => {
                        const { restant, part, ko } = lire(ligne);
                        const idRaison = `raison-${ligne.cle}`;
                        return (
                            <tr key={ligne.cle} className="border-outline-variant border-b">
                                <td className="py-2.5 pr-2.5 pl-4 align-middle">
                                    <span className="text-on-surface block truncate">
                                        {ligne.category}
                                    </span>
                                    <span className="text-on-surface-variant mt-0.5 flex items-center gap-2 text-[0.75rem] leading-4">
                                        {etiquette(ligne)}
                                        {ligne.spent > 0 ? 'déjà consommée' : 'rien de consommé'}
                                    </span>
                                </td>
                                <td className="text-on-surface-variant px-2.5 text-right align-middle tabular-nums">
                                    {n(ligne.spent)}
                                </td>
                                <td className="px-2.5 align-middle">
                                    <AmountField
                                        value={ligne.montant}
                                        onChange={(montant) => mettreAJour(ligne.cle, { montant })}
                                        invalid={ko}
                                        aria-label={`Enveloppe de ${ligne.category}`}
                                        aria-describedby={ko ? idRaison : undefined}
                                    />
                                </td>
                                <td className="px-2.5 align-middle">
                                    <span className="bg-surface-container block h-2 overflow-hidden rounded-xs">
                                        <i
                                            className={cn(
                                                'block h-full',
                                                ko || part >= 100
                                                    ? 'bg-[var(--tk-color-st-orange)]'
                                                    : 'bg-[var(--tk-color-st-vert)]',
                                            )}
                                            style={{ width: `${Math.min(part, 100)}%` }}
                                        />
                                    </span>
                                </td>
                                <td className="px-2.5 text-right align-middle tabular-nums">
                                    <span
                                        className={cn(
                                            'block',
                                            ko
                                                ? 'text-[var(--tk-color-st-orange)]'
                                                : 'text-on-surface',
                                        )}
                                    >
                                        {ko ? `− ${n(-restant)}` : n(restant)}
                                    </span>
                                    {ko && (
                                        <span
                                            id={idRaison}
                                            className="block text-[0.75rem] leading-4 text-[var(--tk-color-st-orange)]"
                                        >
                                            Pas de baisse sous le consommé.
                                        </span>
                                    )}
                                </td>
                                <td className="px-1 align-middle">{menuDe(ligne)}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="h-12">
                        <td className="pl-2">
                            <Button
                                variant="text"
                                size="sm"
                                icon={<Icon glyph={Plus} size={18} />}
                                onClick={() => {
                                    setBrouillon({ nom: '', montant: '', cap: 'OPEX' });
                                    setDialogue({ type: 'ajouter' });
                                }}
                            >
                                Ajouter une ligne
                            </Button>
                        </td>
                        <td className="text-on-surface-variant px-2.5 text-right tabular-nums">
                            {n(consomme)}
                        </td>
                        <td className="text-on-surface px-2.5 text-right font-medium tabular-nums">
                            {n(reparti)}
                        </td>
                        <td className="text-on-surface-variant px-2.5 text-[0.75rem] leading-4 tabular-nums">
                            sur {n(enveloppe)}
                        </td>
                        <td
                            className={cn(
                                'px-2.5 text-right tabular-nums',
                                libre < 0 ? 'text-[var(--tk-color-st-orange)]' : 'text-on-surface',
                            )}
                        >
                            {libre >= 0 ? `${n(libre)} libres` : `${n(-libre)} au-delà`}
                        </td>
                        <td />
                    </tr>
                </tfoot>
            </table>
        </div>
    );

    // ---- téléphone -----------------------------------------------------------------
    const cartes = (
        <>
            <section className="bg-inverse-surface text-inverse-on-surface rounded-card px-5 pt-[22px] pb-5">
                <span className="block text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                    Exercice {year} · lignes du budget
                </span>
                <div className="mt-2 flex items-baseline gap-2.5">
                    <b className="font-brand text-[2.75rem] leading-[3rem] font-semibold tracking-[-0.03em] tabular-nums">
                        {n(enveloppe)}
                    </b>
                    <span className="text-ts-sub leading-ts-sub text-[var(--tk-color-on-dark-2)]">
                        {settings.currency}
                    </span>
                </div>
                <span className="text-ts-sub leading-ts-sub mt-1 block text-[var(--tk-color-on-dark-2)]">
                    enveloppe · {n(reparti)} répartis,{' '}
                    {libre > 0
                        ? `${n(libre)} libres`
                        : libre === 0
                          ? 'rien de libre'
                          : `${n(-libre)} au-delà`}
                </span>
                <span className="mt-4 flex items-center gap-2 text-[0.8125rem] leading-5">
                    <Icon
                        glyph={refusees.length > 0 ? WarningCircle : CheckCircle}
                        size={18}
                        className={
                            refusees.length > 0
                                ? 'text-[var(--tk-color-live-ambre)]'
                                : 'text-[var(--tk-color-live-vert)]'
                        }
                    />
                    {refusees.length > 0
                        ? `${refusees.length} ligne${refusees.length > 1 ? 's' : ''} à corriger`
                        : 'Tout tient dans l’enveloppe'}
                </span>
            </section>

            <section className="rounded-card bg-surface px-4 py-2">
                <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                    <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                        Les lignes
                    </h3>
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                        {lignes.length}
                    </span>
                </div>
                {lignes.length === 0
                    ? vide
                    : lignes.map((ligne) => {
                          const { montant, restant, part, ko, epuisee } = lire(ligne);
                          return (
                              <div
                                  key={ligne.cle}
                                  className="border-outline-variant flex flex-col gap-2 border-t py-3 first:border-t-0"
                              >
                                  <div className="flex items-center gap-2">
                                      <span className="text-on-surface text-ts-body leading-ts-body min-w-0 flex-1 truncate">
                                          {ligne.category}
                                      </span>
                                      <span className="text-on-surface-variant text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                          <b className="text-on-surface font-medium">
                                              {n(ligne.spent)}
                                          </b>{' '}
                                          /{' '}
                                          <span
                                              className={cn(
                                                  ko && 'text-[var(--tk-color-st-orange)]',
                                              )}
                                          >
                                              {n(montant)}
                                          </span>
                                      </span>
                                      <span className="-mr-2 shrink-0">{menuDe(ligne)}</span>
                                  </div>
                                  <span className="bg-surface-container block h-2 overflow-hidden rounded-xs">
                                      <i
                                          className={cn(
                                              'block h-full',
                                              ko || part >= 100
                                                  ? 'bg-[var(--tk-color-st-orange)]'
                                                  : 'bg-[var(--tk-color-st-vert)]',
                                          )}
                                          style={{ width: `${Math.min(part, 100)}%` }}
                                      />
                                  </span>
                                  <span className="text-on-surface-variant flex items-center gap-2 text-[0.75rem] leading-4">
                                      {etiquette(ligne)}
                                      {ko
                                          ? `${n(-restant)} au-delà de l'enveloppe`
                                          : epuisee
                                            ? 'enveloppe épuisée'
                                            : `${n(restant)} restants`}
                                  </span>
                                  {ko && (
                                      <span className="flex items-center gap-1.5 text-[0.75rem] leading-4 text-[var(--tk-color-st-orange)]">
                                          <Icon glyph={WarningCircle} size={18} />
                                          Pas de baisse sous le consommé.
                                      </span>
                                  )}
                              </div>
                          );
                      })}
                {lignes.length > 0 && (
                    <Button
                        variant="text"
                        icon={<Icon glyph={Plus} size={20} />}
                        onClick={() => {
                            setBrouillon({ nom: '', montant: '', cap: 'OPEX' });
                            setDialogue({ type: 'ajouter' });
                        }}
                        className="border-outline-variant text-ts-body min-h-12 w-full justify-start rounded-none border-t px-0 font-medium"
                    >
                        Ajouter une ligne
                    </Button>
                )}
            </section>
        </>
    );

    return (
        <div className="bg-background flex min-w-0 flex-1 flex-col">
            <IconGestureSizeContext.Provider value={bureau ? 40 : 48}>
                {bureau ? (
                    /* `.dhead` de 17.11 : retour, titre et sous-titre, puis Annuler et
                       Enregistrer. Le héro du téléphone devient le sous-titre. */
                    <header className="px-page flex items-center gap-3 pt-5">
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour aux finances"
                            onClick={onBack}
                        >
                            <Icon glyph={ArrowLeft} size={20} />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="font-brand text-on-surface text-ts-page leading-ts-page truncate font-semibold tracking-[-0.02em]">
                                Lignes du budget
                            </h1>
                            <p className="text-on-surface-variant mt-0.5 truncate text-[0.8125rem] leading-4 tabular-nums">
                                {sousTitre}
                            </p>
                        </div>
                        <Button variant="outlined" onClick={onBack}>
                            Annuler
                        </Button>
                        <Button
                            variant="tonal"
                            icon={<Icon glyph={Check} size={20} />}
                            onClick={enregistrer}
                        >
                            Enregistrer
                        </Button>
                    </header>
                ) : (
                    /* `.tbar.stick` — retour, titre, et « Enregistrer » en geste de texte. */
                    <header className="border-outline-variant bg-surface sticky top-0 z-20 flex min-h-14 items-center gap-1 border-b pr-2 pl-1">
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour aux finances"
                            onClick={onBack}
                        >
                            <Icon glyph={ArrowLeft} size={24} />
                        </Button>
                        <h1 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium">
                            Lignes du budget
                        </h1>
                        <Button variant="text" onClick={enregistrer} className="font-medium">
                            Enregistrer
                        </Button>
                    </header>
                )}
            </IconGestureSizeContext.Provider>

            <div className="medium:px-page flex flex-col gap-4 px-4 pt-4 pb-6">
                {bureau ? (
                    <>
                        {lignes.length === 0 ? (
                            <div className="rounded-card bg-surface flex min-h-80 flex-col">
                                {vide}
                            </div>
                        ) : (
                            tableau
                        )}
                        {refusees.length > 0 && (
                            <p className="bg-tint-ambre text-on-tint-ambre flex items-center gap-2 self-start rounded-md px-3.5 py-2.5 text-[0.8125rem] leading-5">
                                <Icon glyph={WarningCircle} size={18} />
                                <span>
                                    <b className="font-medium">
                                        {refusees.length} ligne{refusees.length > 1 ? 's' : ''} à
                                        corriger
                                    </b>{' '}
                                    avant d'enregistrer — c'est la ligne qui bloque, pas la page.
                                </span>
                            </p>
                        )}
                    </>
                ) : (
                    cartes
                )}
            </div>

            <Modal
                isOpen={dialogue !== null}
                onClose={() => setDialogue(null)}
                title={
                    dialogue?.type === 'ajouter'
                        ? 'Nouvelle ligne'
                        : dialogue?.type === 'renommer'
                          ? 'Renommer la ligne'
                          : 'Modifier le montant'
                }
                footer={
                    <>
                        <Button variant="outlined" onClick={() => setDialogue(null)}>
                            Annuler
                        </Button>
                        <Button variant="tonal" onClick={valider}>
                            {dialogue?.type === 'ajouter' ? 'Ajouter' : 'Valider'}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    {(dialogue?.type === 'ajouter' || dialogue?.type === 'renommer') && (
                        <InputField
                            label="Nom du poste"
                            value={brouillon.nom}
                            onChange={(event) =>
                                setBrouillon((b) => ({ ...b, nom: event.target.value }))
                            }
                            autoFocus
                        />
                    )}
                    {(dialogue?.type === 'ajouter' || dialogue?.type === 'montant') && (
                        <InputField
                            label={`Enveloppe (${settings.currency})`}
                            inputMode="numeric"
                            value={brouillon.montant}
                            onChange={(event) =>
                                setBrouillon((b) => ({
                                    ...b,
                                    montant: event.target.value.replace(/\D/g, ''),
                                }))
                            }
                            autoFocus={dialogue?.type === 'montant'}
                        />
                    )}
                    {dialogue?.type === 'ajouter' && (
                        <SegmentedButton
                            options={[
                                { value: 'CAPEX', label: 'CAPEX — investissement' },
                                { value: 'OPEX', label: 'OPEX — frais courant' },
                            ]}
                            value={brouillon.cap}
                            onChange={(value) =>
                                typeof value === 'string' &&
                                setBrouillon((b) => ({ ...b, cap: value }))
                            }
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default BudgetLinesPage;
