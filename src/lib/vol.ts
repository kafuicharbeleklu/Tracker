import { animer, courbeDouce, mouvementReduit } from './mouvement';

/**
 * **Ce qu'on traite s'en va vers son compteur** (11/10).
 *
 * Valider une tâche la retirait de la file, et le chiffre de « Tâches » baissait à l'autre
 * bout de l'écran sans que rien ne relie les deux. Une pastille quitte maintenant la rangée
 * et rejoint le compteur, qui ne baisse qu'à son arrivée ; la rangée se referme derrière
 * elle, et les suivantes remontent au lieu de sauter.
 *
 * Trois pièces :
 * - `retenirLeCompteur` : le compteur visé garde son chiffre tant qu'un vol est en l'air
 *   (`useCompteRetenu` le lit) ;
 * - `faireVoler` : la pastille, de la rangée au compteur ;
 * - `fairePartir` : l'ensemble, pour une rangée qui va quitter sa liste.
 *
 * Sous « réduire les animations », rien ne vole : la rangée part et le chiffre change, comme
 * avant.
 */

const enVol = new Map<string, number>();
const abonnes = new Set<() => void>();
const publier = () => abonnes.forEach((abonne) => abonne());

export const ecouterLesVols = (abonne: () => void): (() => void) => {
    abonnes.add(abonne);
    return () => {
        abonnes.delete(abonne);
    };
};

/** Le nombre de pastilles en route vers ce compteur. */
export const volsVers = (compteur: string): number => enVol.get(compteur) ?? 0;

/** Retient le chiffre du compteur ; rend de quoi le rendre, une seule fois. */
export const retenirLeCompteur = (compteur: string): (() => void) => {
    enVol.set(compteur, volsVers(compteur) + 1);
    publier();
    let rendu = false;
    return () => {
        if (rendu) return;
        rendu = true;
        enVol.set(compteur, Math.max(0, volsVers(compteur) - 1));
        publier();
    };
};

const dansLaFenetre = (cadre: DOMRect): boolean =>
    cadre.width > 0 &&
    cadre.height > 0 &&
    cadre.bottom > 0 &&
    cadre.right > 0 &&
    cadre.top < window.innerHeight &&
    cadre.left < window.innerWidth;

/** Le compteur tel qu'il est à l'écran : la barre du bas au téléphone, le rail au-delà. */
const compteurVisible = (compteur: string): HTMLElement | null => {
    const candidats = document.querySelectorAll<HTMLElement>(`[data-compteur="${compteur}"]`);
    for (const candidat of candidats) {
        if (dansLaFenetre(candidat.getBoundingClientRect())) return candidat;
    }
    return null;
};

const TAILLE = 22;

/**
 * La pastille : elle monte d'abord, puis file vers le compteur (420 ms). La promesse se
 * tient à l'arrivée, ou tout de suite s'il n'y a pas de compteur à l'écran.
 */
export const faireVoler = (
    depart: { x: number; y: number },
    compteur: string,
    teinte: string,
): Promise<void> => {
    const cible = compteurVisible(compteur);
    if (!cible || mouvementReduit()) return Promise.resolve();
    const arrivee = cible.getBoundingClientRect();
    const x0 = depart.x - TAILLE / 2;
    const y0 = depart.y - TAILLE / 2;
    const x1 = arrivee.left + arrivee.width / 2 - TAILLE / 2;
    const y1 = arrivee.top + arrivee.height / 2 - TAILLE / 2;

    const pastille = document.createElement('span');
    pastille.setAttribute('aria-hidden', 'true');
    Object.assign(pastille.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: `${TAILLE}px`,
        height: `${TAILLE}px`,
        borderRadius: '50%',
        background: teinte,
        pointerEvents: 'none',
        zIndex: '120',
    });
    document.body.append(pastille);

    const vol = animer(
        pastille,
        [
            { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
            {
                transform: `translate(${x0 + (x1 - x0) * 0.35}px, ${y0 + (y1 - y0) * 0.75}px) scale(0.9)`,
                opacity: 1,
                offset: 0.55,
            },
            { transform: `translate(${x1}px, ${y1}px) scale(0.45)`, opacity: 0.9 },
        ],
        { duration: 420, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'both' },
    );
    if (!vol) {
        pastille.remove();
        return Promise.resolve();
    }
    return vol.finished.then(
        () => pastille.remove(),
        () => pastille.remove(),
    );
};

/** Le compteur accuse l'arrivée : il rebondit une fois son nouveau chiffre posé. */
const accuserLArrivee = (compteur: string) => {
    window.requestAnimationFrame(() => {
        const cible = compteurVisible(compteur);
        if (!cible) return;
        animer(
            cible,
            [
                { transform: 'scale(0.7)' },
                { transform: 'scale(1.2)', offset: 0.6 },
                { transform: 'none' },
            ],
            { duration: 300, easing: courbeDouce() },
        );
    });
};

interface Depart {
    /** Le compteur visé (`data-compteur`). */
    compteur: string;
    /** La couleur de la pastille. */
    teinte: string;
    /** Ce qu'il faut attendre avant de bouger : une feuille qui redescend. */
    retard?: number;
}

/**
 * **Une rangée va quitter sa liste** : à appeler dans le geste, avant que l'état ne change.
 *
 * La rangée réelle est retirée par React à l'instant. Son image reste à sa place le temps de
 * se refermer (260 ms), les rangées suivantes partent d'où elles étaient et remontent du
 * même pas, et la pastille s'envole. Derrière une feuille (`retard`), on attend d'abord que
 * la rangée soit partie : si elle est toujours là après quelques images, rien ne se passe.
 */
export const fairePartir = (idDeLaRangee: string, { compteur, teinte, retard = 0 }: Depart) => {
    const rangee = document.getElementById(idDeLaRangee);
    if (!rangee || mouvementReduit()) return;
    const cadre = rangee.getBoundingClientRect();
    if (!dansLaFenetre(cadre)) return;

    const rendre = retenirLeCompteur(compteur);
    const marque = rangee.querySelector<HTMLElement>('[data-vol-depart]');
    const origine = (marque ?? rangee).getBoundingClientRect();
    const depart = marque
        ? { x: origine.left + origine.width / 2, y: origine.top + origine.height / 2 }
        : { x: cadre.left + 36, y: cadre.top + cadre.height / 2 };

    /* Où étaient les suivantes, pour qu'elles en repartent. */
    const suivantes: Array<{ element: HTMLElement; haut: number }> = [];
    for (let voisine = rangee.nextElementSibling; voisine; voisine = voisine.nextElementSibling) {
        if (voisine instanceof HTMLElement) {
            suivantes.push({ element: voisine, haut: voisine.getBoundingClientRect().top });
        }
    }

    /* L'image de la rangée, posée exactement sur elle. */
    const style = getComputedStyle(rangee);
    const image = rangee.cloneNode(true) as HTMLElement;
    image.removeAttribute('id');
    image.setAttribute('aria-hidden', 'true');
    image.setAttribute('inert', '');
    Object.assign(image.style, {
        position: 'fixed',
        top: `${cadre.top}px`,
        left: `${cadre.left}px`,
        width: `${cadre.width}px`,
        height: `${cadre.height}px`,
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: '15',
        font: style.font,
        color: style.color,
        borderTopWidth: style.borderTopWidth,
        animation: 'none',
    });

    const envoyerLaPastille = () => {
        void faireVoler(depart, compteur, teinte).then(() => {
            rendre();
            accuserLArrivee(compteur);
        });
    };
    /* Sans feuille à attendre, la pastille part au geste même, avant que la page ne se
       redessine : elle vole sur le compositeur pendant que la file se recalcule. Mesuré au
       banc : lancée après le rendu, elle partait 600 ms après la rangée. */
    if (retard === 0) envoyerLaPastille();

    let essais = 0;
    const apres = () => {
        if (document.getElementById(idDeLaRangee)) {
            essais += 1;
            if (essais < 8) window.requestAnimationFrame(apres);
            else if (retard > 0) rendre();
            return;
        }

        const attente = 140 + retard;
        const douce = courbeDouce();
        document.body.append(image);
        const fermeture = animer(
            image,
            [
                { height: `${cadre.height}px`, opacity: 1 },
                { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' },
            ],
            { duration: 260, delay: attente, easing: douce, fill: 'forwards' },
        );
        if (fermeture) {
            void fermeture.finished.then(
                () => image.remove(),
                () => image.remove(),
            );
        } else image.remove();

        for (const { element, haut } of suivantes) {
            if (!element.isConnected) continue;
            const ecart = haut - element.getBoundingClientRect().top;
            if (Math.abs(ecart) < 1) continue;
            animer(element, [{ transform: `translateY(${ecart}px)` }, { transform: 'none' }], {
                duration: 260,
                delay: attente,
                easing: douce,
                fill: 'backwards',
            });
        }

        if (retard > 0) window.setTimeout(envoyerLaPastille, retard);
    };
    window.requestAnimationFrame(apres);
};
