// App configuration
export const APP_CONFIG = {
    appName: 'Tracker',
    companyName: 'Neemba', // l'entreprise, distincte de `appName` — mention de pied de la planche 02.1
    description: 'Plateforme centralisee de gestion des actifs informatiques',
    version: '1.2.0',
    /**
     * L'adresse à qui écrire quand le produit ne suffit plus. Elle vit ici parce que
     * c'est **l'organisation qui la remplit** : vide, la ligne « Contacter le support »
     * de Paramètres ne s'affiche pas. Un écran de réglages ne porte pas une adresse
     * qu'on n'a pas (planche 14.1).
     */
    supportEmail: 'support.it@neemba.com',
};
