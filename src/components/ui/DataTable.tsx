import React from 'react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';

import { cn } from '../../lib/utils';
import Icon from './Icon';
import { SelectionBox } from './SelectableRow';

/**
 * **Le tableau dense** — la seconde forme d'une liste au bureau, arbitrée par la
 * recherche du 08/09.
 *
 * *« Une table est une surface interactive avec la même discipline d'états qu'un
 * composant. »* Ce qui est tranché, et donc ce que ce composant tient :
 *
 * - **Rangée de 48**, quand la carte en fait 72. §2.43 : un écran large ne mérite pas
 *   des rangées plus hautes, il mérite **plus de rangées visibles**. Les cibles, elles,
 *   ne rétrécissent pas — case et ⋮ restent à 40 × 40 (I2).
 * - **En-tête figé** au défilement vertical, **première colonne figée** à l'horizontal :
 *   c'est là que les tableaux échouent en silence, quand on ne sait plus de quelle
 *   rangée ni de quelle colonne on lit la valeur.
 * - **Troncature** : une ligne, ellipse, **infobulle au survol et au focus**. Un en-tête
 *   ne se tronque jamais — il porte le sens de toute sa colonne.
 * - **Nombres à droite**, le reste à gauche : c'est ce qui permet de comparer deux
 *   montants d'un coup d'œil.
 * - **Survol et focus se ressemblent** : fond `--inset`, la case révélée à gauche, les
 *   actes secondaires à droite. Ce qui se découvre à la souris se découvre au clavier,
 *   sinon la moitié des gestes n'existe que pour une moitié des gens.
 *
 * ## Ce que le tableau n'est pas
 *
 * Il ne remplace pas la carte : il **coexiste** avec elle, et c'est le sélecteur de
 * 17.8 qui tranche par liste. Sous 840, il n'existe pas — six colonnes sur un téléphone
 * ne se lisent pas.
 */
export interface DataColumn<T> {
    id: string;
    /** L'en-tête. Il ne se tronque jamais. */
    header: string;
    cell: (row: T) => React.ReactNode;
    /** Ce que l'infobulle rend quand la cellule se coupe. Absent : pas d'infobulle. */
    title?: (row: T) => string | undefined;
    /** Un nombre s'aligne à droite. */
    numeric?: boolean;
    /**
     * La colonne qui **ordonne** la liste — `th.sorted` de 17.11 : encre pleine et flèche,
     * quand les autres en-têtes restent en encre secondaire. Elle suit le tri réel de
     * l'écran ; sans elle, rien ne dit par quoi le tableau est rangé.
     */
    sorted?: 'asc' | 'desc';
    /**
     * La largeur de la colonne — `minmax` interdit, c'est un `<col>`. **Dans un tableau qui a
     * une colonne de reste**, c'est un **plafond** : la colonne se tient à son contenu, comme
     * `.tbl td` des planches, et ne se coupe qu'au-delà — leurs exemples sont courts, un parc
     * réel porte des noms de trente signes.
     */
    width?: string;
    /**
     * **La colonne qui prend le reste** — le `<col style="width:100%">` des planches (04.1 :
     * « Dernier mouvement », 05.1 : « État du compte »). Les autres gardent leur mesure
     * et se tassent à gauche ; celle-ci absorbe la largeur qui reste. Sans elle, le reste
     * se répartissait entre toutes les colonnes, et le tableau s'étalait d'un bord à
     * l'autre : « Objets » partait à 1 030 là où 05.1 le pose à 700.
     */
    grow?: boolean;
}

export interface DataTableSelection {
    isActive: boolean;
    isSelected: (id: string) => boolean;
    toggle: (id: string) => void;
}

interface DataTableProps<T> {
    columns: DataColumn<T>[];
    rows: T[];
    rowId: (row: T) => string;
    onOpen?: (row: T) => void;
    /** Ce que la rangée dit d'elle-même à qui ne la voit pas. */
    rowLabel?: (row: T) => string;
    selection?: DataTableSelection;
    /** Les actes secondaires d'une rangée, révélés au survol et au focus. */
    rowActions?: (row: T) => React.ReactNode;
    /**
     * **La vignette de `.lead`** — le pictogramme de l'objet dans son carré de 32, au repos,
     * *« la vignette cède la place à la case »* au survol (04.1 et 05.1 au bureau). Sans
     * elle, la première colonne d'un tableau est vide tant qu'on ne la survole pas.
     */
    rowLead?: (row: T) => React.ReactNode;
    /**
     * **La rangée de séparation** — 18.1 au bureau : *« les jours restent des rangées
     * de séparation (36) dans le tableau, avec leur compte »*. Le journal ne perd pas
     * ses jours en devenant tableau ; ils cessent d'être des cartes et deviennent une
     * rangée basse sur le canevas, qui ne se survole pas et ne s'ouvre pas.
     *
     * Rendue chaque fois que la clé change d'une rangée à la suivante — c'est donc à
     * l'appelant de trier avant, comme pour n'importe quel groupement.
     */
    groupOf?: (row: T) => { id: string; label: string; count?: number };
    /** La hauteur maximale du cadre qui défile ; sans elle, c'est la page qui défile. */
    maxHeight?: string;
    className?: string;
}

/*
  **Ce qui reste à gauche quand on fait défiler.** La colonne de tête est figée — c'est
  la seule dont on ne peut pas perdre la trace sans perdre la rangée. Quand une case de
  sélection la précède, les **deux** le sont : la case à 0, la colonne de tête derrière
  elle, à 48. Figer la case seule laisserait le code partir sous elle.

  Une cellule figée doit **repeindre son fond** : elle passe au-dessus des autres, et un
  fond transparent laisserait le texte défiler dessous. `bg-[inherit]` le prend de la
  rangée, donc le survol la repeint avec le reste.
*/
const FIGEE = 'sticky z-[1] bg-[inherit]';
const CASE_GAUCHE = 'left-0';
/** 52 px — `.lead` des planches : 10 d'intérieur de chaque côté autour du carré de 32 (la
 *  vignette, ou la case qui la remplace). La cellule tenait 42, faute de son intérieur droit. */
const TETE_GAUCHE = 'left-[52px]';

function DataTable<T>({
    columns,
    rows,
    rowId,
    onOpen,
    rowLabel,
    selection,
    rowActions,
    rowLead,
    groupOf,
    maxHeight,
    className,
}: DataTableProps<T>) {
    const selectable = Boolean(selection);
    const avecReste = columns.some((column) => column.grow);
    /* Le `colspan` d'une rangée de séparation : tout le tableau, cases et actes
       compris. */
    const colonnes = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
    let groupePose: string | null = null;

    return (
        <div
            className={cn(
                /* `.tbl` — surface blanche, rayon 8, **sans filet autour** : aucune des
                   sept planches à tableau n'en dessine ; une carte ne se cerne pas. */
                'rounded-card bg-surface relative overflow-auto',
                className,
            )}
            style={maxHeight ? { maxHeight } : undefined}
        >
            <table className="w-full border-collapse text-left text-[0.875rem] leading-5">
                {/* Le `<colgroup>` des planches : `.lead` de **52** (la case à cocher, `0 0 0 10`
                    autour de 18 et ses marges de 7), les colonnes à leur mesure, **une** qui
                    prend le reste, et les actes de rangée sur **48**. Elles tenaient 48 et 56. */}
                <colgroup>
                    {selectable && <col style={{ width: '52px' }} />}
                    {columns.map((column) => (
                        <col
                            key={column.id}
                            style={
                                column.grow
                                    ? { width: '100%' }
                                    : column.width && !avecReste
                                      ? { width: column.width }
                                      : undefined
                            }
                        />
                    ))}
                    {rowActions && <col style={{ width: '48px' }} />}
                </colgroup>

                {/* `.tbl` de 17.11 — **cellules `0 10`, en-tête en `--ink2`**. Elles tenaient
                    12 et l'encre tertiaire (13/09, cinq tableaux du bureau). */}
                <thead>
                    <tr className="bg-surface border-outline-variant border-b">
                        {selectable && (
                            <th
                                scope="col"
                                className={cn(
                                    /* `th.lead` — `0 0 0 10`. */
                                    'bg-surface sticky top-0 left-0 z-20 h-10 pr-0 pl-2.5',
                                    'text-text-muted text-[0.75rem] leading-4 font-medium',
                                )}
                            >
                                <span className="sr-only">Sélection</span>
                            </th>
                        )}
                        {columns.map((column, index) => (
                            <th
                                key={column.id}
                                scope="col"
                                /* L'en-tête ne se tronque jamais : `whitespace-nowrap`,
                                   et c'est la colonne qui s'élargit. */
                                aria-sort={
                                    column.sorted
                                        ? column.sorted === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : undefined
                                }
                                className={cn(
                                    'bg-surface sticky top-0 h-10 px-2.5 text-[0.75rem] leading-4 font-medium whitespace-nowrap',
                                    column.sorted ? 'text-on-surface' : 'text-text-muted',
                                    column.numeric && 'text-right',
                                    index === 0
                                        ? cn('z-20', selectable ? TETE_GAUCHE : CASE_GAUCHE)
                                        : 'z-10',
                                )}
                            >
                                {column.header}
                                {column.sorted && (
                                    <Icon
                                        glyph={column.sorted === 'asc' ? ArrowUp : ArrowDown}
                                        size={18}
                                        className="ml-1 inline-block align-text-bottom"
                                    />
                                )}
                            </th>
                        ))}
                        {rowActions && (
                            /* Même en-tête que les autres colonnes — 12 en 500 : sans ces
                               classes, le `th` vide prenait le gras du navigateur. */
                            <th
                                scope="col"
                                className="bg-surface sticky top-0 z-10 h-10 px-2.5 text-[0.75rem] leading-4 font-medium"
                            >
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => {
                        const id = rowId(row);
                        const selected = selection?.isSelected(id) ?? false;
                        const groupe = groupOf?.(row);
                        const ouvreGroupe = groupe && groupe.id !== groupePose;
                        if (groupe) groupePose = groupe.id;

                        return (
                            <React.Fragment key={id}>
                                {ouvreGroupe && (
                                    /* 36 de haut, sur le canevas, en 12 d'appui — elle
                                       sépare, elle ne se lit pas comme une donnée. */
                                    <tr className="bg-background">
                                        <td
                                            colSpan={colonnes}
                                            className="text-on-surface-variant sticky left-0 h-9 px-2.5 text-[0.75rem] leading-4 font-medium"
                                        >
                                            <span className="first-letter:uppercase">
                                                {groupe.label}
                                            </span>
                                            {typeof groupe.count === 'number' && (
                                                <span className="text-text-tertiary ml-2 font-normal tabular-nums">
                                                    {groupe.count}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                <tr
                                    /* Le fond vit sur la rangée : les cellules figées en
                                   héritent (`bg-[inherit]`), donc elles se repeignent
                                   au survol comme le reste. */
                                    className={cn(
                                        'group border-outline-variant bg-surface h-12 border-b transition-colors last:border-b-0',
                                        'hover:bg-surface-container focus-within:bg-surface-container',
                                        selected && 'bg-surface-container',
                                        onOpen &&
                                            /* `.tbl tr.foc` — **l'anneau de 2 au dedans**, et les
                                               mêmes révélations qu'au survol (04.1, rangée 6). La
                                               rangée n'était ni atteignable ni ouvrable au
                                               clavier : seule la souris ouvrait une fiche depuis
                                               le tableau. */
                                            'focus-visible:outline-on-surface cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2',
                                    )}
                                    tabIndex={onOpen ? 0 : undefined}
                                    onClick={
                                        onOpen
                                            ? () => {
                                                  if (selection?.isActive) selection.toggle(id);
                                                  else onOpen(row);
                                              }
                                            : undefined
                                    }
                                    onKeyDown={
                                        onOpen
                                            ? (event) => {
                                                  if (event.target !== event.currentTarget) return;
                                                  if (event.key !== 'Enter' && event.key !== ' ')
                                                      return;
                                                  event.preventDefault();
                                                  if (selection?.isActive) selection.toggle(id);
                                                  else onOpen(row);
                                              }
                                            : undefined
                                    }
                                >
                                    {selectable && (
                                        <td
                                            className={cn(
                                                FIGEE,
                                                CASE_GAUCHE,
                                                'px-2.5 align-middle',
                                            )}
                                        >
                                            {/*
                                          **La case se révèle au survol et au focus**, et
                                          reste en permanence dès qu'une sélection est
                                          ouverte. Elle occupe les 32 de `.cb` et ses marges
                                          — la colonne rend 42 comme sur les planches —,
                                          mais `touch-target` étend sa **cible à 48** sans
                                          toucher à la mise en page : c'est la cible qui ne
                                          rétrécit pas, pas la colonne qui grandit.
                                        */}
                                            <span className="relative flex h-8 w-8 items-center justify-center">
                                                {/* **La vignette au repos, la case au geste.**
                                                Elles occupent le même carré de 32 : rien ne
                                                bouge quand l'une remplace l'autre. */}
                                                {rowLead && (
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            /* Le gabarit ne pose que la place :
                                                               la forme de la vignette appartient
                                                               à l'écran — carrée pour un objet
                                                               (04.1), ronde pour une personne
                                                               (05.1). */
                                                            'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity',
                                                            selection?.isActive || selected
                                                                ? 'opacity-0'
                                                                : 'group-focus-within:opacity-0 group-hover:opacity-0',
                                                        )}
                                                    >
                                                        {rowLead(row)}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    aria-label={
                                                        selected
                                                            ? 'Retirer de la sélection'
                                                            : 'Sélectionner'
                                                    }
                                                    aria-pressed={selected}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        selection?.toggle(id);
                                                    }}
                                                    className={cn(
                                                        'focus-visible:ring-focus-ring touch-target flex h-8 w-8 items-center justify-center rounded-md outline-none focus-visible:ring-2',
                                                        selection?.isActive || selected
                                                            ? 'opacity-100'
                                                            : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100',
                                                    )}
                                                >
                                                    <SelectionBox selected={selected} />
                                                </button>
                                            </span>
                                        </td>
                                    )}

                                    {columns.map((column, index) => {
                                        const infobulle = column.title?.(row);
                                        const premiere = index === 0;
                                        return (
                                            <td
                                                key={column.id}
                                                className={cn(
                                                    'text-on-surface px-2.5 align-middle',
                                                    /* Quand une colonne prend le reste, les autres
                                                       **se tiennent à leur contenu** (`nowrap`, comme
                                                       `.tbl td`) et seule celle-là se coupe. Sans
                                                       colonne de reste, toutes se coupent. */
                                                    avecReste && !column.grow
                                                        ? 'whitespace-nowrap'
                                                        : 'max-w-0 truncate',
                                                    column.numeric && 'text-right tabular-nums',
                                                    premiere &&
                                                        cn(
                                                            FIGEE,
                                                            selectable ? TETE_GAUCHE : CASE_GAUCHE,
                                                        ),
                                                )}
                                                title={infobulle}
                                            >
                                                {index === 0 && rowLabel ? (
                                                    <span className="sr-only">{rowLabel(row)}</span>
                                                ) : null}
                                                {avecReste && !column.grow ? (
                                                    <span
                                                        className="block truncate"
                                                        style={
                                                            column.width
                                                                ? { maxWidth: column.width }
                                                                : undefined
                                                        }
                                                    >
                                                        {column.cell(row)}
                                                    </span>
                                                ) : (
                                                    column.cell(row)
                                                )}
                                            </td>
                                        );
                                    })}

                                    {rowActions && (
                                        /* Le geste de la cellule d'actes n'ouvre pas la
                                           rangée : sans cet arrêt, le ⋮ ouvrait son menu
                                           **et** la fiche derrière lui (18.1, premier
                                           emploi). */
                                        <td
                                            className="px-2.5 align-middle"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <span className="flex justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                                                {rowActions(row)}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
