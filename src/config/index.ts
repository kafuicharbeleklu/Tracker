/**
 * La date de la publication, posée par la construction (`vite.config.ts`). Vide en
 * développement : une date qui change à chaque lancement ferait bouger les références
 * visuelles de la page qui l'affiche.
 */
declare const __DATE_DE_PUBLICATION__: string | undefined;

// App configuration
export const APP_CONFIG = {
    appName: 'Tracker',
    companyName: 'Neemba', // l'entreprise, distincte de `appName` — mention de pied de la planche 02.1
    description: 'Plateforme centralisee de gestion des actifs informatiques',
    version: '1.2.0',
    /** Quand cette version a été publiée — `null` hors d'une publication. */
    publishedAt:
        typeof __DATE_DE_PUBLICATION__ === 'string' && __DATE_DE_PUBLICATION__
            ? __DATE_DE_PUBLICATION__
            : null,
    /**
     * L'adresse à qui écrire quand le produit ne suffit plus. Elle vit ici parce que
     * c'est **l'organisation qui la remplit** : vide, la ligne « Contacter le support »
     * de Paramètres ne s'affiche pas. Un écran de réglages ne porte pas une adresse
     * qu'on n'a pas (planche 14.1).
     */
    supportEmail: 'support.it@neemba.com',
};

/**
 * Le courriel au support — son objet porte la version (10/10) : c'est la première question
 * qu'on pose à qui signale un écart, et la personne n'a pas à aller la chercher.
 */
export const adresseDuSupport = (): string =>
    `mailto:${APP_CONFIG.supportEmail}?subject=${encodeURIComponent(
        `${APP_CONFIG.appName} ${APP_CONFIG.version}`,
    )}`;
