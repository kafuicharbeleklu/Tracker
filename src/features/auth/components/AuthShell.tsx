import React from 'react';
import { cn } from '../../../lib/utils';
import { BrandField } from './BrandBanner';

export { AUTH_MEASURE, AUTH_PANEL } from './authLayout';

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
 *
 * **`field` — le plein champ du bureau** (direction B, retenue le 22/09). Au-delà de
 * 600, la page devient le bleu-noir de la marque, le cartouche LIVE la traverse d'un
 * bord à l'autre, et le contenu se centre : le bloc de marque, la carte blanche du
 * formulaire (`AUTH_PANEL`), puis ce qui suit la carte. La connexion étirée d'avant —
 * un bandeau de 200, une colonne, un grand vide — était la mise en page du téléphone
 * élargie. Les écrans à barre d'étape ne le prennent pas.
 */
const AuthShell: React.FC<{ children: React.ReactNode; className?: string; field?: boolean }> = ({
    children,
    className,
    field = false,
}) => (
    <div
        className={cn(
            'bg-background text-on-surface flex min-h-dvh w-full flex-col',
            /* Au téléphone aussi, le champ est le bleu-noir de la marque (24/09) : la
               feuille du formulaire y monte du bas (`AUTH_PANEL`). */
            field && 'bg-[var(--tk-color-inverse-surface)]',
            field &&
                'medium:relative medium:items-center medium:justify-center medium:overflow-hidden medium:px-6 medium:py-16',
            className,
        )}
    >
        {field && <BrandField />}
        {children}
    </div>
);

export default AuthShell;
