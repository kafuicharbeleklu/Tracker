import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { CaretRight } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';
import { estUnSujetLong, infobulle } from '../../lib/nomLong';
import { CASE_SOUPLE, RANGEE_SOUPLE } from '../../lib/souple';
import { MEDIA } from '../../constants/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useFicheEnPanneau } from '../../hooks/useFicheEnPanneau';

/**
 * Héro de fiche — registre **§0.4 (R3)**, planche **04.2**.
 *
 * **Le héro ouvre toute fiche** — équipement, personne, modèle, site. Ce n'est pas
 * la propriété du tableau de bord, et sa hiérarchie ne se renégocie pas :
 *
 * 1. **une étiquette** au-dessus — ce qu'est l'objet (« Ordinateur portable ») ;
 * 2. **un sujet** — son nom, Archivo 28. Un seul par héro ;
 * 3. **un état** — badge I3 complet (pictogramme **et** mot), suivi du fait qui
 *    situe l'objet ;
 * 4. **trois métriques au plus**, dans le voile. Le type l'impose : un quatrième
 *    qualifiant ne compile pas.
 *
 * **Le corollaire, et c'est la faute qui s'est produite cinq fois sur 04.2 :** ce
 * que le héro porte, **les cartes ne le reprennent pas**. Une information est soit
 * dans le voile, soit dans une carte, jamais dans les deux.
 *
 * **Le voile porte les faits qu'aucune carte ne porte** (§0.5 nonies). Deux
 * suffisent si le troisième appartient à une carte : remplir la troisième cellule
 * pour tenir le motif, c'est redire une carte avec moins d'information.
 *
 * **Les qualifiants suivent le rôle, jamais la recopie.** Sur 04.2, le gestionnaire
 * voit le prix d'achat ; le porteur, à sa place, voit la date de remise — le prix
 * ne franchit pas la frontière de rôle. Un héritier de ce gabarit **choisit** ses
 * trois faits selon ce que son lecteur a le droit de voir.
 *
 * **Une seule zone inversée par écran**, et le geste primaire y vit : c'est le seul
 * jaune du contenu, et il **suit l'état** (attribuer, restituer, clore, confirmer).
 */

export interface DetailMetric {
    /** Le fait — « 2,4 ans », « 1 250 ». Chiffres tabulaires. */
    value: React.ReactNode;
    /** Ce qu'il mesure — « au parc », « XOF à l'achat ». */
    label: React.ReactNode;
    /**
     * La tuile prend **les deux colonnes**, et se couche : le fait à gauche, ce qu'il
     * mesure à droite. `.qual > div.w` de 04.2 — *« un prix à sept chiffres y tient »*,
     * ce qu'une demi-largeur ne permet pas.
     */
    wide?: boolean;
    /** Une tuile peut **ouvrir** — `.qual > a` de 05.2 : « 1 demande en cours ». */
    onClick?: () => void;
}

/** Un, deux ou trois. **Pas quatre** : R3 le dit, le type le tient. */
export type DetailMetrics =
    | readonly [DetailMetric]
    | readonly [DetailMetric, DetailMetric]
    | readonly [DetailMetric, DetailMetric, DetailMetric];

export interface DetailHeroStatus {
    icon: PhosphorGlyph;
    label: string;
    /** Teinte du glyphe sur surface inversée — famille `--live-*` du registre §2.10. */
    /**
     * `muted` manquait : une demande **annulée** ou **classée** est un état comme un
     * autre, et 06.5 la peint en gris. Sans lui, la page d'une demande close ne
     * compilait pas sa propre teinte.
     */
    tone?: 'positive' | 'info' | 'pending' | 'attention' | 'muted';
}

const STATUS_TONE: Record<NonNullable<DetailHeroStatus['tone']>, string> = {
    positive: 'text-[var(--tk-color-live-vert)]',
    info: 'text-[var(--tk-color-live-bleu)]',
    pending: 'text-[var(--tk-color-live-ambre)]',
    attention: 'text-[var(--tk-color-live-orange)]',
    /* Le héro est sur fond inversé : le gris d'état y serait illisible. L'encre
       secondaire de la surface sombre dit « classé » sans crier. */
    muted: 'text-[var(--tk-color-on-dark-2)]',
};

export interface DetailHeroFact {
    icon: PhosphorGlyph;
    /** Une phrase qui situe l'objet — « Bureau Paris — 2ᵉ étage ». */
    children: React.ReactNode;
}

interface DetailHeroProps {
    /** Ce qu'est l'objet, en micro-libellé capitales. */
    label?: React.ReactNode;
    /** Le sujet. Un seul. */
    subject: React.ReactNode;
    /** Avatar / initiales (pour fiche personne, planche 05.2). */
    avatar?: React.ReactNode;
    /** Note explicative sous le bouton d'action dans le héro (planche 05.2 .hnote). */
    note?: React.ReactNode;
    status?: DetailHeroStatus;
    /**
     * Le fait qui **accompagne l'état**, sur sa ligne — « démarrée il y a 2 h ».
     *
     * R3 le dit dans l'ordre : *« un état — badge I3 complet, **suivi du fait qui
     * situe l'objet** »*. Ce fait-là n'attend donc pas sous les qualifiants : il se
     * lit avec l'état, parce qu'il le date. Sans ce logement, la planche 16.2 le
     * renvoyait dans `facts`, deux blocs et deux filets plus bas.
     */
    statusDetail?: React.ReactNode;
    /**
     * La ligne qui **précise le sujet**, juste sous lui — « Périmètre figé au
     * démarrage · dernier scan il y a 12 min ». Ce n'est pas une étiquette (`label`
     * est en capitales, au-dessus) et ce n'est pas un fait situant : c'est la portée
     * du sujet, et elle ne se lit qu'accolée à lui.
     */
    subtitle?: React.ReactNode;
    metrics?: DetailMetrics;
    /**
     * La forme des mesures. `inline` — la rangée filetée de 04.2, pour des faits qui
     * situent un objet. **`boxes`** — les `.hk` de 09.1 : des cases sur un voile blanc,
     * pour des faits qui *sont* le sujet (un type de catalogue n'a rien d'autre à dire
     * que ses modèles et ses actifs).
     */
    /**
     * `qual` — **les tuiles de 04.2** : une grille de deux colonnes sur le voile blanc,
     * dont une tuile peut prendre toute la largeur. C'est la forme que 04.2, 09, 10 et 16
     * ont alignée le 05/09, et elle vit **dans le héro** : les repères chiffrés d'une
     * fiche ne sont pas des cartes, ce sont des qualifiants du sujet.
     */
    metricsStyle?: 'inline' | 'boxes' | 'qual';
    /**
     * Le nombre de colonnes des tuiles `qual` **au bureau**. 04.2 y passe à trois et rend sa
     * tuile large ordinaire ; 05.2 garde deux colonnes. C'est donc l'écran qui le demande.
     */
    metricsDeskColumns?: 2 | 3;
    /**
     * **La barre qui répartit ce que les mesures comptent** — `.split` de 09.2 : trois
     * segments de 8, collés au-dessus des cases. Elle se lit avant les chiffres parce
     * qu'elle donne la proportion d'un coup ; les chiffres donnent ensuite l'exactitude.
     */
    meter?: React.ReactNode;
    /**
     * **La jauge, sous les chiffres et au-dessus du geste** — `.prog` de 16.2, et le même
     * ordre sur 16.1 : les cases donnent l'exactitude, la barre donne la proportion, puis
     * le geste. Elle passait par `note`, qui se rend **après** le geste avec un filet :
     * l'avancement se lisait sous le bouton qui le fait avancer.
     */
    gauge?: React.ReactNode;
    /** Les faits qui situent : emplacement, rattachement. */
    facts?: DetailHeroFact[];
    /**
     * La rangée de renvoi — le porteur, l'incident en cours, le stock. Elle **ouvre**
     * quand il y a quelque part où aller, et se contente de dire sinon.
     */
    relation?: {
        vignette: React.ReactNode;
        title: React.ReactNode;
        detail?: React.ReactNode;
        onOpen?: () => void;
    };
    /** Les gestes. Le premier est le geste primaire, et il suit l'état. */
    actions?: React.ReactNode;
    /**
     * **Le coin haut droit du héro** — un geste d'icône, pas davantage : l'œil de l'aperçu
     * de la photo (23/09). Il se pose en absolu, à la hauteur de la pastille d'état ; le
     * sujet commence sous lui et ne le croise pas.
     */
    corner?: React.ReactNode;
    /**
     * Le geste du héro **à droite du sujet, et à sa mesure** — le bureau (16.2 : `.hero`
     * en grille `minmax(0,1fr) auto`, `.hact` en colonne 2, rangée 1).
     *
     * Au téléphone il s'étire sous la jauge : on le vise au pouce en tenant l'appareil
     * d'une main. Au bureau, un bouton de 700 px n'est pas plus facile à viser, il est
     * seulement plus grand que ce qu'il fait — et il gagne à se tenir en haut, où l'œil
     * arrive, plutôt qu'après trois chiffres et une barre.
     *
     * Les chiffres et la jauge, eux, gardent **toute la largeur** (`1/-1`) : ce sont eux
     * qui mesurent, et une mesure ne se rétrécit pas pour laisser passer un geste.
     */
    actionsInline?: boolean;
    className?: string;
}

/**
 * **Le sujet, à sa taille** (25/09) — 28 sur 32, et un palier plus bas (22 sur 28) pour un
 * nom long : en 28, soixante signes prenaient quatre lignes du héro. Il reste entier, et se
 * coupe aux tirets ou n'importe où quand c'est un code sans espace (`lib/nomLong`).
 */
const classeDuSujet = (subject: React.ReactNode) =>
    cn(
        /* Deux lignes au plus (25/09, soir) : un nom de soixante signes en prenait trois ou
           quatre ; l'entier reste en infobulle et dans « Référence ». */
        'font-brand text-inverse-on-surface mt-1 line-clamp-2 font-semibold tracking-[-0.02em] text-pretty [overflow-wrap:anywhere]',
        estUnSujetLong(subject) ? 'text-ts-sheet leading-ts-sheet' : 'text-ts-page leading-ts-page',
    );

const DetailHero: React.FC<DetailHeroProps> = ({
    label,
    subject,
    avatar,
    note,
    status,
    statusDetail,
    subtitle,
    metrics,
    metricsStyle = 'inline',
    metricsDeskColumns = 2,
    meter,
    gauge,
    facts,
    relation,
    actions,
    corner,
    actionsInline = false,
    className,
}) => {
    /*
      **Le héro bas** (P2b, 25/09) — de 600 à 999 et dans le panneau d'une liste, les
      chiffres passent **en ligne**, sous un filet, au lieu de tuiles de 70 px : sur une
      tablette debout, le héro montait à 440 px avant la première carte. Le téléphone garde
      ses tuiles, le bureau à deux colonnes aussi.
    */
    const panneauTenu = useMediaQuery(MEDIA.panneauTenu);
    const enPanneau = useFicheEnPanneau() !== null;
    const style = (panneauTenu || enPanneau) && metricsStyle !== 'inline' ? 'inline' : metricsStyle;
    return (
        <section
            className={cn(
                /* `.hero` — intérieur `22 / 20 / 20`. Il valait `20 / 16 / 16` : la carte
               était plus étroite que les cartes qu'elle surmonte. */
                'bg-inverse-surface text-inverse-on-surface relative isolate overflow-hidden rounded-xl px-5 pt-[22px] pb-5',
                /* La grille du bureau : tout ce qui identifie reste en colonne 1, le geste
               monte en colonne 2 sur la première rangée, et les mesures traversent. */
                actionsInline &&
                    'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 [&>*]:col-start-1',
                className,
            )}
        >
            {corner && <div className="absolute top-4 right-4 z-10">{corner}</div>}
            {/* **Plus de photo en fond** (23/09) : étirée en `object-cover` sous un voile à
            80 %, elle était floue et gênait le texte. Elle s'ouvre à part, par l'aperçu
            de la fiche (`ImagePreview`). */}

            {avatar ? (
                /* La pastille se pose **au-dessus** du sujet, pas à côté : la passe sobre
               du 03/09 rend la ligne du nom pleine largeur (planche 05.2, `.idh`
               suivi de `.ty` puis `.nm`). À côté, un nom long se coupait en deux. */
                <div className="min-w-0">
                    <span className="font-brand mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-live-bleu)]/25 text-[1.25rem] font-semibold tracking-normal text-[var(--tk-color-avatar-text)]">
                        {avatar}
                    </span>
                    {label && (
                        <p className="text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                            {label}
                        </p>
                    )}
                    <p className={classeDuSujet(subject)} title={infobulle(subject)}>
                        {subject}
                    </p>
                    {/* `.md` de 07.1 — **la ligne sous le nom**, 14 sur 20. Elle n'était
                    rendue que dans la variante sans avatar : un appelant qui passait
                    les deux perdait sa sous-ligne en silence, et « Mon compte » n'a
                    pas d'autre endroit où écrire l'adresse. Les deux variantes la
                    posent désormais à la même mesure. */}
                    {subtitle && (
                        <p className="text-on-nav-surface-variant text-ts-sub leading-ts-sub mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            ) : (
                <>
                    {status && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-md bg-white/10 px-2.5 text-[0.75rem] leading-4 font-medium">
                                <Icon
                                    glyph={status.icon}
                                    size={18}
                                    className={status.tone ? STATUS_TONE[status.tone] : undefined}
                                />
                                {status.label}
                            </span>
                            {statusDetail && (
                                <span className="text-on-nav-surface-variant text-[0.75rem] leading-4">
                                    {statusDetail}
                                </span>
                            )}
                        </div>
                    )}

                    {label && (
                        /* `.ty` — **12 sur 16**, interlettrage `.07em`, capitales. Il tenait
                       `text-label-small`, c'est-à-dire 11 : une marche sous la plus petite
                       que R15 déclare.

                       **Les 16 au-dessus séparent le surtitre de la pastille d'état** — et
                       de rien d'autre. Ils s'appliquaient toujours : sans pastille (la
                       campagne de 16.2, la fiche d'un modèle, celle d'une catégorie), le
                       surtitre tombait à 38 du haut du héro au lieu des 22 de `.hero`, et
                       le héro paraissait lesté d'une bande vide. Relevé le 11/09. */
                        <p
                            className={cn(
                                status && 'mt-4',
                                'text-[0.75rem] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase',
                            )}
                        >
                            {label}
                        </p>
                    )}

                    <p className={classeDuSujet(subject)} title={infobulle(subject)}>
                        {subject}
                    </p>

                    {subtitle && (
                        /* `.md` — **14 sur 20, à 2 du sujet** (16.2). Elle tenait 13 sur 19,
                       c'est-à-dire l'ancien `body-medium` : une marche que R15 ne déclare
                       pas — l'échelle est 28 · 22 · 17 · 16 · 14 · 12 — et le seul endroit
                       du héro où un 13 subsistait. */
                        <p className="text-on-nav-surface-variant text-ts-sub leading-ts-sub mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </>
            )}

            {avatar && status && (
                /* `statusDetail` se pose ici aussi :
               sur une fiche de personne (05.2) c'est la ligne « Départ le … », et un héro
               à avatar l'avalait en silence. Lot 2. */
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-inverse-on-surface inline-flex h-7 items-center gap-2 rounded-md bg-white/10 px-2.5 text-[0.75rem] leading-4 font-medium">
                        <Icon
                            glyph={status.icon}
                            size={18}
                            className={status.tone ? STATUS_TONE[status.tone] : undefined}
                        />
                        {status.label}
                    </span>
                    {statusDetail && (
                        <span className="text-on-nav-surface-variant text-[0.75rem] leading-4">
                            {statusDetail}
                        </span>
                    )}
                </div>
            )}

            {meter && <div className="mt-5">{meter}</div>}

            {metrics && style === 'boxes' && (
                /* `.hrow` / `.hk` — 09.1 : des cases de 12 sur 14, valeur en 22 sur 28. */
                <div
                    className={cn(
                        /* **En rangée souple** (07/10) : trois cases égales laissaient 55 px à
                           « disponibles », qui en demande 78 — le libellé sortait de sa case à
                           320 et en touchait le bord à 360. Chaque case tient au moins son
                           contenu ; sur un téléphone étroit la gouttière passe à 8 et
                           l'intérieur à 6, ce qui garde les trois de front à 360 ; à 320 la
                           troisième passe dessous. */
                        RANGEE_SOUPLE,
                        'gap-3',
                        metrics.length >= 3 && 'etroit:gap-2',
                        meter ? 'mt-3' : 'mt-5',
                        actionsInline && 'col-end-3',
                    )}
                >
                    {metrics.map((metric, index) => (
                        <div
                            key={index}
                            className={cn(
                                /* `.hero .hk{padding:12px 14px}`, mais **`.hrow.three .hk`
                               retombe à `12px 10px`** : à trois de front sur 393 px,
                               14 d'intérieur laissent « réparation » se couper. */
                                CASE_SOUPLE,
                                'rounded-[4px] bg-white/[0.08] py-3',
                                metrics.length >= 3 ? 'etroit:px-1.5 px-2.5' : 'px-3.5',
                            )}
                        >
                            <span className="font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] tabular-nums">
                                {metric.value}
                            </span>
                            <span className="text-on-nav-surface-variant mt-0.5 block text-[0.75rem] leading-4">
                                {metric.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {metrics && style === 'inline' && (
                /* Les chiffres en ligne passent à la ligne plutôt que de déborder : dans un panneau
               de 330 px, trois valeurs de 22 px ne tiennent pas toujours de front. */
                <div
                    className={cn(
                        'mt-3.5 flex flex-wrap gap-x-[18px] gap-y-3 border-t border-white/[0.14] pt-3',
                        meter && 'mt-3',
                    )}
                >
                    {metrics.map((metric, index) => {
                        const contenu = (
                            <>
                                {/* `.hk .v` — 22 sur 28, comme les tuiles ; `.hk .k` en 12 sur 16 (11.1). */}
                                <span className="font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
                                    {metric.value}
                                </span>
                                <span className="text-on-nav-surface-variant mt-0.5 block truncate text-[0.75rem] leading-4">
                                    {metric.label}
                                </span>
                            </>
                        );
                        return metric.onClick ? (
                            <button
                                key={index}
                                type="button"
                                onClick={metric.onClick}
                                className="-mx-1.5 min-w-0 flex-1 cursor-pointer rounded-[4px] px-1.5 text-left hover:bg-white/[0.08]"
                            >
                                {contenu}
                            </button>
                        ) : (
                            <div key={index} className="min-w-0 flex-1">
                                {contenu}
                            </div>
                        );
                    })}
                </div>
            )}

            {gauge && <div className={cn('mt-4', actionsInline && 'col-end-3')}>{gauge}</div>}

            {facts && facts.length > 0 && (
                <div className="mt-3 flex flex-col gap-[7px] border-t border-white/[0.14] pt-3">
                    {facts.map((fact, index) => (
                        <p
                            key={index}
                            className="text-body-medium text-on-nav-surface-variant flex items-center gap-2.5"
                        >
                            <Icon glyph={fact.icon} size={18} className="shrink-0" />
                            <span>{fact.children}</span>
                        </p>
                    ))}
                </div>
            )}

            {relation && <RelationRow {...relation} />}

            {metrics && style === 'qual' && (
                /* `.qual` — grille `1fr 1fr`, gouttière 12, 20 au-dessus. Les tuiles sont
               posées sur le voile blanc à 8 % : **pas de teinte**, le chiffre et son
               libellé suffisent (04.2, passe du 05/09). */
                <div
                    className={cn(
                        'mt-5 grid grid-cols-2 gap-3',
                        metricsDeskColumns === 3 && 'large:grid-cols-3',
                    )}
                >
                    {metrics.map((metric, index) => {
                        const contenu = (
                            <>
                                <span className="font-brand text-ts-sheet leading-ts-sheet block font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
                                    {metric.value}
                                </span>
                                <span
                                    className={cn(
                                        'text-on-nav-surface-variant block truncate text-[0.75rem] leading-4',
                                        metric.wide
                                            ? metricsDeskColumns === 3 && 'large:mt-0.5'
                                            : 'mt-0.5',
                                    )}
                                >
                                    {metric.label}
                                </span>
                            </>
                        );
                        const forme = cn(
                            'flex min-w-0 rounded-[4px] bg-white/[0.08] text-left',
                            metric.wide
                                ? cn(
                                      'col-span-2 items-baseline justify-between gap-3 px-3.5 py-3',
                                      metricsDeskColumns === 3 &&
                                          'large:col-span-1 large:flex-col large:items-stretch large:gap-0 large:px-2.5',
                                  )
                                : 'flex-col px-2.5 py-3',
                        );
                        return metric.onClick ? (
                            <button
                                key={index}
                                type="button"
                                onClick={metric.onClick}
                                className={cn(forme, 'cursor-pointer hover:bg-white/[0.14]')}
                            >
                                {contenu}
                            </button>
                        ) : (
                            <div key={index} className={forme}>
                                {contenu}
                            </div>
                        );
                    })}
                </div>
            )}

            {actions && (
                /* Pas de filet au-dessus du geste : la passe sobre lui donne de l'air, pas
               une règle de plus. Le seul filet du héro sépare la rangée de relation
               (planche 04.2 : `.hrow` porte une bordure, `.hact` n'a qu'une marge). */
                <div
                    className={cn(
                        'flex gap-3',
                        actionsInline
                            ? 'col-start-2! row-start-1 flex-wrap items-center'
                            : 'mt-5 flex-col [&>*]:w-full',
                    )}
                >
                    {actions}
                </div>
            )}

            {note && (
                /* La note du héro est une phrase : le secondaire (26/09). */
                <div className="text-on-nav-surface-variant text-ts-sub leading-ts-sub mt-2.5 border-t border-white/[0.14] pt-2.5">
                    {note}
                </div>
            )}
        </section>
    );
};

const RelationRow: React.FC<NonNullable<DetailHeroProps['relation']>> = ({
    vignette,
    title,
    detail,
    onOpen,
}) => {
    const content = (
        <>
            {/* `.hero .vig` de 04.2 — le **bleu vif de la marque à 24 %**, l'encre en bleu
                pâle, comme la pastille d'initiales au-dessus. Elle tenait `bg-info` : le
                bleu d'information de l'interface, plus sombre et absent de toute planche, et
                une encre blanche. */}
            <span className="rounded-vignette flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--tk-color-live-bleu)]/[0.24] text-[var(--tk-color-avatar-text)]">
                {vignette}
            </span>
            <span className="min-w-0 flex-1">
                {/* `.hrow .t` — **17 sur 24**, la deuxième marche de R15, et sans graisse
                    d'appui : c'est un nom, pas un fait mis en avant. Il tenait
                    `text-body-large` (15/21) en 500. */}
                <span className="text-ts-head leading-ts-head block truncate">{title}</span>
                {detail && (
                    <span className="text-on-nav-surface-variant mt-0.5 block text-[0.75rem] leading-4">
                        {detail}
                    </span>
                )}
            </span>
            {onOpen && (
                <Icon glyph={CaretRight} size={20} className="text-on-nav-surface-variant" />
            )}
        </>
    );

    /* `.hrow` — **20 au-dessus, 16 d'intérieur haut**, filet du voile, 56 de haut. Elle
       tenait `mt-2 pt-2` : la rangée du porteur se collait au sujet, et le filet passait
       à 8 px du nom au lieu de 20. */
    const shell =
        'mt-5 flex min-h-14 w-full items-center gap-3 border-t border-white/[0.14] pt-4 text-left';

    if (!onOpen) return <div className={shell}>{content}</div>;

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(shell, 'focus-visible:ring-primary outline-none focus-visible:ring-2')}
        >
            {content}
        </button>
    );
};

export default DetailHero;
