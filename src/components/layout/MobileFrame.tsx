import React from 'react';

import { MOBILE_ONLY } from '../../constants/breakpoints';

/** L'identifiant du conteneur qui défile — voir `getAppScroller`. */
export const APP_SCROLLER_ID = 'tk-scroll';

/**
 * **Le cadre du téléphone** — le produit est tenu en dimension mobile à toutes les
 * largeurs de fenêtre (arbitrage du 06/09, `MOBILE_ONLY`).
 *
 * Sous 600 px il ne fait rien : la fenêtre **est** le téléphone. Au-delà, la colonne de
 * 393 px se centre sur le bureau et tout le produit vit dedans, connexion comprise.
 *
 * ## Pourquoi deux couches, et pas une
 *
 * Le cadre porte une `transform`, ce qui en fait le **bloc conteneur** de ses
 * descendants en `position: fixed` : la barre du bas, le bouton d'ajout, les feuilles
 * montantes et les voiles se calent alors sur la colonne au lieu de s'étaler sur la
 * fenêtre. C'est ce qui évite de reprendre une à une les dix surfaces flottantes du
 * produit.
 *
 * Mais un élément fixe dont le bloc conteneur défile **défile avec lui** : si le cadre
 * était aussi le conteneur de défilement, la barre du bas remonterait avec le contenu.
 * Le défilement vit donc dans une seconde couche, à l'intérieur : le cadre tient les
 * surfaces flottantes, la couche interne fait glisser les pages.
 */
const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!MOBILE_ONLY) return <>{children}</>;

    return (
        <div className="tk-frame">
            <div id={APP_SCROLLER_ID} className="tk-frame-scroll">
                {children}
            </div>
        </div>
    );
};

export default MobileFrame;
