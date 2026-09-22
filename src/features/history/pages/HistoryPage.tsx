import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClockCounterClockwise, DotsThreeVertical, Export, Laptop } from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import DataTable, { type DataColumn } from '../../../components/ui/DataTable';
import FilterMenuChip from '../../../components/ui/FilterMenuChip';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FilterButton from '../../../components/ui/FilterButton';
import FacetChip from '../../../components/ui/FacetChip';
import { PickRow } from '../../../components/ui/FormParts';
import Icon from '../../../components/ui/Icon';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import ScreenState from '../../../components/ui/ScreenState';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useDebounce } from '../../../hooks/useDebounce';
import { useHistory } from '../../../hooks/useHistory';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { useToast } from '../../../context/ToastContext';
import { buildCsvLine } from '../../../lib/csv';
import { cn } from '../../../lib/utils';
import type { HistoryEvent } from '../../../types';
import ConcernPicker, { type ChoixConcerne } from '../components/ConcernPicker';
import FactSheet from '../components/FactSheet';
import {
    NATURES,
    PERIODES,
    ageDe,
    auteurDe,
    autrePartie,
    complementDe,
    concerne,
    concerneLaPersonne,
    debutDe,
    faitDe,
    groupeDe,
    heure,
    lieuDe,
    marqueDe,
    methodeDe,
    natureDe,
    sousLigneDe,
    type Concerne,
    type Groupe,
    type Nature,
    type PeriodeId,
    type Registres,
} from '../lib/journal';

/**
 * **Historique — le journal des événements** (planche 18.1, dessinée le 05/09, bureau le
 * 09/09).
 *
 * *« Audit » a été scindé le 03/09 : la campagne physique s'appelle Inventaire (16), le
 * journal s'appelle **Historique**.* **Un fait par rangée** : l'objet ou la personne en
 * titre, qui l'a fait et par quelle méthode en sous-ligne, l'heure à droite. *« Rien ne se
 * refait ici »* — une rangée ouvre le fait, et le fait renvoie à l'objet et à la personne.
 *
 * ## Les six colonnes de la planche, et où elles vivent
 *
 * - **Au repos** — le gabarit des listes (17.8), le journal groupé par jour, une carte par
 *   jour. Un jour de plus de quatre faits en montre quatre et nomme le reste (« Voir les 2
 *   autres faits d'hier ») : le journal se parcourt, il ne se déroule pas.
 * - **La feuille de filtre** — trois axes, jamais des onglets (R11) : la nature et la
 *   période en chips avec leur compte, **une personne ou un objet** à choisir. Le pied dit
 *   le résultat avant de le montrer.
 * - **Un événement ouvert** — le fait, puis qui a attesté quoi et comment
 *   (`FactSheet`).
 * - **Mon historique** — le même écran réduit à ce qui concerne la personne, pour qui ne
 *   lit pas le journal entier : sans recherche, sans le choix de personne ni la sécurité.
 * - **Aucun fait** — le vide nomme le filtre qui le produit et rend le geste qui le lève ;
 *   le badge de l'entonnoir reste.
 * - **Au bureau** — *« le patron de 04.1 pour le temps »* : un tableau à cinq colonnes,
 *   les jours en rangées de séparation de 36, les trois filtres en pastilles, le tri, et
 *   l'export dans l'en-tête. Les rangées suivantes arrivent au défilement.
 *
 * ## Ce qui est au repos
 *
 * La période **par défaut** n'est pas un filtre posé : 30 jours pour le journal, tout pour
 * *Mon historique* (dont la planche montre juillet). Le badge ne compte que ce qui s'en
 * écarte — la colonne « aucun fait » compte deux filtres pour « Inventaires · 7 jours » —,
 * et « Tout effacer » y revient.
 */

/** Au téléphone, un jour montre quatre faits et nomme le reste (colonne 1 : « Hier 6 »). */
const PAR_JOUR = 4;

/** Au bureau, le tableau reçoit ses rangées par cinquantaine, au défilement. */
const PAR_PAGE = 50;

const initiales = (nom: string): string =>
    nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() ?? '')
        .join('');

/** La marque ronde de 32 — même icône, même teinte au téléphone et au bureau. */
const MarqueRonde: React.FC<{ fait: HistoryEvent }> = ({ fait }) => {
    const marque = marqueDe(fait);
    return (
        <span
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                marque.teinte,
            )}
        >
            <Icon glyph={marque.glyph} size={18} />
        </span>
    );
};

/** Une rangée ou un renvoi qu'on active au clavier comme à la souris. */
const activer = (geste: () => void) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: geste,
    onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            geste();
        }
    },
});

interface HistoryPageProps {
    onBack?: () => void;
    /**
     * Réduit le journal à ce qui concerne une personne — la vue « Mon historique ». Sans
     * elle, la page la prend d'elle-même pour qui ne peut pas lire le journal entier.
     */
    scopeUserId?: string;
    /** Le renvoi du fait ouvert vers l'objet. */
    onOpenEquipment?: (id: string) => void;
    /** Le renvoi du fait ouvert vers la personne. */
    onOpenUser?: (id: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({
    onBack,
    scopeUserId,
    onOpenEquipment,
    onOpenUser,
}) => {
    const { events, equipment, approvals, users, settings } = useData();
    const { user: moi, permissions } = useAccessControl();
    const { filterEvents } = useHistory();
    const { showToast } = useToast();

    /**
     * **Mon historique** — 18.1, colonne 4. Le journal se lit par qui lit les rapports
     * (17.7) ; les autres y arrivaient quand même par l'adresse, et lisaient tout. Ils
     * lisent désormais ce qui les concerne, sous le nom que la planche leur donne.
     */
    const mien = scopeUserId ?? (permissions.canViewReports ? undefined : moi?.id);
    const periodeAuRepos: PeriodeId = mien ? 'tout' : '30';

    const [recherche, setRecherche] = useState('');
    const [naturesActives, setNaturesActives] = useState<Nature[]>([]);
    const [periode, setPeriode] = useState<PeriodeId>(periodeAuRepos);
    const [choisi, setChoisi] = useState<Concerne | null>(null);
    const [ordre, setOrdre] = useState<'recent' | 'ancien'>('recent');
    /** La feuille ouverte : le filtre, ou le choix d'une personne ou d'un objet. */
    const [feuille, setFeuille] = useState<'filtre' | 'choix' | null>(null);
    /** Le choix s'ouvre depuis la feuille (téléphone) ou depuis sa pastille (bureau). */
    const [choixDepuis, setChoixDepuis] = useState<'filtre' | 'outils'>('filtre');
    const [ouvert, setOuvert] = useState<HistoryEvent | null>(null);
    const [joursDeplies, setJoursDeplies] = useState<ReadonlySet<string>>(new Set());

    const rechercheRetardee = useDebounce(recherche, 250);
    /* 1280 — le seuil des neuf écrans de bureau (17.11), et celui où cinq colonnes tiennent
       sans troncature. En dessous, le journal garde ses cartes par jour. */
    const enTableau = useMediaQuery(MEDIA.twoColumn);

    const registres: Registres = useMemo(
        () => ({
            equipment: new Map(equipment.map((e) => [e.id, e])),
            approvals: new Map(approvals.map((a) => [a.id, a])),
        }),
        [equipment, approvals],
    );

    /**
     * **Le périmètre** — le journal que cette personne a le droit de lire. Le responsable
     * lit son équipe, l'administration tout (`useHistory`) ; *Mon historique* ce qui
     * concerne la personne.
     */
    const perimetre = useMemo(
        () =>
            mien
                ? events.filter((e) => concerneLaPersonne(e, mien, registres))
                : filterEvents(events),
        [events, filterEvents, mien, registres],
    );

    const dansLaPeriode = useMemo(() => {
        const debut = debutDe(periode, settings.fiscalYearStart);
        if (debut === null) return perimetre;
        return perimetre.filter((e) => new Date(e.timestamp).getTime() >= debut);
    }, [perimetre, periode, settings.fiscalYearStart]);

    /** La recherche et le choix — tout sauf la nature, dont les chips comptent le reste. */
    const correspond = useMemo(() => {
        const terme = rechercheRetardee.trim().toLowerCase();
        return (e: HistoryEvent) => {
            if (choisi && !concerne(e, choisi, registres)) return false;
            if (!terme) return true;
            return [
                faitDe(e, registres),
                complementDe(e, registres),
                e.targetName,
                e.actorName,
                e.description,
                lieuDe(e),
                registres.equipment.get(e.targetId)?.serialNumber,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(terme));
        };
    }, [choisi, rechercheRetardee, registres]);

    const horsNature = useMemo(() => dansLaPeriode.filter(correspond), [correspond, dansLaPeriode]);

    const comptesParNature = useMemo(() => {
        const compte = new Map<Nature, number>();
        horsNature.forEach((e) => {
            const n = natureDe(e);
            if (n) compte.set(n, (compte.get(n) ?? 0) + 1);
        });
        return compte;
    }, [horsNature]);

    const affiches = useMemo(() => {
        const sens = ordre === 'recent' ? -1 : 1;
        return horsNature
            .filter((e) => {
                if (naturesActives.length === 0) return true;
                const n = natureDe(e);
                return Boolean(n && naturesActives.includes(n));
            })
            .sort(
                (a, b) =>
                    sens * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
            );
    }, [horsNature, naturesActives, ordre]);

    /** Le journal se lit **groupé par jour** — au-delà de trente jours, par mois. */
    const parGroupe = useMemo(() => {
        const groupes: { groupe: Groupe; faits: HistoryEvent[] }[] = [];
        affiches.forEach((e) => {
            const groupe = groupeDe(e.timestamp);
            const dernier = groupes[groupes.length - 1];
            if (dernier && dernier.groupe.cle === groupe.cle) dernier.faits.push(e);
            else groupes.push({ groupe, faits: [e] });
        });
        return groupes;
    }, [affiches]);

    const comptesParGroupe = useMemo(
        () => new Map(parGroupe.map(({ groupe, faits }) => [groupe.cle, faits.length])),
        [parGroupe],
    );

    /* La sécurité ne se lit pas dans Mon historique : la feuille de la planche la retire. */
    const natures = mien ? NATURES.filter((n) => n.id !== 'securite') : NATURES;

    const filtresPoses =
        naturesActives.length + (periode === periodeAuRepos ? 0 : 1) + (choisi ? 1 : 0);

    const effacer = () => {
        setNaturesActives([]);
        setPeriode(periodeAuRepos);
        setChoisi(null);
    };

    const basculerNature = (id: Nature) =>
        setNaturesActives((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    /* ------------------------------------------------------------ la personne ou l'objet */

    /**
     * **Ce que le choix propose** — les personnes et les objets que le périmètre cite, et
     * seulement eux, chacun avec le nombre de faits qui le concernent.
     */
    const { personnes, objets } = useMemo(() => {
        const faitsParPersonne = new Map<string, number>();
        const faitsParObjet = new Map<string, number>();
        const compter = (table: Map<string, number>, id?: string) => {
            if (id) table.set(id, (table.get(id) ?? 0) + 1);
        };
        perimetre.forEach((e) => {
            if (!e.isSystem && e.actorId !== 'system') compter(faitsParPersonne, e.actorId);
            const autre = autrePartie(e, registres);
            if (autre?.id) compter(faitsParPersonne, autre.id);
            if (e.targetType === 'EQUIPMENT') compter(faitsParObjet, e.targetId);
        });
        const nFaits = (n: number) => `${n} fait${n > 1 ? 's' : ''}`;

        const listePersonnes: ChoixConcerne[] = users
            .filter((u) => faitsParPersonne.has(u.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .map((u) => ({
                kind: 'personne',
                id: u.id,
                name: u.name,
                vignette: initiales(u.name),
                teinte: 'bg-tint-bleu text-on-tint-bleu',
                subtitle: [u.department, u.site, nFaits(faitsParPersonne.get(u.id) ?? 0)]
                    .filter(Boolean)
                    .join(' · '),
                searchText: [u.name, u.email, u.department].filter(Boolean).join(' '),
            }));

        const listeObjets: ChoixConcerne[] = equipment
            .filter((e) => faitsParObjet.has(e.id))
            .sort((a, b) => (a.assetId || a.name).localeCompare(b.assetId || b.name, 'fr'))
            .map((e) => ({
                kind: 'objet',
                id: e.id,
                name: e.assetId || e.name,
                vignette: <Icon glyph={Laptop} size={20} />,
                subtitle: [e.name, nFaits(faitsParObjet.get(e.id) ?? 0)]
                    .filter(Boolean)
                    .join(' · '),
                searchText: [e.assetId, e.name, e.model, e.serialNumber].filter(Boolean).join(' '),
            }));

        return { personnes: listePersonnes, objets: listeObjets };
    }, [equipment, perimetre, registres, users]);

    const choixRetenu = choisi
        ? [...personnes, ...objets].find((c) => c.kind === choisi.kind && c.id === choisi.id)
        : undefined;

    const ouvrirLeChoix = (depuis: 'filtre' | 'outils') => {
        setChoixDepuis(depuis);
        setFeuille('choix');
    };

    const choisir = (choix: Concerne) => {
        setChoisi(choix);
        setFeuille(choixDepuis === 'filtre' ? 'filtre' : null);
    };

    /* ------------------------------------------------------------------- le bureau */

    /**
     * **Les suivants au défilement** — `.lfoot` : « 9 sur 312 · les suivants au
     * défilement ». Le compte se remet à une page dès que les filtres changent : il suit la
     * signature de ce qui est affiché, sans effet ni état à resynchroniser.
     */
    const signature = [
        rechercheRetardee,
        naturesActives.join(','),
        periode,
        choisi?.id,
        ordre,
        mien,
    ].join('|');
    const [defilement, setDefilement] = useState({ signature, n: PAR_PAGE });
    const nVisibles = defilement.signature === signature ? defilement.n : PAR_PAGE;
    const visibles = useMemo(() => affiches.slice(0, nVisibles), [affiches, nVisibles]);
    const sentinelle = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const cible = sentinelle.current;
        if (!enTableau || !cible || nVisibles >= affiches.length) return;
        const observateur = new IntersectionObserver(
            (entrees) => {
                if (entrees.some((entree) => entree.isIntersecting))
                    setDefilement({ signature, n: nVisibles + PAR_PAGE });
            },
            { rootMargin: '0px 0px 480px 0px' },
        );
        observateur.observe(cible);
        return () => observateur.disconnect();
    }, [affiches.length, enTableau, nVisibles, signature]);

    const peutOuvrirLaPersonne = (id: string) => permissions.canViewUsers || id === moi?.id;

    /** ⋮ — ce que la rangée ouvre, au survol (17.11) : le fait, l'objet, la personne. */
    const actesDeLaRangee = (fait: HistoryEvent): MenuItem[] => {
        const actes: MenuItem[] = [
            { id: 'fait', label: 'Ouvrir le fait', onSelect: () => setOuvert(fait) },
        ];
        const objet = fait.targetType === 'EQUIPMENT' && registres.equipment.get(fait.targetId);
        if (objet && onOpenEquipment)
            actes.push({
                id: 'objet',
                label: `Ouvrir ${objet.assetId || objet.name}`,
                onSelect: () => onOpenEquipment(objet.id),
            });
        const autre = autrePartie(fait, registres);
        const personneId = autre?.id ?? (fait.isSystem ? undefined : fait.actorId);
        const personne = personneId ? users.find((u) => u.id === personneId) : undefined;
        if (personne && onOpenUser && peutOuvrirLaPersonne(personne.id))
            actes.push({
                id: 'personne',
                label: `Ouvrir la fiche de ${personne.name}`,
                onSelect: () => onOpenUser(personne.id),
            });
        return actes;
    };

    /**
     * **Cinq colonnes, et la marque en tête** — 18.1 au bureau. L'ordre est celui de la
     * planche : ce qui s'est passé, qui, par quelle preuve, où, quand. *« La sous-ligne ne
     * garde que le complément du fait (à qui, pourquoi). »*
     */
    const colonnes: DataColumn<HistoryEvent>[] = useMemo(
        () => [
            {
                id: 'marque',
                header: '',
                width: '52px',
                cell: (fait) => <MarqueRonde fait={fait} />,
            },
            {
                id: 'fait',
                header: 'Fait',
                /* Le fait prend le reste : c'est la seule colonne qu'on lit, les autres
                   se relèvent. Sans elle, « Attestation » s'étalait sur 320 px de tirets
                   et le fait se coupait à 140. */
                grow: true,
                title: (fait) => faitDe(fait, registres),
                cell: (fait) => {
                    const suite = complementDe(fait, registres);
                    return (
                        <>
                            <span className="block truncate tabular-nums">
                                {faitDe(fait, registres)}
                            </span>
                            {suite && (
                                <span className="text-on-surface-variant block truncate text-[0.75rem] leading-4">
                                    {suite}
                                </span>
                            )}
                        </>
                    );
                },
            },
            {
                id: 'par',
                header: 'Par',
                title: (fait) => auteurDe(fait, mien),
                cell: (fait) => (
                    <span className="text-on-surface-variant first-letter:uppercase">
                        {auteurDe(fait, mien)}
                    </span>
                ),
            },
            {
                id: 'attestation',
                header: 'Attestation',
                title: (fait) => methodeDe(fait),
                /* La colonne porte une majuscule, la sous-ligne non : c'est la même phrase
                   à deux places, et une seule des deux commence quelque chose. */
                cell: (fait) => (
                    <span className="text-on-surface-variant first-letter:uppercase">
                        {methodeDe(fait) ?? '—'}
                    </span>
                ),
            },
            {
                id: 'lieu',
                header: 'Lieu',
                title: (fait) => lieuDe(fait),
                cell: (fait) => (
                    <span className="text-on-surface-variant">{lieuDe(fait) ?? '—'}</span>
                ),
            },
            {
                id: 'heure',
                header: 'Heure',
                width: '80px',
                /* Le journal se lit du plus récent au plus ancien : c'est l'heure qui
                   l'ordonne, et l'en-tête le dit (`th.sorted`). */
                sorted: ordre === 'recent' ? 'desc' : 'asc',
                cell: (fait) => (
                    <span className="text-on-surface-variant tabular-nums">
                        {ageDe(fait.timestamp)}
                    </span>
                ),
            },
        ],
        [mien, ordre, registres],
    );

    /**
     * **L'export du journal** — 18.1 au bureau le pose en acte nommé dans l'en-tête. Il
     * exporte **ce qui est affiché**, filtres compris : un journal exporté en entier ne
     * répond à aucune question, et celui qu'on regarde en répond une.
     */
    const exporterLeJournal = () => {
        const csv = [
            buildCsvLine(
                ['Date', 'Heure', 'Fait', 'Complément', 'Par', 'Attestation', 'Lieu'],
                ',',
            ),
            ...affiches.map((fait) =>
                buildCsvLine(
                    [
                        new Date(fait.timestamp).toLocaleDateString('fr-FR'),
                        heure(fait.timestamp),
                        faitDe(fait, registres),
                        complementDe(fait, registres),
                        auteurDe(fait),
                        methodeDe(fait) ?? '',
                        lieuDe(fait) ?? '',
                    ],
                    ',',
                ),
            ),
        ].join('\n');

        const nom = `historique_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.setAttribute('download', nom);
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(url);
        showToast(
            `${affiches.length} fait${affiches.length > 1 ? 's' : ''} exporté${affiches.length > 1 ? 's' : ''} — « ${nom} ».`,
            'success',
        );
    };

    /* ------------------------------------------------------------------- les mots */

    /**
     * `.ord` — ce qu'on regarde à gauche, combien à droite (« Tout · les plus récents ·
     * 312 faits », « Inventaires · 7 jours · 0 fait »). La période au repos ne s'y écrit
     * pas : elle n'est pas un filtre posé.
     */
    const regard = [
        naturesActives.length === 0
            ? 'Tout'
            : natures
                  .filter((n) => naturesActives.includes(n.id))
                  .map((n) => n.label)
                  .join(', '),
        periode === periodeAuRepos ? null : PERIODES.find((p) => p.id === periode)?.regard,
        choisi?.name,
        filtresPoses === 0 ? (ordre === 'recent' ? 'les plus récents' : 'les plus anciens') : null,
    ]
        .filter(Boolean)
        .join(' · ');

    const nFaits = `${affiches.length} fait${affiches.length > 1 ? 's' : ''}`;

    /**
     * **Le vide nomme le filtre qui le produit** — *« Aucun inventaire ces 7 jours »* — et
     * dit quand le dernier a eu lieu, puis rend le geste qui le lève : la période juste
     * plus large, pas « effacer les filtres ».
     */
    const decrireLeVide = () => {
        const terme = rechercheRetardee.trim();
        const phrase = PERIODES.find((p) => p.id === periode)?.phrase ?? '';
        const nature =
            naturesActives.length === 1 ? natures.find((n) => n.id === naturesActives[0]) : null;

        if (filtresPoses === 0 && !terme) {
            return {
                titre: mien ? 'Rien ne vous concerne encore' : `Aucun fait ${phrase}`.trim(),
                description: mien
                    ? 'Vos remises, vos demandes et vos incidents apparaîtront ici.'
                    : 'Le journal se remplit à mesure que des actes sont posés : une remise, un retour, une demande tranchée.',
                geste:
                    periode !== 'tout'
                        ? { label: 'Voir tout le journal', onClick: () => setPeriode('tout') }
                        : null,
            };
        }

        const titre = terme
            ? `Aucun fait pour « ${terme} »`
            : `${nature?.aucun ?? 'Aucun fait'} ${phrase}`.trim();

        /* Le dernier fait de même nature, toutes périodes confondues. */
        const dernier = perimetre
            .filter(correspond)
            .filter((e) => {
                if (naturesActives.length === 0) return true;
                const n = natureDe(e);
                return Boolean(n && naturesActives.includes(n));
            })
            .reduce<HistoryEvent | null>(
                (plusRecent, e) =>
                    !plusRecent || e.timestamp > plusRecent.timestamp ? e : plusRecent,
                null,
            );

        const date = dernier
            ? new Date(dernier.timestamp).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
              })
            : null;
        const description = [
            date && periode !== 'tout' ? `Le dernier date du ${date}.` : null,
            periode !== 'tout' ? 'Élargissez la période, ou changez de nature.' : null,
            periode === 'tout' && terme
                ? 'Vérifiez l’orthographe, ou cherchez un identifiant.'
                : null,
            periode === 'tout' && !terme ? 'Changez de nature, ou retirez le choix.' : null,
        ]
            .filter(Boolean)
            .join(' ');

        const plusLarge: { id: PeriodeId; label: string } | null =
            periode === '7'
                ? { id: '30', label: 'Voir les 30 derniers jours' }
                : periode === '30'
                  ? { id: 'exercice', label: "Voir l'exercice" }
                  : periode === 'exercice'
                    ? { id: 'tout', label: 'Voir tout le journal' }
                    : null;

        return {
            titre,
            description,
            geste: plusLarge
                ? { label: plusLarge.label, onClick: () => setPeriode(plusLarge.id) }
                : terme
                  ? { label: 'Effacer la recherche', onClick: () => setRecherche('') }
                  : { label: 'Tout effacer', onClick: effacer },
        };
    };

    /* Le vide ne se décrit que s'il se montre : chercher le dernier fait parcourt tout le
       périmètre. */
    const vide = affiches.length === 0 ? decrireLeVide() : null;

    /* ------------------------------------------------------------------- le rendu */

    const rangeeDuTelephone = (fait: HistoryEvent, index: number) => {
        const detail = sousLigneDe(fait, registres, mien);
        return (
            <div
                key={fait.id}
                {...activer(() => setOuvert(fait))}
                className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                    index > 0 && 'border-outline-variant border-t',
                )}
            >
                <MarqueRonde fait={fait} />
                <span className="min-w-0 flex-1">
                    {/* `.ev .t` — **le fait**, pas son sujet. */}
                    <span className="text-on-surface text-ts-body leading-ts-body block truncate tabular-nums">
                        {faitDe(fait, registres)}
                    </span>
                    {detail && (
                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub line-clamp-2 block">
                            {detail}
                        </span>
                    )}
                </span>
                <span className="text-text-tertiary shrink-0 text-[0.75rem] leading-4 tabular-nums">
                    {ageDe(fait.timestamp)}
                </span>
            </div>
        );
    };

    const feuilleDeFiltre = (
        <div className="flex flex-col">
            {/* `.sbody` et `.sfoot` — la feuille pose déjà 20 de chaque côté : libellés et
                chips n'en rajoutent pas, et le pied reprend toute la largeur pour que son
                filet coure d'un bord à l'autre. */}
            <p className="text-on-surface-variant pb-2 text-[0.75rem] leading-4 font-medium">
                Nature
            </p>
            <div className="flex flex-wrap gap-2">
                <FacetChip
                    label="Tout"
                    count={horsNature.length}
                    selected={naturesActives.length === 0}
                    onClick={() => setNaturesActives([])}
                />
                {natures.map((n) => (
                    <FacetChip
                        key={n.id}
                        label={n.label}
                        count={comptesParNature.get(n.id) ?? 0}
                        selected={naturesActives.includes(n.id)}
                        onClick={() => basculerNature(n.id)}
                    />
                ))}
            </div>

            <p className="text-on-surface-variant pt-4 pb-2 text-[0.75rem] leading-4 font-medium">
                Période
            </p>
            <div className="flex flex-wrap gap-2">
                {PERIODES.map((p) => (
                    <FacetChip
                        key={p.id}
                        label={p.label}
                        selected={periode === p.id}
                        onClick={() => setPeriode(p.id)}
                    />
                ))}
            </div>

            {/* « Personne ou objet » — *facultatif* ; Mon historique ne l'a pas. */}
            {!mien && (
                <>
                    <p className="text-on-surface-variant flex items-baseline justify-between pt-4 pb-2 text-[0.75rem] leading-4 font-medium">
                        Personne ou objet
                        <span className="text-text-tertiary font-normal">facultatif</span>
                    </p>
                    <PickRow
                        vignette={
                            choisi ? (
                                (choixRetenu?.vignette ?? initiales(choisi.name))
                            ) : (
                                <Icon glyph={Laptop} size={20} />
                            )
                        }
                        tint={choisi?.kind === 'personne' ? 'bleu' : undefined}
                        title={choisi ? choisi.name : 'Tout le monde, tous les objets'}
                        subtitle={choisi ? choixRetenu?.subtitle : undefined}
                        empty={!choisi}
                        actionLabel={choisi ? 'Changer' : 'Choisir'}
                        onClick={() => ouvrirLeChoix('filtre')}
                    />
                    {choisi && (
                        <Button
                            variant="text"
                            className="mt-1 self-start px-0"
                            onClick={() => setChoisi(null)}
                        >
                            Retirer {choisi.name}
                        </Button>
                    )}
                </>
            )}

            <div className="border-outline-variant -mx-5 mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                <Button
                    variant="tonal"
                    className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                    onClick={effacer}
                >
                    Tout effacer
                </Button>
                <Button
                    variant="filled"
                    className="justify-center"
                    onClick={() => setFeuille(null)}
                >
                    Voir {nFaits}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <ListTemplate
                /* 18.1 est une file d'événements — squelette de file (17.3, A2). */
                skeleton="file"
                /* Au bureau le corps est un tableau : il balaye, il ne se lit pas à 960
                   (§2.43, exception déclarée). Au téléphone, un jour est une carte. */
                body={enTableau ? 'tableau' : 'cartes'}
                title={mien ? 'Mon historique' : 'Historique'}
                onBack={onBack}
                search={
                    mien
                        ? undefined
                        : {
                              value: recherche,
                              onChange: setRecherche,
                              placeholder: 'Identifiant, personne, lieu',
                          }
                }
                actions={
                    enTableau ? (
                        !mien && permissions.canExportReports && affiches.length > 0 ? (
                            <Button
                                variant="outlined"
                                onClick={exporterLeJournal}
                                icon={<Icon glyph={Export} size={20} />}
                                className="h-10 min-h-10 shrink-0 gap-2 rounded-md px-3 text-[0.875rem] font-medium shadow-none"
                            >
                                Exporter
                            </Button>
                        ) : undefined
                    ) : mien ? (
                        /* Mon historique n'a pas de recherche : *« l'entonnoir ouvre la même
                           feuille »*, et il monte dans la rangée du titre. */
                        <FilterButton
                            label="Filtrer mon historique"
                            count={filtresPoses}
                            onClick={() => setFeuille('filtre')}
                            /* `.tb` de la rangée du titre : sans le creux de `.fbtn`, qui
                               appartient à la bande de recherche absente ici. */
                            className="hover:bg-surface-container -mr-2 bg-transparent"
                        />
                    ) : undefined
                }
                /*
                  **Au bureau, les axes montent en pastilles** — *« la recherche, les trois
                  filtres de la feuille en pastilles (nature, période, personne ou objet) et
                  le sens du tri »*. Au téléphone l'entonnoir reste, avec sa feuille.
                */
                filter={
                    enTableau ? (
                        <>
                            <FilterMenuChip
                                axis="Nature"
                                neutralId="toutes"
                                value={naturesActives.length === 1 ? naturesActives[0] : 'toutes'}
                                posed={naturesActives.length > 0}
                                summary={
                                    naturesActives.length > 1
                                        ? `${naturesActives.length} natures`
                                        : undefined
                                }
                                selectedIds={naturesActives}
                                onChange={(id) =>
                                    id === 'toutes'
                                        ? setNaturesActives([])
                                        : basculerNature(id as Nature)
                                }
                                options={[
                                    {
                                        id: 'toutes',
                                        label: 'Toutes les natures',
                                        count: horsNature.length,
                                    },
                                    ...natures.map((n) => ({
                                        id: n.id,
                                        label: n.label,
                                        count: comptesParNature.get(n.id) ?? 0,
                                    })),
                                ]}
                            />
                            <FilterMenuChip
                                axis="Période"
                                neutralId={periodeAuRepos}
                                value={periode}
                                onChange={(id) => setPeriode(id as PeriodeId)}
                                options={PERIODES.map((p) => ({ id: p.id, label: p.label }))}
                            />
                            {!mien && (
                                <FilterMenuChip
                                    axis="Personne ou objet"
                                    neutralId=""
                                    value={choisi?.id ?? ''}
                                    posed={Boolean(choisi)}
                                    summary={choisi?.name ?? 'Personne ou objet'}
                                    options={[]}
                                    onChange={() => undefined}
                                    onOpen={() => ouvrirLeChoix('outils')}
                                />
                            )}
                        </>
                    ) : mien ? undefined : (
                        /* **Le bouton de filtre partagé** : écrit à la main, il restait à 48
                           dans le chrome de 768, où `FilterButton` lit la mesure du gabarit. */
                        <FilterButton
                            label="Filtrer le journal"
                            count={filtresPoses}
                            onClick={() => setFeuille('filtre')}
                        />
                    )
                }
                sort={
                    enTableau
                        ? {
                              label: ordre === 'recent' ? 'Plus récent' : 'Plus ancien',
                              onClick: () =>
                                  setOrdre((prev) => (prev === 'recent' ? 'ancien' : 'recent')),
                          }
                        : undefined
                }
                count={{
                    total: affiches.length,
                    noun: `fait${affiches.length > 1 ? 's' : ''}`,
                    /* Au téléphone, ce qu'on regarde à gauche et le compte nommé à droite ;
                       au bureau le compte monte à côté du titre (`.cnt2`). */
                    regard: enTableau ? undefined : regard,
                    unite: `fait${affiches.length > 1 ? 's' : ''}`,
                }}
                hasRows={parGroupe.length > 0}
                footer={
                    enTableau && affiches.length > PAR_PAGE
                        ? `${visibles.length} sur ${affiches.length}${visibles.length < affiches.length ? ' · les suivants au défilement' : ''}`
                        : undefined
                }
                empty={
                    vide && (
                        <ScreenState
                            icon={ClockCounterClockwise}
                            title={vide.titre}
                            description={vide.description}
                            actions={
                                vide.geste ? (
                                    <Button
                                        variant="tonal"
                                        className="bg-surface-container text-on-surface hover:bg-surface-container-high"
                                        onClick={vide.geste.onClick}
                                    >
                                        {vide.geste.label}
                                    </Button>
                                ) : undefined
                            }
                        />
                    )
                }
            >
                {enTableau ? (
                    <>
                        <DataTable<HistoryEvent>
                            columns={colonnes}
                            rows={visibles}
                            rowId={(fait) => fait.id}
                            onOpen={setOuvert}
                            rowLabel={(fait) => faitDe(fait, registres)}
                            rowActions={(fait) => (
                                <Menu
                                    align="end"
                                    /* Le cadre du tableau le rognait : il flotte. */
                                    floating
                                    items={actesDeLaRangee(fait)}
                                    trigger={
                                        <Button
                                            variant="text"
                                            iconOnly
                                            size="sm"
                                            aria-label="Options du fait"
                                            className="-mr-2"
                                        >
                                            <Icon glyph={DotsThreeVertical} size={20} />
                                        </Button>
                                    }
                                />
                            )}
                            /* Les jours restent, en rangées de séparation de 36. */
                            groupOf={(fait) => {
                                const groupe = groupeDe(fait.timestamp);
                                return {
                                    id: groupe.cle,
                                    label: groupe.titre,
                                    count: comptesParGroupe.get(groupe.cle),
                                };
                            }}
                        />
                        <div ref={sentinelle} aria-hidden="true" />
                    </>
                ) : (
                    parGroupe.map(({ groupe, faits }) => {
                        const deplie = joursDeplies.has(groupe.cle) || faits.length <= PAR_JOUR;
                        const montres = deplie ? faits : faits.slice(0, PAR_JOUR);
                        const reste = faits.length - montres.length;
                        return (
                            /* `.day` — **un jour, une carte** : surface, rayon 8, intérieur
                               8 / 16, et 16 entre deux jours. */
                            <section key={groupe.cle} className="rounded-card bg-surface px-4 py-2">
                                {/* `.dh` — le jour et son compte, 17 sur 24 en graisse d'appui. */}
                                <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                                    <h3 className="text-on-surface text-ts-head leading-ts-head min-w-0 flex-1 truncate font-medium first-letter:uppercase">
                                        {groupe.titre}
                                    </h3>
                                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub shrink-0 tabular-nums">
                                        {faits.length}
                                    </span>
                                </div>
                                {montres.map(rangeeDuTelephone)}
                                {reste > 0 && (
                                    /* `.more` — 48, centré, 16 en graisse d'appui, sur un filet. */
                                    <div
                                        {...activer(() =>
                                            setJoursDeplies((prev) =>
                                                new Set(prev).add(groupe.cle),
                                            ),
                                        )}
                                        className="border-outline-variant text-on-surface text-ts-body flex min-h-12 cursor-pointer items-center justify-center gap-2 border-t font-medium"
                                    >
                                        {reste === 1
                                            ? `Voir l'autre fait ${groupe.de}`
                                            : `Voir les ${reste} autres faits ${groupe.de}`}
                                    </div>
                                )}
                            </section>
                        );
                    })
                )}
            </ListTemplate>

            {/* La feuille de filtre, puis le choix d'une personne ou d'un objet, dans la
                même feuille : on y entre et on en revient sans la refermer. */}
            <BottomSheet
                open={feuille !== null}
                onClose={() => setFeuille(null)}
                title={feuille === 'choix' ? 'Personne ou objet' : 'Filtrer'}
                subtitle={
                    feuille === 'choix' ? 'Les faits qui la concernent, et eux seuls.' : undefined
                }
            >
                {feuille === 'choix' ? (
                    <ConcernPicker personnes={personnes} objets={objets} onPick={choisir} />
                ) : (
                    feuilleDeFiltre
                )}
            </BottomSheet>

            <FactSheet
                fait={ouvert}
                journal={perimetre}
                registres={registres}
                users={users}
                equipment={equipment}
                onClose={() => setOuvert(null)}
                onOpenEquipment={onOpenEquipment}
                canOpenUser={peutOuvrirLaPersonne}
                onOpenUser={onOpenUser}
            />
        </>
    );
};

export default HistoryPage;
