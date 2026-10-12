import { useSyncExternalStore } from 'react';

/**
 * **Le thème** (10/10) — clair, sombre, ou celui de l'appareil.
 *
 * Paramètres portait une rangée « Thème · Clair » qui ne s'ouvrait pas : il n'existait
 * qu'une palette. Les couleurs étant déjà des rôles, une seconde palette suffit
 * (`theme-sombre.css`), et ce module choisit laquelle vaut.
 *
 * Le réglage est **celui de l'appareil** : un téléphone qu'on lit la nuit et un poste de
 * bureau ne se règlent pas pareil, et le thème doit valoir dès l'écran de connexion, avant
 * qu'on sache qui ouvre. Il vit donc dans le navigateur. `index.html` le pose avant le
 * premier rendu, pour qu'un écran sombre ne s'ouvre pas sur un éclair blanc.
 *
 * Le clair reste le défaut : il est l'identité du produit, et personne ne doit voir son
 * écran changer sans l'avoir demandé.
 */
export type ThemeChoisi = 'clair' | 'sombre' | 'appareil';

export const CLE_DU_THEME = 'tracker.theme';
const CHANGEMENT = 'tracker:theme';
const SOMBRE_DE_L_APPAREIL = '(prefers-color-scheme: dark)';

export const LIBELLE_DU_THEME: Record<ThemeChoisi, string> = {
    clair: 'Clair',
    sombre: 'Sombre',
    appareil: 'Celui de l’appareil',
};

export const lireLeTheme = (): ThemeChoisi => {
    try {
        const lu = localStorage.getItem(CLE_DU_THEME);
        return lu === 'sombre' || lu === 'appareil' ? lu : 'clair';
    } catch {
        return 'clair';
    }
};

const estSombre = (theme: ThemeChoisi): boolean =>
    theme === 'sombre' ||
    (theme === 'appareil' &&
        typeof window !== 'undefined' &&
        window.matchMedia(SOMBRE_DE_L_APPAREIL).matches);

/** La palette qui vaut : `data-theme` sur la racine, et la couleur de la barre du navigateur. */
export const appliquerLeTheme = (theme: ThemeChoisi = lireLeTheme()) => {
    if (typeof document === 'undefined') return;
    const sombre = estSombre(theme);
    document.documentElement.dataset.theme = sombre ? 'dark' : 'light';
    /* La barre du navigateur garde le jaune de la marque en clair ; en sombre elle prend le
       fond de la page, pour ne pas poser un bandeau jaune sur un écran éteint. Les deux
       valeurs se lisent dans les rôles : la palette n'est écrite qu'une fois. */
    const couleur = getComputedStyle(document.documentElement)
        .getPropertyValue(sombre ? '--tk-color-app-bg' : '--tk-color-brand')
        .trim();
    if (couleur) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', couleur);
    }
};

const retenirLeTheme = (theme: ThemeChoisi) => {
    try {
        if (theme === 'clair') localStorage.removeItem(CLE_DU_THEME);
        else localStorage.setItem(CLE_DU_THEME, theme);
    } catch {
        /* Navigation privée : le thème tient jusqu'à la fermeture de l'onglet. */
    }
    appliquerLeTheme(theme);
    window.dispatchEvent(new Event(CHANGEMENT));
};

type DocumentAvecTransition = Document & {
    startViewTransition?: (maj: () => void | Promise<void>) => { finished: Promise<void> };
};

/** Le dernier appui : c'est de lui que le thème se répand. */
let dernierAppui: { x: number; y: number; a: number } | null = null;

/** D'où part le changement : l'appui qui vient d'avoir lieu, sinon l'élément qui a le focus. */
const origineDuGeste = (): { x: number; y: number } | null => {
    if (dernierAppui && Date.now() - dernierAppui.a < 1000) {
        return { x: dernierAppui.x, y: dernierAppui.y };
    }
    const actif = document.activeElement;
    if (actif instanceof HTMLElement && actif !== document.body) {
        const cadre = actif.getBoundingClientRect();
        if (cadre.width > 0) {
            return { x: cadre.left + cadre.width / 2, y: cadre.top + cadre.height / 2 };
        }
    }
    return null;
};

/**
 * Choisir un thème. Le nouveau thème **se répand en cercle depuis le geste qui l'a choisi**
 * (11/10) : l'écran ne bascule pas d'un bloc, on voit d'où vient le changement. C'est une
 * transition de vue (`startViewTransition`) : sans elle, ou sous « réduire les animations »,
 * ou si la palette ne change pas, le thème se pose d'un coup.
 *
 * La promesse rendue se tient quand l'écran est posé : l'appelant y referme sa feuille.
 */
export const choisirLeTheme = (theme: ThemeChoisi): Promise<void> => {
    const racine = document.documentElement;
    const change = estSombre(theme) !== (racine.dataset.theme === 'dark');
    const transition = (document as DocumentAvecTransition).startViewTransition;
    const origine = origineDuGeste();
    if (
        !origine ||
        !change ||
        typeof transition !== 'function' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        retenirLeTheme(theme);
        return Promise.resolve();
    }

    const rayon = Math.hypot(
        Math.max(origine.x, window.innerWidth - origine.x),
        Math.max(origine.y, window.innerHeight - origine.y),
    );
    racine.style.setProperty('--bascule-x', `${origine.x}px`);
    racine.style.setProperty('--bascule-y', `${origine.y}px`);
    racine.style.setProperty('--bascule-r', `${rayon}px`);
    racine.classList.add('theme-en-bascule');
    const nettoyer = () => {
        racine.classList.remove('theme-en-bascule');
        for (const mesure of ['--bascule-x', '--bascule-y', '--bascule-r']) {
            racine.style.removeProperty(mesure);
        }
    };
    try {
        const vue = transition.call(document, async () => {
            retenirLeTheme(theme);
            /* Les écrans qui lisent le thème (la coche « Retenu ») se redessinent avant que
               la nouvelle image ne soit prise : React rend dans la microtâche qui précède. */
            await Promise.resolve();
        });
        return vue.finished.then(nettoyer, nettoyer);
    } catch {
        nettoyer();
        retenirLeTheme(theme);
        return Promise.resolve();
    }
};

/** À poser une fois, au démarrage : l'appareil qui passe en sombre entraîne « Celui de l'appareil ». */
export const suivreLeThemeDeLAppareil = () => {
    appliquerLeTheme();
    window.addEventListener(
        'pointerdown',
        (event) => {
            dernierAppui = { x: event.clientX, y: event.clientY, a: Date.now() };
        },
        { capture: true, passive: true },
    );
    const appareil = window.matchMedia(SOMBRE_DE_L_APPAREIL);
    const relire = () => appliquerLeTheme();
    appareil.addEventListener('change', relire);
    /* Un autre onglet a changé le réglage. */
    window.addEventListener('storage', (evenement) => {
        if (evenement.key === CLE_DU_THEME) {
            relire();
            window.dispatchEvent(new Event(CHANGEMENT));
        }
    });
};

const sAbonner = (prevenir: () => void) => {
    window.addEventListener(CHANGEMENT, prevenir);
    return () => window.removeEventListener(CHANGEMENT, prevenir);
};

/** Le thème choisi sur cet appareil, et le geste qui le change. */
export const useTheme = (): [ThemeChoisi, (theme: ThemeChoisi) => Promise<void>] => {
    const theme = useSyncExternalStore(sAbonner, lireLeTheme, () => 'clair' as const);
    return [theme, choisirLeTheme];
};
