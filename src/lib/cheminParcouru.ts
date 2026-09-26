/**
 * **Le chemin réellement parcouru** (25/09) — ce que la flèche de retour suit.
 *
 * La flèche remontait l'arborescence : une fiche de personne ouverte depuis un rôle
 * (« Qui le porte ») ramenait à la liste Équipe, pas au rôle. Elle suit désormais le chemin
 * de la session, et ne remonte l'arborescence qu'à défaut de chemin (lien direct,
 * rechargement, première page ouverte).
 *
 * Une pile d'adresses (le fragment, requête comprise), tenue par **un seul écouteur**
 * installé au démarrage et gardée pour la session de l'onglet :
 * - **revenir sur une adresse déjà dans la pile la tronque jusqu'à elle** : après
 *   « Enregistrer » sur une fiche modifiée, la flèche de la fiche ne rouvre pas le
 *   formulaire, et une boucle A → B → A ne s'empile pas ;
 * - **la connexion vide la pile** : on ne revient jamais sur l'écran de connexion, ni sur
 *   le chemin d'une session précédente.
 */
const CLE = 'tk_chemin_parcouru';
const MAX = 50;
/** Les adresses hors session : elles ne sont jamais une destination de retour. */
const HORS_SESSION = /^\/(login|invite)(\/|$|\?)/;

const adresseCourante = (): string => window.location.hash.replace(/^#/, '') || '/';

const lire = (): string[] => {
    try {
        const brut = sessionStorage.getItem(CLE);
        const pile = brut ? (JSON.parse(brut) as unknown) : [];
        return Array.isArray(pile) ? pile.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
};

let pile: string[] = [];

const sauver = () => {
    try {
        sessionStorage.setItem(CLE, JSON.stringify(pile));
    } catch {
        /* Stockage indisponible (navigation privée) : le chemin vit en mémoire seulement. */
    }
};

/**
 * **Choisir un objet dans une liste n'est pas un pas** (P2a, 25/09) : dès 840, la fiche
 * s'ouvre à côté de la liste et l'adresse le retient (`?ouvert=`). Passer d'un objet à
 * l'autre remplace la dernière adresse au lieu d'empiler — sinon la flèche repasserait
 * par chaque rangée touchée.
 */
export const sansObjetOuvert = (adresse: string): string => {
    const [chemin, requete = ''] = adresse.split('?');
    const parametres = new URLSearchParams(requete);
    parametres.delete('ouvert');
    const reste = parametres.toString();
    return reste ? `${chemin}?${reste}` : chemin;
};

const enregistrer = () => {
    const adresse = adresseCourante();
    const derniere = pile[pile.length - 1];
    if (HORS_SESSION.test(adresse)) {
        pile = [];
    } else if (
        derniere !== undefined &&
        derniere !== adresse &&
        sansObjetOuvert(derniere) === sansObjetOuvert(adresse)
    ) {
        pile = [...pile.slice(0, -1), adresse];
    } else {
        const deja = pile.lastIndexOf(adresse);
        pile = deja >= 0 ? pile.slice(0, deja + 1) : [...pile, adresse].slice(-MAX);
    }
    sauver();
};

let installe = false;

/** À appeler une fois, au démarrage de l'application. */
export const installerCheminParcouru = () => {
    if (installe || typeof window === 'undefined') return;
    installe = true;
    pile = lire();
    enregistrer();
    window.addEventListener('hashchange', enregistrer);
};

/** L'adresse d'où l'on vient, si la session en a une — `null` sinon. */
export const cheminPrecedent = (): string | null => {
    const ici = pile.lastIndexOf(adresseCourante());
    return ici > 0 ? pile[ici - 1] : null;
};

/**
 * **Une page qui change d'adresse sans changer de sujet** — un site renommé : l'ancienne
 * adresse ne mène plus nulle part, elle est remplacée dans le chemin au lieu d'y rester.
 */
export const remplacerAdresseCourante = (nouvelle: string) => {
    const ici = pile.lastIndexOf(adresseCourante());
    if (ici >= 0) pile[ici] = nouvelle;
    sauver();
};
