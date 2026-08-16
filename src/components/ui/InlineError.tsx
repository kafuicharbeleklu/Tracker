import React from 'react';

import { cn } from '../../lib/utils';

/**
 * L'erreur d'acte — planche **17.1**, règle 1 ; registre §2.39.
 *
 * **Une erreur vit là où le geste a été engagé.** Un message qui passe pour dire
 * qu'un acte a échoué est pire que pas de message : il passe, et la personne croit
 * avoir réussi. Le produit en compte 72 aujourd'hui.
 *
 * La forme est donc fixe, et elle tient en quatre points : la feuille **reste
 * ouverte**, la saisie **reste écrite**, cette ligne se pose **au-dessus du pied**,
 * et le geste primaire devient **« Réessayer »**. Rien d'autre ne bouge.
 *
 * Le mot dit ce qui s'est passé **et ce qu'il en reste** : « La demande n'est pas
 * partie. Le serveur n'a pas répondu — ce que vous avez écrit est gardé. »
 */

interface InlineErrorProps {
    /** Ce qui s'est passé, en tête et en gras — « La demande n'est pas partie. » */
    children: React.ReactNode;
    className?: string;
}

const InlineError: React.FC<InlineErrorProps> = ({ children, className }) => (
    <p role="alert" className={cn('text-body-small text-danger', className)}>
        {children}
    </p>
);

export default InlineError;
