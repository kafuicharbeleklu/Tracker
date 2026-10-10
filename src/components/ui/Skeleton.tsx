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

interface SkeletonDetailProps {
    /** Nombre de rangées de la carte de références. */
    rows?: number;
    className?: string;
    label?: string;
}

/**
 * Squelette de **fiche** — Équipement · Utilisateur · Modèle · Catégorie · Rôle.
 *
 * C'est la seule forme où **le héro se dessine aussi** : il est le bloc le plus
 * lourd de l'écran, et l'omettre ferait sauter tout le reste de 200 px à l'arrivée
 * des données. Sa composition suit R3 (§0.4) : une étiquette, un sujet, un état,
 * puis **trois métriques au plus**.
 */
export const SkeletonDetail: React.FC<SkeletonDetailProps> = ({
    rows = 3,
    className,
    label = 'Chargement en cours',
}) => (
    <div className={cn('flex flex-col', className)} role="status" aria-live="polite">
        <span className="sr-only">{label}</span>

        <div className="bg-surface-container flex flex-col gap-3 p-5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-[26px] w-8/12 rounded-sm" />
            <Skeleton className="w-[150px]" />
            <div className="mt-2 flex gap-5">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-1 flex-col gap-[7px]">
                        <Skeleton className="h-5 w-14" />
                        <Skeleton className="w-3/4" />
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-col gap-5 p-4" style={retardDeRangee(1)}>
            <Skeleton className="h-12 rounded-sm" />
            <div className="rounded-card bg-surface p-4">
                <Skeleton className="mb-3.5 h-[11px] w-32" />
                <div className="divide-outline-variant divide-y">
                    {Array.from({ length: rows }, (_, i) => (
                        <div
                            key={i}
                            className="flex min-h-14 items-center gap-3 py-2.5"
                            style={retardDeRangee(i + 2)}
                        >
                            <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Skeleton className="h-[15px] w-2/3" />
                                <Skeleton className="w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

/** Une carte de la mosaïque en attente : son titre, puis ses rangées, coupées au cadre. */
const CarteEnAttente: React.FC<{
    rangees: number;
    index: number;
    className?: string;
    /** Des rangées de réglage ou de chiffres, sans vignette. */
    sansVignette?: boolean;
}> = ({ rangees, index, className, sansVignette = false }) => (
    <div
        className={cn(
            'rounded-card bg-surface deux:min-h-0 flex min-h-56 min-w-0 flex-col overflow-clip p-4',
            className,
        )}
        style={retardDeRangee(index)}
    >
        <Skeleton className="mb-3 h-4 w-36 shrink-0" />
        <div className="divide-outline-variant min-h-0 flex-1 divide-y overflow-clip">
            {Array.from({ length: rangees }, (_, i) => (
                <SkeletonRow key={i} index={i + index} withThumb={!sansVignette} />
            ))}
        </div>
    </div>
);

/** Une tuile de chiffre en attente : son libellé, son chiffre, sa légende. */
const TuileEnAttente: React.FC<{ index: number; className?: string }> = ({ index, className }) => (
    <div
        className={cn('rounded-card bg-surface flex min-w-0 flex-col gap-3 p-4', className)}
        style={retardDeRangee(index)}
    >
        <Skeleton className="w-24" />
        <Skeleton className="h-7 w-20 rounded-sm" />
        <Skeleton className="w-32 max-w-full" />
    </div>
);

/** Le héro d'un écran du téléphone, en attente — le bloc sombre, ses lignes, ses mesures. */
const HerosEnAttente: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('rounded-card bg-surface-container flex flex-col gap-3 p-5', className)}>
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-9 w-40 rounded-sm" />
        <Skeleton className="w-[150px]" />
        <Skeleton className="mt-1 h-2 w-full" />
    </div>
);

/** La ligne d'outils d'une liste : la recherche, l'entonnoir, puis au bureau les puces et le tri. */
const OutilsEnAttente: React.FC = () => (
    <div className="flex shrink-0 items-center gap-2" style={retardDeRangee(1)}>
        <Skeleton className="expanded:h-10 expanded:max-w-[320px] h-12 flex-1 rounded-md" />
        <Skeleton className="expanded:h-10 expanded:w-24 h-12 w-12 shrink-0 rounded-md" />
        <Skeleton className="deux:block hidden h-9 w-20 shrink-0 rounded-md" />
        <Skeleton className="deux:block hidden h-9 w-24 shrink-0 rounded-md" />
        <Skeleton className="expanded:block ml-auto hidden h-4 w-36 shrink-0" />
    </div>
);

/** Les formes d'écran que le squelette de page sait dessiner. */
export type FormeDePage =
    | 'accueil'
    | 'liste'
    | 'listeEtFiche'
    | 'fiche'
    | 'finances'
    | 'campagne'
    | 'inventaire'
    | 'tuiles'
    | 'reglages';

/**
 * Squelette de **l'accueil**, calé sur sa grille (10/10 : « aligner le squelette de
 * chargement avec la grille des cartes »).
 *
 * Ce sont les cases de 03.1, aux mêmes mesures : la bande de chiffres dès 840, puis dès
 * 1000 la grille de douze — une rangée de 448 (la file sur 8, les événements sur 4) et deux
 * rangées de 216 pour la mosaïque, en 8 / 4 elles aussi. Sous 1000, les cartes s'empilent, comme la page. Quand
 * les données arrivent, chaque carte se remplit **à sa place** : rien ne se recompose.
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
                    className="border-outline-variant flex flex-1 flex-col gap-2 border-l px-4 first:border-l-0 first:pl-0"
                    style={retardDeRangee(i)}
                >
                    <Skeleton className="h-6 w-14 rounded-sm" />
                    <Skeleton className="w-20" />
                </div>
            ))}
        </div>
        <div className="deux:grid deux:auto-rows-[13.5rem] deux:grid-cols-12 deux:grid-rows-[28rem] flex flex-col gap-4">
            <CarteEnAttente rangees={6} index={0} className="deux:col-span-8 min-h-72" />
            <CarteEnAttente rangees={5} index={1} className="deux:col-span-4" />
            <CarteEnAttente rangees={2} index={2} sansVignette className="deux:col-span-8" />
            <CarteEnAttente rangees={2} index={3} sansVignette className="deux:col-span-4" />
            <CarteEnAttente rangees={2} index={4} sansVignette className="deux:col-span-8" />
            <CarteEnAttente rangees={2} index={5} className="deux:col-span-4" />
        </div>
    </>
);

/**
 * Squelette de **page** (10/10) — ce que l'on voit pendant qu'un écran arrive : son titre,
 * sa ligne d'outils, puis la forme de son contenu **jusqu'au bas de la fenêtre**.
 *
 * L'attente d'une vue posait quatre rangées nues en haut du canevas, sans titre ni carte :
 * la page paraissait vide aux trois quarts, puis tout arrivait d'un bloc. Trois formes, celles
 * que 17.3 compte : la **liste** (une carte de rangées), la **fiche** (le héro et ses cartes),
 * l'**accueil** (la bande de chiffres et la mosaïque).
 *
 * La racine prend la hauteur qu'on lui laisse (`flex-1`) et coupe ce qui dépasse : au
 * téléphone elle tient l'écran sans faire défiler une page qui n'existe pas encore.
 */
export const SkeletonPage: React.FC<{
    forme?: FormeDePage;
    label?: string;
}> = ({ forme = 'liste', label = 'Chargement en cours' }) => (
    <div
        data-testid="route-loading-fallback"
        role="status"
        aria-live="polite"
        className="medium:px-page expanded:min-h-0 expanded:max-h-none flex max-h-[calc(100dvh-5rem)] min-h-[calc(100dvh-9rem)] flex-1 flex-col gap-4 overflow-clip px-4 pt-5 pb-6"
    >
        <span className="sr-only">{label}</span>

        {/*
          **L'en-tête, à la forme de celui qui arrive** (10/10 : « le squelette illustre bien
          le corps, pas l'en-tête »). C'était un carré et une barre. Chaque forme dessine le
          sien, aux mesures de la page : le retour de 40, le titre de 28, son compte en 12,
          et à droite le geste — nommé au bureau, ⋮ pour une fiche, la pastille du compte à
          l'accueil du téléphone.
        */}
        {forme === 'accueil' ? (
            <>
                <div className="flex shrink-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-2 pt-1">
                        <Skeleton className="h-8 w-52 rounded-sm" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    {/* Au téléphone, la pastille du compte ; au bureau, les deux gestes. */}
                    <Skeleton className="expanded:hidden h-11 w-11 shrink-0 rounded-full" />
                    <div className="expanded:flex hidden shrink-0 gap-2">
                        <Skeleton className="h-10 w-28 rounded-md" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                </div>
                <div className="expanded:hidden flex shrink-0 gap-3" style={retardDeRangee(1)}>
                    <Skeleton className="h-12 flex-1 rounded-md" />
                    <Skeleton className="h-12 flex-1 rounded-md" />
                </div>
            </>
        ) : (
            <div className="expanded:min-h-[52px] flex min-h-14 shrink-0 items-center gap-2">
                <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                <div className="flex min-w-0 flex-1 items-baseline gap-3">
                    <Skeleton
                        className={cn('h-8 rounded-sm', forme === 'fiche' ? 'w-32' : 'w-44')}
                    />
                    {forme === 'liste' && (
                        <Skeleton className="expanded:block hidden h-3 w-32 shrink-0" />
                    )}
                </div>
                {/* Le geste de la page : nommé au bureau, il flotte au téléphone. */}
                <Skeleton className="expanded:block hidden h-10 w-40 shrink-0 rounded-md" />
                {forme === 'fiche' && <Skeleton className="h-10 w-10 shrink-0 rounded-md" />}
            </div>
        )}

        {/* **Chaque écran a ses cartes** (10/10 : « le squelette de certaines pages n'est
            pas fidèle aux cartes de ces pages »). Une liste, une liste et sa fiche, les
            tuiles et le graphique de Finances, la vue globale de l'inventaire et son
            panneau, une campagne et sa colonne, un catalogue en tuiles, des réglages en
            groupes : la forme vient de l'adresse (`formeDeLAdresse`). */}
        {forme === 'liste' && (
            <>
                <OutilsEnAttente />
                <div className="bg-surface min-h-0 flex-1 overflow-clip rounded-xl px-4">
                    <div className="divide-outline-variant divide-y">
                        {Array.from({ length: RANGEES_POUR_REMPLIR }, (_, i) => (
                            <SkeletonRow key={i} index={i} />
                        ))}
                    </div>
                </div>
            </>
        )}

        {forme === 'listeEtFiche' && (
            <>
                <OutilsEnAttente />
                <div className="expanded:grid expanded:grid-cols-[400px_minmax(0,1fr)] flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                    <CarteEnAttente rangees={RANGEES_POUR_REMPLIR} index={0} className="min-h-0" />
                    <CarteEnAttente
                        rangees={6}
                        index={2}
                        sansVignette
                        className="expanded:flex hidden min-h-0"
                    />
                </div>
            </>
        )}

        {forme === 'finances' && (
            <>
                <HerosEnAttente className="expanded:hidden min-h-[278px] shrink-0" />
                <div className="expanded:grid deux:grid-cols-4 hidden shrink-0 grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <TuileEnAttente key={i} index={i} className="min-h-[142px]" />
                    ))}
                </div>
                <div className="deux:grid deux:grid-cols-12 deux:items-start flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                    <div className="deux:col-span-8 flex min-w-0 flex-col gap-4">
                        {/* Le graphique : douze mois, à hauteurs inégales. */}
                        <div className="rounded-card bg-surface flex h-[30.5rem] flex-col gap-4 p-4">
                            <Skeleton className="h-4 w-48 shrink-0" />
                            <div className="flex min-h-0 flex-1 items-end gap-3">
                                {[62, 38, 20, 28, 46, 24, 34, 52, 18, 30, 22, 40].map((h, i) => (
                                    <div
                                        key={i}
                                        aria-hidden="true"
                                        className="bg-skeleton mvt-attente flex-1 rounded-xs"
                                        style={{ height: `${h}%`, ...retardDeRangee(i) }}
                                    />
                                ))}
                            </div>
                        </div>
                        <CarteEnAttente rangees={4} index={4} sansVignette />
                    </div>
                    <div className="deux:col-span-4 deux:flex hidden min-w-0 flex-col gap-4">
                        <CarteEnAttente rangees={3} index={2} className="min-h-[252px]" />
                        <CarteEnAttente rangees={4} index={3} sansVignette />
                    </div>
                </div>
            </>
        )}

        {forme === 'inventaire' && (
            <>
                <OutilsEnAttente />
                <HerosEnAttente className="deux:hidden min-h-[256px] shrink-0" />
                <div className="deux:grid hidden shrink-0 grid-cols-12 gap-4">
                    <TuileEnAttente index={0} className="col-span-6 min-h-[170px]" />
                    {[1, 2, 3].map((i) => (
                        <TuileEnAttente key={i} index={i} className="col-span-2 min-h-[170px]" />
                    ))}
                </div>
                <div className="deux:grid deux:grid-cols-12 flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                    <CarteEnAttente rangees={8} index={1} className="deux:col-span-8 min-h-0" />
                    <div className="deux:flex col-span-4 hidden min-h-0 flex-col gap-4">
                        <CarteEnAttente rangees={1} index={2} sansVignette className="min-h-36" />
                        <CarteEnAttente rangees={5} index={3} className="min-h-0 flex-1" />
                    </div>
                </div>
            </>
        )}

        {forme === 'campagne' && (
            <>
                <div className="deux:grid hidden shrink-0 grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <TuileEnAttente key={i} index={i} className="min-h-[132px]" />
                    ))}
                </div>
                <div className="deux:hidden flex shrink-0 gap-2">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
                <div className="deux:grid deux:grid-cols-12 flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                    <CarteEnAttente
                        rangees={RANGEES_POUR_REMPLIR}
                        index={1}
                        className="deux:col-span-8 min-h-0"
                    />
                    <div className="deux:flex col-span-4 hidden min-h-0 flex-col gap-4">
                        <CarteEnAttente rangees={4} index={2} sansVignette />
                        <CarteEnAttente rangees={3} index={3} sansVignette className="flex-1" />
                    </div>
                </div>
            </>
        )}

        {forme === 'tuiles' && (
            <>
                <OutilsEnAttente />
                {/* Sous 840, le catalogue range ses types par famille, en cartes de rangées. */}
                <div className="expanded:hidden flex min-h-0 flex-1 flex-col gap-4 overflow-clip">
                    <CarteEnAttente rangees={2} index={0} className="shrink-0" />
                    <CarteEnAttente rangees={3} index={1} className="shrink-0" />
                    <CarteEnAttente rangees={4} index={2} className="shrink-0" />
                </div>
                <div className="expanded:grid mx-auto hidden min-h-0 w-full max-w-[1008px] flex-1 auto-rows-min grid-cols-3 gap-4 overflow-clip">
                    {Array.from({ length: 15 }, (_, i) => (
                        <div
                            key={i}
                            className="rounded-card bg-surface flex min-h-[118px] flex-col justify-between gap-3 p-4"
                            style={retardDeRangee(i)}
                        >
                            <div className="flex items-center gap-3">
                                <Skeleton className="rounded-vignette h-10 w-10 shrink-0" />
                                <Skeleton className="h-[15px] w-1/2" />
                            </div>
                            <Skeleton className="w-2/3" />
                        </div>
                    ))}
                </div>
            </>
        )}

        {forme === 'reglages' && (
            <div className="deux:grid deux:grid-cols-2 deux:items-start mx-auto flex min-h-0 w-full max-w-[1008px] flex-1 flex-col gap-4 overflow-clip">
                <div className="flex min-w-0 flex-col gap-4">
                    <CarteEnAttente rangees={1} index={0} sansVignette className="min-h-0" />
                    <CarteEnAttente rangees={5} index={1} sansVignette className="min-h-0" />
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                    <CarteEnAttente rangees={2} index={2} sansVignette className="min-h-0" />
                    <CarteEnAttente rangees={3} index={3} sansVignette className="min-h-0" />
                    <CarteEnAttente rangees={2} index={4} sansVignette className="min-h-0" />
                </div>
            </div>
        )}

        {forme === 'fiche' && (
            <div className="large:grid-cols-12 grid min-h-0 flex-1 grid-cols-1 items-start gap-4 overflow-clip">
                <div className="large:col-span-7 flex min-w-0 flex-col gap-4">
                    {/* Le héro — le bloc le plus lourd de la fiche. */}
                    <div className="rounded-card bg-surface-container flex flex-col gap-3 p-5">
                        <Skeleton className="h-2.5 w-28" />
                        <Skeleton className="h-[26px] w-8/12 rounded-sm" />
                        <Skeleton className="w-[150px]" />
                        <div className="mt-2 flex gap-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="flex flex-1 flex-col gap-[7px]"
                                    style={retardDeRangee(i + 1)}
                                >
                                    <Skeleton className="h-5 w-14" />
                                    <Skeleton className="w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-card bg-surface px-4 py-2">
                        <Skeleton className="my-3 h-4 w-32" />
                        <div className="divide-outline-variant divide-y">
                            {Array.from({ length: 6 }, (_, i) => (
                                <SkeletonRow key={i} index={i + 2} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="large:col-span-5 flex min-w-0 flex-col gap-4">
                    <div className="rounded-card bg-surface px-4 py-2">
                        <Skeleton className="my-3 h-4 w-36" />
                        <div className="divide-outline-variant divide-y">
                            {Array.from({ length: 2 }, (_, i) => (
                                <SkeletonRow key={i} index={i + 3} withThumb={false} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {forme === 'accueil' && <SkeletonAccueil />}
    </div>
);

export default SkeletonList;
