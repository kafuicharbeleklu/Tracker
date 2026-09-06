import React from 'react';
import { cn } from '../../../lib/utils';

/**
 * **La mesure de contenu des pages hors session** — 560 px, la valeur que la planche
 * 00.5 fixe pour un formulaire : *« une liste s'élargit, un formulaire se mesure »*.
 * Le bandeau de marque et le panneau la partagent, donc leur texte s'aligne sur le
 * même bord d'un bout à l'autre de la page.
 */
export const AUTH_MEASURE = 'mx-auto w-full max-w-[560px]';

/**
 * **La coque des pages hors session** — 02.1 et 02.2.
 *
 * Elle occupe l'écran, comme le reste du produit, et **borne son contenu** à la mesure
 * de 00.5. Ce qui s'élargit avec l'écran est la page ; ce qui reste fixe est la colonne
 * qu'on lit.
 *
 * Deux formes ont précédé celle-ci, et toutes deux posaient un **appareil au milieu
 * d'un bureau** : d'abord la coque de 393, la largeur exacte du téléphone de la
 * planche, dont le texte paraissait rapetissé parce qu'il tenait dans une colonne trois
 * fois plus étroite que l'application derrière ; puis la même carte élargie à 560, qui
 * ne ressemblait plus ni à un téléphone ni à une page. La connexion et l'application
 * sont maintenant deux pages du même produit, à la même échelle.
 *
 * Au téléphone, rien ne change : la page **est** la colonne.
 */
const AuthShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <div
        className={cn(
            'bg-background text-on-surface flex min-h-dvh w-full flex-col',
            className,
        )}
    >
        {children}
    </div>
);

export default AuthShell;
