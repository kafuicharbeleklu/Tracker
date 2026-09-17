import React from 'react';

import { cn } from '../../lib/utils';

/**
 * `.meter` — **quatre segments de 4, rayon 2, 6 d'air** ; le vert de statut quand ils se
 * remplissent. Déclaré à l'identique par **02.2** (première connexion) et **07.1**
 * (changer mon mot de passe) : c'est la même jauge, et elle n'a donc qu'un dessin.
 *
 * **Elle décrit, elle n'interdit pas.** Le refus vient de la longueur minimale
 * (`PASSWORD_MIN_LENGTH`), pas du nombre de segments allumés : un mot de passe long et
 * mémorable peut n'en allumer que deux et rester parfaitement acceptable.
 *
 * `aria-hidden` : le compte des segments ne dit rien à qui ne voit pas l'écran — c'est la
 * phrase sous le champ qui porte la règle, et le message d'erreur qui porte le refus.
 */
const PasswordMeter: React.FC<{ filled: number; className?: string }> = ({
    filled,
    className,
}) => (
    <div className={cn('mt-3 flex gap-1.5', className)} aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
            <span
                key={index}
                className={cn(
                    'h-1 flex-1 rounded-[2px]',
                    index < filled ? 'bg-[var(--tk-color-st-vert)]' : 'bg-outline-variant',
                )}
            />
        ))}
    </div>
);

export default PasswordMeter;
