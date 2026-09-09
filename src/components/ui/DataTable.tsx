import React from 'react';

import { cn } from '../../lib/utils';
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
    /** La largeur de la colonne — `minmax` interdit, c'est un `<col>`. */
    width?: string;
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
/** 48 px — la largeur de la colonne de sélection. */
const TETE_GAUCHE = 'left-12';

function DataTable<T>({
    columns,
    rows,
    rowId,
    onOpen,
    rowLabel,
    selection,
    rowActions,
    maxHeight,
    className,
}: DataTableProps<T>) {
    const selectable = Boolean(selection);

    return (
        <div
            className={cn(
                'rounded-card bg-surface border-outline-variant relative overflow-auto border',
                className,
            )}
            style={maxHeight ? { maxHeight } : undefined}
        >
            <table className="w-full border-collapse text-left text-[14px] leading-5">
                <colgroup>
                    {selectable && <col style={{ width: '48px' }} />}
                    {columns.map((column) => (
                        <col
                            key={column.id}
                            style={column.width ? { width: column.width } : undefined}
                        />
                    ))}
                    {rowActions && <col style={{ width: '56px' }} />}
                </colgroup>

                <thead>
                    <tr className="bg-surface border-outline-variant border-b">
                        {selectable && (
                            <th
                                scope="col"
                                className={cn(
                                    'bg-surface sticky top-0 left-0 z-20 h-10 px-3',
                                    'text-text-tertiary text-[12px] leading-4 font-medium',
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
                                className={cn(
                                    'bg-surface text-text-tertiary sticky top-0 h-10 px-3 text-[12px] leading-4 font-medium whitespace-nowrap',
                                    column.numeric && 'text-right',
                                    index === 0
                                        ? cn('z-20', selectable ? TETE_GAUCHE : CASE_GAUCHE)
                                        : 'z-10',
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                        {rowActions && (
                            <th scope="col" className="bg-surface sticky top-0 z-10 h-10 px-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => {
                        const id = rowId(row);
                        const selected = selection?.isSelected(id) ?? false;

                        return (
                            <tr
                                key={id}
                                /* Le fond vit sur la rangée : les cellules figées en
                                   héritent (`bg-[inherit]`), donc elles se repeignent
                                   au survol comme le reste. */
                                className={cn(
                                    'group border-outline-variant bg-surface h-12 border-b transition-colors last:border-b-0',
                                    'hover:bg-surface-container focus-within:bg-surface-container',
                                    selected && 'bg-surface-container',
                                    onOpen && 'cursor-pointer',
                                )}
                                onClick={
                                    onOpen
                                        ? () => {
                                              if (selection?.isActive) selection.toggle(id);
                                              else onOpen(row);
                                          }
                                        : undefined
                                }
                            >
                                {selectable && (
                                    <td className={cn(FIGEE, CASE_GAUCHE, 'px-3 align-middle')}>
                                        {/*
                                          **La case se révèle au survol et au focus**, et
                                          reste en permanence dès qu'une sélection est
                                          ouverte. Sa cible garde ses 40 px même dans une
                                          rangée de 48 : c'est la cible qui ne rétrécit
                                          pas, pas la rangée qui grandit.
                                        */}
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
                                                'focus-visible:ring-focus-ring -ml-1 flex h-10 w-10 items-center justify-center rounded-md outline-none focus-visible:ring-2',
                                                selection?.isActive || selected
                                                    ? 'opacity-100'
                                                    : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100',
                                            )}
                                        >
                                            <SelectionBox selected={selected} />
                                        </button>
                                    </td>
                                )}

                                {columns.map((column, index) => {
                                    const infobulle = column.title?.(row);
                                    const premiere = index === 0;
                                    return (
                                        <td
                                            key={column.id}
                                            className={cn(
                                                'text-on-surface max-w-0 truncate px-3 align-middle',
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
                                            {column.cell(row)}
                                        </td>
                                    );
                                })}

                                {rowActions && (
                                    <td className="px-3 align-middle">
                                        <span className="flex justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                                            {rowActions(row)}
                                        </span>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
