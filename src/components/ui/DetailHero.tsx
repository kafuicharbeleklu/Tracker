import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { CaretRight } from '@phosphor-icons/react';

import Icon from './Icon';
import Thumbnail from './Thumbnail';
import { cn } from '../../lib/utils';

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
    tone?: 'positive' | 'info' | 'pending' | 'attention';
}

const STATUS_TONE: Record<NonNullable<DetailHeroStatus['tone']>, string> = {
    positive: 'text-[var(--tk-color-live-vert)]',
    info: 'text-[var(--tk-color-live-bleu)]',
    pending: 'text-[var(--tk-color-live-ambre)]',
    attention: 'text-[var(--tk-color-live-orange)]',
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
    /** L'image du sujet lui-même — la photo de l'actif, jamais une image d'ambiance. */
    image?: string;
    /** Les gestes. Le premier est le geste primaire, et il suit l'état. */
    actions?: React.ReactNode;
    className?: string;
}

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
    meter,
    gauge,
    facts,
    relation,
    image,
    actions,
    className,
}) => (
    <section
        className={cn(
            /* `.hero` — intérieur `22 / 20 / 20`. Il valait `20 / 16 / 16` : la carte
               était plus étroite que les cartes qu'elle surmonte. */
            'bg-inverse-surface text-inverse-on-surface relative isolate overflow-hidden rounded-xl px-5 pt-[22px] pb-5',
            className,
        )}
    >
        {image && (
            <>
                <Thumbnail
                    src={image}
                    alt=""
                    className="absolute inset-0 -z-20 h-full w-full object-cover"
                    /* Sans image, le héro garde sa surface inversée : c'est déjà un fond. */
                    fallback={null}
                />
                {/* Le voile monte vers le bas : le sujet reste lisible sur n'importe
                    quelle photo, et le bas du héro porte le texte le plus dense. */}
                <span
                    aria-hidden="true"
                    className="from-inverse-surface/60 via-inverse-surface/80 to-inverse-surface/95 absolute inset-0 -z-10 bg-gradient-to-b"
                />
            </>
        )}

        {avatar ? (
            /* La pastille se pose **au-dessus** du sujet, pas à côté : la passe sobre
               du 03/09 rend la ligne du nom pleine largeur (planche 05.2, `.idh`
               suivi de `.ty` puis `.nm`). À côté, un nom long se coupait en deux. */
            <div className="min-w-0">
                <span className="font-brand mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-live-bleu)]/25 text-[20px] font-semibold tracking-tight text-[var(--tk-color-avatar-text)]">
                    {avatar}
                </span>
                {label && (
                    <p className="text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                        {label}
                    </p>
                )}
                <p className="font-brand text-inverse-on-surface mt-1 text-[28px] leading-8 font-semibold tracking-[-0.02em] text-pretty">
                    {subject}
                </p>
            </div>
        ) : (
            <>
                {status && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 items-center gap-2 rounded-md bg-white/10 px-2.5 text-[12px] leading-4 font-medium">
                            <Icon
                                glyph={status.icon}
                                size={18}
                                className={status.tone ? STATUS_TONE[status.tone] : undefined}
                            />
                            {status.label}
                        </span>
                        {statusDetail && (
                            <span className="text-on-nav-surface-variant text-[12px]">
                                {statusDetail}
                            </span>
                        )}
                    </div>
                )}

                {label && (
                    /* `.ty` — **12 sur 16**, interlettrage `.07em`, capitales, 16 au-dessus.
                       Il tenait `text-label-small`, c'est-à-dire 11 : une marche sous la
                       plus petite que R15 déclare, et la même étiquette valait 12 dans la
                       variante à pastille juste au-dessus. */
                    <p className="mt-4 text-[12px] leading-4 tracking-[0.07em] text-[var(--tk-color-on-dark-2)] uppercase">
                        {label}
                    </p>
                )}

                <p className="font-brand text-inverse-on-surface mt-1 text-[28px] leading-8 font-semibold tracking-[-0.02em] text-pretty">
                    {subject}
                </p>

                {subtitle && (
                    <p className="text-on-nav-surface-variant mt-1 text-[13px] leading-[19px]">
                        {subtitle}
                    </p>
                )}
            </>
        )}

        {avatar && status && (
            /* `statusDetail` se pose ici aussi, pas seulement dans la variante à image :
               sur une fiche de personne (05.2) c'est la ligne « Départ le … », et un héro
               à avatar l'avalait en silence. Lot 2. */
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-inverse-on-surface inline-flex h-7 items-center gap-2 rounded-md bg-white/10 px-2.5 text-[12px] leading-4 font-medium">
                    <Icon
                        glyph={status.icon}
                        size={18}
                        className={status.tone ? STATUS_TONE[status.tone] : undefined}
                    />
                    {status.label}
                </span>
                {statusDetail && (
                    <span className="text-on-nav-surface-variant text-[12px]">{statusDetail}</span>
                )}
            </div>
        )}

        {meter && <div className="mt-5">{meter}</div>}

        {metrics && metricsStyle === 'boxes' && (
            /* `.hrow` / `.hk` — 09.1 : des cases de 12 sur 14, valeur en 22 sur 28. */
            <div className={cn('flex gap-3', meter ? 'mt-3' : 'mt-5')}>
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className={cn(
                            /* `.hero .hk{padding:12px 14px}`, mais **`.hrow.three .hk`
                               retombe à `12px 10px`** : à trois de front sur 393 px,
                               14 d'intérieur laissent « réparation » se couper. */
                            'min-w-0 flex-1 rounded-[4px] bg-white/[0.08] py-3',
                            metrics.length >= 3 ? 'px-2.5' : 'px-3.5',
                        )}
                    >
                        <span className="font-brand block text-[22px] leading-7 font-semibold tracking-[-0.015em] tabular-nums">
                            {metric.value}
                        </span>
                        <span className="text-on-nav-surface-variant mt-0.5 block text-[12px] leading-4">
                            {metric.label}
                        </span>
                    </div>
                ))}
            </div>
        )}

        {metrics && metricsStyle === 'inline' && (
            <div className="mt-3.5 flex gap-[18px] border-t border-white/[0.14] pt-3">
                {metrics.map((metric, index) => (
                    <div key={index} className="min-w-0 flex-1">
                        <span className="font-brand text-[19px] leading-[23px] font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
                            {metric.value}
                        </span>
                        <span className="text-label-small text-on-nav-surface-variant mt-0.5 block">
                            {metric.label}
                        </span>
                    </div>
                ))}
            </div>
        )}

        {gauge && <div className="mt-4">{gauge}</div>}

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

        {metrics && metricsStyle === 'qual' && (
            /* `.qual` — grille `1fr 1fr`, gouttière 12, 20 au-dessus. Les tuiles sont
               posées sur le voile blanc à 8 % : **pas de teinte**, le chiffre et son
               libellé suffisent (04.2, passe du 05/09). */
            <div className="mt-5 grid grid-cols-2 gap-3">
                {metrics.map((metric, index) => {
                    const contenu = (
                        <>
                            <span className="font-brand block text-[22px] leading-7 font-semibold tracking-[-0.015em] whitespace-nowrap tabular-nums">
                                {metric.value}
                            </span>
                            <span
                                className={cn(
                                    'text-on-nav-surface-variant block truncate text-[12px] leading-4',
                                    metric.wide ? undefined : 'mt-0.5',
                                )}
                            >
                                {metric.label}
                            </span>
                        </>
                    );
                    const forme = cn(
                        'flex min-w-0 rounded-[4px] bg-white/[0.08] text-left',
                        metric.wide
                            ? 'col-span-2 items-baseline justify-between gap-3 px-3.5 py-3'
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
            <div className="mt-5 flex flex-col gap-3 [&>*]:w-full">{actions}</div>
        )}

        {note && (
            <div className="text-on-nav-surface-variant mt-2.5 border-t border-white/[0.14] pt-2.5 text-[12px] leading-[17px]">
                {note}
            </div>
        )}
    </section>
);

const RelationRow: React.FC<NonNullable<DetailHeroProps['relation']>> = ({
    vignette,
    title,
    detail,
    onOpen,
}) => {
    const content = (
        <>
            <span className="rounded-vignette bg-info/25 text-inverse-on-surface flex h-10 w-10 shrink-0 items-center justify-center">
                {vignette}
            </span>
            <span className="min-w-0 flex-1">
                {/* `.hrow .t` — **17 sur 24**, la deuxième marche de R15, et sans graisse
                    d'appui : c'est un nom, pas un fait mis en avant. Il tenait
                    `text-body-large` (15/21) en 500. */}
                <span className="block truncate text-[17px] leading-6">{title}</span>
                {detail && (
                    <span className="text-on-nav-surface-variant mt-0.5 block text-[12px] leading-4">
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
