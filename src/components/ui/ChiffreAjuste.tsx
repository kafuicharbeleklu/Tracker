import React from 'react';
import { cn } from '../../lib/utils';

/**
 * **Un chiffre tient dans sa case** (07/10).
 *
 * Un montant ne passe pas à la ligne et ne se coupe pas : « 73 511 000 » amputé d'un chiffre
 * est un autre montant. Posé en 22 dans une demi-tuile, il mordait sur la marge à 320 px ;
 * un exercice à neuf chiffres en sortait à 360. Le chiffre garde donc sa taille tant qu'il
 * tient, et **descend juste assez** pour tenir quand la case est plus étroite que lui.
 *
 * Sans mesure à l'écran : la chasse du texte s'estime (les chiffres d'Archivo sont tabulaires,
 * 0,58 em chacun ; l'espace fine d'un millier, 0,1 em), et la taille est le plus petit de
 * « celle du parent » et « la largeur de la case divisée par cette chasse ». La largeur de
 * la case se lit en `cqi` : **un ancêtre doit être un conteneur** (`@container`), dont la
 * boîte de contenu est la place offerte au chiffre. Sans conteneur, `cqi` vaut la fenêtre :
 * le chiffre garde sa taille, rien ne casse.
 *
 * - `texte` — la valeur finale, celle dont on estime la chasse (un `ChiffreAnime` en enfant
 *   compte jusqu'à elle) ;
 * - `reserve` — ce que la ligne porte à côté du chiffre (« XOF », un libellé) et qu'il faut
 *   lui laisser.
 *
 * L'interligne ne bouge pas : il est déclaré en `rem` par l'appelant, et la case garde sa
 * hauteur quand le chiffre rétrécit.
 */
const chasseDe = (signe: string): number => {
    if (/\d/.test(signe)) return 0.58;
    if (signe === ' ') return 0.1;
    if (/\s/.test(signe)) return 0.2;
    if (/[.,:;'’/|!]/.test(signe)) return 0.3;
    if (/[%—–mMW]/.test(signe)) return 0.98;
    if (/[A-ZÀ-Þ]/.test(signe)) return 0.76;
    return 0.6;
};

export const chasseEnEm = (texte: string): number =>
    Array.from(texte).reduce((somme, signe) => somme + chasseDe(signe), 0);

interface ChiffreAjusteProps {
    texte: string;
    reserve?: string;
    className?: string;
    children?: React.ReactNode;
}

const ChiffreAjuste: React.FC<ChiffreAjusteProps> = ({
    texte,
    reserve = '0px',
    className,
    children,
}) => {
    /* 4 % de marge : l'estimation ne voit ni l'arrondi des pixels ni la chasse exacte de
       l'espace fine, et « 73 511 000 » mordait encore de 2 px sur l'intérieur de sa case. */
    const chasse = Math.max(chasseEnEm(texte) * 1.04, 1);
    return (
        <span
            className={cn('inline-block whitespace-nowrap', className)}
            style={{ fontSize: `min(1em, calc((100cqi - ${reserve}) / ${chasse.toFixed(2)}))` }}
        >
            {children ?? texte}
        </span>
    );
};

export default ChiffreAjuste;
