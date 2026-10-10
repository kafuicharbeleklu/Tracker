import React from 'react';

import { cn } from '../../lib/utils';

/**
 * Squelettes d'attente — planche **17.3** (composant partagé, 28 écrans), registre §2.39.
 *
 * **A1 — la forme décide.** Squelette quand on connaît *la forme* de ce qui arrive
 * — liste, fiche, file ; tourniquet quand on ne connaît que *la durée* — un envoi,
 * une validation. Ce ne sont pas deux styles concurrents, ce sont deux réponses à
 * deux questions. Le tourniquet, lui, ne vit que dans le bouton qui l'a lancé
 * (`Button loading`), jamais en plein écran.
 *
 * **A2 — la forme est exacte.** Même hauteur de rangée, même vignette, même nombre
 * de lignes que le contenu attendu : l'écran se **peuple**, il ne se recompose pas.
 * Un squelette approximatif fait sauter la page à l'arrivée des données, et coûte
 * alors plus qu'il ne rapporte.
 *
 * **A3 — ni couleur, ni vague brillante.** Une seule nuance, et pas de balayage lumineux :
 * il attire l'œil **sur l'attente** au lieu de l'en détourner. **Mais l'attente respire**
 * (08/10, à la demande du commanditaire) : immobile, le squelette se lisait comme une page
 * figée, pas comme une page qui arrive. Une pulsation douce de l'opacité (`mvt-attente`),
 * qui descend la liste une rangée après l'autre ; rien ne bouge sous « réduire les
 * animations ». La planche 17.3 disait « aucune animation » : elle est à mettre à jour.
 *
 * **A4 — ce qui est déjà connu est déjà vrai.** Le titre de l'écran, les onglets, le
 * fil d'Ariane ne dépendent d'aucune donnée : ils restent affichés pour de bon.
 * C'est pourquoi ces composants ne dessinent **que le contenu** — la barre du haut
 * reste celle de l'écran.
 *
 * **A5 — rien avant 300 ms** : voir `useDelayedPending`.
 *
 * **A6 — le squelette n'a aucune valeur propre** (passe du 06/09). Il prend la hauteur
 * de la rangée réelle — **68** en liste, **56** en file, le héro sombre pour une fiche —
 * et la nuance du **creux** de la page. Il portait 72 et 64, deux hauteurs qu'aucune
 * liste du produit ne fait, et un gris à lui : l'écran sautait donc à l'arrivée de la
 * donnée, ce que le squelette est précisément là pour éviter.
 *
 * Trois formes couvrent les vingt-huit écrans, et la planche les compte :
 * liste (4 écrans) · fiche (5) · file (3), les autres n'attendent rien de long.
 */

interface SkeletonProps {
    className?: string;
}

/**
 * Un bloc nu. Hauteur par défaut 12 px — la ligne secondaire ; le parent
 * dimensionne le reste. Rayon 2 (la planche dit 3 ; l'échelle du produit ne
 * connaît que 2/4/8 et le registre interdit d'en inventer un quatrième).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={cn('bg-skeleton mvt-attente h-3 rounded-xs', className)} aria-hidden="true" />
);

/** Le décalage d'une rangée dans la respiration — la vague descend la liste. */
const retardDeRangee = (index: number) =>
    ({ '--attente-retard': `${index * 120}ms` }) as React.CSSProperties;

/** La vignette de rangée en attente — 40 × 40, rayon 6 (§2.2). */
const SkeletonVignette: React.FC<{ round?: boolean }> = ({ round = false }) => (
    <Skeleton className={cn('h-10 w-10 shrink-0', round ? 'rounded-full' : 'rounded-vignette')} />
);

/**
 * Les largeurs ne sont pas décoratives : une liste dont toutes les lignes font la
 * même longueur ne ressemble à aucune liste. Cinq paires, reprises de la planche.
 */
const ROW_WIDTHS: ReadonlyArray<readonly [string, string]> = [
    ['w-[78%]', 'w-[46%]'],
    ['w-[64%]', 'w-[52%]'],
    ['w-[83%]', 'w-[41%]'],
    ['w-[70%]', 'w-[56%]'],
    ['w-[75%]', 'w-[44%]'],
];

interface SkeletonRowProps {
    /** Rangée avec vignette (liste d'objets ou de personnes) ou sans (rangée de réglage). */
    withThumb?: boolean;
    /** Index de la rangée — choisit sa paire de largeurs. */
    index?: number;
    className?: string;
}

/**
 * Une rangée de liste au repos : la vignette de 40, le titre et sa sous-ligne.
 * **68 px**, la hauteur que 04.1 donne à ses rangées.
 */
export const SkeletonRow: React.FC<SkeletonRowProps> = ({
    withThumb = true,
    index = 0,
    className,
}) => {
    const [title, sub] = ROW_WIDTHS[index % ROW_WIDTHS.length];

    return (
        <div
            className={cn('flex min-h-[68px] items-center gap-4 py-3', className)}
            style={retardDeRangee(index)}
        >
            {withThumb && <SkeletonVignette />}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className={cn('h-[15px]', title)} />
                <Skeleton className={sub} />
            </div>
            {withThumb && <Skeleton className="w-[38px] shrink-0" />}
        </div>
    );
};

/**
 * **Le squelette remplit la place de ce qui arrive** (10/10). Il tenait cinq rangées en haut
 * de la page et laissait le reste nu : on lisait une liste de cinq objets, puis l'écran se
 * remplissait d'un coup. `remplir` en donne assez pour couvrir la hauteur — le cadre coupe
 * ce qui dépasse — ; au téléphone, où la page défile, sept rangées font l'écran.
 */
const RANGEES_POUR_REMPLIR = 16;
const RANGEES_AU_TELEPHONE = 7;
/** Au-delà de l'écran du téléphone, une rangée de remplissage n'existe qu'au bureau. */
const auDelaDuTelephone = (index: number) =>
    index >= RANGEES_AU_TELEPHONE ? 'expanded:flex hidden' : undefined;

interface SkeletonListProps {
    /**
     * **Cinq rangées, jamais une seule** : un squelette à une rangée annonce une
     * liste vide.
     */
    rows?: number;
    /** Couvrir toute la hauteur du cadre — voir `RANGEES_POUR_REMPLIR`. */
    remplir?: boolean;
    withThumb?: boolean;
    className?: string;
    /** Libellé lu par les lecteurs d'écran pendant l'attente. */
    label?: string;
}

/** Squelette de **liste** — Inventaire · Utilisateurs · Catalogue · Emplacements. */
export const SkeletonList: React.FC<SkeletonListProps> = ({
    rows = 5,
    remplir = false,
    withThumb = true,
    className,
    label = 'Chargement en cours',
}) => (
    <div
        className={cn('divide-outline-variant divide-y', className)}
        role="status"
        aria-live="polite"
    >
        <span className="sr-only">{label}</span>
        {Array.from({ length: remplir ? RANGEES_POUR_REMPLIR : rows }, (_, i) => (
            <SkeletonRow
                key={i}
                index={i}
                withThumb={withThumb}
                className={remplir ? auDelaDuTelephone(i) : undefined}
            />
        ))}
    </div>
);

interface SkeletonQueueProps {
    rows?: number;
    /** Couvrir toute la hauteur du cadre — voir `RANGEES_POUR_REMPLIR`. */
    remplir?: boolean;
    className?: string;
    label?: string;
}

/**
 * Squelette de **file** — Tâches · Demandes · Inventaire. **56 px**, la hauteur que
 * 03.3 donne aux siennes, et la marque d'événement **ronde** (§2.5 : ce n'est pas une
 * vignette, c'est un fait passé).
 *
 * Le geste de rangée est retiré : *« une rangée de file ne porte ni verbe ni ⋮ »*
 * (R15). Le squelette ne réserve donc plus la place d'un bouton qui n'arrivera pas.
 */
export const SkeletonQueue: React.FC<SkeletonQueueProps> = ({
    rows = 3,
    remplir = false,
    className,
    label = 'Chargement en cours',
}) => (
    <div
        className={cn('divide-outline-variant divide-y', className)}
        role="status"
        aria-live="polite"
    >
        <span className="sr-only">{label}</span>
        {Array.from({ length: remplir ? RANGEES_POUR_REMPLIR : rows }, (_, i) => (
            <div
                key={i}
                className={cn(
                    'flex min-h-14 items-center gap-3 py-2',
                    remplir && auDelaDuTelephone(i),
                )}
                style={retardDeRangee(i)}
            >
                <SkeletonVignette round />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-[17px] w-4/5" />
                    <Skeleton className="w-1/2" />
                </div>
                <Skeleton className="w-[26px] shrink-0" />
            </div>
        ))}
    </div>
);

/* ───────────────────────── Les pièces d'une page en attente ─────────────────────────

   **Chaque carte a son en-tête, chaque page sa grille** (10/10, troisième relevé du
   commanditaire : *« je vois toujours des manquements sur certaines cartes, surtout au
   niveau des en-têtes ; certaines pages bureau ne sont pas fidèles à 100 % à la grille de
   leurs cartes »*). Le squelette tenait neuf formes pour une vingtaine d'écrans : une carte
   y avait une barre pour titre, sans compte ni pied ; Finances y avait deux cartes à droite
   quand la page en a trois ; un tableau s'y annonçait en rangées à vignette.

   Les pièces qui suivent se composent comme les pages : l'en-tête et ses gestes, la ligne
   d'outils, la carte avec son titre, ce qu'elle porte à droite et son pied. Les mesures
   sont celles du banc (`squelettes.mjs`, 1440 × 900) : l'en-tête à 20, sa rangée de 52, les
   outils à 8, les cartes à 16. */

/** Une barre claire sur un aplat sombre — le héros d'une fiche, la file de l'accueil. */
const SUR_SOMBRE = 'bg-white/[0.12]';

/** Sept et cinq douzièmes dès 1000 — `DOUZIEMES` (regimeBureau), préfixées pour une fiche. */
const DOUZIEMES_DES_DEUX = {
    5: 'deux:shrink deux:grow-0 deux:basis-[calc(500%/12_-_28px/3)]',
    7: 'deux:shrink deux:grow-0 deux:basis-[calc(700%/12_-_20px/3)]',
} as const;

/**
 * L'en-tête d'une page : la flèche (un glyphe de 20 dans son geste de 40, calé sur le
 * bord), le titre à la largeur du mot qui arrive, ce qui l'accompagne, puis les gestes
 * nommés du bureau et le ⋮.
 */
const EnTeteEnAttente: React.FC<{
    titre: string;
    /** Le compte à côté du titre (une liste), les onglets (Tâches), ou la ligne dessous. */
    annexe?: 'compte' | 'onglets' | 'sousTitre';
    /** Les gestes nommés, de gauche à droite : leurs largeurs. */
    gestes?: readonly string[];
    menu?: boolean;
}> = ({ titre, annexe, gestes = [], menu = false }) => (
    <div className="expanded:min-h-[52px] flex min-h-12 shrink-0 items-center gap-4">
        <div className="expanded:gap-2 flex min-w-0 shrink-0 items-center gap-1">
            <span className="expanded:-ml-2.5 expanded:h-10 expanded:w-10 -ml-3 flex h-12 w-12 shrink-0 items-center justify-center">
                <Skeleton className="h-5 w-5 rounded-sm" />
            </span>
            {annexe === 'sousTitre' ? (
                <div className="flex min-w-0 flex-col">
                    <span className="flex h-8 items-center">
                        <Skeleton className={cn('h-6 rounded-sm', titre)} />
                    </span>
                    <span className="deux:flex hidden h-[18px] items-center">
                        <Skeleton className="w-72 max-w-full" />
                    </span>
                </div>
            ) : (
                <Skeleton className={cn('h-6 rounded-sm', titre)} />
            )}
        </div>
        <div className="flex min-w-0 flex-1 items-center">
            {annexe === 'compte' && <Skeleton className="expanded:block mt-1.5 hidden w-44" />}
            {annexe === 'onglets' && (
                <Skeleton className="expanded:block hidden h-9 w-[192px] rounded-md" />
            )}
        </div>
        {gestes.map((largeur, i) => (
            <Skeleton
                key={i}
                className={cn('expanded:block hidden h-10 shrink-0 rounded-md', largeur)}
            />
        ))}
        {menu && (
            <span
                className={cn(
                    'expanded:h-10 expanded:w-10 flex h-12 w-12 shrink-0 items-center justify-center',
                    gestes.length > 0 && 'expanded:-ml-2',
                )}
            >
                <Skeleton className="h-5 w-1.5 rounded-sm" />
            </span>
        )}
    </div>
);

/**
 * La ligne d'outils : la recherche, l'entonnoir, les puces, et à droite le tri et la forme.
 * À 8 du titre, 4 dessous — la carte qui suit commence 16 plus bas, comme sur la page.
 */
const OutilsEnAttente: React.FC<{
    /** Le champ dense de Tâches et de Dépenses : 36 de haut, 300 de large, puces de 32. */
    dense?: boolean;
    filtre?: boolean;
    puces?: readonly string[];
    droite?: readonly string[];
}> = ({ dense = false, filtre = false, puces = [], droite = [] }) => (
    <div
        className={cn('mt-2 flex shrink-0 flex-wrap items-center pb-1', dense ? 'gap-2' : 'gap-3')}
        style={retardDeRangee(1)}
    >
        <Skeleton
            className={cn(
                'expanded:flex-none h-12 min-w-0 flex-1 rounded-md',
                dense ? 'expanded:h-9 expanded:w-[300px]' : 'expanded:h-10 expanded:w-[320px]',
            )}
        />
        {filtre && (
            <Skeleton className="expanded:h-10 expanded:w-[88px] h-12 w-12 shrink-0 rounded-md" />
        )}
        {puces.map((largeur, i) => (
            <Skeleton
                key={i}
                className={cn('expanded:block hidden h-8 shrink-0 rounded-md', largeur)}
            />
        ))}
        <span className="expanded:block hidden flex-1" />
        {droite.map((largeur, i) => (
            <Skeleton key={i} className={cn('expanded:block hidden h-4 shrink-0', largeur)} />
        ))}
    </div>
);

/** Une carte : la surface, le rayon, et la vague qui la prend à son rang. */
const CarteEnAttente: React.FC<{
    index?: number;
    /** L'aplat sombre d'un héros. */
    sombre?: boolean;
    className?: string;
    children?: React.ReactNode;
}> = ({ index = 0, sombre = false, className, children }) => (
    <div
        className={cn(
            'rounded-card flex min-w-0 flex-col overflow-clip',
            sombre ? 'bg-inverse-surface' : 'bg-surface',
            className,
        )}
        style={retardDeRangee(index)}
    >
        {children}
    </div>
);

/** L'en-tête d'une carte : son titre, et ce qu'elle porte à droite — un compte, un mot. */
const TeteDeCarte: React.FC<{
    titre?: string;
    droite?: string;
    sombre?: boolean;
    className?: string;
}> = ({ titre = 'w-32', droite, sombre = false, className }) => (
    <div className={cn('flex h-[22px] shrink-0 items-center justify-between gap-3', className)}>
        <Skeleton className={cn('h-4', titre, sombre && SUR_SOMBRE)} />
        {droite && <Skeleton className={cn(droite, sombre && SUR_SOMBRE)} />}
    </div>
);

/** Le pied d'une carte, sous son filet : « Tous les … › » à droite, ou un renvoi à gauche. */
const PiedEnAttente: React.FC<{
    /** Le renvoi de l'accueil : le mot à gauche, le chevron à droite. */
    etale?: boolean;
    sombre?: boolean;
    className?: string;
}> = ({ etale = false, sombre = false, className }) => (
    <div
        className={cn(
            'mt-auto flex h-12 shrink-0 items-center gap-3 border-t',
            sombre ? 'border-white/10' : 'border-outline-variant',
            etale ? 'justify-between' : 'justify-end',
            className,
        )}
    >
        <Skeleton className={cn('h-3.5 w-36', sombre && SUR_SOMBRE)} />
        <Skeleton className={cn('h-3.5 w-3.5', sombre && SUR_SOMBRE)} />
    </div>
);

/** Une rangée : sa vignette (ou rien), son titre et sa sous-ligne, ce qu'elle porte à droite. */
const RangeeEnAttente: React.FC<{
    index: number;
    /** La hauteur de la rangée qui arrive — `h-[65px]`. */
    hauteur?: string;
    vignette?: 'carree' | 'ronde' | 'petite' | false;
    droite?: string | false;
    sombre?: boolean;
    className?: string;
}> = ({
    index,
    hauteur = 'h-[65px]',
    vignette = 'carree',
    droite = 'w-8',
    sombre = false,
    className,
}) => {
    const [titre, sous] = ROW_WIDTHS[index % ROW_WIDTHS.length];
    return (
        <div
            className={cn('flex shrink-0 items-center gap-3', hauteur, className)}
            style={retardDeRangee(index)}
        >
            {vignette && (
                <Skeleton
                    className={cn(
                        'shrink-0',
                        vignette === 'petite' ? 'h-9 w-9' : 'h-10 w-10',
                        vignette === 'ronde' ? 'rounded-full' : 'rounded-vignette',
                        sombre && SUR_SOMBRE,
                    )}
                />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className={cn('h-3.5', titre, sombre && SUR_SOMBRE)} />
                <Skeleton className={cn('h-2.5', sous, sombre && SUR_SOMBRE)} />
            </div>
            {droite && <Skeleton className={cn('shrink-0', droite, sombre && SUR_SOMBRE)} />}
        </div>
    );
};

/** `n` rangées sous filet, coupées au cadre de la carte. */
const RangeesEnAttente: React.FC<
    { n: number; depart?: number; className?: string } & Omit<
        React.ComponentProps<typeof RangeeEnAttente>,
        'index' | 'className'
    >
> = ({ n, depart = 0, className, sombre, ...rangee }) => (
    <div
        className={cn(
            'min-h-0 divide-y overflow-clip',
            sombre ? 'divide-white/10' : 'divide-outline-variant',
            className,
        )}
    >
        {Array.from({ length: n }, (_, i) => (
            <RangeeEnAttente key={i} index={i + depart} sombre={sombre} {...rangee} />
        ))}
    </div>
);

/** Une rangée de fait : l'étiquette à gauche, la valeur à droite. */
const FaitsEnAttente: React.FC<{ n: number; hauteur?: string; depart?: number }> = ({
    n,
    hauteur = 'h-12',
    depart = 0,
}) => (
    <div className="divide-outline-variant divide-y">
        {Array.from({ length: n }, (_, i) => (
            <div
                key={i}
                className={cn('flex items-center justify-between gap-4', hauteur)}
                style={retardDeRangee(i + depart)}
            >
                <Skeleton className={i % 2 ? 'w-24' : 'w-32'} />
                <Skeleton className={i % 2 ? 'w-36' : 'w-24'} />
            </div>
        ))}
    </div>
);

/** Une tuile de chiffre : ce qu'on lit (12), le chiffre (32), ce qu'il veut dire (18). */
const TuileEnAttente: React.FC<{
    index: number;
    /** La pastille d'une tuile de campagne, à gauche du libellé. */
    pastille?: boolean;
    jauge?: boolean;
    className?: string;
}> = ({ index, pastille = false, jauge = false, className }) => (
    <div
        className={cn('rounded-card bg-surface flex min-w-0 flex-col p-4', className)}
        style={retardDeRangee(index)}
    >
        <span className={cn('flex items-center gap-2.5', pastille ? 'h-8' : 'h-4')}>
            {pastille && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
            <Skeleton className="w-24" />
        </span>
        <span className={cn('flex h-8 items-center', pastille ? 'mt-2' : 'mt-3')}>
            <Skeleton className="h-6 w-28 rounded-sm" />
        </span>
        {jauge ? (
            <Skeleton className="mt-auto h-2 w-full rounded-full" />
        ) : (
            <span className="mt-2 flex h-[18px] items-center">
                <Skeleton className="w-36 max-w-full" />
            </span>
        )}
    </div>
);

/** Le héros sombre d'une fiche : l'étiquette, le sujet, puis ses mesures et son geste. */
const HerosEnAttente: React.FC<{
    /** La hauteur du héros qui arrive — `deux:h-[305px]`. */
    className?: string;
    mesures?: 2 | 3;
    /** L'avatar d'une personne, au-dessus de l'étiquette. */
    avatar?: boolean;
    /** La pastille d'état d'un actif, au-dessus de l'étiquette. */
    pastille?: boolean;
    /** La rangée du porteur, entre le sujet et les mesures. */
    porteur?: boolean;
    geste?: boolean;
}> = ({
    className,
    mesures = 3,
    avatar = false,
    pastille = false,
    porteur = false,
    geste = false,
}) => (
    <CarteEnAttente sombre className={cn('shrink-0 px-5 pt-[22px] pb-5', className)}>
        {avatar && <Skeleton className={cn('mb-4 h-14 w-14 rounded-full', SUR_SOMBRE)} />}
        {pastille && <Skeleton className={cn('mb-6 h-7 w-36 rounded-md', SUR_SOMBRE)} />}
        <Skeleton className={cn('h-2.5 w-44', SUR_SOMBRE)} />
        <Skeleton className={cn('mt-3 h-6 w-1/2 rounded-sm', SUR_SOMBRE)} />
        {porteur && (
            <div className="mt-5 flex h-[72px] shrink-0 items-center gap-3 border-t border-white/10">
                <Skeleton className={cn('rounded-vignette h-10 w-10 shrink-0', SUR_SOMBRE)} />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className={cn('h-3.5 w-32', SUR_SOMBRE)} />
                    <Skeleton className={cn('h-2.5 w-64 max-w-full', SUR_SOMBRE)} />
                </div>
            </div>
        )}
        {/* Les mesures se calent en bas du héros, comme sur la fiche. */}
        <div className="mt-auto flex gap-3 pt-1">
            {Array.from({ length: mesures }, (_, i) => (
                <Skeleton key={i} className={cn('h-[70px] flex-1 rounded-sm', SUR_SOMBRE)} />
            ))}
        </div>
        {geste && <Skeleton className={cn('mt-5 h-12 w-full rounded-sm', SUR_SOMBRE)} />}
    </CarteEnAttente>
);

/** Un tableau en attente — l'en-tête de 40, puis des rangées de 48 (`DataTable`, 17.11). */
const COLONNES_DU_TABLEAU = 'grid grid-cols-[52px_1.45fr_1.3fr_1fr_1fr_1.6fr_1.4fr] items-center';

export const SkeletonTableau: React.FC<{ rangees?: number; label?: string }> = ({
    rangees = RANGEES_POUR_REMPLIR + 2,
    label = 'Chargement en cours',
}) => (
    <div className="divide-outline-variant divide-y" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className={cn('h-10', COLONNES_DU_TABLEAU)}>
            <span />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-2.5 w-14" />
            ))}
        </div>
        {Array.from({ length: rangees }, (_, i) => (
            <div key={i} className={cn('h-12', COLONNES_DU_TABLEAU)} style={retardDeRangee(i)}>
                <Skeleton className="rounded-vignette ml-2.5 h-8 w-8" />
                <Skeleton className={cn('h-3.5', i % 2 ? 'w-24' : 'w-20')} />
                <Skeleton className={i % 3 ? 'w-32' : 'w-24'} />
                <Skeleton className={i % 2 ? 'w-20' : 'w-28'} />
                <Skeleton className="w-24" />
                <Skeleton className={i % 3 ? 'w-28' : 'w-36'} />
                <Skeleton className="w-24" />
            </div>
        ))}
    </div>
);

/**
 * Les formes de fiche. Le héros et les cartes ont les hauteurs relevées sur chaque fiche :
 * à l'arrivée des données, les deux colonnes ne bougent pas.
 */
export type FormeDeFiche = 'actif' | 'personne' | 'modele' | 'type' | 'site' | 'commune';

interface CarteDeFiche {
    /** La hauteur de la carte au bureau. */
    h: string;
    rangees: number;
    hauteur?: string;
    vignette?: 'carree' | 'ronde' | false;
    faits?: boolean;
    droite?: string;
    pied?: boolean;
    /** Des tuiles au lieu de rangées — les modèles d'un type, les locaux d'un site. */
    tuiles?: string;
}

const FICHES: Record<
    FormeDeFiche,
    {
        heros: React.ComponentProps<typeof HerosEnAttente>;
        gauche: CarteDeFiche[];
        droite: CarteDeFiche[];
    }
> = {
    actif: {
        heros: { className: 'deux:h-[305px]', pastille: true, porteur: true },
        gauche: [{ h: 'deux:h-[326px]', rangees: 3, vignette: 'ronde', pied: true }],
        droite: [
            { h: 'deux:h-[324px]', rangees: 5, faits: true },
            { h: 'deux:h-[373px]', rangees: 4, faits: true, pied: true },
        ],
    },
    personne: {
        heros: { className: 'deux:h-[368px]', avatar: true, mesures: 2, geste: true },
        gauche: [
            { h: 'deux:h-[247px]', rangees: 3, hauteur: 'h-[61px]' },
            { h: 'deux:h-[306px]', rangees: 4, vignette: 'ronde', droite: 'w-24' },
        ],
        droite: [
            { h: 'deux:h-[364px]', rangees: 5, hauteur: 'h-[60px]', vignette: false },
            { h: 'deux:h-[246px]', rangees: 3, hauteur: 'h-[61px]' },
        ],
    },
    modele: {
        heros: { className: 'deux:h-[272px]', geste: true },
        gauche: [{ h: 'deux:h-[304px]', rangees: 3, hauteur: 'h-16', droite: 'w-16', pied: true }],
        droite: [{ h: 'deux:h-[179px]', rangees: 2, faits: true }],
    },
    type: {
        heros: { className: 'deux:h-[184px]', mesures: 2 },
        gauche: [
            { h: 'deux:h-[361px]', rangees: 6, tuiles: 'h-[112px]', droite: 'w-4', pied: true },
        ],
        droite: [{ h: 'deux:h-[219px]', rangees: 2 }],
    },
    site: {
        heros: { className: 'deux:h-[226px]' },
        gauche: [{ h: 'deux:h-[272px]', rangees: 6, tuiles: 'h-24', droite: 'w-4' }],
        droite: [{ h: 'deux:h-[251px]', rangees: 3 }],
    },
    commune: {
        heros: { className: 'deux:h-[272px]' },
        gauche: [{ h: 'deux:h-[304px]', rangees: 3, pied: true }],
        droite: [{ h: 'deux:h-[219px]', rangees: 3, faits: true }],
    },
};

const CarteDeFicheEnAttente: React.FC<{ carte: CarteDeFiche; index: number }> = ({
    carte,
    index,
}) => (
    <CarteEnAttente index={index} className={cn('px-4 pt-[17px] pb-4', carte.h)}>
        <TeteDeCarte droite={carte.droite} className="mb-2.5" />
        {carte.tuiles ? (
            <div className="grid grid-cols-3 gap-3 pt-0.5">
                {Array.from({ length: carte.rangees }, (_, i) => (
                    <Skeleton key={i} className={cn('w-full rounded-sm', carte.tuiles)} />
                ))}
            </div>
        ) : carte.faits ? (
            <FaitsEnAttente n={carte.rangees} depart={index} />
        ) : (
            <RangeesEnAttente
                n={carte.rangees}
                depart={index}
                hauteur={carte.hauteur}
                vignette={carte.vignette ?? 'carree'}
                droite="w-4"
            />
        )}
        {carte.pied && <PiedEnAttente />}
    </CarteEnAttente>
);

/** Le corps d'une fiche : sept colonnes pour le sujet, cinq pour la référence (17.11). */
const CorpsDeFiche: React.FC<{ forme: FormeDeFiche; colonnes?: boolean }> = ({
    forme,
    colonnes = true,
}) => {
    const fiche = FICHES[forme];
    return (
        <div
            className={cn(
                'mx-auto flex w-full max-w-[1280px] flex-col gap-4',
                colonnes && 'deux:flex-row deux:items-start',
            )}
        >
            <div className={cn('flex min-w-0 flex-col gap-4', colonnes && DOUZIEMES_DES_DEUX[7])}>
                <HerosEnAttente {...fiche.heros} />
                {fiche.gauche.map((carte, i) => (
                    <CarteDeFicheEnAttente key={i} carte={carte} index={i + 1} />
                ))}
            </div>
            <div className={cn('flex min-w-0 flex-col gap-4', colonnes && DOUZIEMES_DES_DEUX[5])}>
                {fiche.droite.map((carte, i) => (
                    <CarteDeFicheEnAttente key={i} carte={carte} index={i + 2} />
                ))}
            </div>
        </div>
    );
};

interface SkeletonDetailProps {
    /** La fiche qui arrive — son héros et ses cartes ont leurs hauteurs à elle. */
    forme?: FormeDeFiche;
    /** Deux colonnes dès 1000 (la page) ; une seule dans un panneau. */
    colonnes?: boolean;
    className?: string;
    label?: string;
}

/**
 * Squelette de **fiche** — Équipement · Utilisateur · Modèle · Type · Site.
 *
 * C'est la forme où **le héros se dessine aussi**, et sombre (A6) : il est le bloc le plus
 * lourd de l'écran, et un aplat clair à sa place faisait passer la fiche du blanc au noir
 * à l'arrivée des données. Dès 1000 px le corps se range en sept et cinq douzièmes, comme
 * la page (10/10) : il tenait une seule colonne, et la référence sautait à droite.
 */
export const SkeletonDetail: React.FC<SkeletonDetailProps> = ({
    forme = 'commune',
    colonnes = false,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('flex flex-col', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <CorpsDeFiche forme={forme} colonnes={colonnes} />
    </div>
);

/** Les formes d'écran que le squelette de page sait dessiner — une par page du produit. */
export type FormeDePage =
    | 'accueil'
    | 'liste'
    | 'tableau'
    | 'historique'
    | 'taches'
    | 'depenses'
    | 'finances'
    | 'lignes'
    | 'rapports'
    | 'inventaire'
    | 'campagne'
    | 'catalogue'
    | 'emplacements'
    | 'parametres'
    | 'acces'
    | 'tension'
    | `fiche:${FormeDeFiche}`;

/** Une carte de l'accueil : son titre et ce qu'il porte, un chiffre et sa phrase, une jauge. */
const CarteDeMesure: React.FC<{ index: number; droite?: string; className?: string }> = ({
    index,
    droite,
    className,
}) => (
    <CarteEnAttente index={index} className={cn('min-h-52 p-4', className)}>
        <TeteDeCarte droite={droite} />
        <span className="mt-5 flex h-7 items-center gap-3">
            <Skeleton className="h-5 w-14 rounded-sm" />
            <Skeleton className="w-48 max-w-full" />
        </span>
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 w-64 max-w-full" />
        <PiedEnAttente etale />
    </CarteEnAttente>
);

/**
 * Squelette de **l'accueil**, calé sur sa grille.
 *
 * Ce sont les cases de 03.1, aux mêmes mesures : la bande de chiffres (84) dès 840, puis
 * dès 1000 la grille de douze — une rangée de 448 (la file sur 8, les événements sur 4) et
 * deux rangées de 216 pour la mosaïque, en 8 / 4 elles aussi. Sous 1000, les cartes
 * s'empilent, comme la page. Quand les données arrivent, chaque carte se remplit **à sa
 * place** : rien ne se recompose.
 *
 * **La file est sombre, chaque carte a son titre, son compte et son pied** (10/10) : elles
 * étaient six cartes blanches sous une barre, et la première virait au noir à l'arrivée.
 *
 * La page d'accueil le pose elle-même tant que les données se lisent : ses cartes
 * affichaient leur état vide — « Aucun type en tension », « 0 actif » — avant d'avoir rien
 * lu, et un vide annoncé à tort est pire qu'une attente.
 */
export const SkeletonAccueil: React.FC = () => (
    <>
        <div className="rounded-card bg-surface expanded:flex hidden shrink-0 px-4 py-3.5">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="border-outline-variant flex flex-1 flex-col border-l px-4 first:border-l-0 first:pl-0"
                    style={retardDeRangee(i)}
                >
                    <span className="flex h-8 items-center">
                        <Skeleton className="h-5 w-12 rounded-sm" />
                    </span>
                    <span className="flex h-6 items-center">
                        <Skeleton className="h-2.5 w-20" />
                    </span>
                </div>
            ))}
        </div>
        <div className="deux:grid deux:auto-rows-[13.5rem] deux:grid-cols-12 deux:grid-rows-[28rem] flex flex-col gap-4">
            {/* La file — le héros sombre de la page, à 20 d'intérieur. */}
            <CarteEnAttente sombre className="deux:col-span-8 min-h-72 px-5 pt-5">
                <TeteDeCarte sombre titre="w-24" droite="w-5" className="mt-px mb-2.5" />
                <RangeesEnAttente
                    n={5}
                    sombre
                    hauteur="h-[59px]"
                    className="flex-1 border-t border-white/10"
                />
                <PiedEnAttente etale sombre className="mb-5" />
            </CarteEnAttente>
            <CarteEnAttente index={1} className="deux:col-span-4 px-4 pt-[17px] pb-2">
                <TeteDeCarte titre="w-40" className="mb-2" />
                <RangeesEnAttente
                    n={5}
                    depart={1}
                    vignette="ronde"
                    droite={false}
                    className="flex-1"
                />
                <PiedEnAttente etale />
            </CarteEnAttente>
            <CarteDeMesure index={2} className="deux:col-span-8" />
            <CarteDeMesure index={3} droite="w-14" className="deux:col-span-4" />
            <CarteDeMesure index={4} className="deux:col-span-8" />
            <CarteEnAttente index={5} className="deux:col-span-4 min-h-52 px-4 pt-[17px] pb-2">
                <TeteDeCarte droite="w-16" className="mb-1" />
                <RangeesEnAttente
                    n={3}
                    depart={5}
                    hauteur="h-[41px]"
                    vignette={false}
                    className="flex-1"
                />
            </CarteEnAttente>
        </div>
    </>
);

/** La colonne de lecture des pages centrées — 1008 dès 1280 (Catalogue, Rapports, Accès…). */
const COLONNE_DE_LECTURE = 'large:mx-auto large:max-w-[1008px]';

/** Deux zones côte à côte dès 1000 : 8 et 4 douzièmes, à même hauteur. */
const HUIT_ET_QUATRE = 'deux:grid deux:grid-cols-12 flex flex-col gap-4';

/** Le panneau d'une tâche ou d'une dépense : l'étiquette, le sujet, ses lignes, son pied. */
const PanneauEnAttente: React.FC<{ depense?: boolean }> = ({ depense = false }) => (
    <CarteEnAttente index={2} className="expanded:flex hidden min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-clip px-5 py-5">
            <span className="flex h-4 items-center justify-between">
                <Skeleton className="h-2.5 w-40" />
                {depense && <Skeleton className="h-4 w-12" />}
            </span>
            <span className={cn('flex h-7 items-center', depense ? 'mt-4' : 'mt-1')}>
                <Skeleton className="h-5 w-2/5 rounded-sm" />
            </span>
            <span className="mt-1 flex h-[18px] items-center">
                <Skeleton className="w-3/5" />
            </span>
            {depense ? (
                <>
                    <Skeleton className="mt-6 h-8 w-44 rounded-sm" />
                    <div className="border-outline-variant mt-5 flex h-[98px] shrink-0 items-center gap-4 rounded-md border px-3">
                        <Skeleton className="h-[72px] w-14 shrink-0 rounded-sm" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-3.5 w-56 max-w-full" />
                            <Skeleton className="h-2.5 w-32" />
                        </div>
                        <Skeleton className="h-8 w-[70px] shrink-0 rounded-md" />
                        <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                    </div>
                    <div className="border-outline-variant mt-5 border-b">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="border-outline-variant grid h-[35px] grid-cols-[minmax(96px,min(38%,11rem))_minmax(0,1fr)] items-center border-t"
                                style={retardDeRangee(i + 2)}
                            >
                                <Skeleton className="w-28" />
                                <Skeleton className="w-36" />
                            </div>
                        ))}
                    </div>
                    <span className="mt-5 flex h-[18px] items-center justify-between">
                        <Skeleton className="w-52" />
                        <Skeleton className="w-40" />
                    </span>
                    <Skeleton className="mt-2 h-2 w-full rounded-full" />
                    <Skeleton className="mt-3 w-64" />
                </>
            ) : (
                <>
                    <Skeleton className="mt-[18px] h-10 w-full shrink-0 rounded-md" />
                    <Skeleton className="mt-6 h-2.5 w-40" />
                    <RangeesEnAttente
                        n={4}
                        depart={2}
                        hauteur="h-[56px]"
                        vignette="ronde"
                        droite={false}
                        className="mt-2"
                    />
                </>
            )}
        </div>
        <div className="border-outline-variant flex h-16 shrink-0 items-center justify-between border-t px-5">
            <Skeleton className="w-32" />
            <span className="flex gap-2.5">
                {!depense && <Skeleton className="h-10 w-28 rounded-md" />}
                <Skeleton className={cn('h-10 rounded-md', depense ? 'w-[90px]' : 'w-[120px]')} />
            </span>
        </div>
    </CarteEnAttente>
);

/** La liste d'une file ou d'un journal : la bande du groupe, puis ses rangées. */
const ListeGroupeeEnAttente: React.FC<{ bande: string; rangee: string }> = ({ bande, rangee }) => (
    <CarteEnAttente className="expanded:w-[360px] large:w-[400px] expanded:flex-none min-h-0 flex-1">
        <div className={cn('flex shrink-0 items-center justify-between px-4', bande)}>
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-2.5 w-6" />
        </div>
        <RangeesEnAttente
            n={RANGEES_POUR_REMPLIR}
            hauteur={rangee}
            vignette="petite"
            droite="w-10"
            className="[&>*]:border-outline-variant flex-1 divide-y-0 px-0 [&>*]:border-t [&>*]:px-4"
        />
    </CarteEnAttente>
);

/** Une carte de réglages : son intitulé, puis des rangées à une valeur. */
const ReglagesEnAttente: React.FC<{ index: number; rangees: readonly string[] }> = ({
    index,
    rangees,
}) => (
    <CarteEnAttente index={index} className="shrink-0">
        <span className="flex h-9 items-end px-4 pb-1.5">
            <Skeleton className="h-2.5 w-24" />
        </span>
        <div className="divide-outline-variant divide-y">
            {rangees.map((hauteur, i) => (
                <div
                    key={i}
                    className={cn('flex items-center justify-between gap-4 px-4', hauteur)}
                    style={retardDeRangee(i + index)}
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className={cn('h-3.5', i % 2 ? 'w-44' : 'w-36')} />
                        {hauteur !== 'h-14' && <Skeleton className="h-2.5 w-56 max-w-full" />}
                    </div>
                    <Skeleton className="w-20 shrink-0" />
                </div>
            ))}
        </div>
    </CarteEnAttente>
);

/** Une tuile du catalogue : la vignette et le nom, puis ses deux comptes. */
const TuileDeTypeEnAttente: React.FC<{ index: number }> = ({ index }) => (
    <div
        className="rounded-card bg-surface flex h-[118px] flex-col justify-between p-4"
        style={retardDeRangee(index)}
    >
        <div className="flex items-center gap-3">
            <Skeleton className="rounded-vignette h-9 w-9 shrink-0" />
            <Skeleton className="h-3.5 w-2/5" />
        </div>
        <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-5" />
                <Skeleton className="h-2.5 w-14" />
            </div>
            <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-3.5 w-6" />
                <Skeleton className="h-2.5 w-20" />
            </div>
        </div>
    </div>
);

/**
 * Squelette de **page** — ce que l'on voit pendant qu'un écran arrive : son en-tête, sa
 * ligne d'outils, puis ses cartes **à leur place**, jusqu'au bas de la fenêtre.
 *
 * Une forme par page (10/10) : l'adresse dit laquelle (`formeDeLAdresse`). Chaque forme
 * reprend la grille de sa page — 8 et 4 douzièmes, la colonne de 1008, la liste de 400 et
 * son panneau — et les hauteurs relevées au banc, pour que rien ne bouge à l'arrivée.
 *
 * La racine prend la hauteur qu'on lui laisse (`flex-1`) et coupe ce qui dépasse : au
 * téléphone elle tient l'écran sans faire défiler une page qui n'existe pas encore.
 */
export const SkeletonPage: React.FC<{
    forme?: FormeDePage;
    label?: string;
}> = ({ forme = 'liste', label = 'Chargement en cours' }) => {
    const fiche = forme.startsWith('fiche:') ? (forme.slice(6) as FormeDeFiche) : null;
    const centree = ['rapports', 'catalogue', 'emplacements', 'parametres', 'acces'].includes(
        forme,
    );
    return (
        <div
            data-testid="route-loading-fallback"
            data-forme={forme}
            role="status"
            aria-live="polite"
            className={cn(
                'medium:px-page expanded:min-h-0 expanded:max-h-none flex max-h-[calc(100dvh-5rem)] min-h-[calc(100dvh-9rem)] flex-1 flex-col overflow-clip px-4 pb-6',
                /* L'accueil ouvre 4 px plus haut : son titre tient deux lignes. */
                forme === 'accueil' ? 'expanded:pt-4 pt-5' : 'pt-5',
            )}
        >
            <span className="sr-only">{label}</span>
            <div
                className={cn('flex min-h-0 w-full flex-1 flex-col', centree && COLONNE_DE_LECTURE)}
            >
                {forme === 'accueil' && (
                    <>
                        <div className="flex shrink-0 items-start justify-between gap-4">
                            <div className="flex min-w-0 flex-col">
                                <span className="flex h-8 items-center">
                                    <Skeleton className="h-6 w-44 rounded-sm" />
                                </span>
                                <span className="flex h-5 items-center">
                                    <Skeleton className="w-48" />
                                </span>
                            </div>
                            {/* Au téléphone, la pastille du compte ; au bureau, les deux gestes. */}
                            <Skeleton className="expanded:hidden h-11 w-11 shrink-0 rounded-full" />
                            <div className="expanded:flex hidden shrink-0 gap-4">
                                <Skeleton className="h-10 w-[114px] rounded-md" />
                                <Skeleton className="h-10 w-[111px] rounded-md" />
                            </div>
                        </div>
                        <div
                            className="expanded:hidden mt-4 flex shrink-0 gap-3"
                            style={retardDeRangee(1)}
                        >
                            <Skeleton className="h-12 flex-1 rounded-md" />
                            <Skeleton className="h-12 flex-1 rounded-md" />
                        </div>
                        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
                            <SkeletonAccueil />
                        </div>
                    </>
                )}

                {(forme === 'liste' || forme === 'tableau') && (
                    <>
                        <EnTeteEnAttente titre="w-20" annexe="compte" gestes={['w-[126px]']} />
                        <OutilsEnAttente filtre droite={['w-24', 'w-20']} />
                        <CarteEnAttente
                            className={cn('mt-4 min-h-0 flex-1', forme === 'liste' && 'px-4')}
                        >
                            {forme === 'tableau' ? <SkeletonTableau /> : <SkeletonList remplir />}
                        </CarteEnAttente>
                    </>
                )}

                {forme === 'historique' && (
                    <>
                        <EnTeteEnAttente titre="w-28" annexe="compte" gestes={['w-[110px]']} />
                        <div
                            className="mt-2 flex shrink-0 flex-wrap items-center gap-3 pb-1"
                            style={retardDeRangee(1)}
                        >
                            <Skeleton className="expanded:h-10 expanded:w-[320px] expanded:flex-none h-12 min-w-0 flex-1 rounded-md" />
                            {['w-[195px]', 'w-[102px]', 'w-[165px]'].map((largeur) => (
                                <Skeleton
                                    key={largeur}
                                    className={cn(
                                        'expanded:block hidden h-10 shrink-0 rounded-md',
                                        largeur,
                                    )}
                                />
                            ))}
                            <span className="expanded:block hidden flex-1" />
                            <Skeleton className="expanded:block hidden h-4 w-24 shrink-0" />
                        </div>
                        <CarteEnAttente className="expanded:px-0 mt-4 min-h-0 flex-1 px-4">
                            <div className="expanded:hidden">
                                <SkeletonQueue remplir />
                            </div>
                            <div className="expanded:block hidden">
                                <SkeletonTableau />
                            </div>
                        </CarteEnAttente>
                    </>
                )}

                {forme === 'taches' && (
                    <>
                        <EnTeteEnAttente titre="w-[76px]" annexe="onglets" />
                        <OutilsEnAttente
                            dense
                            puces={['w-[88px]', 'w-[96px]', 'w-[102px]']}
                            droite={['w-40']}
                        />
                        <div className="mt-4 flex min-h-0 flex-1 gap-4">
                            <ListeGroupeeEnAttente bande="h-[34px]" rangee="h-[59px]" />
                            <PanneauEnAttente />
                        </div>
                    </>
                )}

                {forme === 'depenses' && (
                    <>
                        <EnTeteEnAttente
                            titre="w-[106px]"
                            annexe="compte"
                            gestes={['w-[175px]', 'w-[213px]']}
                        />
                        <OutilsEnAttente
                            dense
                            puces={['w-[88px]', 'w-[100px]', 'w-[131px]', 'w-[123px]']}
                            droite={['w-44']}
                        />
                        <div className="mt-4 flex min-h-0 flex-1 gap-4">
                            <ListeGroupeeEnAttente bande="h-8" rangee="h-[57px]" />
                            <PanneauEnAttente depense />
                        </div>
                    </>
                )}

                {forme === 'finances' && (
                    <>
                        <EnTeteEnAttente
                            titre="w-[100px]"
                            annexe="sousTitre"
                            gestes={['w-[183px]', 'w-[213px]']}
                        />
                        {/* Sous 1000, le héros sombre de l'exercice ; au-delà, ses quatre tuiles. */}
                        <HerosEnAttente className="deux:hidden mt-4 min-h-[262px]" mesures={2} />
                        <div className="deux:grid mt-4 hidden shrink-0 grid-cols-4 gap-4">
                            {[0, 1, 2, 3].map((i) => (
                                <TuileEnAttente
                                    key={i}
                                    index={i}
                                    jauge={i === 0}
                                    className="h-[142px]"
                                />
                            ))}
                        </div>
                        <div
                            className={cn(
                                'deux:items-start mt-4 min-h-0 flex-1 overflow-clip',
                                HUIT_ET_QUATRE,
                            )}
                        >
                            <div className="deux:col-span-8 flex min-w-0 flex-col gap-4">
                                {/* Le graphique : douze mois, à hauteurs inégales. */}
                                <CarteEnAttente index={1} className="h-[30.5rem] shrink-0 p-4">
                                    <TeteDeCarte titre="w-44" droite="w-40" />
                                    <div className="mt-6 flex min-h-0 flex-1 items-end gap-6 px-10 pb-12">
                                        {[76, 31, 51, 39, 38, 37, 31, 32, 31, 0, 0, 0].map(
                                            (h, i) => (
                                                <div
                                                    key={i}
                                                    aria-hidden="true"
                                                    className="bg-skeleton mvt-attente flex-1 rounded-xs"
                                                    style={{
                                                        height: `${Math.max(h, 2)}%`,
                                                        ...retardDeRangee(i),
                                                    }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </CarteEnAttente>
                                <CarteEnAttente index={4} className="h-[340px] shrink-0 px-4 pt-3">
                                    <TeteDeCarte titre="w-20" droite="w-36" className="mb-4" />
                                    <RangeesEnAttente
                                        n={5}
                                        depart={4}
                                        hauteur="h-[58px]"
                                        vignette={false}
                                        droite="w-56"
                                    />
                                </CarteEnAttente>
                            </div>
                            <div className="deux:col-span-4 deux:flex hidden min-w-0 flex-col gap-4">
                                <CarteEnAttente index={2} className="h-[252px] px-4 pt-[19px]">
                                    <TeteDeCarte titre="w-14" className="mb-4" />
                                    <RangeesEnAttente
                                        n={3}
                                        depart={2}
                                        hauteur="h-16"
                                        droite="w-3"
                                        className="divide-y-0"
                                    />
                                </CarteEnAttente>
                                <CarteEnAttente index={3} className="h-[220px] px-4 pt-[19px]">
                                    <TeteDeCarte titre="w-20" droite="w-28" className="mb-3" />
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex h-10 items-center gap-2"
                                            style={retardDeRangee(i + 3)}
                                        >
                                            <Skeleton className="h-4 w-4 shrink-0" />
                                            <Skeleton className="w-32" />
                                            <span className="flex-1" />
                                            <Skeleton className="h-1.5 w-16 rounded-full" />
                                            <Skeleton className="w-9" />
                                        </div>
                                    ))}
                                </CarteEnAttente>
                                <CarteEnAttente index={4} className="h-[340px] px-4 pt-[19px]">
                                    <TeteDeCarte titre="w-24" droite="w-10" className="mb-4" />
                                    <RangeesEnAttente
                                        n={4}
                                        depart={4}
                                        hauteur="h-16"
                                        droite="w-3"
                                        className="divide-y-0"
                                    />
                                </CarteEnAttente>
                            </div>
                        </div>
                    </>
                )}

                {forme === 'lignes' && (
                    <>
                        <EnTeteEnAttente
                            titre="w-48"
                            annexe="sousTitre"
                            gestes={['w-[85px]', 'w-[133px]']}
                        />
                        <div
                            className={cn(
                                'deux:items-start mt-4 min-h-0 flex-1 overflow-clip',
                                HUIT_ET_QUATRE,
                            )}
                        >
                            {/* Le tableau des lignes : son en-tête, quatre lignes, le total. */}
                            <CarteEnAttente className="deux:col-span-8 shrink-0">
                                <div className="flex h-10 items-center justify-between px-4">
                                    <Skeleton className="h-2.5 w-10" />
                                    <span className="flex gap-16">
                                        <Skeleton className="h-2.5 w-16" />
                                        <Skeleton className="h-2.5 w-16" />
                                        <Skeleton className="h-2.5 w-14" />
                                    </span>
                                </div>
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="border-outline-variant flex h-[63px] items-center gap-4 border-t px-4"
                                        style={retardDeRangee(i)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <Skeleton className="h-3.5 w-36" />
                                            <Skeleton className="h-2.5 w-44" />
                                        </div>
                                        <Skeleton className="deux:block hidden w-20" />
                                        <Skeleton className="h-10 w-[120px] rounded-md" />
                                        <Skeleton className="deux:block hidden h-1.5 w-16 rounded-full" />
                                        <Skeleton className="deux:block hidden w-24" />
                                    </div>
                                ))}
                                <div className="border-outline-variant flex h-12 items-center justify-between border-t px-4">
                                    <Skeleton className="w-24" />
                                    <Skeleton className="w-40" />
                                </div>
                            </CarteEnAttente>
                            <CarteEnAttente
                                index={2}
                                className="deux:col-span-4 deux:flex hidden h-[471px] p-4"
                            >
                                <Skeleton className="mt-1 h-2.5 w-28" />
                                <Skeleton className="mt-3 h-7 w-44 rounded-sm" />
                                <Skeleton className="mt-5 h-2 w-full rounded-full" />
                                <div className="mt-3">
                                    <FaitsEnAttente n={3} hauteur="h-7" depart={2} />
                                </div>
                                <Skeleton className="mt-9 h-2.5 w-20" />
                                {[0, 1].map((i) => (
                                    <div key={i} className="mt-4 flex flex-col gap-2.5">
                                        <span className="flex justify-between">
                                            <Skeleton className="w-40" />
                                            <Skeleton className="w-28" />
                                        </span>
                                        <Skeleton className="h-1.5 w-full rounded-full" />
                                    </div>
                                ))}
                                <Skeleton className="mt-auto h-12 w-full rounded-md" />
                            </CarteEnAttente>
                        </div>
                    </>
                )}

                {forme === 'rapports' && (
                    <>
                        <EnTeteEnAttente titre="w-[98px]" annexe="compte" />
                        <div className="deux:grid-cols-2 mt-4 grid shrink-0 grid-cols-1 gap-4">
                            {[0, 1, 2, 3].map((i) => (
                                <CarteEnAttente key={i} index={i} className="h-[176px] p-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="rounded-vignette h-10 w-10 shrink-0" />
                                        <div className="flex flex-1 flex-col gap-2">
                                            <Skeleton className="h-3.5 w-40" />
                                            <Skeleton className="h-2.5 w-64 max-w-full" />
                                        </div>
                                    </div>
                                    <Skeleton className="mt-6 h-2.5 w-36" />
                                    <div className="mt-auto flex gap-3">
                                        <Skeleton className="h-12 flex-1 rounded-sm" />
                                        <Skeleton className="h-12 flex-1 rounded-sm" />
                                    </div>
                                </CarteEnAttente>
                            ))}
                        </div>
                    </>
                )}

                {forme === 'inventaire' && (
                    <>
                        <EnTeteEnAttente titre="w-[105px]" annexe="compte" />
                        <OutilsEnAttente filtre />
                        <HerosEnAttente className="deux:hidden mt-4 min-h-[256px]" mesures={3} />
                        <div className="deux:grid mt-4 hidden shrink-0 grid-cols-12 gap-4">
                            <TuileEnAttente index={0} jauge className="col-span-6 h-[170px]" />
                            {[1, 2, 3].map((i) => (
                                <TuileEnAttente
                                    key={i}
                                    index={i}
                                    className="col-span-2 h-[170px]"
                                />
                            ))}
                        </div>
                        {/* Les deux zones tiennent 448 au moins, comme la page : sur un portable de
                            657 de haut, elle défile plutôt que d'écraser sa liste. */}
                        <div
                            className={cn(
                                'deux:min-h-[28rem] mt-4 flex-1 overflow-clip',
                                HUIT_ET_QUATRE,
                            )}
                        >
                            {/* La vue globale : l'en-tête de ses colonnes, puis les pays. */}
                            <CarteEnAttente index={1} className="deux:col-span-8 min-h-0 px-2 pt-2">
                                <div className="flex h-10 shrink-0 items-center gap-3 px-2">
                                    <span className="w-10 shrink-0" />
                                    <Skeleton className="h-2.5 w-10" />
                                    <span className="flex-1" />
                                    <Skeleton className="h-2.5 w-16" />
                                    <Skeleton className="h-2.5 w-36" />
                                </div>
                                <RangeesEnAttente
                                    n={8}
                                    depart={1}
                                    hauteur="h-16"
                                    droite="w-48"
                                    className="divide-y-0 px-2"
                                />
                            </CarteEnAttente>
                            <div className="deux:flex col-span-4 hidden min-h-0 flex-col gap-4">
                                <CarteEnAttente index={2} className="h-[136px] shrink-0 p-4">
                                    <Skeleton className="mt-1 h-2.5 w-10" />
                                    <Skeleton className="mt-3 h-5 w-44 rounded-sm" />
                                    <div className="mt-auto flex gap-6">
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} className="flex flex-1 flex-col gap-2">
                                                <Skeleton className="h-3.5 w-6" />
                                                <Skeleton className="h-2.5 w-14" />
                                            </div>
                                        ))}
                                    </div>
                                </CarteEnAttente>
                                <CarteEnAttente index={3} className="min-h-0 flex-1 px-4 pt-4">
                                    <div className="flex h-4 shrink-0 items-center justify-between">
                                        <Skeleton className="h-2.5 w-10" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </div>
                                    <RangeesEnAttente
                                        n={5}
                                        depart={3}
                                        hauteur="h-16"
                                        className="mt-2"
                                    />
                                </CarteEnAttente>
                            </div>
                        </div>
                    </>
                )}

                {forme === 'campagne' && (
                    <>
                        <EnTeteEnAttente
                            titre="w-[92px]"
                            annexe="sousTitre"
                            gestes={['w-[114px]', 'w-[157px]']}
                            menu
                        />
                        {/* Les quatre tuiles : deux par deux au téléphone, de front au-delà. */}
                        <div className="medium:grid-cols-4 expanded:gap-4 deux:mt-4 mt-3 grid shrink-0 grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <TuileEnAttente
                                    key={i}
                                    index={i}
                                    pastille
                                    jauge={i === 0}
                                    className="h-[130px]"
                                />
                            ))}
                        </div>
                        <div
                            className={cn(
                                /* 416 au moins : les étapes (248) et l'activité (152). */
                                'deux:mt-5 deux:min-h-[416px] mt-4 flex-1 overflow-clip',
                                HUIT_ET_QUATRE,
                            )}
                        >
                            <CarteEnAttente index={1} className="deux:col-span-8 min-h-0">
                                <div className="border-outline-variant deux:flex hidden h-16 shrink-0 items-center gap-3 border-b px-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="w-14" />
                                    <span className="flex-1" />
                                    <Skeleton className="h-10 w-60 rounded-md" />
                                    <Skeleton className="w-36" />
                                </div>
                                <RangeesEnAttente
                                    n={RANGEES_POUR_REMPLIR}
                                    depart={1}
                                    droite="w-24"
                                    className="px-4"
                                />
                            </CarteEnAttente>
                            <div className="deux:flex col-span-4 hidden min-h-0 flex-col gap-4">
                                <CarteEnAttente index={2} className="h-[248px] shrink-0 p-4">
                                    <TeteDeCarte titre="w-28" className="mb-3" />
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex h-12 items-start gap-3"
                                            style={retardDeRangee(i + 2)}
                                        >
                                            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                                            <div className="flex flex-1 flex-col gap-2 pt-1">
                                                <Skeleton className="h-3.5 w-24" />
                                                <Skeleton className="h-2.5 w-52 max-w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </CarteEnAttente>
                                <CarteEnAttente
                                    index={3}
                                    className="min-h-[152px] flex-1 px-4 pt-4"
                                >
                                    <TeteDeCarte titre="w-16" className="mb-2" />
                                    <RangeesEnAttente
                                        n={6}
                                        depart={3}
                                        hauteur="h-[46px]"
                                        vignette={false}
                                        droite={false}
                                        className="flex-1 divide-y-0"
                                    />
                                    <PiedEnAttente className="mb-4" />
                                </CarteEnAttente>
                            </div>
                        </div>
                    </>
                )}

                {forme === 'catalogue' && (
                    <>
                        <EnTeteEnAttente titre="w-[108px]" annexe="compte" gestes={['w-[126px]']} />
                        <OutilsEnAttente filtre droite={['w-24']} />
                        {/* Sous 840, les types se rangent par famille, en cartes de rangées. */}
                        <div className="expanded:hidden mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                            {[2, 3, 4].map((n, i) => (
                                <CarteEnAttente key={n} index={i} className="shrink-0 px-4 pt-4">
                                    <TeteDeCarte droite="w-12" className="mb-1" />
                                    <RangeesEnAttente n={n} depart={i} hauteur="h-[68px]" />
                                </CarteEnAttente>
                            ))}
                        </div>
                        <div className="expanded:flex mt-4 hidden min-h-0 flex-1 flex-col gap-4 overflow-clip">
                            {[3, 4, 5].map((n, famille) => (
                                <div key={n} className="flex shrink-0 flex-col gap-2">
                                    <div
                                        className="flex h-8 items-center gap-3"
                                        style={retardDeRangee(famille)}
                                    >
                                        <Skeleton className="rounded-vignette h-8 w-8 shrink-0" />
                                        <Skeleton className="h-4 w-36" />
                                        <span className="flex-1" />
                                        <Skeleton className="w-12" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {Array.from({ length: n }, (_, i) => (
                                            <TuileDeTypeEnAttente key={i} index={i + famille} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {forme === 'emplacements' && (
                    <>
                        <EnTeteEnAttente
                            titre="w-40"
                            annexe="compte"
                            gestes={['w-[108px]', 'w-[212px]']}
                        />
                        <OutilsEnAttente />
                        <div className="deux:flex-row mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                            {/* Le globe — un disque, et sa légende dessous. */}
                            <div
                                className={cn(
                                    'deux:flex hidden min-w-0 flex-col items-center gap-9 pt-5',
                                    DOUZIEMES_DES_DEUX[7],
                                )}
                            >
                                <Skeleton className="aspect-square h-auto w-[500px] max-w-full rounded-full" />
                                <Skeleton className="h-2.5 w-96 max-w-full" />
                            </div>
                            <div
                                className={cn('flex min-w-0 flex-col gap-4', DOUZIEMES_DES_DEUX[5])}
                            >
                                {[5, 2].map((n, i) => (
                                    <CarteEnAttente key={n} index={i + 1} className="shrink-0">
                                        <TeteDeCarte
                                            titre={i ? 'w-12' : 'w-20'}
                                            droite={i ? 'w-10' : 'w-3'}
                                            className="mx-4 mt-[19px] mb-[15px]"
                                        />
                                        <RangeesEnAttente
                                            n={n}
                                            depart={i + 1}
                                            droite="w-12"
                                            className="[&>*]:border-outline-variant divide-y-0 [&>*]:border-t [&>*]:px-4"
                                        />
                                    </CarteEnAttente>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {forme === 'parametres' && (
                    <>
                        <EnTeteEnAttente titre="w-32" />
                        <div className="deux:grid-cols-2 deux:items-start mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-clip">
                            <div className="flex min-w-0 flex-col gap-4">
                                <ReglagesEnAttente index={0} rangees={['h-14']} />
                                <ReglagesEnAttente
                                    index={1}
                                    rangees={[
                                        'h-14',
                                        'h-[61px]',
                                        'h-[61px]',
                                        'h-[61px]',
                                        'h-[61px]',
                                    ]}
                                />
                            </div>
                            <div className="flex min-w-0 flex-col gap-4">
                                <ReglagesEnAttente index={2} rangees={['h-[60px]', 'h-14']} />
                                <ReglagesEnAttente index={3} rangees={['h-14', 'h-14', 'h-14']} />
                                <ReglagesEnAttente index={4} rangees={['h-14', 'h-14']} />
                            </div>
                        </div>
                    </>
                )}

                {forme === 'acces' && (
                    <>
                        <EnTeteEnAttente titre="w-[67px]" annexe="compte" gestes={['w-[86px]']} />
                        <OutilsEnAttente />
                        <div
                            className={cn(
                                'deux:items-start mt-4 min-h-0 flex-1 overflow-clip',
                                HUIT_ET_QUATRE,
                            )}
                        >
                            {[
                                { n: 8, span: 'deux:col-span-8', titre: 'w-20', droite: 'w-14' },
                                { n: 6, span: 'deux:col-span-4', titre: 'w-24', droite: 'w-16' },
                            ].map((carte, i) => (
                                <CarteEnAttente
                                    key={carte.n}
                                    index={i}
                                    className={cn('shrink-0', carte.span)}
                                >
                                    <TeteDeCarte
                                        titre={carte.titre}
                                        droite={carte.droite}
                                        className="mx-4 mt-[23px] mb-[11px]"
                                    />
                                    <RangeesEnAttente
                                        n={carte.n}
                                        depart={i}
                                        droite="w-14"
                                        className="[&>*]:border-outline-variant divide-y-0 px-0 [&>*]:px-4 [&>*+*]:border-t"
                                    />
                                    {/* Sous les rôles, la note du système ; sous les groupes,
                                        une dernière rangée de 68. */}
                                    {i === 0 ? (
                                        <div className="border-outline-variant flex h-[46px] items-center border-t px-4">
                                            <Skeleton className="w-3/4" />
                                        </div>
                                    ) : (
                                        <span className="h-[3px]" />
                                    )}
                                </CarteEnAttente>
                            ))}
                        </div>
                    </>
                )}

                {forme === 'tension' && (
                    <>
                        <EnTeteEnAttente titre="w-48" />
                        <div className="deux:grid-cols-2 mt-4 grid shrink-0 grid-cols-1 gap-4">
                            {[0, 1].map((i) => (
                                <CarteEnAttente
                                    key={i}
                                    index={i}
                                    className="h-[229px] px-4 pt-[19px]"
                                >
                                    <TeteDeCarte titre="w-44" droite="w-12" className="mb-3" />
                                    <RangeesEnAttente
                                        n={3}
                                        depart={i}
                                        hauteur="h-[57px]"
                                        droite="w-10"
                                    />
                                </CarteEnAttente>
                            ))}
                        </div>
                    </>
                )}

                {fiche && (
                    <>
                        <EnTeteEnAttente
                            titre={fiche === 'actif' || fiche === 'personne' ? 'w-40' : 'w-20'}
                            gestes={fiche === 'type' ? ['w-[171px]'] : []}
                            menu
                        />
                        <div className="mt-4 min-h-0 flex-1 overflow-clip">
                            <CorpsDeFiche forme={fiche} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SkeletonList;
