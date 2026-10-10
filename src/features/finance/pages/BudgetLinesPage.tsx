import React, { useState } from 'react';
import {
    Calculator,
    Check,
    CheckCircle,
    DotsThreeVertical,
    Plus,
    WarningCircle,
} from '@phosphor-icons/react';

import AmountField from '../../../components/ui/AmountField';
import NatureBadge, { NATURE_TEINTE } from '../components/NatureBadge';
import BarreDePage from '../../../components/layout/BarreDePage';
import Button from '../../../components/ui/Button';
import ListActionFab from '../../../components/ui/ListActionFab';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import FlecheDeRetour from '../../../components/ui/FlecheDeRetour';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import BottomSheet from '../../../components/ui/BottomSheet';
import Chip from '../../../components/ui/Chip';
import { FieldLabel, FormWarn, OptionRow } from '../../../components/ui/FormParts';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import { CORPS_BUREAU, PAGE_BUREAU } from '../../../lib/regimeBureau';
import type { FinanceBudgetItem, FinanceExpenseType } from '../../../types';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import ChiffreAjuste from '../../../components/ui/ChiffreAjuste';
import { JAUGE, JAUGE_RANGEE } from '../../../lib/jauge';

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

    /** Ouvrir la saisie d'une ligne neuve — le bouton flottant, le pied du tableau, le vide. */
    const ajouter = () => {
        setBrouillon({ nom: '', montant: '', cap: 'OPEX' });
        setDialogue({ type: 'ajouter' });
    };

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

    /* Ce que la feuille sait de la ligne ouverte, et ce qu'elle peut dire avant le geste. */
    const ligneOuverte =
        dialogue && dialogue.type !== 'ajouter'
            ? lignes.find((l) => l.cle === dialogue.cle)
            : undefined;
    const nomPris =
        dialogue !== null &&
        dialogue.type !== 'montant' &&
        lignes.some(
            (l) =>
                l.cle !== ligneOuverte?.cle &&
                l.category.trim().toLowerCase() === brouillon.nom.trim().toLowerCase(),
        );
    const sousLeConsomme =
        dialogue?.type === 'montant' &&
        (Number(brouillon.montant) || 0) < (ligneOuverte?.spent ?? 0);
    /** Les postes des autres exercices qui manquent à celui-ci — de vraies lignes, pas des exemples. */
    const suggestions = (() => {
        const presents = new Set(lignes.map((l) => l.category.trim().toLowerCase()));
        const vus = new Map<string, FinanceBudgetItem>();
        [...financeBudgets]
            .filter((b) => b.year !== year)
            .sort((a, b) => b.year - a.year)
            .forEach((b) =>
                b.items.forEach((item) => {
                    const cle = item.category.trim().toLowerCase();
                    if (!presents.has(cle) && !vus.has(cle)) vus.set(cle, item);
                }),
            );
        return [...vus.values()].slice(0, 6);
    })();
    /** L'effet sur l'enveloppe de l'exercice, dit avant « Ajouter ». */
    const effet = (() => {
        if (dialogue === null || dialogue.type === 'renommer') return null;
        const saisi = Number(brouillon.montant) || 0;
        if (saisi === 0) return null;
        const avant = dialogue.type === 'montant' ? Number(ligneOuverte?.montant) || 0 : 0;
        const apres = reparti - avant + saisi;
        const cur = settings.currency;
        if (!exercice?.totalAllocated)
            return { depasse: false, texte: `Le budget ${year} passera à ${n(apres)} ${cur}.` };
        const reste = exercice.totalAllocated - apres;
        return reste >= 0
            ? { depasse: false, texte: `Il restera ${n(reste)} ${cur} à répartir.` }
            : {
                  depasse: true,
                  texte: `Dépasse l'enveloppe de ${n(-reste)} ${cur} : elle passera à ${n(apres)} ${cur}.`,
              };
    })();
    const validable =
        dialogue?.type === 'montant'
            ? !sousLeConsomme
            : brouillon.nom.trim().length > 0 && !nomPris;

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

    const etiquette = (ligne: Ligne) => <NatureBadge nature={ligne.capitalization} />;

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
        /* Le vide ne double pas le geste d'ajout — un seul par écran (17.7) : le bouton
           flottant au téléphone, « Ajouter une ligne » sous la synthèse au bureau (25/09).
           Son rond dit l'objet, pas le geste : le « + » s'y lisait comme un bouton. */
        <CardEmptyState
            glyph={Calculator}
            title="Aucune ligne pour cet exercice"
            description="Chaque poste porte une enveloppe ; les dépenses s'y imputent ensuite."
        />
    );

    // ---- bureau --------------------------------------------------------------------
    const tableau = (
        <div className="rounded-card bg-surface overflow-hidden">
            <table className="w-full table-fixed border-collapse text-left text-[0.875rem] leading-5">
                <colgroup>
                    <col />
                    {/* Resserrées le 24/09 : le tableau tient 8 colonnes sur 12 à côté de
                        l'enveloppe, et 708 px de chiffres ne laissaient que 40 au nom. La jauge
                        rend encore 12 px le 07/10 : à 1 366, barre latérale ouverte, il en
                        manquait 8 à « Maintenance & Services ». */}
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '84px' }} />
                    <col style={{ width: '132px' }} />
                    <col style={{ width: '48px' }} />
                </colgroup>
                <thead>
                    {/* La graisse se pose sur les cellules : un `th` natif est gras et n'hérite pas
                        du `font-medium` de sa rangée — les en-têtes sortaient en 700, hors des deux
                        graisses du système (relevé du 26/09). */}
                    <tr className="border-outline-variant text-on-surface-variant h-10 border-b text-[0.75rem] leading-4 [&>th]:font-medium">
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
                                    <span
                                        title={ligne.category}
                                        className="text-on-surface block truncate"
                                    >
                                        {ligne.category}
                                    </span>
                                    {/* Une cellule de tableau ne rogne pas : la phrase passait
                                        sous le montant de la colonne voisine. Elle paraît
                                        **entière ou pas du tout** — elle redit ce que la colonne
                                        « Consommé » chiffre — en passant, faute de place, sur
                                        une seconde ligne que la cellule ne montre pas. Le témoin
                                        de largeur nulle tient la première ligne quand la ligne
                                        n'a pas de nature. */}
                                    <span className="text-on-surface-variant mt-0.5 flex h-5 flex-wrap items-center gap-x-2 overflow-hidden text-[0.75rem] leading-4">
                                        <span aria-hidden="true" className="-mr-2 h-5 w-0" />
                                        {etiquette(ligne)}
                                        <span className="whitespace-nowrap">
                                            {ligne.spent > 0
                                                ? 'déjà consommée'
                                                : 'rien de consommé'}
                                        </span>
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
                                    <span
                                        className={cn(
                                            'bg-surface-container block overflow-hidden',
                                            JAUGE_RANGEE,
                                        )}
                                    >
                                        <i
                                            className={cn(
                                                'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
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
                        {/* Le pied totalise ; l'ajout est au bout de la colonne de droite. */}
                        <td className="text-on-surface-variant pl-4 text-[0.75rem] leading-4 font-medium">
                            Total · {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
                        </td>
                        <td className="text-on-surface-variant px-2.5 text-right tabular-nums">
                            {n(consomme)}
                        </td>
                        <td className="text-on-surface px-2.5 text-right font-medium tabular-nums">
                            {n(reparti)}
                        </td>
                        <td />
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

    /**
     * **Le côté de l'enveloppe, au bureau** (24/09). Le tableau courait seul sur 1 200 px :
     * quatre lignes, et l'enveloppe réduite à un sous-titre en 13. La colonne de droite
     * la pose en chiffre, dit en une barre ce qui est consommé, réparti et libre, la
     * part de chaque nature, et porte le geste d'ajout.
     */
    const parNature = (['CAPEX', 'OPEX'] as const).map((cap) => ({
        cap,
        mot: cap === 'CAPEX' ? 'Investissement' : 'Frais courants',
        somme: lignes
            .filter((l) => l.capitalization === cap)
            .reduce((t, l) => t + (Number(l.montant) || 0), 0),
    }));
    const base = Math.max(enveloppe, reparti, 1);
    const segments = [
        { cle: 'consomme', mot: 'Consommé', v: consomme, teinte: 'bg-on-surface' },
        {
            cle: 'reparti',
            mot: 'Réparti, à consommer',
            v: Math.max(0, reparti - consomme),
            teinte: 'bg-[var(--tk-color-st-vert)]',
        },
        {
            cle: 'libre',
            mot: libre >= 0 ? 'Libre' : 'Au-delà de l’enveloppe',
            v: Math.abs(libre),
            teinte: libre >= 0 ? 'bg-surface-container-high' : 'bg-[var(--tk-color-st-orange)]',
        },
    ];
    const cote = (
        <aside className="rounded-card bg-surface flex flex-col gap-5 p-4">
            <div>
                <p className="text-on-surface-variant text-[0.75rem] leading-4 font-medium">
                    Enveloppe {year}
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                    <b className="font-brand text-on-surface text-ts-page leading-ts-page font-semibold tracking-[-0.02em] tabular-nums">
                        <ChiffreAnime valeur={n(enveloppe)} />
                    </b>
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub">
                        {settings.currency}
                    </span>
                </p>
            </div>
            <div>
                <div className={cn('bg-surface-container flex overflow-hidden', JAUGE)}>
                    {segments.map((seg) => (
                        <i
                            key={seg.cle}
                            className={cn(
                                'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                'block h-full',
                                seg.teinte,
                            )}
                            style={{ width: `${(seg.v / base) * 100}%` }}
                        />
                    ))}
                </div>
                <ul className="mt-4 flex flex-col gap-2.5">
                    {segments.map((seg) => (
                        <li
                            key={seg.cle}
                            className="text-ts-sub leading-ts-sub flex items-center gap-2.5"
                        >
                            <i className={cn('h-2.5 w-2.5 shrink-0 rounded-[2px]', seg.teinte)} />
                            <span className="text-on-surface-variant min-w-0 flex-1 truncate">
                                {seg.mot}
                            </span>
                            <span
                                className={cn(
                                    'tabular-nums',
                                    seg.cle === 'libre' && libre < 0
                                        ? 'text-[var(--tk-color-st-orange)]'
                                        : 'text-on-surface',
                                )}
                            >
                                {n(seg.v)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="border-outline-variant border-t pt-4">
                <p className="text-on-surface-variant mb-3 text-[0.75rem] leading-4 font-medium">
                    Par nature
                </p>
                <ul className="flex flex-col gap-3">
                    {parNature.map((nat) => {
                        const part = reparti > 0 ? Math.round((nat.somme / reparti) * 100) : 0;
                        return (
                            <li key={nat.cap}>
                                <span className="text-ts-sub leading-ts-sub flex items-baseline gap-2">
                                    <span className="text-on-surface min-w-0 flex-1 truncate">
                                        {nat.mot}
                                        <span className="text-text-tertiary"> · {nat.cap}</span>
                                    </span>
                                    <span className="text-on-surface tabular-nums">
                                        {n(nat.somme)}
                                    </span>
                                    <span className="text-text-tertiary w-10 text-right tabular-nums">
                                        {part} %
                                    </span>
                                </span>
                                <span
                                    className={cn(
                                        'bg-surface-container mt-2 block overflow-hidden',
                                        JAUGE_RANGEE,
                                    )}
                                >
                                    <i
                                        className={cn(
                                            'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                            'block h-full',
                                            NATURE_TEINTE[nat.cap].barre,
                                        )}
                                        style={{ width: `${part}%` }}
                                    />
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {refusees.length > 0 && (
                <p className="bg-tint-ambre text-on-tint-ambre flex gap-2 rounded-md px-3.5 py-2.5 text-[0.8125rem] leading-5">
                    <Icon glyph={WarningCircle} size={18} className="mt-px shrink-0" />
                    <span>
                        <b className="font-medium">
                            {refusees.length} ligne{refusees.length > 1 ? 's' : ''} à corriger
                        </b>{' '}
                        avant d'enregistrer.
                    </span>
                </p>
            )}
            <Button
                variant="tonal"
                icon={<Icon glyph={Plus} size={20} />}
                onClick={ajouter}
                className="w-full"
            >
                Ajouter une ligne
            </Button>
        </aside>
    );

    // ---- téléphone -----------------------------------------------------------------
    const cartes = (
        <>
            <section className="bg-inverse-surface text-inverse-on-surface rounded-card @container px-5 pt-[22px] pb-5">
                <span className="block text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                    Exercice {year} · lignes du budget
                </span>
                <div className="mt-2 flex items-baseline gap-2.5">
                    <b className="font-brand text-[2.5rem] leading-[3rem] font-semibold tracking-[-0.03em] tabular-nums">
                        {/* L'enveloppe tient à côté de sa devise : en 40, « 100 000 000 »
                            poussait « XOF » dans la marge du héro à 320 (07/10). */}
                        <ChiffreAjuste texte={n(enveloppe)} reserve="3rem">
                            <ChiffreAnime valeur={n(enveloppe)} />
                        </ChiffreAjuste>
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
                                  className="border-outline-variant flex flex-col border-t py-4 first:border-t-0"
                              >
                                  {/* **Les montants passent sous le nom quand il n'a plus
                                      96 px** (07/10) : ils ne se coupent pas, et à 320 ils ne
                                      laissaient que 35 px au nom — « Maintenance & Services »
                                      se lisait « M… ». Le ⋮ reste en haut à droite : il est
                                      hors de la rangée qui se replie. */}
                                  <div className="flex items-center gap-2">
                                      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                          <span className="text-on-surface text-ts-body leading-ts-body min-w-0 flex-[1_1_6rem] truncate">
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
                                      </div>
                                      <span className="-mr-2 shrink-0">{menuDe(ligne)}</span>
                                  </div>
                                  <span
                                      className={cn(
                                          'bg-surface-container mt-4 block overflow-hidden',
                                          JAUGE,
                                      )}
                                  >
                                      <i
                                          className={cn(
                                              'mvt-jauge duration-medium2 ease-emphasized transition-[width]',
                                              'block h-full',
                                              ko || part >= 100
                                                  ? 'bg-[var(--tk-color-st-orange)]'
                                                  : 'bg-[var(--tk-color-st-vert)]',
                                          )}
                                          style={{ width: `${Math.min(part, 100)}%` }}
                                      />
                                  </span>
                                  <span className="text-on-surface-variant mt-3 flex items-center gap-2 text-[0.75rem] leading-4">
                                      {etiquette(ligne)}
                                      {ko
                                          ? `${n(-restant)} au-delà de l'enveloppe`
                                          : epuisee
                                            ? 'enveloppe épuisée'
                                            : `${n(restant)} restants`}
                                  </span>
                                  {ko && (
                                      <span className="mt-2 flex items-center gap-1.5 text-[0.75rem] leading-4 text-[var(--tk-color-st-orange)]">
                                          <Icon glyph={WarningCircle} size={18} />
                                          Pas de baisse sous le consommé.
                                      </span>
                                  )}
                              </div>
                          );
                      })}
            </section>
        </>
    );

    return (
        /* **L'en-tête reste, le corps défile** (24/09) — le régime des listes au bureau :
           l'en-tête partait avec le tableau. */
        <div className={cn('bg-background flex min-w-0 flex-1 flex-col', PAGE_BUREAU)}>
            <IconGestureSizeContext.Provider value={bureau ? 40 : 48}>
                {bureau ? (
                    /* `.dhead` de 17.11 : retour, titre et sous-titre, puis Annuler et
                       Enregistrer. Le héro du téléphone devient le sous-titre. */
                    /* **La rangée des listes** (10/10) : la flèche calée sur le bord (-10), 8
                       jusqu'au titre, 16 entre les gestes. La flèche était un bouton nu,
                       posé à 280 : le titre tombait à 332 quand toutes les autres pages
                       l'ont à 318. */
                    <header className="px-page large:mx-auto large:max-w-[calc(80rem+2*var(--tk-space-page))] flex min-h-[72px] w-full items-center gap-4 pt-5">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FlecheDeRetour
                                onBack={onBack}
                                compact={false}
                                label="Retour aux finances"
                            />
                            <div className="min-w-0 flex-1">
                                <h1 className="font-brand text-on-surface text-ts-page leading-ts-page truncate font-semibold tracking-[-0.02em]">
                                    Lignes du budget
                                </h1>
                                <p className="text-on-surface-variant text-ts-sub leading-ts-sub truncate tabular-nums">
                                    {sousTitre}
                                </p>
                            </div>
                        </div>
                        {/* Les gestes du chrome du bureau font 40, comme la flèche (17.11) ;
                            48 au doigt. Ils tenaient 48 à côté d'une flèche de 40 (08/10). */}
                        <Button
                            variant="outlined"
                            onClick={onBack}
                            className="doigt:h-12 doigt:min-h-12 h-10 min-h-10"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="tonal"
                            icon={<Icon glyph={Check} size={20} />}
                            onClick={enregistrer}
                            className="doigt:h-12 doigt:min-h-12 h-10 min-h-10"
                        >
                            Enregistrer
                        </Button>
                    </header>
                ) : (
                    /* La barre commune du téléphone (24/09) ; « Enregistrer » en coche nommée. */
                    <BarreDePage
                        className="sticky top-0 z-20"
                        title="Lignes du budget"
                        onBack={onBack}
                        backLabel="Retour aux finances"
                        actions={
                            <Button
                                variant="text"
                                iconOnly
                                aria-label="Enregistrer"
                                onClick={enregistrer}
                            >
                                <Icon glyph={Check} size={24} />
                            </Button>
                        }
                    />
                )}
            </IconGestureSizeContext.Provider>

            {/* **Au téléphone, ajouter une ligne est le bouton flottant** (24/09) — le geste
                d'ajout de toutes les listes (17.7). La rangée « Ajouter une ligne » du pied
                de la carte se découvrait après avoir défilé tous les postes. */}
            {!bureau && (
                <ListActionFab
                    label="lignes du budget"
                    actions={[
                        {
                            id: 'ajouter-ligne',
                            label: 'Ajouter une ligne',
                            icon: 'add',
                            onSelect: ajouter,
                        },
                    ]}
                />
            )}

            <div
                className={cn(
                    'medium:px-page flex flex-col gap-4 px-4 pt-4',
                    CORPS_BUREAU,
                    /* Le corps défile sur toute la largeur — la barre de défilement au bord
                       de la fenêtre — et centre son contenu à 1 280 par ses marges. */
                    bureau
                        ? 'large:px-[max(var(--tk-space-page),calc((100%_-_80rem)/2))] @container w-full pb-6'
                        : 'pb-24',
                )}
            >
                {bureau ? (
                    /* **Tableau (8) et enveloppe (4) côte à côte quand le corps a 1 040 px**
                       — en deçà, l'enveloppe passe sous le tableau (07/10). Le seuil se lit sur
                       le corps, pas sur la fenêtre : la barre latérale ouverte en prend 240, et
                       c'est la place qui reste qui compte. Les cinq colonnes de chiffres tiennent
                       504 px ; il en faut 160 de plus au nom, soit un tableau de 690. Posé sur
                       la fenêtre, le côte-à-côte partait à 1 000 px (le seuil des deux colonnes,
                       descendu le 25/09) : à 1 024, le nom avait 41 px (« Mat… ») et « déjà
                       consommée » passait sous le montant voisin ; à 1 280, barre ouverte, 95. */
                    <div className="flex flex-col gap-4 @[65rem]:grid @[65rem]:grid-cols-12 @[65rem]:items-start">
                        <div className="@[65rem]:col-span-8">
                            {lignes.length === 0 ? (
                                <div className="rounded-card bg-surface flex min-h-80 flex-col">
                                    {vide}
                                </div>
                            ) : (
                                tableau
                            )}
                        </div>
                        <div className="@[65rem]:col-span-4">{cote}</div>
                    </div>
                ) : (
                    cartes
                )}
            </div>

            {/* **La saisie d'une ligne — une feuille, pas une boîte** (24/09). La boîte
                centrée ouvrait deux champs vides et un segmenté dont le second cran sortait
                de l'écran à 393. La feuille dit sur quoi elle porte (l'exercice, ce qui
                reste libre), propose les postes des autres exercices, nomme les deux
                natures par ce qu'elles désignent, et dit l'effet sur l'enveloppe avant
                « Ajouter ». Renommer et modifier le montant prennent la même feuille,
                réduite à leur champ. */}
            <BottomSheet
                open={dialogue !== null}
                onClose={() => setDialogue(null)}
                title={
                    dialogue?.type === 'ajouter'
                        ? 'Nouvelle ligne'
                        : dialogue?.type === 'renommer'
                          ? 'Renommer la ligne'
                          : 'Modifier le montant'
                }
                subtitle={
                    dialogue?.type === 'ajouter'
                        ? `Budget ${year} · ${
                              exercice?.totalAllocated && libre > 0
                                  ? `${n(libre)} ${settings.currency} à répartir`
                                  : `${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`
                          }`
                        : ligneOuverte?.category
                }
            >
                <div className="flex flex-col gap-5">
                    {(dialogue?.type === 'ajouter' || dialogue?.type === 'renommer') && (
                        <div className="flex flex-col gap-3">
                            <InputField
                                label="Nom du poste"
                                name="poste"
                                placeholder="Matériel IT, licences, télécoms…"
                                value={brouillon.nom}
                                onChange={(event) =>
                                    setBrouillon((b) => ({ ...b, nom: event.target.value }))
                                }
                                error={nomPris ? 'Ce poste existe déjà dans ce budget.' : undefined}
                                autoFocus
                            />
                            {dialogue?.type === 'ajouter' && suggestions.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel note="· d'autres exercices">Déjà connus</FieldLabel>
                                    <div className="-mt-2 flex flex-wrap gap-2">
                                        {suggestions.map((s) => (
                                            <Chip
                                                key={s.category}
                                                variant="suggestion"
                                                label={s.category}
                                                selected={brouillon.nom === s.category}
                                                onClick={() =>
                                                    setBrouillon({
                                                        nom: s.category,
                                                        montant:
                                                            brouillon.montant ||
                                                            String(Math.round(s.allocated)),
                                                        cap: s.capitalization ?? brouillon.cap,
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {(dialogue?.type === 'ajouter' || dialogue?.type === 'montant') && (
                        <div className="flex flex-col gap-3">
                            <InputField
                                label="Enveloppe"
                                name="enveloppe"
                                inputMode="numeric"
                                placeholder="0"
                                suffix={settings.currency}
                                value={
                                    brouillon.montant
                                        ? Number(brouillon.montant).toLocaleString('fr-FR')
                                        : ''
                                }
                                onChange={(event) =>
                                    setBrouillon((b) => ({
                                        ...b,
                                        montant: event.target.value.replace(/\D/g, ''),
                                    }))
                                }
                                error={
                                    sousLeConsomme
                                        ? `Déjà ${n(ligneOuverte?.spent ?? 0)} ${settings.currency} consommés : le montant ne descend pas plus bas.`
                                        : undefined
                                }
                                autoFocus={dialogue?.type === 'montant'}
                                className="tabular-nums"
                            />
                            {effet && !sousLeConsomme && (
                                <FormWarn
                                    glyph={effet.depasse ? WarningCircle : CheckCircle}
                                    tint={effet.depasse ? 'orange' : 'vert'}
                                >
                                    {effet.texte}
                                </FormWarn>
                            )}
                        </div>
                    )}
                    {dialogue?.type === 'ajouter' && (
                        <div role="radiogroup" aria-label="Nature" className="flex flex-col gap-2">
                            <FieldLabel>Nature</FieldLabel>
                            <div className="-mt-2 flex flex-col gap-2">
                                <OptionRow
                                    title="Investissement · CAPEX"
                                    hint="un bien qui dure : matériel, installation"
                                    tint={NATURE_TEINTE.CAPEX.option}
                                    selected={brouillon.cap === 'CAPEX'}
                                    onSelect={() => setBrouillon((b) => ({ ...b, cap: 'CAPEX' }))}
                                />
                                <OptionRow
                                    title="Frais courants · OPEX"
                                    hint="ce qui se renouvelle : licences, abonnements"
                                    tint={NATURE_TEINTE.OPEX.option}
                                    selected={brouillon.cap === 'OPEX'}
                                    onSelect={() => setBrouillon((b) => ({ ...b, cap: 'OPEX' }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* `.sfoot` — deux colonnes égales, filet au-dessus. */}
                    <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={() => setDialogue(null)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={valider} disabled={!validable}>
                            {dialogue?.type === 'ajouter' ? 'Ajouter la ligne' : 'Valider'}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

export default BudgetLinesPage;
