import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarBlank,
    CaretDown,
    CheckCircle,
    DotsThreeVertical,
    Funnel,
    Receipt,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import FilePicker from '../../../components/ui/FilePicker';
import FilterButton from '../../../components/ui/FilterButton';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import SearchField from '../../../components/ui/SearchField';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useListeEtFiche } from '../../../hooks/useListeEtFiche';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { toucheSimplePourLaPage } from '../../../lib/clavier';
import { saveExpenseSourceFile } from '../../../lib/financeFileStorage';
import { exerciceParDefaut, formatNumber } from '../../../lib/financial';
import { cn } from '../../../lib/utils';
import type { FinanceExpense, FinanceExpenseType } from '../../../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import ExpenseDetailSheet from '../components/ExpenseDetailSheet';
import ExpenseEditModal from '../components/ExpenseEditModal';
import ListeDesDepenses, { type MoisDuJournal } from '../components/ListeDesDepenses';
import PanneauDeDepense from '../components/PanneauDeDepense';
import { useBudgetExercise } from '../hooks/useBudgetExercise';
import { useExpenseActions } from '../hooks/useExpenseActions';
import {
    EXPENSE_TYPE_LABELS,
    etatDuJustificatif,
    getExpenseStatusLabel,
    posteDeLaDepense,
} from '../lib/expensePresentation';
import ChiffreAnime from '../../../components/ui/ChiffreAnime';
import ChiffreAjuste from '../../../components/ui/ChiffreAjuste';

interface ExpenseJournalPageProps {
    onBack: () => void;
}

/** Les cinq natures de dépense, dans l'ordre où la feuille de filtre les pose. */
const NATURES: readonly FinanceExpenseType[] = [
    'Purchase',
    'License',
    'Maintenance',
    'Service',
    'Cloud',
];

type PeriodeId = 'exercice' | 'trimestre' | 'mois';

const PERIODES: readonly { id: PeriodeId; label: string }[] = [
    { id: 'exercice', label: 'Exercice' },
    { id: 'trimestre', label: 'Ce trimestre' },
    { id: 'mois', label: 'Ce mois' },
];

/**
 * **Les vues du journal au bureau** (27/09) — ce qu'on vient y chercher, en puces dans la
 * ligne d'outils, avec leur compte : tout, ce qui attend d'être payé, ce qui attend sa pièce,
 * les abonnements. La nature ne filtre plus au bureau : elle découle du poste, que le
 * bandeau filtre déjà.
 */
type VueId = 'toutes' | 'attente' | 'sans-justificatif' | 'recurrentes';

const VUES: readonly { id: VueId; label: string; garde: (depense: FinanceExpense) => boolean }[] = [
    { id: 'toutes', label: 'Toutes', garde: () => true },
    { id: 'attente', label: 'En attente', garde: (d) => d.status === 'Pending' },
    {
        id: 'sans-justificatif',
        label: 'Sans justificatif',
        garde: (d) => etatDuJustificatif(d) === 'manquant',
    },
    { id: 'recurrentes', label: 'Récurrentes', garde: (d) => d.status === 'Recurring' },
];

const majuscule = (texte: string): string => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « Août 2026 » — l'en-tête d'une carte de mois. */
const titreDuMois = (iso: string): string =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(iso));

/** « 6 août » — la date d'une écriture, sans son année : la carte la porte. */
const jourEtMois = (iso: string): string =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(iso));

/**
 * `.vig` — **deux lettres du fournisseur**, comme « DL » pour Dell Technologies et
 * « MS » pour Microsoft : un seul mot donne ses deux premières lettres, sinon la
 * vignette d'un fournisseur en un mot n'en porterait qu'une, seule au milieu de 40.
 */
const initiales = (nom: string): string => {
    const mots = (nom || '').split(/[\s-]+/).filter(Boolean);
    if (mots.length === 0) return '?';
    if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
    return (mots[0][0] + mots[1][0]).toUpperCase();
};

const cleDuMois = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * **Le journal des dépenses — 15.3, « Vue — le journal des dépenses ».**
 *
 * L'historique de ce qui a consommé l'enveloppe, **groupé par mois avec le total du
 * mois**. Chaque rangée ouvre sa dépense ; son ⋮ voit la facture ou supprime.
 *
 * Il portait la page d'avant les planches : un fil d'Ariane « Finances » au-dessus d'un
 * titre de 30, une carte nommée « Historique des Transactions », un tableau à sept
 * colonnes caché sous 600 et, en dessous, une liste de cartes qui redisait les mêmes
 * faits dans une autre grammaire — deux corps pour une liste, aucune recherche, aucun
 * filtre, aucun mois. Il prend ici le gabarit des huit listes (17.8), celui que
 * l'Historique (18.1) emploie déjà pour la même forme : *un journal groupé par période,
 * avec le total de la période en tête de carte.*
 *
 * ## Trois écarts avec la planche, et pourquoi
 *
 * **Le poste ne filtre pas.** 15.3 pose trois axes — poste, nature, période. Une dépense
 * du produit **ne porte pas de poste** : le panneau de détail le *devine* aujourd'hui,
 * en cherchant la ligne de budget dont le type coïncide. Or 15.1 a précisément fait
 * tomber la devinette (« un chiffre deviné ne se présente pas comme un chiffre su ») ;
 * un filtre bâti dessus compterait faux. L'axe reviendra avec le lien, pas avant.
 *
 * **La rangée ne redit pas « Modifier ».** Le ⋮ de la planche l'y met ; la colonne
 * suivante de la même planche le met aussi dans le héro de la dépense ouverte, où le
 * produit le porte déjà. Deux chemins vers le même formulaire n'en font pas un meilleur.
 *
 * **Les trois chemins du bouton flottant** — photographier, importer, saisir — sont les
 * **deux modes** de la feuille d'enregistrement (« scan » et « saisie ») : au téléphone,
 * photographier et importer ouvrent le même sélecteur de fichier.
 */
const ExpenseJournalPage: React.FC<ExpenseJournalPageProps> = ({ onBack }) => {
    const { settings } = useData();
    const { financeExpenses, financeBudgets, updateFinanceExpense, isHydrating } = useFinanceData();
    const { requestExpenseDeletion, previewSourceFile, downloadSourceFile } = useExpenseActions();
    const { showToast } = useToast();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const [filtreOuvert, setFiltreOuvert] = useState(false);
    const [recherche, setRecherche] = useState('');
    const [naturesActives, setNaturesActives] = useState<FinanceExpenseType[]>([]);
    const [periode, setPeriode] = useState<PeriodeId>('exercice');
    const recherchee = useDebounce(recherche, 200);
    const compact = useMediaQuery(MEDIA.compact);

    /* **Le bureau, dès 840** (27/09) : les vues en puces, la liste des dépenses et la
       dépense ouverte à côté. Sous 840, la page du téléphone. */
    const bureau = useMediaQuery(MEDIA.expandedUp);
    const souris = useMediaQuery(MEDIA.hoverCapable);
    const [vue, setVue] = useState<VueId>('toutes');
    const [editionId, setEditionId] = useState<string | null>(null);

    /* L'exercice demandé par l'adresse (`/finance?annee=2025`, depuis « Exercices »), sinon
       celui de l'année. */
    const [exerciseYear, setExerciseYear] = useState<number>(() => {
        const requete = window.location.hash.split('?')[1];
        const annee = requete ? Number(new URLSearchParams(requete).get('annee')) : NaN;
        return Number.isInteger(annee) && annee > 1900
            ? annee
            : (exerciceParDefaut(financeBudgets) ?? new Date().getFullYear());
    });

    useEffect(() => {
        if (financeBudgets.length === 0) return;
        if (!financeBudgets.some((budget) => budget.year === exerciseYear)) {
            setExerciseYear(exerciceParDefaut(financeBudgets) ?? financeBudgets[0].year);
        }
    }, [financeBudgets, exerciseYear]);

    const { currentBudget } = useBudgetExercise(exerciseYear);

    /** Les écritures de l'exercice — le périmètre dont le héro rend compte. */
    const deLExercice = useMemo(
        () =>
            financeExpenses
                .filter((exp) => new Date(exp.date).getFullYear() === exerciseYear)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [financeExpenses, exerciseYear],
    );

    const consomme = useMemo(
        () => deLExercice.reduce((somme, exp) => somme + exp.amount, 0),
        [deLExercice],
    );

    const dansLaPeriode = useMemo(() => {
        if (periode === 'exercice') return deLExercice;
        const now = new Date();
        const debut =
            periode === 'mois'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return deLExercice.filter((exp) => new Date(exp.date) >= debut);
    }, [deLExercice, periode]);

    const comptesParNature = useMemo(() => {
        const compte = new Map<FinanceExpenseType, number>();
        for (const exp of dansLaPeriode) {
            compte.set(exp.type, (compte.get(exp.type) ?? 0) + 1);
        }
        return compte;
    }, [dansLaPeriode]);

    const affichees = useMemo(() => {
        const terme = recherchee.trim().toLowerCase();
        return dansLaPeriode.filter((exp) => {
            if (naturesActives.length > 0 && !naturesActives.includes(exp.type)) return false;
            if (!terme) return true;
            return [exp.supplier, exp.invoiceNumber, exp.description]
                .filter(Boolean)
                .some((champ) => String(champ).toLowerCase().includes(terme));
        });
    }, [dansLaPeriode, naturesActives, recherchee]);

    /** Les mois, du plus récent au plus ancien, avec le total de chacun. */
    const parMois = useMemo(() => {
        const groupes = new Map<string, FinanceExpense[]>();
        for (const exp of affichees) {
            const cle = cleDuMois(exp.date);
            const liste = groupes.get(cle);
            if (liste) liste.push(exp);
            else groupes.set(cle, [exp]);
        }
        return [...groupes.entries()];
    }, [affichees]);

    const filtresPoses = (naturesActives.length > 0 ? 1 : 0) + (periode !== 'exercice' ? 1 : 0);

    /* ── Le bureau ─────────────────────────────────────────────────────────────────── */

    /**
     * **Au bureau, la page est la liste et la dépense ouverte, d'emblée** (27/09, à la
     * demande : *« on peut se passer de cette page et aller directement à la suivante depuis
     * Finances »*). Finances porte déjà ce que disait le bandeau (le consommé, les mois, la
     * part des postes) ; la page n'avait plus qu'à montrer les dépenses. Elle s'ouvre donc
     * comme Tâches : la file de 400 à gauche, la plus récente ouverte à droite.
     */
    const dansLaRecherche = useMemo(() => {
        const terme = recherchee.trim().toLowerCase();
        if (!terme) return deLExercice;
        return deLExercice.filter((exp) =>
            [exp.supplier, exp.invoiceNumber, exp.description]
                .filter(Boolean)
                .some((champ) => String(champ).toLowerCase().includes(terme)),
        );
    }, [deLExercice, recherchee]);

    const comptesParVue = useMemo(() => {
        const comptes = {} as Record<VueId, number>;
        VUES.forEach((v) => {
            comptes[v.id] = dansLaRecherche.filter(v.garde).length;
        });
        return comptes;
    }, [dansLaRecherche]);

    const afficheesAuBureau = useMemo(() => {
        const garde = VUES.find((v) => v.id === vue)?.garde ?? (() => true);
        return dansLaRecherche.filter(garde);
    }, [dansLaRecherche, vue]);

    const totalAffiche = useMemo(
        () => afficheesAuBureau.reduce((somme, exp) => somme + exp.amount, 0),
        [afficheesAuBureau],
    );

    /** Les mois de la liste, avec leur total — ses en-têtes de groupe. */
    const moisDuJournal = useMemo(() => {
        const groupes = new Map<string, MoisDuJournal>();
        for (const exp of afficheesAuBureau) {
            const cle = cleDuMois(exp.date);
            const groupe = groupes.get(cle);
            if (groupe) {
                groupe.depenses.push(exp);
                groupe.total += exp.amount;
            } else {
                groupes.set(cle, {
                    cle,
                    titre: majuscule(titreDuMois(exp.date)),
                    total: exp.amount,
                    depenses: [exp],
                });
            }
        }
        return [...groupes.values()];
    }, [afficheesAuBureau]);

    /** Les abonnements sans pièce : la vue « Sans justificatif » dit qu'elle les écarte. */
    const recurrentesSansPiece = useMemo(
        () => dansLaRecherche.filter((exp) => etatDuJustificatif(exp) === 'facultatif').length,
        [dansLaRecherche],
    );

    const filtreAuBureau = vue !== 'toutes' || Boolean(recherchee);

    const toutVoir = () => {
        setVue('toutes');
        setRecherche('');
    };

    /* La dépense ouverte, tenue dans l'adresse (`?ouvert=`). Sous 840, elle passe à la
       feuille du téléphone. */
    const versLaFeuille = useCallback((id: string, fermerLaFiche: () => void) => {
        setSelectedExpenseId(id);
        fermerLaFiche();
    }, []);
    const {
        actif: listeEtFiche,
        ouvert: ouverteId,
        ouvrir: ouvrirLaFiche,
        fermer: fermerLaFiche,
    } = useListeEtFiche(true, versLaFeuille);
    const depenseOuverte = useMemo(
        () =>
            listeEtFiche && ouverteId
                ? (financeExpenses.find((exp) => exp.id === ouverteId) ?? null)
                : null,
        [financeExpenses, listeEtFiche, ouverteId],
    );

    /* Une dépense supprimée ailleurs, ou un lien vers une dépense qui n'existe plus : la
       fiche se referme au lieu de rester ouverte sur rien. */
    useEffect(() => {
        if (ouverteId && listeEtFiche && !isHydrating && financeExpenses.length > 0) {
            if (!financeExpenses.some((exp) => exp.id === ouverteId)) fermerLaFiche();
        }
    }, [fermerLaFiche, financeExpenses, isHydrating, listeEtFiche, ouverteId]);

    /* **La plus récente s'ouvre à l'arrivée**, comme la première tâche de Tâches : la page
       n'a pas d'état « rien d'ouvert » à montrer d'abord. Refermée exprès (la croix, Échap),
       elle ne se rouvre pas d'elle-même ; le panneau invite alors à choisir. */
    const fermeeExpres = useRef(false);
    const ouverteAvant = useRef<string | null>(null);
    useEffect(() => {
        if (ouverteAvant.current && !ouverteId) fermeeExpres.current = true;
        ouverteAvant.current = ouverteId;
    }, [ouverteId]);
    useEffect(() => {
        if (!listeEtFiche || ouverteId || fermeeExpres.current || isHydrating) return;
        const premiere = afficheesAuBureau[0];
        if (premiere) ouvrirLaFiche(premiere.id);
    }, [afficheesAuBureau, isHydrating, listeEtFiche, ouverteId, ouvrirLaFiche]);

    const ouvrirLaDepense = (exp: FinanceExpense) => {
        if (bureau) ouvrirLaFiche(exp.id);
        else setSelectedExpenseId(exp.id);
    };

    const changerDExercice = (annee: number) => {
        setExerciseYear(annee);
        fermeeExpres.current = false;
        fermerLaFiche();
    };

    /* « Joindre » — le même chemin que l'enregistrement d'une dépense : la pièce est gardée
       sur l'appareil (IndexedDB), la dépense en retient le nom et l'identifiant. */
    const selecteurDePiece = useRef<HTMLInputElement>(null);
    const cibleDeLaPiece = useRef<string | null>(null);
    const joindre = (exp: FinanceExpense) => {
        cibleDeLaPiece.current = exp.id;
        selecteurDePiece.current?.click();
    };
    const recevoirLaPiece = async (fichiers: File[]) => {
        const id = cibleDeLaPiece.current;
        cibleDeLaPiece.current = null;
        const fichier = fichiers[0];
        if (!id || !fichier) return;
        let sourceFileId: string | undefined;
        try {
            sourceFileId = await saveExpenseSourceFile(fichier);
        } catch {
            sourceFileId = undefined;
        }
        if (!sourceFileId) {
            showToast('Le justificatif n’a pas pu être enregistré sur cet appareil.', 'error');
            return;
        }
        const joint = updateFinanceExpense(id, { sourceFileId, sourceFileName: fichier.name });
        showToast(
            joint ? 'Justificatif joint.' : 'Modification refusée.',
            joint ? 'success' : 'error',
        );
    };

    const marquerPayee = (exp: FinanceExpense) => {
        const fait = updateFinanceExpense(exp.id, { status: 'Paid' });
        showToast(
            fait ? 'Dépense marquée payée.' : 'Modification refusée.',
            fait ? 'success' : 'error',
        );
    };

    const supprimer = (exp: FinanceExpense) =>
        requestExpenseDeletion(exp, () => {
            if (ouverteId === exp.id) fermerLaFiche();
            setSelectedExpenseId((courant) => (courant === exp.id ? null : courant));
        });

    /*
      **Le clavier de la dépense ouverte** — J et K pour passer à la suivante et à la
      précédente, comme dans Tâches ; Échap la referme (`useListeEtFiche`). Au bureau, et
      jamais dans un champ ni sous un calque.
    */
    const surTouche = useRef<(event: KeyboardEvent) => void>(() => undefined);
    surTouche.current = (event: KeyboardEvent) => {
        if (!listeEtFiche || !toucheSimplePourLaPage(event)) return;
        const touche = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        if (touche !== 'j' && touche !== 'k') return;
        const index = depenseOuverte
            ? afficheesAuBureau.findIndex((exp) => exp.id === depenseOuverte.id)
            : -1;
        const cible = touche === 'j' ? index + 1 : Math.max(0, index - 1);
        const suivante = afficheesAuBureau[Math.min(cible, afficheesAuBureau.length - 1)];
        if (!suivante || suivante.id === depenseOuverte?.id) return;
        event.preventDefault();
        ouvrirLaFiche(suivante.id);
    };
    useEffect(() => {
        if (!bureau) return;
        const ecouter = (event: KeyboardEvent) => surTouche.current(event);
        document.addEventListener('keydown', ecouter);
        return () => document.removeEventListener('keydown', ecouter);
    }, [bureau]);

    const exercicesConnus = useMemo(
        () => [...financeBudgets].sort((a, b) => b.year - a.year),
        [financeBudgets],
    );

    const derniere = deLExercice[0];

    const outilsDuBureau = bureau ? (
        <div className="flex flex-wrap items-center gap-2 pt-3 pb-1">
            <SearchField
                dense
                raccourci
                value={recherche}
                onChange={setRecherche}
                placeholder="Fournisseur, facture, objet"
                /* 300 comme Tâches ; 240 sous 1 200, où la ligne porte aussi son total. */
                className="large:w-[300px] h-9 w-[240px] max-w-full gap-2 px-2.5"
            />
            {VUES.map((v) => (
                <FacetChip
                    key={v.id}
                    dense
                    label={v.label}
                    count={comptesParVue[v.id]}
                    selected={vue === v.id}
                    onClick={() => setVue(v.id)}
                    className="min-h-8 px-[11px]"
                />
            ))}
            {/* Le total de ce qui est affiché — il suit la vue et la recherche. */}
            <p className="text-text-secondary ml-auto text-[0.8125rem] leading-[1.125rem] whitespace-nowrap">
                <b className="text-on-surface font-semibold tabular-nums">
                    {formatNumber(totalAffiche, settings.compactNotation)} {settings.currency}
                </b>
                <span className="large:inline hidden">
                    {' '}
                    · {afficheesAuBureau.length} écriture
                    {afficheesAuBureau.length > 1 ? 's' : ''}
                </span>
            </p>
        </div>
    ) : undefined;

    const videAuBureau = (
        <div className="bg-surface flex min-h-0 flex-1 flex-col rounded-xl">
            <CardEmptyState
                glyph={
                    vue === 'sans-justificatif' && !recherchee
                        ? CheckCircle
                        : filtreAuBureau
                          ? Funnel
                          : Receipt
                }
                tone={vue === 'sans-justificatif' || vue === 'attente' ? 'positive' : 'neutral'}
                title={
                    vue === 'sans-justificatif'
                        ? 'Aucun justificatif ne manque'
                        : vue === 'attente'
                          ? 'Aucune dépense en attente'
                          : filtreAuBureau
                            ? 'Aucune écriture ne correspond'
                            : "Aucune dépense sur l'exercice"
                }
                description={
                    vue === 'sans-justificatif' || vue === 'attente'
                        ? 'Sur ce périmètre, tout est en ordre.'
                        : filtreAuBureau
                          ? 'Retirez un filtre, ou cherchez autrement.'
                          : "Chaque facture enregistrée consomme l'enveloppe d'un poste."
                }
                action={
                    filtreAuBureau ? (
                        <Button variant="outlined" onClick={toutVoir}>
                            Voir tout le journal
                        </Button>
                    ) : undefined
                }
            />
        </div>
    );

    const journalAuBureau =
        afficheesAuBureau.length > 0 ? (
            <ListeDesDepenses
                mois={moisDuJournal}
                ouverteId={depenseOuverte?.id ?? null}
                onOuvrir={ouvrirLaDepense}
                notationCompacte={settings.compactNotation}
            />
        ) : (
            videAuBureau
        );

    /* Le panneau sans dépense ouverte — refermée exprès, ou une liste vide. */
    const panneauVide = (
        <div className="bg-surface flex h-full min-h-0 flex-col rounded-xl">
            <CardEmptyState
                glyph={Receipt}
                title="Aucune dépense ouverte"
                description="Choisissez-en une dans la liste, ou passez de l’une à l’autre avec J et K."
            />
        </div>
    );

    const ouvrirLaFacture = (exp: FinanceExpense) => {
        void previewSourceFile(exp);
    };

    return (
        <>
            <AddExpenseModal
                isOpen={isAddExpenseModalOpen}
                onClose={() => setIsAddExpenseModalOpen(false)}
            />
            <ExpenseDetailSheet
                expenseId={selectedExpenseId}
                onClose={() => setSelectedExpenseId(null)}
                budgetItems={currentBudget.items}
            />
            <ExpenseEditModal expenseId={editionId} onClose={() => setEditionId(null)} />
            <FilePicker
                ref={selecteurDePiece}
                accept="application/pdf,image/*"
                onFiles={(_noms, fichiers) => void recevoirLaPiece(fichiers)}
                onReject={(message) => showToast(message, 'error')}
            />

            <ListTemplate
                /* Une file d'écritures — squelette de file (17.3, A2). */
                skeleton="file"
                /* Au téléphone, le corps apporte ses propres cartes, une par mois ; au bureau,
                   le journal est un tableau qui prend toute la largeur. */
                body={bureau ? 'tableau' : 'cartes'}
                title="Dépenses"
                onBack={onBack}
                /* Le journal est une sous-page de Finances : sa flèche vaut aussi au bureau. */
                retourAuBureau
                backLabel="Retour aux finances"
                search={{
                    value: recherche,
                    onChange: setRecherche,
                    placeholder: 'Fournisseur, facture, objet',
                }}
                /* Au bureau : l'exercice, à côté du geste d'enregistrement. */
                actions={
                    bureau ? (
                        <Menu
                            align="end"
                            title="Exercice"
                            /* Les exercices — la carte « Exercices » de Finances, en menu :
                               chacun avec son état, puis l'écran qui en ouvre un nouveau. */
                            items={[
                                ...exercicesConnus.map((budget) => ({
                                    id: String(budget.year),
                                    label: `Exercice ${budget.year}`,
                                    trailingText:
                                        budget.items.length === 0
                                            ? 'à projeter'
                                            : budget.status.toLowerCase(),
                                    onSelect: () => changerDExercice(budget.year),
                                })),
                                {
                                    id: 'exercices',
                                    label: 'Tous les exercices',
                                    dividerBefore: true,
                                    onSelect: () => {
                                        window.location.hash = '/finance/exercices';
                                    },
                                },
                            ]}
                            trigger={
                                <Button
                                    variant="outlined"
                                    className="doigt:h-12 doigt:min-h-12 h-10 min-h-10 shrink-0 gap-2 rounded-md pr-2.5 pl-3 text-[0.875rem] font-medium"
                                >
                                    <Icon glyph={CalendarBlank} size={20} />
                                    Exercice {exerciseYear}
                                    <Icon
                                        glyph={CaretDown}
                                        size={18}
                                        className="text-text-secondary"
                                    />
                                </Button>
                            }
                        />
                    ) : undefined
                }
                outilsBureau={outilsDuBureau}
                /* La dépense ouverte à côté de la liste, dès 840 — liste de 400, panneau le
                   reste. Le panneau est toujours là : il invite quand rien n'est ouvert. */
                listeEtFiche={bureau}
                listeLarge
                panel={
                    !bureau ? undefined : depenseOuverte ? (
                        <PanneauDeDepense
                            depense={depenseOuverte}
                            poste={posteDeLaDepense(depenseOuverte, currentBudget.items)}
                            devise={settings.currency}
                            notationCompacte={settings.compactNotation}
                            touches={souris}
                            onFermer={fermerLaFiche}
                            onModifier={() => setEditionId(depenseOuverte.id)}
                            onMarquerPayee={() => marquerPayee(depenseOuverte)}
                            onJoindre={() => joindre(depenseOuverte)}
                            onVoir={() => void previewSourceFile(depenseOuverte)}
                            onTelecharger={() => void downloadSourceFile(depenseOuverte)}
                            onSupprimer={() => supprimer(depenseOuverte)}
                        />
                    ) : (
                        panneauVide
                    )
                }
                note={
                    bureau && vue === 'sans-justificatif' && recurrentesSansPiece > 0 ? (
                        <p className="text-text-secondary px-1 text-[0.8125rem] leading-[1.125rem]">
                            Les {recurrentesSansPiece} récurrentes n’y figurent pas : leur
                            justificatif est facultatif.
                        </p>
                    ) : undefined
                }
                filter={
                    <FilterButton
                        label="Filtrer les dépenses"
                        count={filtresPoses}
                        onClick={() => setFiltreOuvert(true)}
                    />
                }
                /* **Le compte à côté du titre, toujours** (24/09) : il ne s'écrivait que
                   filtré, sous la recherche, parce que le héro dit déjà le total. Au titre
                   il ne coûte plus de ligne ; filtré, il dit le rapport. */
                count={
                    bureau
                        ? {
                              total: deLExercice.length,
                              noun: `écriture${deLExercice.length > 1 ? 's' : ''}`,
                          }
                        : {
                              total: affichees.length,
                              noun:
                                  affichees.length !== deLExercice.length
                                      ? `écriture${affichees.length > 1 ? 's' : ''} sur ${deLExercice.length}`
                                      : `écriture${affichees.length > 1 ? 's' : ''}`,
                          }
                }
                subtitle={
                    bureau && derniere ? `la dernière le ${jourEtMois(derniere.date)}` : undefined
                }
                hero={
                    bureau ? undefined : (
                        /* `.hero` de 15.3 — le consommé de l'exercice, que le filtre ne
                       touche pas : ce qu'il annonce est le fait de l'exercice. */
                        <section className="bg-inverse-surface text-inverse-on-surface rounded-card @container px-5 pt-[22px] pb-5">
                            <span className="block text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                                Consommé à ce jour
                            </span>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                                <b className="font-brand text-[2.5rem] leading-[3rem] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
                                    {/* Le chiffre tient dans le héro, sa devise à côté (07/10). */}
                                    <ChiffreAjuste
                                        texte={formatNumber(consomme, settings.compactNotation)}
                                        reserve="3rem"
                                    >
                                        <ChiffreAnime
                                            valeur={formatNumber(
                                                consomme,
                                                settings.compactNotation,
                                            )}
                                        />
                                    </ChiffreAjuste>
                                </b>
                                <span className="text-ts-sub leading-ts-sub text-[var(--tk-color-on-dark-2)]">
                                    {settings.currency}
                                </span>
                            </div>
                            <span className="text-ts-sub leading-ts-sub mt-1 block text-[var(--tk-color-on-dark-2)]">
                                consommés en {deLExercice.length} écriture
                                {deLExercice.length > 1 ? 's' : ''} · exercice {exerciseYear}
                            </span>
                        </section>
                    )
                }
                pageAction={{
                    label: 'Enregistrer une dépense',
                    description: 'Enregistrer une dépense',
                    onClick: () => setIsAddExpenseModalOpen(true),
                }}
                /* Au bureau, le vide se dit dans la carte du journal, sous le bandeau et les
                   vues qui l'expliquent : la page a toujours son corps. */
                hasRows={bureau || parMois.length > 0}
                /* **Le vide ne redouble pas « Enregistrer »** (25/09) : le geste est déjà
                   dans l'en-tête au bureau, et flottant au téléphone. Filtré, il garde sa
                   sortie. */
                empty={
                    <CardEmptyState
                        glyph={filtresPoses > 0 || recherchee ? Funnel : Receipt}
                        title={
                            filtresPoses > 0 || recherchee
                                ? 'Aucune écriture ne correspond'
                                : "Aucune dépense sur l'exercice"
                        }
                        description={
                            filtresPoses > 0 || recherchee
                                ? 'Élargissez la période, ou changez de nature.'
                                : "Chaque facture enregistrée consomme l'enveloppe d'un poste."
                        }
                        action={
                            filtresPoses > 0 || recherchee ? (
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setNaturesActives([]);
                                        setPeriode('exercice');
                                        setRecherche('');
                                    }}
                                >
                                    Voir tout le journal
                                </Button>
                            ) : undefined
                        }
                    />
                }
            >
                {bureau
                    ? journalAuBureau
                    : parMois.map(([cle, ecritures]) => {
                          const totalDuMois = ecritures.reduce(
                              (somme, exp) => somme + exp.amount,
                              0,
                          );
                          return (
                              /* `.card` — **un mois, une carte** : surface, rayon 8, intérieur
                           8 / 16, et 16 entre deux mois. */
                              <section key={cle} className="rounded-card bg-surface px-4 py-2">
                                  {/* `.ch` — le mois et **son total**, 17 sur 24 en graisse
                                d'appui, le total en 14 sur 20 à droite. */}
                                  <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                                      <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium first-letter:uppercase">
                                          {titreDuMois(ecritures[0].date)}
                                      </h3>
                                      <span className="text-on-surface-variant text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                          {formatNumber(totalDuMois, settings.compactNotation)}
                                      </span>
                                  </div>
                                  {ecritures.map((exp, index) => {
                                      const nature = EXPENSE_TYPE_LABELS[exp.type].toLowerCase();
                                      /* **Deux faits au téléphone** (22/09) : la référence de la
                                   pièce — `AWS-2026-215` — se relève sur la dépense ouverte ;
                                   elle ne sert pas à la reconnaître dans la liste, dont la
                                   sous-ligne porte déjà le jour, le poste et l'état. */
                                      const complement = compact
                                          ? exp.description?.trim()
                                          : exp.invoiceNumber || exp.description?.trim();
                                      const etat =
                                          exp.status === 'Paid'
                                              ? undefined
                                              : getExpenseStatusLabel(exp.status).toLowerCase();
                                      const sousLigne = [
                                          jourEtMois(exp.date),
                                          nature,
                                          complement,
                                          etat,
                                      ]
                                          .filter(Boolean)
                                          .join(' · ');
                                      return (
                                          /* `.lrow` — 64 de haut, gouttière 12, un filet entre
                                       deux, et le ⋮ au bout. */
                                          <div
                                              key={exp.id}
                                              className={cn(
                                                  'flex min-h-16 w-full items-center gap-3 py-2 text-left',
                                                  index > 0 && 'border-outline-variant border-t',
                                              )}
                                          >
                                              <div
                                                  role="button"
                                                  tabIndex={0}
                                                  onClick={() => setSelectedExpenseId(exp.id)}
                                                  onKeyDown={(event) => {
                                                      if (
                                                          event.key === 'Enter' ||
                                                          event.key === ' '
                                                      ) {
                                                          event.preventDefault();
                                                          setSelectedExpenseId(exp.id);
                                                      }
                                                  }}
                                                  className="focus-visible:ring-focus-ring flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[4px] outline-none focus-visible:ring-2"
                                              >
                                                  {/* `.vig` — 40, rayon 4, deux lettres du
                                                fournisseur en fonte d'affichage. */}
                                                  <span className="bg-surface-container text-on-surface-variant font-brand text-ts-control flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] font-semibold">
                                                      {initiales(exp.supplier)}
                                                  </span>
                                                  <span className="min-w-0 flex-1">
                                                      <span className="text-on-surface text-ts-body leading-ts-body block truncate">
                                                          {exp.supplier}
                                                      </span>
                                                      <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                                          {sousLigne}
                                                      </span>
                                                  </span>
                                                  {/* `.amt` — **le nombre nu**, 16 sur 24 :
                                                la devise est dite une fois, dans le héro. */}
                                                  <span className="text-on-surface text-ts-body leading-ts-body shrink-0 tabular-nums">
                                                      {formatNumber(
                                                          exp.amount,
                                                          settings.compactNotation,
                                                      )}
                                                  </span>
                                              </div>
                                              <Menu
                                                  align="end"
                                                  /* Le corps de la page défile au bureau : un menu
                                               posé dans le flux s'y ferait couper. */
                                                  floating
                                                  title={exp.supplier}
                                                  items={[
                                                      {
                                                          id: 'facture',
                                                          label: exp.sourceFileName
                                                              ? 'Voir son justificatif'
                                                              : 'Aucun justificatif',
                                                          disabled:
                                                              !exp.sourceFileId &&
                                                              !exp.sourceFileUrl,
                                                          onSelect: () => ouvrirLaFacture(exp),
                                                      },
                                                      {
                                                          id: 'supprimer',
                                                          label: 'Supprimer',
                                                          destructive: true,
                                                          dividerBefore: true,
                                                          onSelect: () =>
                                                              requestExpenseDeletion(exp, () =>
                                                                  setSelectedExpenseId((courant) =>
                                                                      courant === exp.id
                                                                          ? null
                                                                          : courant,
                                                                  ),
                                                              ),
                                                      },
                                                  ]}
                                                  trigger={
                                                      <Button
                                                          variant="text"
                                                          iconOnly
                                                          aria-label={`Autres actes sur ${exp.supplier}`}
                                                          className="text-on-surface-variant hover:bg-surface-container -mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-md p-0"
                                                      >
                                                          <Icon
                                                              glyph={DotsThreeVertical}
                                                              size={20}
                                                          />
                                                      </Button>
                                                  }
                                              />
                                          </div>
                                      );
                                  })}
                              </section>
                          );
                      })}
            </ListTemplate>

            {/* La feuille de filtre — les axes en chips, jamais en onglets (R11). Pastilles de
                17.8 : 14 sur 20, 36 de haut. */}
            <BottomSheet
                open={filtreOuvert}
                onClose={() => setFiltreOuvert(false)}
                title="Filtrer"
                emploi="filtre"
            >
                <div className="flex flex-col pb-0">
                    {/* `.sbody` et `.sfoot` — la feuille pose déjà 20 de chaque côté : libellés et
                        chips n'en rajoutent pas (ils tombaient à 40), et le pied reprend toute
                        la largeur pour que son filet coure d'un bord à l'autre. */}
                    <p className="text-on-surface-variant pb-2 text-[0.75rem] leading-4 font-medium">
                        Nature
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <FacetChip
                            compact
                            label="Toutes"
                            count={dansLaPeriode.length}
                            selected={naturesActives.length === 0}
                            onClick={() => setNaturesActives([])}
                        />
                        {NATURES.map((nature) => (
                            <FacetChip
                                compact
                                key={nature}
                                label={EXPENSE_TYPE_LABELS[nature]}
                                count={comptesParNature.get(nature) ?? 0}
                                selected={naturesActives.includes(nature)}
                                onClick={() =>
                                    setNaturesActives((prev) =>
                                        prev.includes(nature)
                                            ? prev.filter((x) => x !== nature)
                                            : [...prev, nature],
                                    )
                                }
                            />
                        ))}
                    </div>

                    <p className="text-on-surface-variant pt-4 pb-2 text-[0.75rem] leading-4 font-medium">
                        Période
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {PERIODES.map((p) => (
                            <FacetChip
                                compact
                                key={p.id}
                                label={p.id === 'exercice' ? `Exercice ${exerciseYear}` : p.label}
                                selected={periode === p.id}
                                onClick={() => setPeriode(p.id)}
                            />
                        ))}
                    </div>

                    <div
                        data-pied
                        className="border-outline-variant -mx-5 mt-4 duo-de-pied gap-3 border-t px-5 pt-4 pb-1"
                    >
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={() => {
                                setNaturesActives([]);
                                setPeriode('exercice');
                            }}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => setFiltreOuvert(false)}
                        >
                            Voir les {affichees.length}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </>
    );
};

export default ExpenseJournalPage;
