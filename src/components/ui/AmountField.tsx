import React, { useState } from 'react';

import { cn } from '../../lib/utils';

/**
 * **Le champ de montant d'une cellule** — `.inp` de 15.2 au bureau : 40 de haut, aligné à
 * droite, chiffres tabulaires. C'est la seule colonne qui se tape dans le tableau des
 * lignes du budget ; le consommé, la jauge et le restant se recalculent derrière lui.
 *
 * Il garde des **chiffres nus** (« 21000000 ») et les **groupe à l'affichage** hors du
 * focus (« 21 000 000 ») : on lit un montant, on tape des chiffres. Refusé (`invalid`), il
 * passe à l'encre d'alerte et à son filet — le refus se dit sur la ligne (15.2).
 */
interface AmountFieldProps {
    value: string;
    onChange: (value: string) => void;
    invalid?: boolean;
    'aria-label': string;
    'aria-describedby'?: string;
    autoFocus?: boolean;
    className?: string;
}

const grouper = (chiffres: string): string =>
    chiffres === '' ? '' : new Intl.NumberFormat('fr-FR').format(Number(chiffres));

const AmountField: React.FC<AmountFieldProps> = ({
    value,
    onChange,
    invalid = false,
    autoFocus,
    className,
    ...aria
}) => {
    const [focus, setFocus] = useState(false);

    return (
        <input
            {...aria}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus={autoFocus}
            aria-invalid={invalid || undefined}
            value={focus ? value : grouper(value)}
            /* Au focus, l'affichage passe de « 85 000 » à « 85000 » : la sélection du
               navigateur se perd dans ce changement, et ce qu'on tapait s'ajoutait au bout
               (« 850005000 »). On resélectionne tout une fois le chiffre nu posé — taper
               remplace, comme dans une cellule de tableur. */
            onFocus={(event) => {
                const champ = event.currentTarget;
                setFocus(true);
                requestAnimationFrame(() => champ.select());
            }}
            onBlur={() => setFocus(false)}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
            className={cn(
                'bg-surface text-on-surface h-10 w-full rounded-sm border px-3 text-right text-[0.875rem] leading-5 tabular-nums outline-none',
                'focus-visible:border-on-surface focus-visible:ring-on-surface/20 focus-visible:ring-2',
                invalid
                    ? 'border-[var(--tk-color-st-orange)] text-[var(--tk-color-st-orange)]'
                    : 'border-outline-variant',
                className,
            )}
        />
    );
};

export default AmountField;
