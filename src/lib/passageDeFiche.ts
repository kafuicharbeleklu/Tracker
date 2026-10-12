import { flushSync } from 'react-dom';

import { getAppScroller } from './appScroll';
import { mouvementReduit } from './mouvement';

/**
 * **La rangée devient la fiche** (11/10).
 *
 * Ouvrir un actif remplaçait la liste par une page : rien ne disait d'où venait la fiche,
 * ni où l'on retombait en la quittant. La rangée touchée s'agrandit maintenant jusqu'à
 * devenir l'en-tête de sa fiche (300 ms), et l'en-tête s'y replie au retour (250 ms). C'est
 * la transition « zoom » d'iOS 18 et le « container transform » de Material.
 *
 * C'est une transition de vue (`startViewTransition` : Chrome 111, Safari 18, Firefox 144).
 * La rangée de départ et l'en-tête d'arrivée (`data-fiche-entete`) portent le même nom le
 * temps du passage ; le navigateur fait le reste. Sans elle, sous « réduire les
 * animations », ou quand il n'y a pas de rangée d'où partir, la page change comme avant.
 *
 * Le passage se joue **au changement d'adresse**, donc aussi pour le retour du navigateur :
 * le routeur confie sa mise à jour à `passer`, qui la fait dans la transition.
 *
 * - À l'aller, on attend l'en-tête de la fiche 400 ms au plus (une fiche se charge à la
 *   demande) : s'il n'est pas là, la rangée s'efface et la page arrive sans lui.
 * - Au retour, la liste revient où on l'avait laissée, et l'en-tête se replie dans sa
 *   rangée si elle est à l'écran.
 */
type DocumentAvecTransition = Document & {
    startViewTransition?: (maj: () => void | Promise<void>) => { finished: Promise<void> };
};

const NOM = 'fiche';
const ATTENTE_MS = 400;
const ENTETE = '[data-fiche-entete]';

/** Les adresses qui ouvrent une fiche à en-tête. */
const FICHES = [
    /^\/inventory\/(?!add$|import$|edit$|filter$)[^/]+$/,
    /^\/users\/(?!add$|import$|edit$)[^/]+$/,
    /^\/locations\/site\/[^/]+$/,
    /^\/management\/models\/(?!add$|import$)[^/]+$/,
    /^\/management\/categories\/(?!add$)[^/]+$/,
];

const cheminDe = (url: string): string => {
    const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
    return fragment.split('?')[0] || '/';
};
const estUneFiche = (chemin: string) => FICHES.some((forme) => forme.test(chemin));

/** La rangée qu'on vient d'actionner. */
let touchee: { element: HTMLElement; a: number } | null = null;
/** Pour chaque liste quittée : la rangée ouverte et l'endroit où la liste en était. */
const souvenirs = new Map<string, { texte: string; defilement: number }>();
/** `attente` : la transition va jouer les mises à jour ; `joue` : elle les a jouées. */
let phase: 'repos' | 'attente' | 'joue' = 'repos';
/** Ce que les routeurs ont à faire à ce changement d'adresse, et ce qui doit suivre. */
const misesAJour: Array<() => void> = [];
const suites: Array<() => void> = [];

/** Vrai pendant le passage : la page n'ajoute pas sa propre entrée. */
export const passageDeFicheEnCours = (): boolean => phase !== 'repos';

/** À poser une fois, au démarrage. */
export const suivreLesRangees = () => {
    document.addEventListener(
        'click',
        (event) => {
            const rangee =
                event.target instanceof Element
                    ? event.target.closest<HTMLElement>('[data-rangee]')
                    : null;
            touchee = rangee ? { element: rangee, a: performance.now() } : null;
        },
        { capture: true },
    );
};

/**
 * Ce qui doit se faire une fois la nouvelle page posée (remonter en tête de page). Fait à
 * l'instant, la liste remontait avant d'être quittée, et la rangée n'était plus où on
 * l'avait touchée.
 */
export const apresLePassage = (suite: () => void) => {
    suites.push(suite);
    /* Si l'adresse ne change pas, rien ne viendra la jouer. */
    window.setTimeout(() => {
        const rang = suites.indexOf(suite);
        if (rang >= 0) {
            suites.splice(rang, 1);
            suite();
        }
    }, 120);
};

const dansLaFenetre = (element: Element): boolean => {
    const cadre = element.getBoundingClientRect();
    return (
        cadre.height > 0 &&
        cadre.width > 0 &&
        cadre.bottom > 0 &&
        cadre.top < window.innerHeight &&
        cadre.right > 0 &&
        cadre.left < window.innerWidth
    );
};

const defilementCourant = (): number => {
    const cadre = getAppScroller();
    return cadre instanceof Window ? cadre.scrollY : cadre.scrollTop;
};

/** Attend qu'un élément paraisse, sans compter sur les images : elles sont suspendues. */
const attendre = (trouver: () => HTMLElement | null): Promise<HTMLElement | null> =>
    new Promise((tenir) => {
        const dejaLa = trouver();
        if (dejaLa) {
            tenir(dejaLa);
            return;
        }
        let fini = false;
        const finir = (element: HTMLElement | null) => {
            if (fini) return;
            fini = true;
            observateur.disconnect();
            window.clearTimeout(delai);
            tenir(element);
        };
        const observateur = new MutationObserver(() => {
            const element = trouver();
            if (element) finir(element);
        });
        observateur.observe(document.body, { childList: true, subtree: true });
        const delai = window.setTimeout(() => finir(trouver()), ATTENTE_MS);
    });

const enTete = (): HTMLElement | null => {
    const element = document.querySelector<HTMLElement>(ENTETE);
    return element && dansLaFenetre(element) ? element : null;
};

const rangeeDe = (texte: string): HTMLElement | null => {
    for (const rangee of document.querySelectorAll<HTMLElement>('[data-rangee]')) {
        if (rangee.textContent === texte && dansLaFenetre(rangee)) return rangee;
    }
    return null;
};

/** Les mises à jour en attente, rendues tout de suite, puis ce qui devait suivre. */
const appliquer = () => {
    const mises = misesAJour.splice(0);
    const apres = suites.splice(0);
    flushSync(() => mises.forEach((mise) => mise()));
    apres.forEach((suite) => suite());
};

/** Sans passage : la mise à jour ordinaire. */
const laisserFaire = (miseAJour: () => void) => {
    miseAJour();
    suites.splice(0).forEach((suite) => suite());
};

/**
 * Le routeur passe ici à chaque changement d'adresse, avec sa mise à jour. Plusieurs
 * routeurs écoutent le même changement : la première mise à jour ouvre le passage, les
 * suivantes s'y joignent.
 */
export const passer = (event: HashChangeEvent, miseAJour: () => void) => {
    if (phase === 'attente') {
        misesAJour.push(miseAJour);
        return;
    }
    if (phase === 'joue') {
        /* Un autre changement d'adresse pendant que le passage se joue : il n'attend pas. */
        laisserFaire(miseAJour);
        return;
    }

    const avant = cheminDe(event.oldURL);
    const apres = cheminDe(event.newURL);
    const transition = (document as DocumentAvecTransition).startViewTransition;
    const possible = typeof transition === 'function' && !mouvementReduit();

    const rangee =
        possible &&
        estUneFiche(apres) &&
        !estUneFiche(avant) &&
        touchee &&
        performance.now() - touchee.a < 1000 &&
        touchee.element.isConnected &&
        /* Une rangée de tableau ne se détache pas de son tableau. */
        touchee.element.tagName !== 'TR' &&
        dansLaFenetre(touchee.element)
            ? touchee.element
            : null;
    const souvenir = possible && estUneFiche(avant) ? souvenirs.get(apres) : undefined;
    const entete = souvenir ? enTete() : null;
    touchee = null;

    if (!rangee && !(souvenir && entete)) {
        laisserFaire(miseAJour);
        return;
    }

    const racine = document.documentElement;
    const sens = rangee ? 'vers-la-fiche' : 'vers-la-liste';
    const depart = (rangee ?? entete) as HTMLElement;
    if (rangee) {
        souvenirs.set(avant, {
            texte: rangee.textContent ?? '',
            defilement: defilementCourant(),
        });
        if (souvenirs.size > 24) souvenirs.delete(souvenirs.keys().next().value as string);
    }

    phase = 'attente';
    misesAJour.push(miseAJour);
    depart.style.setProperty('view-transition-name', NOM);
    racine.classList.add(sens);
    let arrivee: HTMLElement | null = null;
    const nettoyer = () => {
        phase = 'repos';
        racine.classList.remove(sens);
        depart.style.removeProperty('view-transition-name');
        arrivee?.style.removeProperty('view-transition-name');
        if (misesAJour.length > 0) appliquer();
    };

    try {
        const vue = transition.call(document, async () => {
            depart.style.removeProperty('view-transition-name');
            if (rangee) {
                appliquer();
                phase = 'joue';
                arrivee = await attendre(enTete);
            } else if (souvenir) {
                /* La liste revient où on l'avait laissée : on ne remonte pas en tête. La
                   rangée est là ou n'y est pas ; on ne l'attend pas (la liste ne monte que
                   ses premières rangées tant que l'écran est suspendu). */
                suites.length = 0;
                appliquer();
                phase = 'joue';
                getAppScroller().scrollTo(0, souvenir.defilement);
                arrivee = rangeeDe(souvenir.texte);
            }
            arrivee?.style.setProperty('view-transition-name', NOM);
        });
        void vue.finished.then(nettoyer, nettoyer);
    } catch {
        nettoyer();
    }
};
