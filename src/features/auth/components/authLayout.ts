import { cn } from '../../../lib/utils';

/**
 * **La mesure de contenu des pages hors session** — 560 px, la valeur que la planche
 * 00.5 fixe pour un formulaire : *« une liste s'élargit, un formulaire se mesure »*.
 * Le bandeau de marque et le panneau la partagent, donc leur texte s'aligne sur le
 * même bord d'un bout à l'autre de la page.
 */
export const AUTH_MEASURE = 'mx-auto w-full max-w-[560px]';

/**
 * **Le panneau d'une page de marque** — la colonne du formulaire au téléphone, **la
 * carte blanche du plein champ** au-delà de 600 (connexion bureau, direction B retenue
 * le 22/09) : 440 de large, rayon 8, 32 d'intérieur, l'ombre du dialogue, posée sur le
 * bleu-noir. Les écrans à barre d'étape (02.2, étapes 1 et 2) gardent `AUTH_MEASURE` :
 * ils ne portent pas le bandeau, donc pas le champ.
 */
export const AUTH_PANEL = cn(
    AUTH_MEASURE,
    /* **Au téléphone, une feuille qui monte du bas** (24/09) : coins hauts arrondis à 20,
       l'ombre portée vers le haut, 20 de recouvrement sur le champ de marque. La colonne
       d'avant s'étirait (`flex-1`) et laissait 440 px vides entre le bouton et les
       comptes de démonstration ; c'est maintenant le champ sombre qui prend la hauteur. */
    'relative -mt-5 flex flex-none flex-col rounded-t-[1.25rem] bg-surface px-5 pt-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(10,25,29,0.18)]',
    'medium:mt-0',
    'medium:relative medium:max-w-[440px] medium:flex-none medium:rounded-card medium:bg-surface medium:p-8 medium:shadow-dialog',
);
