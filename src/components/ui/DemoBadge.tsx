import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface DemoBadgeProps {
    /** Libellé court affiché (ex. « Démo », « Simulation ») */
    label?: string;
    /** Info-bulle explicative (title natif) */
    title?: string;
    className?: string;
}

/**
 * Étiquette « Démo » systématique (politique X5 de l'audit UX) : signale toute
 * donnée ou mécanisme simulé affiché dans l'interface. À apposer à côté de la
 * donnée concernée — le simulé ne doit jamais être présenté comme réel sans
 * cette étiquette.
 */
export const DemoBadge: React.FC<DemoBadgeProps> = ({ label = 'Démo', title, className }) => {
    const accessibleTitle = title ?? 'Donnée de démonstration — non issue du système réel';
    return (
        <span
            aria-label={accessibleTitle}
            title={accessibleTitle}
            className={cn(
                'border-outline-variant inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5',
                'bg-surface-container text-on-surface-variant text-label-small tracking-wide whitespace-nowrap uppercase',
                className,
            )}
        >
            <MaterialIcon name="science" size={12} />
            {label}
        </span>
    );
};

export default DemoBadge;
