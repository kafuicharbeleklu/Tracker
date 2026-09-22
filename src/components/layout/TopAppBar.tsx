import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import MaterialIcon from '../ui/MaterialIcon';
import Tooltip from '../ui/Tooltip';

interface TopAppBarAction {
    icon: string;
    onClick: () => void;
    label: string;
}

interface TopAppBarProps {
    title: string;
    leadingAction?: TopAppBarAction;
    trailingActions?: TopAppBarAction[];
    className?: string;
    titleClassName?: string;
}

/**
 * **La barre du haut — `.tbar` des planches**, et rien d'autre.
 *
 * Elle ne paraît que sur les vues qui ne portent pas leur propre en-tête : une page
 * portée en pose un elle-même, et `adnMobileViews` l'écarte alors. Elle en a longtemps
 * doublé une : la page d'ajout d'un équipement écrivait « Équipement » ici, en 18, puis
 * « Nouvel équipement » douze pixels plus bas, en 17 — deux barres, deux mesures, un
 * écran.
 *
 * Sa mesure est celle que toutes les planches déclarent pour une barre : **56 de haut**,
 * titre **17 sur 24** en Archivo 600, chasse −.01em. Elle tenait 64 et `.section-title`,
 * qui est le titre d'une *feuille* (22 sur 28) et non d'une barre.
 */
const TopAppBar: React.FC<TopAppBarProps> = ({
    title,
    leadingAction,
    trailingActions = [],
    className,
    titleClassName,
}) => {
    return (
        <header
            role="banner"
            className={cn(
                'bg-surface border-outline-variant min-h-14 border-b',
                /* `.tbar` — `0 8 0 4` quand la barre porte son retour de 48 : le geste
                   porte déjà son air, et le titre part à 56 comme sur toutes les
                   planches. Elle tenait 16 de chaque côté, retour compris. */
                'flex items-center justify-between',
                leadingAction ? 'pr-2 pl-1' : 'px-4',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center">
                {leadingAction && (
                    // Tooltip maison (au lieu de `title` natif) : hover desktop ET appui long tactile
                    // (600 ms) — l'icône seule n'est plus muette au tap (AUDIT_MOBILE #6).
                    <Tooltip content={leadingAction.label} placement="bottom">
                        <Button
                            variant="text"
                            size="sm"
                            onClick={leadingAction.onClick}
                            aria-label={leadingAction.label}
                            iconOnly
                            /* `.tb` — **48**, rayon 4, glyphe de 20 : la barre n'est montée
                               qu'au téléphone, où le geste d'une barre fait 48. `size="sm"`
                               le posait à 40, la mesure du chrome de bureau. */
                            className="h-12 min-h-12 w-12 min-w-12 rounded-md"
                            icon={<MaterialIcon name={leadingAction.icon} size={20} />}
                        />
                    </Tooltip>
                )}
                <div
                    className={cn(
                        /* Derrière le retour, `gap 4` puis l'intérieur de `.tid`, 4 : le titre
                           part à 60, comme sur toutes les barres de second niveau. */
                        'font-brand text-ts-head leading-ts-head flex-1 truncate font-semibold tracking-[-0.01em] text-[var(--tk-color-text-primary)]',
                        leadingAction ? 'ml-2' : 'ml-1',
                        titleClassName,
                    )}
                    role="heading"
                    aria-level={2}
                >
                    {title}
                </div>
            </div>

            {trailingActions.length > 0 && (
                // gap-2 : les hit-box étendues à 48px (touch-target) se juxtaposent sans se
                // chevaucher (avant : boutons collés → zones de frappe superposées). AUDIT_MOBILE #7.
                <div className="flex items-center gap-2">
                    {trailingActions.slice(0, 3).map((action) => (
                        <Tooltip
                            key={`${action.icon}-${action.label}`}
                            content={action.label}
                            placement="bottom"
                        >
                            <Button
                                variant="text"
                                size="sm"
                                onClick={action.onClick}
                                aria-label={action.label}
                                iconOnly
                                className="h-12 min-h-12 w-12 min-w-12 rounded-md"
                                icon={<MaterialIcon name={action.icon} size={20} />}
                            />
                        </Tooltip>
                    ))}
                </div>
            )}
        </header>
    );
};

export default TopAppBar;
