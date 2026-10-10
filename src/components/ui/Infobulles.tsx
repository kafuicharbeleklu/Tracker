import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * **Les infobulles du produit** (10/10) — une seule bulle, posée à la racine, qui répond à
 * tout l'écran.
 *
 * Relevé du commanditaire : *« le projet n'a pas d'infobulle, fais une revue complète pour en
 * mettre »*. `Tooltip` existait, mais il enveloppe son déclencheur dans une boîte : poser
 * cette boîte autour de chaque geste d'icône aurait déplacé ses marges et ses règles de
 * `flex`, écran par écran — il n'était donc employé qu'à deux endroits. Ici rien n'enveloppe
 * rien : un seul écouteur sur le document trouve ce que le pointeur survole, et la bulle se
 * pose à côté, dans un portail.
 *
 * Elle parle dans quatre cas, par ordre de priorité :
 * 1. **`data-infobulle="…"`** — ce qu'on a voulu dire d'un élément (une abréviation, un
 *    segment de jauge, une pastille) ;
 * 2. **un geste sans mot** — un bouton, un lien ou une marque qui n'a qu'un `aria-label` :
 *    la bulle dit ce nom. C'est le cas de tous les gestes d'icône du produit ;
 * 3. **un `title` natif** — la bulle le remplace (le navigateur l'affichait après une
 *    seconde, dans sa propre police) ;
 * 4. **un texte coupé** — une ligne à l'ellipse dit son texte entier.
 *
 * Elle ne dit jamais plus que l'élément : pas d'explication, pas de phrase (cf. « pas de
 * surinformation »). Une demi-seconde de survol à la souris, aussitôt au clavier ; rien au
 * doigt, où un survol n'existe pas. Elle est cachée aux lecteurs d'écran : elle redit un nom
 * qu'ils ont déjà lu.
 */

/** Le temps de survol avant la bulle ; une bulle qui vient de se fermer n'attend pas. */
const DELAI_MS = 500;
const ENCORE_CHAUDE_MS = 400;
const ECART = 8;
/** Au-delà, un élément nommé est une région, pas un geste : on ne le bulle pas. */
const LARGEUR_D_UN_GESTE = 120;
const HAUTEUR_D_UN_GESTE = 72;

interface Bulle {
    cible: HTMLElement;
    texte: string;
}

const NOMMABLES =
    'button, a, summary, [role="button"], [role="img"], [role="switch"], [role="tab"], [role="link"], [role="menuitem"]';

/* Les espaces insécables restent : « 15 251 000 » ne se coupe pas d'une ligne à l'autre. */
const propre = (texte: string | null | undefined): string =>
    (texte ?? '').replace(/[ \t\r\n]+/g, ' ').trim();

/** Le navigateur ne double pas la bulle : son `title` est mis de côté le temps qu'elle dure. */
const taireLeTitre = (el: HTMLElement) => {
    const titre = el.getAttribute('title');
    if (titre !== null) {
        el.dataset.titreNatif = titre;
        el.removeAttribute('title');
    }
};
const rendreLeTitre = (el: HTMLElement) => {
    const titre = el.dataset.titreNatif;
    if (titre !== undefined) {
        el.setAttribute('title', titre);
        delete el.dataset.titreNatif;
    }
};

/** Ce qu'il y a à dire de ce que le pointeur survole, ou rien. */
const lire = (depart: Element | null): Bulle | null => {
    if (!depart || !(depart instanceof Element)) return null;

    const explicite = depart.closest<HTMLElement>('[data-infobulle]');
    if (explicite) {
        const texte = propre(explicite.dataset.infobulle);
        if (texte) return { cible: explicite, texte };
    }

    const nomme = depart.closest<HTMLElement>(`:is(${NOMMABLES})[aria-label]`);
    if (nomme && !nomme.hasAttribute('data-sans-infobulle')) {
        const nom = propre(nomme.getAttribute('aria-label'));
        const visible = propre(nomme.innerText);
        const cadre = nomme.getBoundingClientRect();
        const estUnGeste = cadre.width <= LARGEUR_D_UN_GESTE && cadre.height <= HAUTEUR_D_UN_GESTE;
        if (nom && estUnGeste && !visible.toLowerCase().includes(nom.toLowerCase())) {
            return { cible: nomme, texte: nom };
        }
    }

    const titre = depart.closest<HTMLElement>('[title], [data-titre-natif]');
    if (titre) {
        const texte = propre(titre.getAttribute('title') ?? titre.dataset.titreNatif);
        const redit = propre(titre.innerText) === texte;
        const rogne =
            titre.scrollWidth > titre.clientWidth + 1 ||
            Array.from(titre.querySelectorAll<HTMLElement>('.truncate')).some(
                (el) => el.scrollWidth > el.clientWidth + 1,
            );
        if (texte && (!redit || rogne)) return { cible: titre, texte };
        /* Un `title` qui redit un texte entièrement visible n'a rien à ajouter : on le met de
           côté pour que le navigateur ne pose pas sa propre bulle. */
        if (texte && redit) taireLeTitre(titre);
    }

    const coupe = depart.closest<HTMLElement>('.truncate, [class*="line-clamp-"]');
    if (coupe) {
        const deborde =
            coupe.scrollWidth > coupe.clientWidth + 1 ||
            coupe.scrollHeight > coupe.clientHeight + 1;
        const texte = propre(coupe.innerText);
        if (deborde && texte) return { cible: coupe, texte: texte.slice(0, 280) };
    }
    return null;
};

const Infobulles: React.FC = () => {
    const [bulle, setBulle] = useState<Bulle | null>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const boite = useRef<HTMLDivElement>(null);
    const courante = useRef<Bulle | null>(null);
    const attente = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** La cible dont on attend la demi-seconde : son `title` est déjà mis de côté. */
    const attendue = useRef<HTMLElement | null>(null);
    const fermeeA = useRef(0);

    useEffect(() => {
        const annulerLAttente = () => {
            if (attente.current) clearTimeout(attente.current);
            attente.current = null;
            if (attendue.current && attendue.current !== courante.current?.cible) {
                rendreLeTitre(attendue.current);
            }
            attendue.current = null;
        };
        const fermer = () => {
            annulerLAttente();
            if (courante.current) {
                rendreLeTitre(courante.current.cible);
                courante.current = null;
                fermeeA.current = Date.now();
                setBulle(null);
                setPosition(null);
            }
        };
        const ouvrir = (suivante: Bulle, aussitot: boolean) => {
            annulerLAttente();
            const montrer = () => {
                attente.current = null;
                attendue.current = null;
                if (!suivante.cible.isConnected) return;
                if (courante.current && courante.current.cible !== suivante.cible) {
                    rendreLeTitre(courante.current.cible);
                }
                taireLeTitre(suivante.cible);
                courante.current = suivante;
                setPosition(null);
                setBulle(suivante);
            };
            if (aussitot || Date.now() - fermeeA.current < ENCORE_CHAUDE_MS) montrer();
            else {
                /* Le `title` se tait dès le survol : sans cela le navigateur pose le sien
                   pendant la demi-seconde d'attente. */
                taireLeTitre(suivante.cible);
                attendue.current = suivante.cible;
                attente.current = setTimeout(montrer, DELAI_MS);
            }
        };

        /* Au doigt, pas de survol : un écran qui n'en a pas (`hover: none`) ne bulle qu'au
           clavier, même s'il reçoit par compatibilité des événements de souris. */
        const survolPossible = window.matchMedia('(hover: hover)');
        const auSurvol = (event: PointerEvent) => {
            if (event.pointerType === 'touch' || !survolPossible.matches) return;
            const trouvee = lire(event.target as Element | null);
            if (!trouvee) {
                if (courante.current || attente.current) fermer();
                return;
            }
            if (courante.current?.cible === trouvee.cible) return;
            if (attendue.current === trouvee.cible) return;
            ouvrir(trouvee, false);
        };
        const aLaSortie = (event: PointerEvent) => {
            const vers = event.relatedTarget as Node | null;
            const cible = courante.current?.cible;
            if (cible && vers && cible.contains(vers)) return;
            if (!vers) fermer();
        };
        const auFocus = (event: FocusEvent) => {
            const cible = event.target as HTMLElement | null;
            if (!cible?.matches?.(':focus-visible')) return;
            const trouvee = lire(cible);
            if (trouvee) ouvrir(trouvee, true);
        };
        const auClavier = (event: KeyboardEvent) => {
            if (event.key === 'Escape') fermer();
        };

        document.addEventListener('pointerover', auSurvol, true);
        document.addEventListener('pointerout', aLaSortie, true);
        document.addEventListener('pointerdown', fermer, true);
        document.addEventListener('focusin', auFocus, true);
        document.addEventListener('focusout', fermer, true);
        document.addEventListener('keydown', auClavier, true);
        document.addEventListener('scroll', fermer, true);
        window.addEventListener('resize', fermer);
        window.addEventListener('blur', fermer);
        return () => {
            fermer();
            document.removeEventListener('pointerover', auSurvol, true);
            document.removeEventListener('pointerout', aLaSortie, true);
            document.removeEventListener('pointerdown', fermer, true);
            document.removeEventListener('focusin', auFocus, true);
            document.removeEventListener('focusout', fermer, true);
            document.removeEventListener('keydown', auClavier, true);
            document.removeEventListener('scroll', fermer, true);
            window.removeEventListener('resize', fermer);
            window.removeEventListener('blur', fermer);
        };
    }, []);

    /* La bulle se pose sous sa cible, centrée ; au-dessus s'il n'y a pas la place, et jamais
       hors de la fenêtre. Elle se mesure une fois rendue : sa largeur dépend de son texte. */
    useLayoutEffect(() => {
        if (!bulle || !boite.current) return;
        const cible = bulle.cible.getBoundingClientRect();
        const moi = boite.current.getBoundingClientRect();
        const dessous = cible.bottom + ECART + moi.height <= window.innerHeight - ECART;
        const top = dessous
            ? cible.bottom + ECART
            : Math.max(ECART, cible.top - ECART - moi.height);
        const centre = cible.left + cible.width / 2 - moi.width / 2;
        const left = Math.min(Math.max(ECART, centre), window.innerWidth - moi.width - ECART);
        setPosition({ top: Math.round(top), left: Math.round(left) });
    }, [bulle]);

    if (!bulle) return null;
    return createPortal(
        <div
            ref={boite}
            role="tooltip"
            aria-hidden="true"
            data-infobulle-ouverte=""
            style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                visibility: position ? 'visible' : 'hidden',
            }}
            className="bg-inverse-surface text-inverse-on-surface shadow-elevation-2 pointer-events-none fixed z-[400] max-w-[260px] rounded-md px-2 py-1 text-[0.75rem] leading-4 font-medium break-words ring-1 ring-white/10"
        >
            {bulle.texte}
        </div>,
        document.body,
    );
};

export default Infobulles;
