import React, { useMemo } from 'react';
import {
    ArrowCircleRight,
    ArrowUUpLeft,
    CaretRight,
    Check,
    ClockCounterClockwise,
    Handshake,
    Package,
    Plus,
    Wrench,
} from '@phosphor-icons/react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import { EventType, ViewType } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useFinanceData } from '../../../context/FinanceDataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useHistory } from '../../../hooks/useHistory';
import { usePendingTasks, daysSince, type PendingTask } from '../../../hooks/usePendingTasks';
import { useCurrentCampaign, type CurrentCampaign } from '../../../hooks/useCurrentCampaign';
import { useAccountMenu } from '../../../hooks/useAccountMenu';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';

import Reading from '../../../components/layout/Reading';
import Button from '../../../components/ui/Button';
import Menu from '../../../components/ui/Menu';
import Icon from '../../../components/ui/Icon';
import Figure from '../../../components/ui/Figure';
import { getCategoryLabel } from '../../../constants/glossary';
import { calculateLinearDepreciation, formatDate, formatMoment } from '../../../lib/financial';
import { rememberAuditScope } from '../../../lib/auditScope';
import { ACTIVE_APPROVAL_STATUSES, getHistoryEventSentence } from '../../../lib/businessRules';
import { cn } from '../../../lib/utils';
import heroImage from '../../../assets/dashboard-hero.webp';

/**
 * Tableau de bord — **porté sur la planche 03.1, passe sobre du 02/09**.
 *
 * L'arc de l'écran est fixe : **décision → état → analyse → activité**.
 *
 * ## Ce que la passe sobre du 02/09 change
 *
 * L'intro de la planche le dit en une phrase : *« la zone sombre ne porte que ce qui
 * attend un geste, et sa forme suit le volume — vide, 2, 17, 999 — sans jamais
 * s'allonger. Dessous, les compteurs du parc sont des tuiles teintées (le composant
 * de 04.2) ; “Types en tension” ne liste que ce qui manque ; le budget et l'état du
 * parc tiennent en un chiffre et une jauge chacun. »*
 *
 * Concrètement, par rapport au portage du 20/08 :
 *
 * - **L'échelle passe à quatre marches**, R15 : `--t1` 28 · `--t2` 17 · `--t3` 16 ·
 *   `--t4` 12, plus la demi-marche `--t35` 14 que la planche réserve au **sous-titre
 *   de rangée du héro** (`.tt .s`) et à rien d'autre. Les valeurs 20, 15, 13 et 11
 *   que le code portait ne sont sur aucune marche : elles sont ramenées.
 * - **Deux graisses** : Inter 400 pour le texte, 500 pour un titre de carte ou un
 *   geste ; Archivo 600 pour les seuls chiffres et le prénom. Le titre du héro passe
 *   donc de « Archivo 600 » à **Inter 400** (`.hero h3{font-weight:400}`), et les
 *   titres de rangée de 500 à 400 (`.tt .t` ne déclare aucune graisse).
 * - **Les compteurs du parc deviennent des tuiles teintées** — quatre pour le
 *   gestionnaire (`.qual` : attribués · disponibles · en réparation · actifs au
 *   parc), deux pour le porteur (mes équipements · demandes en cours). La carte à
 *   séparateurs du 20/08 disparaît, et avec elle l'arbitrage « sobre = séparateurs
 *   plutôt que tuiles » : la passe du 02/09 tranche l'inverse, et c'est elle qui vaut.
 * - **Les cartes perdent leur icône de titre.** `.ch` ne porte qu'un `h3` et, à
 *   droite, une mention de 12 px (« 0 disponible »). Une icône devant chaque titre
 *   était du bruit répété cinq fois.
 * - **Le héro perd son image.** La planche le peint d'un aplat sombre — pas une
 *   photo sous un voile à 90 %. Le voile ne servait qu'à rendre l'image inoffensive ;
 *   la planche supprime les deux.
 * - **Les rangées de « À traiter » disent l'objet, puis qui et quoi.** Le titre est
 *   l'équipement (`Dell Latitude 7420`), le sous-titre la personne et la nature
 *   (`Kossi Adjovi · validation`). Le code mettait la personne dans le titre.
 * - **La vignette de rangée porte la nature par sa teinte** — `.vig.val` bleu,
 *   `.rec` vert, `.ret` orange. Elle valait `bg-info/25` pour les trois, donc ne
 *   disait rien.
 * - **L'attente se lit sur chaque rangée** (`.age`, « 6 j ») et au régime saturé
 *   (« la plus ancienne depuis 14 jours »). La note du 20/08 tenait cette donnée pour
 *   absente du modèle : elle est dans `Approval.createdAt` et
 *   `Equipment.returnRequestedAt`. C'était un relevé faux, pas un manque. Elle est
 *   jointe au sous-titre et non posée en colonne — voir la rangée pour le pourquoi.
 * - **Les notes explicatives partent** (R15 : *aucune note dans l'écran*) : « Aucune
 *   demande en attente. Le parc est à jour. », « Ouvrir la file (Tâches), filtrée
 *   sur : », « Amortis à plus de 85 %… », « N sans date de fin connue… ». Reste
 *   `.wnote`, qui ne commente pas un chiffre mais en ajoute un.
 * - **Les destinations perdent leur préposition** : `.more .mo` porte le lieu seul —
 *   « Tâches, par ancienneté », « Finances » — pas « dans Finances ». Une exception
 *   assumée : la planche nomme « Historique » la destination de « Tout l'historique »,
 *   et ce lieu n'existe pas dans `ViewType` ; le renvoi mène à **Audit**, qui est où le
 *   journal se lit. Une destination se nomme comme l'écran qu'elle ouvre, sinon elle
 *   ment.
 *
 * ## « À traiter » n'est pas une liste, c'est une zone bornée
 *
 * Sa **forme change avec le volume**, et la planche en dessine **quatre régimes** :
 *
 * | régime | volume | forme |
 * | --- | --- | --- |
 * | `vide` | 0 | pastille verte, « Vous êtes à jour » |
 * | `normale` | tout tient | les rangées, et le compte à droite du titre |
 * | `forte` | plus de quatre | quatre rangées, puis « Voir les N autres » |
 * | `saturee` | ≥ 250 | un chiffre de 44, puis les natures d'action |
 *
 * Le compte de l'en-tête (`.cnt`) accompagne les trois régimes qui portent quelque
 * chose — la planche l'écrit pour 2, 17 et 999 — et **le régime vide n'en a pas** :
 * il n'y a pas de zéro à afficher, il y a une phrase à lire. La colonne du porteur, elle,
 * n'en porte aucun : sa zone ne compte pas, elle montre ce qui l'attend.
 *
 * **Une seule destination** : les liens n'ouvrent pas un autre écran, ils ouvrent
 * **le même** — Tâches — en portant le filtre et le tri.
 *
 * ## « Répartition par type » est restée « Types en tension »
 *
 * Ce qui décide, c'est **de quel type il ne reste plus rien**. La carte ne liste que
 * les types à zéro disponible, les plus nombreux d'abord, bornée à cinq lignes. Pas
 * de barre : à zéro disponible, une barre ne dit rien. La passe sobre remplace le
 * pictogramme d'alerte de chaque ligne par la **pastille carrée de 8 px** (`.dot`)
 * et déplace « 0 disponible » dans l'en-tête de la carte.
 *
 * ## L'accueil porte le oui d'un tap, et rien de plus
 *
 * Le non se prend dans la file, où il exige un motif et un code (lot 5, T4). La
 * planche ne dessine pas de bouton sur ses rangées de démonstration — elle montre
 * l'attente à leur place — mais elle **déclare `.rbtn`** (40 px, `0 14px`, 15/500,
 * `rgba(255,255,255,.14)`), le geste de rangée sur surface inversée. Le produit le
 * garde donc, aux mesures de la planche, et l'attente s'installe à côté.
 *
 * ## Ce que la relecture du 08/09 ajoute
 *
 * - **« Inventaire en cours »**, la carte que la passe du 05/09 glisse entre « Le parc »
 *   et « Types en tension » : le lieu compté, la part retrouvée, et la reprise de la
 *   campagne. Elle n'existe **que pendant** un comptage — voir `useCurrentCampaign`.
 * - **Le rythme du budget n'est plus le quart de l'exercice.** La planche pose le repère
 *   de `.wbar b` à 67 % au 3 septembre, c'est-à-dire à la **part d'exercice écoulée**, et
 *   date sa phrase du jour (« 5 points au-dessus du rythme au 3 septembre »). Le code
 *   comparait à 25 % toute l'année : au 8 septembre il annonçait « 44 points au-dessus du
 *   rythme », ce qui n'est pas un écart mais une erreur de référence.
 * - **Le chiffre du budget est le pourcentage**, et le montant total passe au libellé —
 *   « 72 % · de 42 000 000 XOF consommés ». Le code montrait l'engagé et gardait le
 *   pourcentage pour la seule jauge.
 * - **« Tout l'historique » existe** : la page Historique (18.1) a été écrite le 05/09,
 *   et le renvoi que la planche dessine depuis « Derniers événements » n'est plus mort.
 *
 * ## Ce qui n'est pas porté, et pourquoi
 *
 * - **Le filtrage déjà appliqué dans Tâches** : le régime saturé en présente les
 *   natures d'action, puis ouvre la file unique. La définition du filtre appartient
 *   au travail de cette file.

 * - **Le rayon 4 de `.vig`** : le registre §2.2 fixe la vignette de rangée à 6 px sur
 *   les 28 écrans, et `rounded-vignette` porte ce rôle. Changer le jeton pour une
 *   planche désaccorderait les 27 autres — c'est un arbitrage de socle, pas de page.
 * - **La teinte `neutre` de `.qual`** (fond `--surface`, pastille `--inset`) que la
 *   quatrième tuile du gestionnaire demande : `TintedTile` ne la connaît pas encore,
 *   et le composant partagé n'est pas dans le périmètre de ce portage. La tuile est
 *   donc composée sur place, aux mesures exactes de `.qual .neutre`, en attendant que
 *   le ton rejoigne le composant.
 */

interface DashboardPageProps {
    onViewChange: (view: ViewType) => void;
    onNavigate?: (path: string) => void;
}

const TODO_SATURATION_THRESHOLD = 250;

/** `.hv-forte` — la planche en dessine **quatre**, et le bureau (§2.43 bis) aussi. */
const TODO_SHOWN = 4;

/** « 3 septembre » — la date du jour telle que `.wnote` la date (« au 3 septembre »). */
const jourEnClair = (date: Date): string => {
    const rendu = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return date.getDate() === 1 ? rendu.replace(/^1\s/, '1ᵉʳ ') : rendu;
};

/** « commencée hier » — un jour de campagne se dit, il ne se déchiffre pas. */
const enJour = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const jourDe = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const delta = Math.round((jourDe(new Date()) - jourDe(d)) / 86_400_000);
    if (delta <= 0) return "aujourd'hui";
    if (delta === 1) return 'hier';
    return `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
};

/**
 * **Où en est la campagne** — « Commencée hier, 2 écarts relevés. »
 *
 * La colonne mobile de la planche loge cette phrase dans `.mo`, à droite de « Reprendre
 * la campagne ». Mesuré à 393 : le libellé prend 180 px, la phrase 147, plus 18 de
 * chevron et 20 de gouttières — **365 px pour 329 disponibles**. La rangée ne peut pas
 * les tenir tous les deux, et c'est la phrase qui saute (« commencée hier, … »), donc
 * précisément le nombre d'écarts qui décide d'y retourner.
 *
 * La colonne bureau de la même planche a déjà tranché : la phrase passe en `.wnote`,
 * pleine largeur, et `.mo` reprend son rôle — **le lieu où l'on va**, comme les quatre
 * autres renvois de l'écran (« Finances », « Historique », « Tâches, par ancienneté »).
 * C'est cette résolution-là qui est portée, à 393 comme à 1280.
 */
const repriseNote = (campagne: CurrentCampaign): React.ReactNode => (
    <>
        Commencée {enJour(campagne.startedAt)}
        {campagne.ecarts > 0 && (
            <>
                ,{' '}
                <span className="text-on-surface">
                    {campagne.ecarts} écart{campagne.ecarts > 1 ? 's' : ''}
                </span>{' '}
                relevé{campagne.ecarts > 1 ? 's' : ''}
            </>
        )}
        .
    </>
);

/**
 * **Le rythme d'un exercice, c'est le temps écoulé** — le repère de `.wbar b`, que la
 * planche pose à 67 % « au 3 septembre », soit la part de l'année consommée à cette
 * date. Le code comparait à 25 % toute l'année : au 8 septembre il annonçait « 44 points
 * au-dessus du rythme » sur un budget à 72 %, ce qui ne mesurait plus rien.
 */
const partEcoulee = (annee: number): number => {
    const debut = new Date(annee, 0, 1).getTime();
    const fin = new Date(annee + 1, 0, 1).getTime();
    return Math.max(0, Math.min(100, ((Date.now() - debut) / (fin - debut)) * 100));
};

/** `.age` de la planche — « 6 j », et « auj. » plutôt que « 0 j ». */
const formatAge = (days: number | null): string | null => {
    if (days === null) return null;
    return days === 0 ? 'auj.' : `${days} j`;
};

/**
 * La vignette de rangée dit **la nature de l'attente par sa teinte** — planche 03.1,
 * `.hero .vig.val / .rec / .ret` : bleu la validation, vert la réception, orange le
 * retour. Les fonds sont la famille `--live-*` du registre §2.10 à 28 % (30 % pour
 * l'orange), l'encre la même famille éclaircie d'environ trois quarts de blanc. La
 * planche écrit cette encre en valeur brute ; le produit la recompose par `color-mix`
 * sur le jeton, parce qu'aucune valeur brute ne vit hors du fichier de jetons — et le
 * garde-fou `ds:check` lit aussi les commentaires, donc elle ne s'y cite pas non plus.
 */
const TASK_VIGNETTE: Record<PendingTask['kind'], React.CSSProperties> = {
    validation: {
        backgroundColor: 'color-mix(in srgb, var(--tk-color-live-bleu) 28%, transparent)',
        color: 'color-mix(in srgb, var(--tk-color-live-bleu) 30%, white)',
    },
    receipt: {
        backgroundColor: 'color-mix(in srgb, var(--tk-color-live-vert) 28%, transparent)',
        color: 'color-mix(in srgb, var(--tk-color-live-vert) 26%, white)',
    },
    return: {
        backgroundColor: 'color-mix(in srgb, var(--tk-color-live-orange) 30%, transparent)',
        color: 'color-mix(in srgb, var(--tk-color-live-orange) 22%, white)',
    },
};

/**
 * `.hero` — la passe du 05/09 rend au bloc « À traiter » son image de cartouche, sous
 * un voile qui va de 76 % à 92 % du bleu-noir : l'image se devine, elle ne se lit pas.
 * Le voile se compose sur le jeton inversé, sans valeur brute.
 */
const HERO_STYLE: React.CSSProperties = {
    backgroundColor: 'var(--tk-color-inverse-surface)',
    backgroundImage: `url(${heroImage})`,
    backgroundPosition: 'center 42%',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
};
const HERO_VEIL_STYLE: React.CSSProperties = {
    backgroundImage:
        'linear-gradient(180deg, color-mix(in srgb, var(--tk-color-inverse-surface) 76%, transparent) 0%, color-mix(in srgb, var(--tk-color-inverse-surface) 90%, transparent) 62%, color-mix(in srgb, var(--tk-color-inverse-surface) 92%, transparent) 100%)',
};

/** Les trois états que « Le parc » compte, dans l'ordre de la barre et des compteurs. */
const FLEET_STATES: readonly {
    key: 'assigned' | 'available' | 'repair';
    status: string;
    label: string;
    tone: 'bleu' | 'vert' | 'orange';
    color: string;
}[] = [
    {
        key: 'assigned',
        status: 'Attribué',
        label: 'attribués',
        tone: 'bleu',
        color: 'var(--tk-color-st-bleu)',
    },
    {
        key: 'available',
        status: 'Disponible',
        label: 'disponibles',
        tone: 'vert',
        color: 'var(--tk-color-st-vert)',
    },
    {
        key: 'repair',
        status: 'En réparation',
        label: 'en réparation',
        tone: 'orange',
        color: 'var(--tk-color-st-orange)',
    },
];

/** `.vmot` — la pastille ronde de 48 du régime vide, `rgba(122,185,85,.22)`. */
const EMPTY_MOTIF_STYLE: React.CSSProperties = {
    backgroundColor: 'color-mix(in srgb, var(--tk-color-live-vert) 22%, transparent)',
    color: 'color-mix(in srgb, var(--tk-color-live-vert) 26%, white)',
};

/**
 * `.mk` — la marque d'événement porte **le glyphe de l'acte**, pas une horloge
 * générique : la planche en montre quatre distincts (paquet, retour, remise,
 * attribution) sur cinq rangées.
 */
const EVENT_GLYPH: Partial<Record<EventType, PhosphorGlyph>> = {
    CREATE: Package,
    RETURN: ArrowUUpLeft,
    ASSIGN: ArrowCircleRight,
    ASSIGN_PENDING: ArrowCircleRight,
    ASSIGN_IT_SELECTED: ArrowCircleRight,
    ASSIGN_CONFIRMED: Handshake,
    REPAIR_START: Wrench,
    REPAIR_END: Wrench,
};

/**
 * `.card` — **16 px d'intérieur** (passe du 05/09, alignée sur 09/10/16), rayon 8. Son
 * en-tête `.ch` ne porte **qu'un titre** (17 px / 500 / 24) et, à droite, une mention
 * de 14 / 20 en encre secondaire ; 8 px sous lui. L'icône que le code posait devant
 * chaque titre n'existe nulle part dans la planche.
 */
const Card: React.FC<{
    title: string;
    meta?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, meta, children }) => (
    <section className="rounded-card bg-surface p-4">
        {/* `<header>`, pas `<div>` (10/09) : les rangées qui suivent sont des `div` et
            comptent sur `first-of-type:border-t-0` — avec un en-tête `div`, la première
            rangée n'était jamais la première de son type, et la planche (`.ev+.ev`,
            `.brow:first-of-type{border-top:0}`) n'a pas de filet sous le titre. */}
        <header className="mb-2 flex min-h-6 items-center justify-between gap-3">
            <h3 className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                {title}
            </h3>
            {meta && (
                <span className="text-on-surface-variant shrink-0 text-[14px] leading-5">
                    {meta}
                </span>
            )}
        </header>
        {children}
    </section>
);

/**
 * `.more` — la rangée d'orientation : 48 px, un filet au-dessus, le libellé à 16 px,
 * la **destination seule** à droite en 12 px, et le chevron **droit** de 18. Le code
 * portait un chevron bas pivoté et un libellé de 14 : ni l'un ni l'autre n'est dans
 * la planche.
 */
const DashboardMoreAction: React.FC<{
    label: React.ReactNode;
    destination: React.ReactNode;
    onClick: () => void;
    tone?: 'surface' | 'inverse';
}> = ({ label, destination, onClick, tone = 'surface' }) => {
    const isInverse = tone === 'inverse';

    return (
        <Button
            variant="text"
            onClick={onClick}
            className={cn(
                'min-h-12 w-full justify-start gap-2.5 border-t px-0 text-[16px] font-normal hover:bg-transparent',
                isInverse
                    ? 'text-inverse-on-surface hover:text-inverse-on-surface focus-visible:ring-primary border-white/[0.14]'
                    : 'border-outline-variant text-on-surface hover:text-on-surface mt-1',
            )}
        >
            <span className="shrink-0">{label}</span>
            <span
                className={cn(
                    'ml-auto min-w-0 flex-1 truncate text-right text-[12px] leading-4 font-normal',
                    isInverse ? 'text-on-nav-surface-variant' : 'text-on-surface-variant',
                )}
            >
                {destination}
            </span>
            <Icon
                glyph={CaretRight}
                size={18}
                className={cn(
                    'shrink-0',
                    isInverse ? 'text-on-nav-surface-variant' : 'text-on-surface',
                )}
            />
        </Button>
    );
};

/**
 * `.wrow` + `.wbar` (+ `.wnote`) — **un chiffre et une jauge**, la forme que la passe
 * sobre donne à « État du parc », « Budget » et « Garantie ».
 *
 * Ce n'est pas `ProportionRow` : celui-ci porte les mesures de la planche 04.2
 * (chiffre 20 / interligne nul, libellé 15/19, jauge à 14 px du chiffre, teinte
 * `attention` en rouge `--danger`), et 03.1 en demande d'autres — chiffre **22/28**,
 * libellé **16/24**, jauge à **12 px**, remplissage `--st-orange` ou `--st-vert`. Les
 * deux formes convergeront quand le composant partagé accueillera les mesures de la
 * passe ; en attendant, celle de 03.1 vit ici plutôt que de tordre celle de 04.2.
 */
const Gauge: React.FC<{
    value: React.ReactNode;
    label: React.ReactNode;
    percent: number;
    /** Classe de remplissage — l'encre par défaut, `--st-orange` ce qui appelle un geste. */
    fill?: string;
    /** Le repère vertical de `.wbar b` — le quart d'exercice, en pourcentage. */
    marker?: number;
    note?: React.ReactNode;
    ariaLabel?: string;
}> = ({ value, label, percent, fill = 'bg-on-surface', marker, note, ariaLabel }) => {
    const clamped = Math.max(0, Math.min(100, percent));

    return (
        <div>
            <p className="mt-2.5 flex items-baseline gap-2.5">
                <span className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em] tabular-nums">
                    {value}
                </span>
                <span className="text-on-surface-variant min-w-0 flex-1 text-[16px] leading-6">
                    {label}
                </span>
            </p>

            <div
                role="img"
                aria-label={ariaLabel ?? `${Math.round(clamped)} %`}
                className="bg-surface-container relative mt-3 h-1.5 rounded-xs"
            >
                <span
                    className={cn('block h-full rounded-xs', fill)}
                    style={{ width: `${clamped}%` }}
                />
                {marker !== undefined && (
                    <span
                        className="bg-outline absolute -top-1 h-3.5 w-0.5"
                        style={{ left: `${marker}%` }}
                        aria-hidden="true"
                    />
                )}
            </div>

            {note && <p className="text-on-surface-variant mt-2 text-[16px] leading-6">{note}</p>}
        </div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onViewChange, onNavigate }) => {
    const { equipment: allEquipment, users, approvals } = useData();
    const { filterEquipment, permissions, user: currentUser } = useAccessControl();
    const { getRecentActivity } = useHistory();

    /**
     * **LE MENU DE COMPTE.** Il portait sa propre boîte : un voile fixe, un bord,
     * `shadow-elevation-3`, 300 px de large, des rangées séparées d'un filet. Le produit
     * compte neuf autres menus contextuels, tous rendus par `components/ui/Menu` —
     * c'est-à-dire par `menus.css`. Celui-ci était le seul à ne ressembler à aucun
     * autre, et le seul sans navigation au clavier ni sémantique `menu`/`menuitem`.
     *
     * Son contenu vit dans `useAccountMenu` : **le pied de la barre latérale ouvre le
     * même menu** au bureau (00.3, §2.43), et une liste de destinations recopiée d'une
     * surface à l'autre finit par diverger.
     */
    const compte = useAccountMenu();

    /**
     * **Les deux seuils du bureau** (00.3, et la note de recherche du 08/09).
     *
     * `large` (≥ 840) : la navigation a quitté le bas de l'écran, l'en-tête prend sa
     * forme de bureau et la bande de chiffres passe en ligne. `bureau` (≥ 1280) : la
     * grille de 03.1 — c'est le seuil où chaque colonne garde ses 360 px, la seule
     * bascule à deux colonnes que §2.43 accorde.
     */
    const large = useMediaQuery(MEDIA.expandedUp);
    const bureau = useMediaQuery(MEDIA.twoColumn);
    /**
     * **L'avatar n'est dans l'en-tête que lorsqu'il n'y a pas de navigation latérale.**
     * Dès 600 px, le rail puis la barre portent la personne à leur pied : garder la
     * pastille en haut ferait **deux portes vers le même compte** sur le même écran.
     */
    const compact = useMediaQuery(MEDIA.compact);

    const equipment = useMemo(
        () => filterEquipment(allEquipment, users),
        [allEquipment, users, filterEquipment],
    );
    /*
      Ce qui attend un geste vient du hook partagé : l'accueil, la barre du bas et la
      barre latérale doivent annoncer **le même nombre**. Il vivait ici, et la barre
      latérale en tenait un second, compté sur les noms des personnes.
    */
    const { tasks: todo, oldestWaitDays: oldestWait, breakdown: todoBreakdown } = usePendingTasks();

    /* L'inventaire physique qui tourne — `null` tant que personne ne compte. */
    const campagne = useCurrentCampaign();

    const openTasks = () => onViewChange('tasks');

    /**
     * **Reprendre, ce n'est pas relister.** Le renvoi ne repasse pas par la vue globale
     * (16.1) : il retient le lieu et ouvre le comptage (16.2) là où il en était. Le
     * périmètre est le site entier — c'est celui que la carte nomme.
     */
    const reprendreCampagne = (encours: CurrentCampaign) => {
        rememberAuditScope({ country: encours.country, site: encours.site });
        onViewChange('audit_details');
    };

    // ---- l'état du parc --------------------------------------------------------
    const counts = useMemo(() => {
        const assigned = equipment.filter((item) => item.status === 'Attribué').length;
        const available = equipment.filter((item) => item.status === 'Disponible').length;
        const repair = equipment.filter((item) => item.status === 'En réparation').length;
        return {
            total: equipment.length,
            assigned,
            available,
            repair,
            /**
             * **Ce que les trois états ne couvrent pas.** La planche compte trois états et
             * sa fixture s'y épuise — 7 + 5 + 2 = 14. Le parc réel non : un actif *retiré*
             * ou *manquant* n'est ni attribué, ni disponible, ni en réparation, et il
             * manquait à la barre sans que rien ne le dise.
             *
             * Le reste est **nommé état par état** : « 34 retirés, 11 manquants » se lit,
             * là où « 45 hors des trois états » demande d'aller chercher lesquels.
             */
            reste: (() => {
                const parEtat = new Map<string, number>();
                equipment.forEach((item) => {
                    if (
                        item.status === 'Attribué' ||
                        item.status === 'Disponible' ||
                        item.status === 'En réparation'
                    )
                        return;
                    parEtat.set(item.status, (parEtat.get(item.status) ?? 0) + 1);
                });
                const total = [...parEtat.values()].reduce((a, b) => a + b, 0);
                const phrase = [...parEtat.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([etat, n]) => `${n} ${etat.toLowerCase()}${n > 1 ? 's' : ''}`)
                    .join(', ');
                return { total, phrase };
            })(),
        };
    }, [equipment]);

    /**
     * **Types en tension** : uniquement ceux dont il ne reste aucune unité
     * disponible, les plus nombreux d'abord. Ce qui est couvert tient en une phrase.
     */
    const tension = useMemo(() => {
        const byType = new Map<string, { label: string; total: number; available: number }>();
        equipment.forEach((item) => {
            const entry = byType.get(item.type) ?? {
                label: getCategoryLabel(item.type),
                total: 0,
                available: 0,
            };
            entry.total += 1;
            if (item.status === 'Disponible') entry.available += 1;
            byType.set(item.type, entry);
        });

        const all = [...byType.entries()];
        const stressed = all
            .filter(([, entry]) => entry.available === 0)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
        return { stressed, calm: all.length - stressed.length };
    }, [equipment]);

    const fleet = useMemo(() => {
        const active = equipment.filter((item) => item.operationalStatus !== 'Retiré');
        const now = Date.now();

        const endOfLife = active.filter((item) => {
            if (!item.financial) return false;
            /*
              **Sans prix d'achat, il n'y a pas de vie comptable** — donc pas de fin.
              `calculateLinearDepreciation` rend `progressPercent: 100` quand le montant
              amortissable est nul (division impossible, valeur de repli). Le parc importé
              porte `purchasePrice: 0` sur ses 243 actifs : la carte annonçait « 243 sur
              243 en fin de vie comptable », jauge pleine, sur un parc dont aucun prix
              n'est connu. Un chiffre issu d'un repli n'est pas une mesure.
            */
            if (!(item.financial.purchasePrice > 0) || !(item.financial.depreciationYears > 0))
                return false;
            const stats = calculateLinearDepreciation(
                item.financial.purchasePrice,
                item.financial.purchaseDate,
                item.financial.depreciationYears,
                item.financial.purchasePrice > 0
                    ? ((item.financial.salvageValue || 0) / item.financial.purchasePrice) * 100
                    : 0,
            );
            return stats.progressPercent > 85;
        }).length;

        const uncovered = active.filter(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() <= now,
        ).length;

        return { size: active.length, endOfLife, uncovered };
    }, [equipment]);

    const { financeBudgets } = useFinanceData();

    const budgetStats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const currentBudget =
            financeBudgets.find((b) => b.year === currentYear) || financeBudgets[0];
        if (!currentBudget) return null;
        const totalAllocated = currentBudget.totalAllocated || 0;
        const totalSpent = currentBudget.items.reduce((acc, item) => acc + (item.spent || 0), 0);
        const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
        const remaining = totalAllocated - totalSpent;
        return {
            year: currentBudget.year,
            totalAllocated,
            totalSpent,
            percentSpent,
            remaining,
        };
    }, [financeBudgets]);

    /**
     * Le repère du budget — `null` dès que l'exercice affiché n'est pas celui qui court :
     * on ne mesure pas un retard sur une année finie ou pas commencée.
     */
    const budgetPace = useMemo(() => {
        if (!budgetStats) return null;
        return budgetStats.year === new Date().getFullYear() ? partEcoulee(budgetStats.year) : null;
    }, [budgetStats]);
    const budgetGap =
        budgetStats && budgetPace !== null ? Math.round(budgetStats.percentSpent - budgetPace) : 0;

    /* Trois lignes au téléphone, **quatre au bureau** : la colonne des événements y est
       bornée à la hauteur de la file, et la planche l'y dessine à quatre. */
    const recentEvents = useMemo(
        () => getRecentActivity(bureau ? 4 : 3),
        [bureau, getRecentActivity],
    );

    // ---- la vue de l'utilisateur porteur ---------------------------------------
    const myEquipment = useMemo(
        () =>
            allEquipment.filter(
                (item) =>
                    item.user?.id === currentUser?.id || item.user?.name === currentUser?.name,
            ),
        [allEquipment, currentUser],
    );

    const myTypes = useMemo(() => {
        const countsByType = new Map<string, number>();
        myEquipment.forEach((item) => {
            countsByType.set(
                getCategoryLabel(item.type),
                (countsByType.get(getCategoryLabel(item.type)) || 0) + 1,
            );
        });
        const max = Math.max(...countsByType.values(), 1);
        return [...countsByType.entries()].map(([type, count]) => ({
            type,
            count,
            percent: (count / max) * 100,
        }));
    }, [myEquipment]);

    const myWarranty = useMemo(() => {
        const now = Date.now();
        const covered = myEquipment.filter(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() > now,
        ).length;
        const uncoveredItem = myEquipment.find(
            (item) => item.warrantyEnd && new Date(item.warrantyEnd).getTime() <= now,
        );
        const percent = myEquipment.length > 0 ? (covered / myEquipment.length) * 100 : 0;
        return { covered, total: myEquipment.length, percent, uncoveredItem };
    }, [myEquipment]);

    const mine = useMemo(
        () => ({
            equipment: myEquipment.length,
            requests: approvals.filter(
                (approval) =>
                    ACTIVE_APPROVAL_STATUSES.includes(approval.status) &&
                    (approval.requesterId === currentUser?.id ||
                        approval.beneficiaryId === currentUser?.id),
            ).length,
            receipts: approvals.filter(
                (approval) =>
                    approval.status === 'PENDING_DELIVERY' &&
                    approval.beneficiaryId === currentUser?.id,
            ).length,
        }),
        [myEquipment, approvals, currentUser],
    );

    /**
     * **Le renouvellement** — la conséquence que « État du parc » pose sous la fin de
     * vie comptable : la ligne du budget qui le porte, et ce qu'il en reste. La ligne
     * se reconnaît à son nom (matériel, renouvellement, équipement) ; à défaut, c'est
     * la plus dotée de l'exercice. Sans budget, la phrase n'existe pas.
     */
    const renewal = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const currentBudget =
            financeBudgets.find((b) => b.year === currentYear) || financeBudgets[0];
        if (!currentBudget || currentBudget.items.length === 0) return null;
        const named = currentBudget.items.find((item) =>
            /renouvel|mat[ée]riel|[ée]quipement|hardware/i.test(item.category),
        );
        const line = named ?? [...currentBudget.items].sort((a, b) => b.allocated - a.allocated)[0];
        return { category: line.category, remaining: line.allocated - (line.spent || 0) };
    }, [financeBudgets]);

    const openFleet = (status: string) =>
        onNavigate?.(`/inventory/filter/${encodeURIComponent(status)}`);

    const isManager = permissions.canManageInventory;
    const firstName = (currentUser?.name || '').split(' ')[0];

    /** Quatre rangées au plus dans la zone : au-delà, c'est la file qui prend. */
    const isTodoSaturated = todo.length >= TODO_SATURATION_THRESHOLD;
    const shown = todo.slice(0, TODO_SHOWN);
    const rest = todo.length - shown.length;

    /**
     * `.sub` — la sous-ligne dit **la charge**, dans la grammaire des quatre régimes de
     * la planche : « Rien à traiter · 14 actifs » · « 2 choses vous attendent » ·
     * « 17 choses vous attendent » · « 999 demandes en attente ». Le rappel du parc
     * n'apparaît **qu'au régime vide** : quand il y a du travail, c'est le travail qui
     * occupe la ligne. Le code l'accolait aux quatre régimes.
     */
    const subtitle = (() => {
        if (!isManager) {
            return mine.receipts === 0
                ? 'Rien à confirmer'
                : `${mine.receipts} réception${mine.receipts > 1 ? 's' : ''} à confirmer`;
        }
        if (todo.length === 0) return `Rien à traiter · ${counts.total} actifs`;
        if (isTodoSaturated) return `${todo.length} demandes en attente`;
        return `${todo.length} chose${todo.length > 1 ? 's' : ''} vous attend${todo.length > 1 ? 'ent' : ''}`;
    })();

    /*
      **Les onze morceaux de l'écran, nommés une fois.** Le téléphone les empile ; le
      bureau les compose autrement (03.1 bureau, §2.43 bis). Ce sont **les mêmes** — une
      carte qui change de place ne change pas de contenu, et c'est la seule façon de tenir
      les deux régimes sans écrire deux tableaux de bord.
    */
    const enTete = (
        <>
            {/* `.topbar` — prénom en Archivo 600 / 28 / 32, sous-ligne 16 / 24. */}
            <header className="flex items-start justify-between gap-3 pt-2">
                <div className="min-w-0">
                    <h1 className="font-brand text-on-surface text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                        Bonjour {firstName}
                    </h1>
                    <p className="text-on-surface-variant mt-0.5 text-[16px] leading-6">
                        {subtitle}
                    </p>
                </div>

                {compact && (
                    <Menu
                        align="end"
                        /* La légende dit **qui l'on est et à quel titre**. Le
                           rattachement n'y monte pas : il vit dans Mon compte, et
                           une légende de 12 qui passe à la ligne cesse d'en être
                           une. */
                        title={compte.legende}
                        items={compte.items}
                        trigger={
                            <Button
                                variant="text"
                                size="md"
                                iconOnly
                                /* `.avat` — 44, rond. `iconOnly` pose `min-h-12 min-w-12` que `h-11`
                                   ne bat pas : les deux minima sont abaissés avec (10/09). */
                                className="font-brand focus-visible:ring-primary flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-inverse-surface)] text-[15px] font-semibold tracking-wide text-white hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                                aria-label={`Compte — ${compte.nom}`}
                            >
                                {compte.initiales}
                            </Button>
                        }
                    />
                )}
            </header>
        </>
    );

    const gestes = (
        <>
            {isManager ? (
                <div className="grid grid-cols-2 gap-2.5">
                    <Button
                        variant="text"
                        className="bg-surface text-on-surface hover:bg-surface-container h-12 gap-2 !rounded-[4px] px-3 text-[16px] font-medium !shadow-none"
                        icon={<Icon glyph={ArrowUUpLeft} size={20} />}
                        onClick={() => onViewChange('return_wizard')}
                    >
                        Restituer
                    </Button>
                    <Button
                        variant="filled"
                        className="bg-primary hover:bg-primary-hover h-12 gap-2 !rounded-[4px] px-3 text-[16px] font-medium text-[var(--tk-color-brand-text)] !shadow-none"
                        icon={<Icon glyph={ArrowCircleRight} size={20} />}
                        onClick={() => onViewChange('assignment_wizard')}
                    >
                        Attribuer
                    </Button>
                </div>
            ) : (
                <Button
                    variant="filled"
                    className="bg-primary hover:bg-primary-hover h-12 w-full gap-2 !rounded-[4px] px-3 text-[16px] font-medium text-[var(--tk-color-brand-text)] !shadow-none"
                    icon={<Icon glyph={Plus} size={20} />}
                    onClick={() => onViewChange('new_request')}
                >
                    Demander un équipement
                </Button>
            )}
        </>
    );

    const aTraiter = (
        <>
            <section
                className="rounded-card text-inverse-on-surface relative isolate overflow-hidden p-5"
                style={HERO_STYLE}
            >
                <div
                    className="absolute inset-0 -z-10"
                    style={HERO_VEIL_STYLE}
                    aria-hidden="true"
                />
                <div className="flex min-h-6 items-center justify-between gap-3">
                    {/* `.hero h3` — 17 / 500 / 24, sans glyphe : la zone se nomme,
                        elle ne s'illustre pas. Le compte, 14 / 20, dès qu'il y a
                        quelque chose à traiter. */}
                    <h3 className="min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                        À traiter
                    </h3>
                    {/* La colonne du porteur n'en porte aucun : sa zone ne
                        compte pas, elle montre ce qui l'attend. */}
                    {isManager && todo.length > 0 && (
                        <span className="shrink-0 text-[14px] leading-5 text-[var(--tk-color-on-dark-2)] tabular-nums">
                            {todo.length}
                        </span>
                    )}
                </div>

                {todo.length === 0 ? (
                    /* Régime `vide` — `.vide` / `.vmot` : une pastille ronde de 48
                       au vert vivant, deux lignes, et pas de rassurance ajoutée. */
                    <div className="flex items-center gap-3.5 pt-3 pb-1">
                        <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                            style={EMPTY_MOTIF_STYLE}
                        >
                            <Icon glyph={Check} size={20} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[17px] leading-6">Vous êtes à jour</p>
                            <p className="mt-0.5 text-[12px] leading-4 text-[var(--tk-color-on-dark-2)]">
                                Rien n’attend votre geste.
                            </p>
                        </div>
                    </div>
                ) : isTodoSaturated ? (
                    /* Régime `saturee` — `.bigc` 44 / 48 / -.03em, puis `.tri` : les
                       natures d'action, chacune un renvoi vers la file. */
                    <>
                        <div className="font-brand mt-2 text-[44px] leading-[48px] font-semibold tracking-[-0.03em] tabular-nums">
                            {todo.length}
                        </div>
                        <div className="mt-1 text-[12px] leading-4 text-[var(--tk-color-on-dark-2)]">
                            demandes en attente
                            {oldestWait !== null &&
                                ` · la plus ancienne depuis ${oldestWait} jour${oldestWait > 1 ? 's' : ''}`}
                        </div>
                        <div className="mt-3 border-t border-white/[0.14]">
                            {todoBreakdown.map((item) => (
                                <Button
                                    key={item.label}
                                    variant="text"
                                    onClick={openTasks}
                                    className="text-inverse-on-surface hover:text-inverse-on-surface focus-visible:ring-primary min-h-12 w-full justify-start gap-3 border-b border-white/[0.14] px-0 font-normal hover:bg-transparent"
                                >
                                    <span className="font-brand w-12 shrink-0 text-left text-[17px] font-semibold tabular-nums">
                                        {item.count}
                                    </span>
                                    <span className="flex-1 text-left text-[16px]">
                                        {item.label}
                                    </span>
                                    <Icon
                                        glyph={CaretRight}
                                        size={18}
                                        className="text-on-nav-surface-variant shrink-0"
                                    />
                                </Button>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Régimes `normale` et `forte` — `.trow` : 68 px, filet au-dessus
                       (le premier compris), et l'attente à droite. */
                    <>
                        {shown.map((entry) => {
                            const age = formatAge(daysSince(entry.since));
                            /* La nature, en un mot : « validation », « réception »,
                               « retour » — la sous-ligne d'une file dit la personne
                               et la nature, rien d'autre (R15). */
                            const nature =
                                entry.kind === 'receipt'
                                    ? 'réception'
                                    : entry.kind === 'return'
                                      ? 'retour'
                                      : 'validation';
                            /*
                              **Une rangée ne vous nomme pas à vous.** La colonne
                              du porteur l'écrit sans détour : sa réception se lit
                              « Écran Dell U2722 · livré le 24 juillet », pas
                              « Marc Finance · réception ». Une file dit *de qui*
                              on attend quelque chose ; quand c'est de vous, le
                              nom est du bruit et la nature suffit.
                            */
                            const pourMoi =
                                Boolean(currentUser?.name) && entry.who === currentUser?.name;
                            const initials = entry.who
                                .split(' ')
                                .map((part) => part[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join('')
                                .toUpperCase();

                            /*
                              `.trow` — **une rangée de file ne porte ni verbe ni ⋮**
                              (R15) : elle est le sujet, l'objet en titre, la personne
                              et la nature en sous-ligne, l'âge à droite en 12
                              tabulaire, sans chevron ; son tap ouvre la file, où le
                              verbe ouvre la feuille d'acte. Les boutons « Valider »,
                              « Confirmer », « Réceptionner » que l'accueil portait
                              passaient par le pavé administrateur : ils partent.
                            */
                            return (
                                <Button
                                    key={entry.id}
                                    variant="text"
                                    layout="card"
                                    onClick={openTasks}
                                    className="text-inverse-on-surface hover:text-inverse-on-surface focus-visible:ring-primary min-h-14 w-full items-center gap-3 rounded-none border-t border-white/[0.14] px-0 py-2 font-normal whitespace-normal first-of-type:mt-2 hover:bg-transparent active:scale-100"
                                >
                                    {/* `.vig` — initiales quand une personne est
                                        nommée, le glyphe de l'objet sinon ; la teinte
                                        dit la nature. */}
                                    <span
                                        className="rounded-vignette font-brand flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold"
                                        style={TASK_VIGNETTE[entry.kind]}
                                    >
                                        {initials ? initials : <Icon glyph={Package} size={20} />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[17px] leading-6 tracking-[-0.01em]">
                                            {entry.what}
                                        </span>
                                        <span className="mt-0.5 block text-[14px] leading-5 text-[var(--tk-color-on-dark-2)]">
                                            {[pourMoi ? '' : entry.who, nature]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </span>
                                    {age && (
                                        <span className="mt-1 shrink-0 self-start text-[12px] leading-4 text-[var(--tk-color-on-dark-2)] tabular-nums">
                                            {age}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}

                        {rest > 0 && (
                            <DashboardMoreAction
                                label={`Voir ${rest > 1 ? `les ${rest} autres` : "l'autre"}`}
                                destination="Tâches, par ancienneté"
                                onClick={() => openTasks()}
                                tone="inverse"
                            />
                        )}
                    </>
                )}
            </section>
        </>
    );

    const leParc = (
        <>
            {isManager ? (
                <section className="rounded-card bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                            Le parc
                        </h3>
                        <Figure
                            layout="inline"
                            value={counts.total}
                            label="actifs"
                            onClick={() => openFleet('')}
                            aria-label={`${counts.total} actifs, voir la liste`}
                            className="shrink-0"
                        />
                    </div>
                    {/* `.split` — 6 px, rayon 2, 2 px entre les états, **sur le
                        creux de la page**. La barre n'avait pas de fond : les
                        actifs qu'aucun des trois états ne couvre y laissaient un
                        blanc, et la barre paraissait inachevée. Le creux est le
                        même que celui de `.wbar`, la jauge de la carte voisine —
                        il dit « le reste du parc », il ne le peint pas en état. */}
                    <div
                        className="bg-surface-container mt-3.5 flex h-1.5 gap-0.5 overflow-hidden rounded-xs"
                        role="img"
                        aria-label={`${counts.assigned} attribués, ${counts.available} disponibles, ${counts.repair} en réparation${counts.reste.total > 0 ? `, ${counts.reste.phrase}` : ''} sur ${counts.total}`}
                    >
                        {FLEET_STATES.map((state) => {
                            const width =
                                counts.total > 0 ? (counts[state.key] / counts.total) * 100 : 0;
                            return width > 0 ? (
                                <span
                                    key={state.key}
                                    className="block h-full"
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: state.color,
                                    }}
                                />
                            ) : null;
                        })}
                    </div>
                    {/* `.qual` — trois colonnes, 22 / 28 en Archivo, le libellé 14 / 20
                        avec sa pastille de 8. */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {FLEET_STATES.map((state) => (
                            <Figure
                                key={state.key}
                                value={counts[state.key]}
                                label={state.label}
                                tone={state.tone}
                                onClick={() => openFleet(state.status)}
                            />
                        ))}
                    </div>
                    {/* `.calm` — la phrase qui répond au creux de la barre, dans
                        l'idiome de la carte voisine (« Les 3 autres types ont au
                        moins une unité »). Elle ne paraît que s'il y a un reste :
                        un parc entièrement en service n'a rien à expliquer. */}
                    {counts.reste.total > 0 && (
                        <Button
                            variant="text"
                            onClick={() => openFleet('')}
                            className="text-on-surface-variant hover:text-on-surface mt-2.5 min-h-0 justify-start px-0 text-left text-[12px] leading-4 font-normal hover:bg-transparent"
                        >
                            <span>
                                Hors service :{' '}
                                <b className="text-on-surface font-medium tabular-nums">
                                    {counts.reste.phrase}
                                </b>
                            </span>
                        </Button>
                    )}
                </section>
            ) : (
                /* `.qual.two` — deux cartes blanches, chiffre et libellé à pastille :
                   ce que je détiens (bleu), ce que j'attends (ambre). */
                <div className="grid grid-cols-2 gap-4">
                    <Figure
                        card
                        tone="bleu"
                        value={mine.equipment}
                        label="mes équipements"
                        onClick={() => openFleet('')}
                    />
                    <Figure
                        card
                        tone="ambre"
                        value={mine.requests}
                        label="demandes en cours"
                        onClick={() => onViewChange('tasks')}
                    />
                </div>
            )}
        </>
    );

    /*
      **La carte n'existe que s'il y a une campagne.** Extraite en constante, elle est
      évaluée à chaque rendu — et `campagne.site` sur un `null` faisait tomber tout
      l'écran. Le garde ne peut donc pas rester au point d'appel : il vient ici.
    */
    const inventaire = campagne && (
        <>
            <Card title="Inventaire en cours" meta={campagne.site}>
                <Gauge
                    value={`${campagne.progress} %`}
                    label="du parc du lieu retrouvé"
                    percent={campagne.progress}
                    fill="bg-[var(--tk-color-st-vert)]"
                    note={repriseNote(campagne)}
                    ariaLabel={`${campagne.found} actifs retrouvés sur ${campagne.expected}`}
                />
                <DashboardMoreAction
                    label="Reprendre la campagne"
                    destination="Inventaire"
                    onClick={() => reprendreCampagne(campagne)}
                />
            </Card>
        </>
    );

    const typesEnTension = (
        <>
            <Card
                title="Types en tension"
                meta={tension.stressed.length > 0 ? '0 disponible' : undefined}
            >
                {tension.stressed.length > 0 ? (
                    <>
                        {tension.stressed.map(([type, entry]) => (
                            /* `.brow` — 48 px, filet au-dessus, pastille carrée
                                   de 8 en `--st-orange`. Le pictogramme d'alerte
                                   que le code posait sur chaque ligne redisait ce
                                   que la carte dit déjà par son titre. */
                            <div
                                key={type}
                                className="border-outline-variant flex min-h-12 items-center gap-3 border-t first-of-type:border-t-0"
                            >
                                <span className="h-2 w-2 shrink-0 rounded-xs bg-[var(--tk-color-st-orange)]" />
                                <span className="text-on-surface min-w-0 flex-1 truncate text-[16px]">
                                    {entry.label}
                                </span>
                                <span className="text-on-surface-variant shrink-0 text-[12px] leading-4 tabular-nums">
                                    0 sur {entry.total}
                                </span>
                            </div>
                        ))}
                        {tension.calm > 0 && (
                            <p className="text-on-surface-variant mt-2.5 text-[12px] leading-4">
                                {tension.calm === 1
                                    ? 'L’autre type a au moins une unité.'
                                    : `Les ${tension.calm} autres types ont au moins une unité.`}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-on-surface-variant mt-2.5 text-[12px] leading-4">
                        Chaque type a au moins une unité.
                    </p>
                )}
            </Card>
        </>
    );

    const etatDuParc = (
        <>
            <Card title="État du parc">
                <Gauge
                    value={fleet.endOfLife}
                    label={`sur ${fleet.size} en fin de vie comptable`}
                    percent={fleet.size > 0 ? (fleet.endOfLife / fleet.size) * 100 : 0}
                    fill="bg-[var(--tk-color-st-orange)]"
                    note={
                        renewal ? (
                            <>
                                Renouvellement sur « {renewal.category} »,{' '}
                                <span className="text-on-surface">
                                    {new Intl.NumberFormat('fr-FR').format(renewal.remaining)} XOF
                                </span>{' '}
                                restants.
                            </>
                        ) : undefined
                    }
                />
                {/* `.wsep` — 1 px de filet, 20 px au-dessus. */}
                <div className="bg-outline-variant mt-5 h-px" />
                <Gauge
                    value={fleet.uncovered}
                    label={`sur ${fleet.size} hors garantie`}
                    percent={fleet.size > 0 ? (fleet.uncovered / fleet.size) * 100 : 0}
                    fill="bg-[var(--tk-color-st-orange)]"
                />
                <DashboardMoreAction
                    label="Valeur et amortissement"
                    destination="Finances"
                    onClick={() => onViewChange('finance')}
                />
            </Card>
        </>
    );

    const budget = (
        <>
            <Card title={`Budget ${budgetStats?.year || 2026}`}>
                {budgetStats ? (
                    <>
                        <Gauge
                            /* `.wrow` — **le chiffre est le pourcentage**, et
                                   le total passe au libellé : « 72 % · de
                                   42 000 000 XOF consommés ». Un montant engagé
                                   ne se compare à rien tant qu'on n'a pas lu
                                   l'enveloppe qui le suit. */
                            value={`${Math.round(budgetStats.percentSpent)} %`}
                            label={`de ${new Intl.NumberFormat('fr-FR').format(budgetStats.totalAllocated)} XOF consommés`}
                            percent={budgetStats.percentSpent}
                            marker={budgetPace ?? undefined}
                            ariaLabel={
                                budgetPace === null
                                    ? `${budgetStats.percentSpent.toFixed(1)} %`
                                    : `${budgetStats.percentSpent.toFixed(1)} % ; repère du rythme de l’exercice à ${Math.round(budgetPace)} %`
                            }
                            /*
                                  `.wnote` — la conséquence, pas le commentaire, et
                                  son `b` n'est pas gras : la planche le pose à 400,
                                  en encre pleine. Elle **date** sa mesure (« au 3
                                  septembre ») parce que l'écart au rythme change
                                  tous les jours. Sur un exercice qui n'est pas en
                                  cours, il n'y a pas de rythme à tenir : la jauge
                                  reste seule.
                                */
                            note={
                                budgetPace === null ? undefined : (
                                    <>
                                        <span className="text-on-surface">
                                            {budgetGap === 0
                                                ? 'Au rythme de l’exercice'
                                                : `${Math.abs(budgetGap)} point${Math.abs(budgetGap) > 1 ? 's' : ''} ${budgetGap > 0 ? 'au-dessus du rythme' : 'sous le rythme'}`}
                                        </span>{' '}
                                        au {jourEnClair(new Date())}.
                                    </>
                                )
                            }
                        />
                        <DashboardMoreAction
                            label="Détail par enveloppe"
                            destination="Finances"
                            onClick={() => onViewChange('finance')}
                        />
                    </>
                ) : (
                    <p className="text-on-surface-variant mt-2.5 text-[12px] leading-4">
                        Aucun budget configuré pour cet exercice.
                    </p>
                )}
            </Card>
        </>
    );

    const mesEquipements = (
        <>
            <Card title="Mes équipements">
                {myTypes.length > 0 ? (
                    myTypes.map((item) => (
                        <div
                            key={item.type}
                            className="border-outline-variant flex min-h-12 items-center gap-3 border-t first-of-type:border-t-0"
                        >
                            <span className="text-on-surface min-w-0 flex-1 truncate text-[16px]">
                                {item.type}
                            </span>
                            <span className="bg-surface-container h-1.5 w-20 shrink-0 overflow-hidden rounded-xs">
                                <span
                                    className="bg-on-surface block h-full rounded-xs"
                                    style={{ width: `${item.percent}%` }}
                                />
                            </span>
                            <span className="text-on-surface min-w-5 shrink-0 text-right text-[16px] tabular-nums">
                                {item.count}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-on-surface-variant mt-2.5 text-[12px] leading-4">
                        Aucun équipement ne vous est actuellement attribué.
                    </p>
                )}
            </Card>
        </>
    );

    const garantie = (
        <>
            <Card title="Garantie">
                <Gauge
                    value={myWarranty.covered}
                    label={`sur ${myWarranty.total} couverts`}
                    percent={myWarranty.percent}
                    fill="bg-[var(--tk-color-st-vert)]"
                    note={
                        myWarranty.uncoveredItem ? (
                            <>
                                {myWarranty.uncoveredItem.name || myWarranty.uncoveredItem.model}{' '}
                                hors garantie{' '}
                                <span className="text-on-surface">
                                    depuis{' '}
                                    {formatDate(
                                        new Date(myWarranty.uncoveredItem.warrantyEnd || ''),
                                    )}
                                </span>
                                .
                            </>
                        ) : undefined
                    }
                />
            </Card>
        </>
    );

    const evenements = (
        <>
            <Card title="Derniers événements">
                {recentEvents.length > 0 ? (
                    <>
                        {recentEvents.map((event) => {
                            /*
                              `.mk` — §2.5 : 32 px, ronde, sur le creux. La passe sobre
                              **ne tinte plus** la marque d'une personne : la planche
                              pose une seule déclaration pour les deux cas, et c'est le
                              contenu — initiales ou glyphe de l'acte — qui distingue.
                            */
                            const glyph = EVENT_GLYPH[event.type] ?? ClockCounterClockwise;
                            const initials =
                                !event.isSystem && event.actorName
                                    ? event.actorName
                                          .split(' ')
                                          .map((part) => part[0])
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase()
                                    : '';

                            return (
                                <div
                                    key={event.id}
                                    className="border-outline-variant flex min-h-14 items-center gap-3 border-t py-3 first-of-type:border-t-0"
                                >
                                    <span className="bg-surface-container text-on-surface-variant font-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
                                        {initials || <Icon glyph={glyph} size={18} />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-on-surface text-[16px] leading-6">
                                            {getHistoryEventSentence({
                                                event,
                                                perspectiveActorId: currentUser?.id,
                                            })}
                                        </p>
                                        <p className="text-on-surface-variant mt-0.5 text-[12px] leading-4 tabular-nums">
                                            {formatMoment(event.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {/*
                          « Tout l'historique » mène au journal (18.1), écrit le
                          05/09 : le renvoi que la planche dessine n'est plus un
                          geste mort. Le porteur, lui, n'a pas accès au journal —
                          il se lit par qui peut lire les rapports — et son
                          « Tout mon historique » reste sa fiche, qui porte les
                          mêmes faits bornés à lui.
                        */}
                        {isManager
                            ? permissions.canViewReports && (
                                  <DashboardMoreAction
                                      label="Tout l’historique"
                                      destination="Historique"
                                      onClick={() => onViewChange('history')}
                                  />
                              )
                            : currentUser?.id && (
                                  <DashboardMoreAction
                                      label="Tout mon historique"
                                      destination="Mon profil"
                                      onClick={() => onNavigate?.(`/users/${currentUser.id}`)}
                                  />
                              )}
                    </>
                ) : (
                    <p className="text-on-surface-variant mt-2.5 text-[12px] leading-4">
                        Aucun événement enregistré pour l’instant.
                    </p>
                )}
            </Card>
        </>
    );

    /**
     * `.bande` — **la bande de chiffres**, au bureau (§2.43 bis). Elle *reprend* « Le
     * parc » du téléphone plutôt que d'ajouter une tuile : *« pas de tuile neuve »*.
     * Chaque nombre est une porte vers la liste, pré-filtrée.
     *
     * **Sauf le dernier.** « Hors garantie » n'a pas de filtre dans le produit : il est
     * donc rendu en chiffre nu, pas en lien. Une porte qui n'ouvre rien est pire qu'un
     * chiffre qui se lit.
     */
    const bande = (
        <section className="rounded-card bg-surface flex px-5 py-3.5">
            {[
                { cle: 'total', valeur: counts.total, mot: 'actifs', statut: '' },
                {
                    cle: 'assigned',
                    valeur: counts.assigned,
                    mot: 'attribués',
                    statut: 'Attribué',
                    pastille: 'var(--tk-color-st-bleu)',
                },
                {
                    cle: 'available',
                    valeur: counts.available,
                    mot: 'disponibles',
                    statut: 'Disponible',
                    pastille: 'var(--tk-color-st-vert)',
                },
                {
                    cle: 'repair',
                    valeur: counts.repair,
                    mot: 'en réparation',
                    statut: 'En réparation',
                    pastille: 'var(--tk-color-st-orange)',
                },
                { cle: 'warranty', valeur: fleet.uncovered, mot: 'hors garantie' },
            ].map((entree, index) => {
                const chiffre = (
                    <>
                        <span className="font-brand text-on-surface flex items-center gap-2 text-[22px] leading-[26px] font-semibold tabular-nums">
                            {entree.pastille && (
                                <span
                                    aria-hidden="true"
                                    className="h-2 w-2 shrink-0 rounded-xs"
                                    style={{ backgroundColor: entree.pastille }}
                                />
                            )}
                            {entree.valeur}
                        </span>
                        {/* 400, pas 500 : `Button` pose sa graisse à tout ce qu'il
                            contient, et `.bande .k` n'en déclare aucune. Et une boîte de
                            24 sans marge — 16 de ligne, 4 de part et d'autre : dans 03.1 la
                            légende est un `span` en ligne, qui prend la ligne de son lien
                            et perd sa marge ; la bande y mesure 82, pas 76 (relevé du
                            13/09). */}
                        <span className="text-on-surface-variant block py-1 text-[12px] leading-4 font-normal">
                            {entree.mot}
                        </span>
                    </>
                );
                return (
                    <div
                        key={entree.cle}
                        className={cn(
                            'min-w-0 flex-1 py-0.5 pr-4',
                            index > 0 && 'border-outline-variant border-l pl-4',
                        )}
                    >
                        {entree.statut !== undefined ? (
                            <Button
                                variant="text"
                                layout="card"
                                onClick={() => openFleet(entree.statut as string)}
                                aria-label={`${entree.valeur} ${entree.mot}, voir la liste`}
                                className="h-auto w-full flex-col items-start gap-0 px-0 py-0 hover:bg-transparent"
                            >
                                {chiffre}
                            </Button>
                        ) : (
                            chiffre
                        )}
                    </div>
                );
            })}
        </section>
    );

    /**
     * `.dhead` — l'en-tête du bureau : le prénom, la charge, **et les deux gestes sur la
     * même ligne**, à 40 px. L'avatar n'y est pas : au bureau la personne vit au pied de
     * la barre latérale, et deux portes vers son compte en feraient une de trop.
     */
    const enTeteBureau = (
        <header className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
                {/* **Le titre de la page, et le seul** : l'écran n'avait aucun `h1` —
                    le plan du document commençait donc à `h2`, et une lecture au clavier
                    ou à la voix n'y trouvait pas d'entrée. */}
                <h1 className="font-brand text-on-surface text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                    Bonjour {firstName}
                </h1>
                <p className="text-on-surface-variant mt-0.5 text-[14px] leading-5">{subtitle}</p>
            </div>
            {isManager && (
                <>
                    <Button
                        variant="text"
                        className="border-outline-variant bg-surface text-on-surface hover:bg-surface-container h-10 min-h-10 shrink-0 gap-2 !rounded-[4px] border px-3 text-[14px] font-medium !shadow-none"
                        icon={<Icon glyph={ArrowUUpLeft} size={18} />}
                        onClick={() => onViewChange('return_wizard')}
                    >
                        Restituer
                    </Button>
                    <Button
                        variant="filled"
                        className="bg-primary hover:bg-primary-hover h-10 min-h-10 shrink-0 gap-2 !rounded-[4px] px-3 text-[14px] font-medium text-[var(--tk-color-brand-text)] !shadow-none"
                        icon={<Icon glyph={ArrowCircleRight} size={18} />}
                        onClick={() => onViewChange('assignment_wizard')}
                    >
                        Attribuer
                    </Button>
                </>
            )}
            {!isManager && (
                <Button
                    variant="filled"
                    className="bg-primary hover:bg-primary-hover h-10 min-h-10 shrink-0 gap-2 !rounded-[4px] px-3 text-[14px] font-medium text-[var(--tk-color-brand-text)] !shadow-none"
                    icon={<Icon glyph={Plus} size={18} />}
                    onClick={() => onViewChange('new_request')}
                >
                    Demander un équipement
                </Button>
            )}
        </header>
    );

    /**
     * **Le seul écran multi-zones de la vague** (03.1, bureau du 08/09). À 1280 : la
     * bande de chiffres en ligne, puis la file (8/12) et les événements (4/12) **à même
     * hauteur** — une porte chacune —, puis la mosaïque, *pesée sur ce que les cartes
     * portent* : Budget 7 (une jauge et trois montants) et Inventaire 5 ; Types en
     * tension 5 (une liste courte) et État du parc 7 (deux jauges côte à côte).
     *
     * Sans campagne en cours, la mosaïque n'a que trois cartes : l'État du parc prend
     * alors la rangée entière plutôt que de laisser un trou de cinq colonnes.
     */
    const mosaique = campagne
        ? [
              { cle: 'budget', span: 'col-span-7', contenu: budget },
              { cle: 'inventaire', span: 'col-span-5', contenu: inventaire },
              { cle: 'tension', span: 'col-span-5', contenu: typesEnTension },
              { cle: 'etat', span: 'col-span-7', contenu: etatDuParc },
          ]
        : [
              { cle: 'budget', span: 'col-span-7', contenu: budget },
              { cle: 'tension', span: 'col-span-5', contenu: typesEnTension },
              { cle: 'etat', span: 'col-span-12', contenu: etatDuParc },
          ];

    /** Les cartes d'une rangée vont **à même hauteur** : leur pied se cale en bas. */
    const CASE_GRILLE =
        'flex min-w-0 flex-col [&>section]:flex [&>section]:flex-1 [&>section]:flex-col [&_.mt-auto]:mt-auto';

    return (
        <div className="bg-background flex min-w-0 flex-1 flex-col">
            {/* `.page` — gouttière de 16, intérieur 16 / 16 / 24 ; 24 au-delà du rail. */}
            <div className="medium:px-page flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
                <Reading className="flex flex-col gap-4">
                    {/* L'en-tête change de forme, jamais de contenu : le prénom, la
                        charge, les gestes. Au téléphone ils sont sous le titre et pleine
                        largeur ; au bureau ils tiennent sur sa ligne. */}
                    {large ? enTeteBureau : enTete}
                    {!large && gestes}
                    {large && isManager && bande}

                    {bureau && isManager ? (
                        <>
                            {/* `.zones` — 8fr et 4fr, à hauteur égale : les événements
                                sont **bornés à la hauteur de la file** au lieu de courir
                                le long de la page. Pas huit colonnes sur douze : le partage
                                de 03.1 ne compte pas les gouttières, et la colonne des
                                événements tombait 5 px trop à droite (relevé du 13/09). */}
                            <div className="grid grid-cols-[8fr_4fr] items-stretch gap-4">
                                {/*
                                  **C'est la file qui donne sa hauteur à la rangée, jamais
                                  l'inverse.** Le héro garde donc sa hauteur naturelle : au
                                  régime vide il tient en deux lignes, et l'étirer
                                  fabriquerait un pan sombre de 400 px pour dire « rien à
                                  traiter ». Les événements, eux, s'étirent — c'est ce que
                                  la planche demande : qu'ils cessent de courir le long de
                                  la page.
                                */}
                                <div className="flex min-w-0 flex-col">{aTraiter}</div>
                                <div className={CASE_GRILLE}>{evenements}</div>
                            </div>

                            <div className="grid grid-cols-12 items-stretch gap-4">
                                {mosaique.map((carte) => (
                                    <div key={carte.cle} className={cn(CASE_GRILLE, carte.span)}>
                                        {carte.contenu}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {aTraiter}
                            {/* Au bureau, « Le parc » **est** la bande : pas de tuile
                                neuve, la planche l'écrit. */}
                            {!(large && isManager) && leParc}
                            {isManager ? (
                                <>
                                    {campagne && inventaire}
                                    {typesEnTension}
                                    {etatDuParc}
                                    {budget}
                                </>
                            ) : (
                                <>
                                    {mesEquipements}
                                    {garantie}
                                </>
                            )}
                            {evenements}
                        </>
                    )}
                </Reading>
            </div>
        </div>
    );
};

export default DashboardPage;
