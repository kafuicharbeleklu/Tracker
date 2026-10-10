import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ClockCounterClockwise,
    DotsThreeVertical,
    Export,
    Funnel,
    Laptop,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import PanneauDeFiche from '../../../components/layout/PanneauDeFiche';
import { useListeEtFiche } from '../../../hooks/useListeEtFiche';
import DataTable, { type DataColumn } from '../../../components/ui/DataTable';
import FilterMenuChip from '../../../components/ui/FilterMenuChip';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FilterButton from '../../../components/ui/FilterButton';
import FacetChip from '../../../components/ui/FacetChip';
import { PickRow } from '../../../components/ui/FormParts';
import Icon from '../../../components/ui/Icon';
import Menu, { type MenuItem } from '../../../components/ui/Menu';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useJournalComplet } from '../../../hooks/useJournalComplet';
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

const initiales = (nom: string): string =>
    nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() ?? '')
        .join('');

/**
 * La marque ronde — même icône, même teinte au téléphone et au bureau, mais **pas la même
 * taille** (23/09) : 32 et un glyphe de 18 dans la colonne de tête du tableau (la vignette
 * de `DataTable`, comme sur Actifs), **40 et un glyphe de 20** dans une rangée de téléphone,
 * comme la vignette de toutes les autres listes. Elle tenait 32 partout : au téléphone,
 * le journal paraissait dessiné plus petit que les listes voisines.
 */
const MarqueRonde: React.FC<{ fait: HistoryEvent; taille?: 'tableau' | 'rangee' }> = ({
    fait,
    taille = 'tableau',
}) => {
    const marque = marqueDe(fait);
    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full',
                taille === 'rangee' ? 'h-10 w-10' : 'h-8 w-8',
                marque.teinte,
            )}
        >
            <Icon glyph={marque.glyph} size={taille === 'rangee' ? 20 : 18} />
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
    /**
     * Le renvoi du fait d'une demande vers la demande (08/10) — **le seul historique des
     * demandes** : la file des Tâches n'en garde plus.
     */
}

const HistoryPage: React.FC<HistoryPageProps> = ({
    onBack,
    scopeUserId,
    onOpenEquipment,
    onOpenUser,
}) => {
    const { events, equipment, approvals, users, settings } = useData();
    useJournalComplet();
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
    /* Le tableau suppose une souris (P2c) : au doigt, le journal garde ses cartes et ouvre
       le fait à côté (P2a). */
    /* `MEDIA.bureau`, pas `twoColumn` (08/10) : descendu à 1 000 avec les deux colonnes le
       25/09, le tableau écrasait « Fait » à 190 px dès qu'une attestation longue entrait dans
       la page, et ses colonnes changeaient de largeur au défilement. */
    const largeurDuTableau = useMediaQuery(MEDIA.bureau);
    const survol = useMediaQuery(MEDIA.hoverCapable);
    const enTableau = largeurDuTableau && survol;

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

    /* **Le fait ouvert à côté du journal, dès 840** (P2a, 25/09) — en cartes : toucher un
       fait l'ouvre dans le panneau de droite, et son identifiant tient dans l'adresse. Sous
       840, il redevient la feuille. */
    const versLaFeuille = useCallback(
        (id: string, fermer: () => void) => {
            const fait = perimetre.find((e) => e.id === id);
            if (fait) setOuvert(fait);
            fermer();
        },
        [perimetre],
    );
    const {
        actif: ficheACote,
        ouvert: idACote,
        ouvrir: ouvrirACote,
    } = useListeEtFiche(!enTableau, versLaFeuille);
    /* Une feuille ouverte sous 840 passe dans le panneau quand la place vient. */
    useEffect(() => {
        if (ficheACote && ouvert) {
            ouvrirACote(ouvert.id);
            setOuvert(null);
        }
    }, [ficheACote, ouvert, ouvrirACote]);
    const faitACote = idACote ? (perimetre.find((e) => e.id === idACote) ?? null) : null;
    const ouvrirFait = (fait: HistoryEvent) =>
        ficheACote ? ouvrirACote(fait.id) : setOuvert(fait);

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

    /*
      **Plus de tranches de cinquante** (23/09) : le tableau monte lui-même ce qui se voit
      (`DataTable` → `useVirtualWindow`), et reçoit donc tout le journal filtré. La
      sentinelle, puis l'écoute du cadre, n'avaient plus rien à réclamer.
    */

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
                    : 'Le journal se remplit à mesure que des actes sont posés.',
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
                data-rangee
                {...activer(() => ouvrirFait(fait))}
                aria-current={idACote === fait.id ? 'true' : undefined}
                className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                    index > 0 && 'border-outline-variant border-t',
                    /* Les faits qu'on déplie (« Voir les N autres ») arrivent en fondu (26/09). */
                    index >= PAR_JOUR && 'mvt-contenu',
                    /* Le fait ouvert à côté garde le creux, jusqu'aux bords de sa carte. */
                    idACote === fait.id &&
                        'bg-surface-muted-strong shadow-[-16px_0_0_var(--tk-color-surface-muted-strong),16px_0_0_var(--tk-color-surface-muted-strong)]',
                )}
            >
                <MarqueRonde fait={fait} taille="rangee" />
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

            <div
                data-pied
                className="border-outline-variant duo-de-pied -mx-5 mt-4 gap-3 border-t px-5 pt-4 pb-1"
            >
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
                                className="doigt:h-12 doigt:min-h-12 doigt:text-ts-control doigt:leading-ts-control h-10 min-h-10 shrink-0 gap-2 rounded-md px-3 text-[0.875rem] font-medium shadow-none"
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
                listeEtFiche={ficheACote}
                panel={
                    ficheACote && (parGroupe.length > 0 || faitACote) ? (
                        <PanneauDeFiche
                            cle={idACote}
                            vide={{
                                glyph: ClockCounterClockwise,
                                title: 'Aucun fait ouvert',
                                description:
                                    'Choisissez un fait dans le journal pour lire sa preuve sans le quitter.',
                            }}
                        >
                            {faitACote ? (
                                <FactSheet
                                    key={faitACote.id}
                                    enPanneau
                                    fait={faitACote}
                                    journal={perimetre}
                                    registres={registres}
                                    users={users}
                                    equipment={equipment}
                                    onClose={() => undefined}
                                    onOpenEquipment={onOpenEquipment}
                                    canOpenUser={peutOuvrirLaPersonne}
                                    onOpenUser={onOpenUser}
                                />
                            ) : null}
                        </PanneauDeFiche>
                    ) : undefined
                }
                empty={
                    vide && (
                        <CardEmptyState
                            glyph={
                                filtresPoses > 0 || rechercheRetardee.trim()
                                    ? Funnel
                                    : ClockCounterClockwise
                            }
                            title={vide.titre}
                            description={vide.description}
                            action={
                                vide.geste ? (
                                    <Button variant="outlined" onClick={vide.geste.onClick}>
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
                            rows={affiches}
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
                emploi={feuille === 'choix' ? 'acte' : 'filtre'}
            >
                {feuille === 'choix' ? (
                    <ConcernPicker personnes={personnes} objets={objets} onPick={choisir} />
                ) : (
                    feuilleDeFiltre
                )}
            </BottomSheet>

            <FactSheet
                fait={ficheACote ? null : ouvert}
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
