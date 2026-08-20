import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';

import { cn } from '../../lib/utils';

/**
 * Icône — Phosphor, et Phosphor seul (REGLES-TRANSVERSES §0.1, règle I1).
 *
 * Aucune icône dessinée à la main, aucun sprite maison : le dessin vient de la
 * bibliothèque, et la correspondance depuis Material Symbols est dans
 * `CORRESPONDANCE-ICONES.md`.
 *
 * **I2 — quatre tailles, et pas d'autre** (§0.2) :
 *   32 état vide, une fois par écran · 24 barre du haut et barre du bas
 *   20 rangée, puce, geste de rangée, chevron · 18 en ligne dans un texte de 13.
 * La taille passe par la prop, jamais par un style en ligne : sinon l'échelle
 * redevient négociable écran par écran. Les 28, 40 et 56 px relevés dans le code
 * n'existent pas ici — c'est voulu.
 *
 * **La graisse.** `regular` partout ; `fill` **uniquement** pour dire *actif* ou
 * *acquis* — l'onglet en cours, une coche de fait accompli. Jamais sur une puce
 * d'état, jamais sur une icône de rangée : deux insistances côte à côte
 * n'insistent plus. `thin`, `bold`, `duotone` ne sont pas exposés.
 *
 * **I3 — un état se dit par un pictogramme *et* un mot** (§0.3). L'icône est donc
 * toujours décorative : c'est le contrôle qui la porte qui doit avoir un nom
 * accessible. Il n'y a pas de prop de libellé ici, et c'est la règle qui le dit.
 */

/** Les quatre tailles du registre §0.2. Aucune autre valeur n'est admise. */
export type IconSize = 18 | 20 | 24 | 32;

/** `fill` = actif ou acquis, et rien d'autre (§0.2). */
export type IconEmphasis = 'regular' | 'fill';

export interface IconProps {
    /** Le glyphe Phosphor lui-même : `import { Package } from '@phosphor-icons/react'`. */
    glyph: PhosphorGlyph;
    /** 24 par défaut — la taille des deux barres, celle qui n'a pas de classe dans les planches. */
    size?: IconSize;
    emphasis?: IconEmphasis;
    className?: string;
}

const Icon: React.FC<IconProps> = ({ glyph: Glyph, size = 24, emphasis = 'regular', className }) => (
    <Glyph
        size={size}
        weight={emphasis}
        aria-hidden="true"
        focusable="false"
        // `flex-none` : le conteneur d'une icône ne fixe pas sa largeur (§0.2) — un
        // `flex:0 0 15px` sur un chevron écrase le glyphe.
        className={cn('flex-none', className)}
    />
);

export default Icon;
