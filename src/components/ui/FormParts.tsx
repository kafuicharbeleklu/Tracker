import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { Check } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **Les pièces de la planche 04.3**, partagées par ses quatre colonnes : la saisie
 * d'une fiche, l'import d'un fichier, la déclaration d'un incident et la sortie du
 * parc emploient le même en-tête de section, la même étiquette, le même cran
 * d'échelle et le même bloc de conséquences.
 *
 * Elles vivaient dans `AddEquipmentPage`, où seule la première colonne pouvait les
 * atteindre — et les deux feuilles les auraient réécrites en divergeant, ce que 17.6
 * a déjà coûté une fois au bouton d'ajout.
 *
 * Elles siègent parmi les primitives, et non dans la fonctionnalité : ce sont des
 * contrôles, et `check-ds-compliance` a raison de compter un `<button>` nu hors de
 * `src/components/ui/**` — c'est là que les autres écrans iront les chercher.
 */

/**
 * `.shot` — **la case d'une pièce jointe : un carré de 56, rayon 4.** Vide, elle est
 * pointillée et porte le mot ; pleine, elle porte sa coche sur la teinte. Les photos
 * d'un incident et les documents d'une fiche emploient la même.
 */
export const ShotBox: React.FC<{
    glyph: PhosphorGlyph;
    /** Le mot sous le glyphe, quand la case est vide. */
    label?: string;
    filled?: boolean;
    tint?: Tint;
    title?: string;
    'aria-label': string;
    onClick?: () => void;
}> = ({ glyph, label, filled = false, tint = 'vert', title, onClick, ...rest }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={rest['aria-label']}
        className={cn(
            'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md text-center text-[12px] leading-[14px]',
            filled
                ? TINT_CLASS[tint]
                : 'border-outline text-on-surface-variant hover:bg-surface-container border-[1.5px] border-dashed',
        )}
    >
        <Icon glyph={glyph} size={filled ? 20 : 18} />
        {!filled && label && <span>{label}</span>}
    </button>
);

/**
 * Les cinq teintes du socle — le fond et son encre vont **par paire**. C'est ce que
 * `styles.css` déclare, et ce que chaque planche réinventait avant lui (79 hex
 * distincts pour 18 déclarés).
 */
export const TINT_CLASS = {
    bleu: 'bg-[var(--tk-color-tint-bleu)] text-[var(--tk-color-on-tint-bleu)]',
    vert: 'bg-[var(--tk-color-tint-vert)] text-[var(--tk-color-on-tint-vert)]',
    ambre: 'bg-[var(--tk-color-tint-ambre)] text-[var(--tk-color-on-tint-ambre)]',
    orange: 'bg-[var(--tk-color-tint-orange)] text-[var(--tk-color-on-tint-orange)]',
    rouge: 'bg-[var(--tk-color-tint-danger)] text-[var(--tk-color-on-tint-danger)]',
} as const;

export type Tint = keyof typeof TINT_CLASS;

/**
 * La carte d'une section — `.fsec` : surface, rayon 8, **16 d'intérieur, gouttière
 * 16**, et un en-tête `.sh` réduit à **un titre et sa précision**.
 *
 * **La tuile d'icône est tombée** (passe du 05/09, déclarée à l'identique par 04.3,
 * 04.4 et 05.3 : `.sh .si{display:none}`). Elle teintait chaque section par « nature »
 * — bleu pour la référence, vert pour la configuration, orange pour l'achat — et cette
 * nature ne voulait rien dire : deux formulaires voisins n'attribuaient pas les mêmes
 * couleurs aux mêmes idées. Un titre de section se lit ; il n'a pas besoin d'être
 * annoncé par un carré coloré. C'est ce que 09 et 10 font depuis la passe sobre.
 *
 * L'intérieur passe de **20 à 16** dans le même mouvement — la mesure que les trois
 * planches déclarent.
 *
 * La précision (`.cs`) se pose **au bout de la ligne du titre**, pas en dessous : la
 * ligne fait 24 de haut, le titre prend la place et la précision ferme à droite.
 */
export const FormSection: React.FC<{
    title: string;
    /** `.cs` — ce que la section doit dire d'elle-même, en quelques mots. */
    caption?: string;
    children: React.ReactNode;
}> = ({ title, caption, children }) => (
    <section className="rounded-card bg-surface flex flex-col gap-4 p-4">
        <div className="flex min-h-6 items-center justify-between gap-3">
            <p className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium">
                {title}
            </p>
            {caption && (
                <span className="text-on-surface-variant shrink-0 text-[14px] leading-5">
                    {caption}
                </span>
            )}
        </div>
        {children}
    </section>
);

/** `.fnote` — ce que l'écran déduit, dit une fois, jamais redemandé. 12 sur 16. */
export const FormNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-text-tertiary text-[12px] leading-4">{children}</p>
);

/** `.warn` — le rappel encadré : 14 sur 20, rayon 4, sur le creux ou sur une teinte. */
export const FormWarn: React.FC<{
    children: React.ReactNode;
    glyph: PhosphorGlyph;
    tint?: Tint;
}> = ({ children, glyph, tint }) => (
    <p
        className={cn(
            'flex gap-3 rounded-md px-4 py-3 text-[14px] leading-5',
            tint ? TINT_CLASS[tint] : 'bg-surface-container text-on-surface-variant',
        )}
    >
        <Icon glyph={glyph} size={18} className="mt-px shrink-0" />
        <span>{children}</span>
    </p>
);

/**
 * `.lab` — l'étiquette d'un champ : **12 sur 16 en 500, sur l'encre secondaire**, et
 * 8 px au-dessus du champ. Le suffixe `.rq` dit « facultatif » ou « obligatoire », en
 * chasse normale sur l'encre tertiaire.
 */
export const FieldLabel: React.FC<{ children: React.ReactNode; note?: string }> = ({
    children,
    note,
}) => (
    <p className="text-on-surface-variant mb-2 text-[12px] leading-4 font-medium">
        {children}
        {note && <span className="text-text-tertiary font-normal"> {note}</span>}
    </p>
);

/**
 * `.opt` — un cran de l'échelle, **nommé par ce qu'il déclenche** et teinté par lui.
 * « Cassé » ne dit pas ce qui va se passer ; « Immobilisé, à réviser » le dit.
 */
export const OptionRow: React.FC<{
    title: string;
    hint: string;
    selected: boolean;
    tint?: Tint;
    onSelect?: () => void;
    disabled?: boolean;
}> = ({ title, hint, selected, tint = 'vert', onSelect, disabled }) => (
    <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
            'flex min-h-14 w-full items-center gap-3 rounded-md px-3.5 py-2 text-left',
            selected
                ? TINT_CLASS[tint]
                : cn(
                      'bg-surface-container text-on-surface',
                      !disabled && 'hover:bg-surface-container-high',
                  ),
            disabled && 'cursor-default',
        )}
    >
        <span className="min-w-0 flex-1">
            <span className="block text-[16px] leading-6">{title}</span>
            <span
                className={cn(
                    'block text-[14px] leading-5',
                    selected ? 'opacity-80' : 'text-on-surface-variant',
                )}
            >
                {hint}
            </span>
        </span>
        {/* `.rd` — cerné au repos, **plein de l'encre du cran** une fois pris. */}
        <span
            className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                selected ? 'bg-current' : 'border-outline border-[1.5px]',
            )}
        >
            {selected && <Icon glyph={Check} size={18} className="text-surface" />}
        </span>
    </button>
);

/**
 * `.fixed` — **l'objet sur lequel on agit, posé et non modifiable.** Une feuille
 * d'acte s'ouvre toujours devant quelque chose ; le redire en clair évite d'avoir à
 * la refermer pour savoir sur quoi elle porte.
 */
export const SubjectRow: React.FC<{
    glyph: PhosphorGlyph;
    title: string;
    detail: string;
}> = ({ glyph, title, detail }) => (
    <div className="flex items-center gap-3 py-2">
        <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <Icon glyph={glyph} size={20} />
        </span>
        <span className="min-w-0 flex-1">
            <span className="text-on-surface block truncate text-[16px] leading-6 tabular-nums">
                {title}
            </span>
            <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                {detail}
            </span>
        </span>
    </div>
);

/**
 * `.conseq` — **ce que l'acte déclenche, avant de le poser.** Une ligne par
 * conséquence, chacune sous la teinte de ce qu'elle touche : ce qui disparaît, ce qui
 * reste, ce que ça coûte.
 */
export const Consequences: React.FC<{
    label: string;
    lines: Array<{ glyph: PhosphorGlyph; tint: Tint; content: React.ReactNode }>;
}> = ({ label, lines }) => (
    <div className="bg-surface-container flex flex-col gap-2.5 rounded-md px-4 py-3">
        <p className="text-on-surface-variant text-[12px] leading-4 font-medium">{label}</p>
        {lines.map((line, index) => (
            <span
                key={index}
                className="text-on-surface flex items-center gap-3 text-[14px] leading-5"
            >
                <span
                    className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                        TINT_CLASS[line.tint],
                    )}
                >
                    <Icon glyph={line.glyph} size={18} />
                </span>
                <span className="min-w-0">{line.content}</span>
            </span>
        ))}
    </div>
);

/**
 * `.pick` — **une rangée qui porte un choix déjà fait, et le rouvre.** Planches 06.4 et
 * 17.4 : vignette de 40, deux lignes, et le verbe de reprise à droite (« Changer »).
 * Rien n'est choisi : la rangée le dit en encre tertiaire, et le verbe devient
 * « Choisir ».
 */
export const PickRow: React.FC<{
    vignette: React.ReactNode;
    /** La teinte de la vignette. Sans elle, le creux gris — c'est le cas du vide. */
    tint?: Tint;
    title: string;
    subtitle?: string;
    /** « Changer » quand le choix est fait, « Choisir » quand il reste à faire. */
    actionLabel: string;
    /** Le titre est un appel au choix, pas une valeur : il se lit en tertiaire. */
    empty?: boolean;
    onClick: () => void;
}> = ({ vignette, tint, title, subtitle, actionLabel, empty = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="bg-surface-container flex min-h-14 w-full items-center gap-3 rounded-[4px] px-3.5 py-2 text-left"
    >
        <span
            className={cn(
                'font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold',
                tint ? TINT_CLASS[tint] : 'bg-surface text-text-tertiary',
            )}
        >
            {vignette}
        </span>
        <span className="min-w-0 flex-1">
            <span
                className={cn(
                    'block truncate text-[16px] leading-6',
                    empty ? 'text-text-tertiary' : 'font-medium',
                )}
            >
                {title}
            </span>
            {subtitle && (
                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                    {subtitle}
                </span>
            )}
        </span>
        <span className="shrink-0 text-[15px] font-medium">{actionLabel}</span>
    </button>
);

/**
 * `.seg` — **l'échelle courte**, sur le creux : deux ou trois crans, le pris en surface.
 * 06.4 n'en veut que deux pour l'urgence, *« le produit n'en distingue pas trois »*.
 * Ce n'est pas le segmenté de Material : piste de 4 d'intérieur, crans de 36, rayon 2.
 */
export const Segmented = <T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: ReadonlyArray<{ value: T; label: string }>;
    value: T;
    onChange: (value: T) => void;
    /** Ce que l'échelle règle, pour qui ne voit pas le libellé au-dessus. */
    label?: string;
}) => (
    <div
        role="group"
        aria-label={label}
        className="bg-surface-container flex gap-1 rounded-[4px] p-1"
    >
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                aria-pressed={value === option.value}
                className={cn(
                    'flex min-h-9 flex-1 items-center justify-center rounded-[2px] text-[14px] leading-5',
                    value === option.value
                        ? 'bg-surface text-on-surface font-medium shadow-[0_1px_2px_rgba(10,25,29,0.08)]'
                        : 'text-on-surface-variant',
                )}
            >
                {option.label}
            </button>
        ))}
    </div>
);

/**
 * `.tile` — **une tuile de choix**, deux par ligne, 88 au minimum. Le glyphe en haut,
 * le nom en bas ; le cran pris passe en encre inversée. Elle sert la feuille de choix du
 * type (06.4) : des chemins, pas un formulaire.
 */
export const ChoiceTile: React.FC<{
    glyph: PhosphorGlyph;
    label: string;
    selected: boolean;
    onClick: () => void;
}> = ({ glyph, label, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
            'flex min-h-[88px] flex-col justify-between gap-3 rounded-[4px] p-3.5 text-left',
            selected
                ? 'bg-inverse-surface text-inverse-on-surface'
                : 'bg-surface-container text-on-surface',
        )}
    >
        <Icon
            glyph={glyph}
            size={24}
            className={selected ? undefined : 'text-on-surface-variant'}
        />
        <span className="text-[16px] leading-6">{label}</span>
    </button>
);
