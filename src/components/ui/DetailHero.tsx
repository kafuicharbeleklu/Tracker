import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { CaretRight } from '@phosphor-icons/react';

import Icon from './Icon';
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
    facts,
    relation,
    image,
    actions,
    className,
}) => (
    <section
        className={cn(
            'bg-inverse-surface text-inverse-on-surface relative isolate overflow-hidden rounded-xl px-4 pt-5 pb-4',
            className,
        )}
    >
        {image && (
            <>
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 -z-20 h-full w-full object-cover"
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
            <div className="flex items-start gap-3.5">
                <span className="font-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-live-bleu)]/25 text-[20px] font-semibold tracking-tight text-[var(--tk-color-avatar-text)]">
                    {avatar}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    {label && (
                        <p className="text-label-small text-on-nav-surface-variant font-medium tracking-[0.07em] uppercase">
                            {label}
                        </p>
                    )}
                    <p className="font-brand text-inverse-on-surface mt-0.5 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                        {subject}
                    </p>
                </div>
            </div>
        ) : (
            <>
                {status && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body-small inline-flex h-[26px] items-center gap-[7px] rounded-md bg-white/10 px-2.5">
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
                    <p className="text-label-small text-on-nav-surface-variant mt-3 font-medium tracking-[0.07em] uppercase">
                        {label}
                    </p>
                )}

                <p className="font-brand text-inverse-on-surface mt-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
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
            <div className="mt-3.5">
                <span className="text-inverse-on-surface inline-flex h-[26px] items-center gap-[7px] rounded-md bg-white/10 px-2.5 text-[12px]">
                    <Icon
                        glyph={status.icon}
                        size={18}
                        className={status.tone ? STATUS_TONE[status.tone] : undefined}
                    />
                    {status.label}
                </span>
            </div>
        )}

        {metrics && (
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

        {actions && (
            <div className="mt-3.5 flex flex-col gap-2.5 border-t border-white/[0.14] pt-3 [&>*]:w-full">
                {actions}
            </div>
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
                <span className="text-body-large block truncate font-medium">{title}</span>
                {detail && (
                    <span className="text-body-small text-on-nav-surface-variant mt-px block">
                        {detail}
                    </span>
                )}
            </span>
            {onOpen && (
                <Icon glyph={CaretRight} size={20} className="text-on-nav-surface-variant" />
            )}
        </>
    );

    const shell =
        'mt-2 flex min-h-14 w-full items-center gap-3 border-t border-white/[0.14] pt-2 text-left';

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
