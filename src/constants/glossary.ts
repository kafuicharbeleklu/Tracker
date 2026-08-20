/**
 * SOURCE OFFICIELLE DE TERMINOLOGIE du Tracker DS (DESIGN_SYSTEM.md §13).
 *
 * Un terme qui figure ici ne se réécrit pas ailleurs : quand un libellé de
 * section, une action ou un message standard change, il change dans ce fichier,
 * pas dans la page. La chaîne est déjà établie pour les destinations :
 * `glossary.ts` -> `destinations.ts` (registre unique X1) -> les 4 surfaces de
 * navigation + les titres de document.
 *
 * Conventions que ce fichier applique — et qui valent pour toute chaîne affichée :
 *  - CASSE DE PHRASE. Les capitales visibles à l'écran (badges, `section-label`)
 *    viennent de la CSS (`uppercase`), jamais de la chaîne.
 *  - UNE ACTION = UN VERBE À L'INFINITIF + son objet dès que l'objet n'est pas
 *    évident. Un intitulé d'action ne peut pas être un groupe nominal
 *    (contre-exemple vivant : « Retour matériel », DashboardPage.tsx:355).
 *  - UN CONCEPT, UN TERME. « Équipement », pas « Matériel » ni « Actif » ;
 *    « Emplacement », pas « Localisation ».
 *  - TYPOGRAPHIE FRANÇAISE : espace insécable avant `: ; ! ?`, guillemets « … ».
 *
 * ÉTAT DE CONSOMMATION (mesuré le 2026-07-25) : 9 entrées sur 32 sont réellement
 * lues, toutes du bloc « Pages », via `destinations.ts`. Les blocs « Actions »,
 * « Messages » et « Placeholders » sont aujourd'hui réécrits littéralement dans
 * les pages ; les valeurs coïncident, le risque est la dérive future. Toute
 * nouvelle page doit lire ce fichier plutôt que recopier la chaîne.
 */
export const GLOSSARY = {
    // Entités
    EQUIPMENT: 'Équipement',
    EQUIPMENT_PLURAL: 'Équipements',
    USER: 'Utilisateur',
    USER_PLURAL: 'Utilisateurs',
    LOCATION: 'Emplacement',
    LOCATION_PLURAL: 'Emplacements',

    // Actions
    ADD: 'Ajouter',
    SAVE: 'Enregistrer',
    CANCEL: 'Annuler',
    CONFIRM: 'Confirmer',
    DELETE: 'Supprimer',
    ASSIGN: 'Attribuer',
    RETURN: 'Retourner',
    EXPORT: 'Exporter',
    IMPORT: 'Importer',

    // Pages
    DASHBOARD: 'Tableau de bord',
    INVENTORY: 'Inventaire',
    USERS: 'Utilisateurs',
    APPROVALS: 'Approbations',
    /* Le référentiel s'appelle **Catalogue** — c'est le nom que la planche 09.1
     donne à l'écran et à son groupe. « Gestion » ne disait pas ce qu'on y gère. */
    MANAGEMENT: 'Catalogue',
    LOCATIONS: 'Emplacements',
    AUDIT: 'Audit',
    REPORTS: 'Rapports',
    SETTINGS: 'Paramètres',

    // Messages
    SUCCESS_CREATE: (entity: string) => `${entity} ajouté avec succès`,
    SUCCESS_UPDATE: (entity: string) => `${entity} modifié avec succès`,
    SUCCESS_DELETE: (entity: string) => `${entity} supprimé avec succès`,
    ERROR_REQUIRED: 'Ce champ est requis',
    ERROR_INVALID_EMAIL: 'Adresse e-mail invalide',
    ERROR_SERVER: 'Une erreur est survenue. Veuillez réessayer.',

    // Placeholders
    SEARCH_PLACEHOLDER: 'Rechercher...',
    EXAMPLE_PREFIX: 'Ex :',
} as const;

/**
 * LIBELLÉS DE CATÉGORIE — source unique (arbitrage du 2026-08-05).
 *
 * `Category.name` est une CLÉ, pas un mot : elle joint `Equipment.type`
 * (`types/index.ts` : « Linked to Category name ») et elle est testée en dur par
 * la logique métier (`DataContext` : `['Laptop','Server','Printer'].includes`).
 * Elle ne se traduit donc pas — c'est le libellé qui porte la langue, et il ne
 * se choisit qu'ici.
 *
 * Avant cette table, le même objet portait trois libellés : « Écrans et
 * moniteurs » (`Category.description`), « Moniteur » (ManagementPage) et
 * « Écran » (NewRequestPage). Toute page qui affiche une catégorie lit
 * `getCategoryLabel`, jamais sa propre liste.
 *
 * ÉTAPE SUIVANTE, hors de ce fichier : le libellé doit descendre dans la donnée,
 * en table par langue portée par `Category` — une catégorie créée par un
 * administrateur n'a aucune entrée ici. Voir `REGLES-TRANSVERSES.md` §5.7.
 */
export const CATEGORY_LABELS: Record<string, string> = {
    Furniture: 'Mobilier',
    Headphones: 'Casque',
    Keyboard: 'Clavier',
    Laptop: 'Ordinateur portable',
    Monitor: 'Moniteur',
    Mouse: 'Souris',
    Phone: 'Téléphone',
    Printer: 'Imprimante',
    Server: 'Serveur',
    Tablet: 'Tablette',
};

/** Le libellé affichable d'une catégorie. Repli sur la clé : une catégorie créée
 *  par un administrateur s'affiche sous son nom plutôt que de disparaître. */
export const getCategoryLabel = (name: string): string => CATEGORY_LABELS[name] || name;
