import React from 'react';
import { cn } from '../../lib/utils';

/**
 * La mesure de lecture du système — **960 px, une seule valeur** (§2.43, planche 00.3).
 *
 * Le relevé du 06/08 comptait **sept largeurs maximales différentes** dans le produit
 * (`max-w-md`, `2xl`, `lg`, `7xl`…), posées écran par écran. Une liste étirée sur
 * 1600 px n'est pas plus lisible : l'œil perd la ligne entre le nom et la valeur au
 * bout de la rangée. Le contenu s'arrête à 960, le reste est de la marge.
 *
 * `large` (1200) et `extra-large` (1600) **ne changent rien à la mise en page** : ils
 * n'élargissent que le vide autour du contenu, et c'est cette mesure qui s'en charge.
 *
 * **Un écran large ne mérite pas des rangées plus hautes : il mérite plus de rangées
 * visibles.** Ce composant ne touche donc qu'à la largeur — jamais aux hauteurs, aux
 * jetons de densité ni à l'échelle typographique, qui ne changent pas avec la fenêtre.
 *
 * ## L'exception déclarée
 *
 * Un tableau que l'on vient **comparer** — un rapport, un export à l'écran — prend
 * toute la largeur : ce n'est pas de la lecture, c'est du balayage. Il sort de cette
 * mesure par un conteneur qui glisse (`overflow-x`), et lui seul.
 */
const Reading: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => <div className={cn('mx-auto w-full max-w-[960px]', className)}>{children}</div>;

export default Reading;
