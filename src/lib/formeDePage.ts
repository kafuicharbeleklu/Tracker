import type { FormeDeFiche, FormeDePage } from '../components/ui/Skeleton';

/** La forme retenue d'une liste — le choix de la personne, sinon le défaut de la fenêtre. */
const enTableau = (liste: string): boolean => {
    let choix: string | null = null;
    try {
        choix = localStorage.getItem(`tk_list_view_${liste}`);
    } catch {
        choix = null;
    }
    if (choix === 'cartes' || choix === 'tableau') {
        return choix === 'tableau' && window.matchMedia('(min-width: 840px)').matches;
    }
    /* Le défaut de `useListView` : le tableau à 1280 et à la souris. */
    return window.matchMedia('(min-width: 1280px) and (hover: hover) and (pointer: fine)').matches;
};

/**
 * **La forme de l'écran qui arrive, lue dans l'adresse** (10/10) : le squelette dessine les
 * cartes de **cette page-là** — la mosaïque de l'accueil, la file et son panneau, les tuiles
 * de Finances et ses trois cartes de droite, un tableau si la liste en est un —, pas une
 * forme à tout faire. Une adresse inconnue rend une liste.
 */
export const formeDeLAdresse = (): FormeDePage => {
    const chemin = window.location.hash.replace(/^#/, '').split('?')[0];
    const [section, second, troisieme, quatrieme] = chemin.split('/').filter(Boolean);
    const fiche = (forme: FormeDeFiche): FormeDePage => `fiche:${forme}`;
    const saisie = second !== undefined && ['import', 'add', 'edit', 'filter'].includes(second);
    switch (section) {
        case undefined:
        case 'dashboard':
            return 'accueil';
        case 'tasks':
            return second === 'new' ? 'liste' : 'taches';
        case 'finance':
            return !second
                ? 'finances'
                : second === 'expenses'
                  ? 'depenses'
                  : second === 'lines'
                    ? 'lignes'
                    : 'liste';
        case 'audit':
            return second === 'details' ? 'campagne' : second === 'lieux' ? 'liste' : 'inventaire';
        case 'management':
            if (!second) return 'catalogue';
            if (second === 'tension') return 'tension';
            if (troisieme === 'import' || troisieme === 'add' || quatrieme) return 'liste';
            return fiche(second === 'categories' ? 'type' : 'modele');
        case 'reports':
            return 'rapports';
        case 'settings':
            return second ? 'liste' : 'parametres';
        case 'rbac':
            return troisieme ? fiche('commune') : 'acces';
        case 'locations':
            return second === 'site' && troisieme
                ? quatrieme
                    ? 'liste'
                    : fiche('site')
                : second
                  ? 'liste'
                  : 'emplacements';
        case 'history':
            return 'historique';
        case 'inventory':
            if (second && !saisie) return fiche('actif');
            return !second && enTableau('inventory') ? 'tableau' : 'liste';
        case 'users':
            if (second && !saisie) return fiche('personne');
            return !second && enTableau('users') ? 'tableau' : 'liste';
        default:
            return 'liste';
    }
};

/** La fiche que l'adresse désigne — pour le squelette que la fiche pose elle-même. */
export const ficheDeLAdresse = (): FormeDeFiche => {
    const forme = formeDeLAdresse();
    return forme.startsWith('fiche:') ? (forme.slice(6) as FormeDeFiche) : 'commune';
};
