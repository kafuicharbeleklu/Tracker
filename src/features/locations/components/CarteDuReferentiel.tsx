import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CornersOut, Minus, Plus } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';
import type { Anneau } from '../lib/contours';
import { regionDesPays } from '../lib/regions';

/**
 * **La carte du référentiel** (10/10) — une carte à plat, cadrée sur les pays que le
 * référentiel porte. Elle remplace le globe en pointillés du 24/09.
 *
 * - **Une seule carte, qu'on déplace** (11/10, à la demande : *« on devrait avoir une seule
 *   map au lieu de deux, on gagnera en largeur, et en implémentant la navigation dessus on
 *   pourra déplacer manuellement »*). Elle tenait en deux cartouches, l'Afrique de l'Ouest et
 *   l'Europe côte à côte : la seconde prenait le quart de la largeur pour un pays. La carte
 *   prend maintenant tout le cadre et s'ouvre sur la région la plus fournie ; les autres sont
 *   à un geste (les raccourcis en haut à gauche) ou à portée de main.
 * - **Se déplacer.** À la souris : glisser, et Ctrl + molette pour l'échelle (la molette
 *   seule reste au défilement de la page). Au doigt : deux doigts, pour déplacer et pincer
 *   (un doigt reste au défilement). Au clavier : les flèches, `+`, `-`, `0`. Et deux boutons.
 * - **La teinte dit le nombre d'actifs**, en trois pas d'un seul bleu, du plus clair au plus
 *   foncé ; l'étiquette écrit le chiffre. Les pas suivent les paquets que forment les pays
 *   (quatre autour de 35, un à 142), pas des tranches égales qui en laisseraient une vide.
 *   Les voisins restent en fond, pour se repérer.
 * - **Toucher un pays le choisit** : la carte s'approche de lui, et la page montre ses
 *   sites ; le toucher de nouveau, ou « Vue d'ensemble », y revient. Chaque pays est un
 *   bouton, au doigt, à la souris et au clavier.
 *
 * Pas de bibliothèque : une projection de Mercator, en SVG. Une seule carte couvre du golfe
 * de Guinée à la Manche : la projection plane d'avant, réglée sur une latitude, y aurait
 * élargi la France d'un quart. Les contours viennent de `lib/contours`, chargés à
 * l'ouverture de la carte.
 */
export interface PaysDeLaCarte {
    id: string;
    label: string;
    /** Le code ISO du pays reconnu : il donne son contour. */
    code: string | null;
    lat: number;
    lng: number;
    /** Ce qui donne sa teinte au pays : le nombre d'actifs. */
    poids: number;
    /** Ce que dit l'étiquette sous le nom : « 8 actifs ». */
    detail: string;
}

/** Un rectangle : gauche, haut, droite, bas. Dans le plan de la carte, ou à l'écran. */
type Cadre = [number, number, number, number];

/** Du plan de la carte à l'écran : une échelle et un décalage. */
interface Vue {
    k: number;
    tx: number;
    ty: number;
}

interface Contours {
    du: (code: string) => Anneau[] | null;
    codes: () => string[];
}

interface Place {
    pays: PaysDeLaCarte;
    trace: string;
    /** Le plus grand territoire du pays : c'est lui qu'on cadre (la France sans la Guyane). */
    cadre: Cadre;
}

interface Region {
    cle: string;
    titre: string;
    places: Place[];
    cadre: Cadre;
}

interface Modele {
    places: Place[];
    /** Les régions, la plus fournie d'abord. */
    regions: Region[];
    /** Tous les pays portés, d'un seul regard. */
    tout: Cadre;
    /** Jusqu'où la carte se laisse emmener. */
    bornes: Cadre;
    /** Les pays voisins, en un seul tracé. */
    voisins: string;
}

/** Au-delà, deux pays ne sont plus de la même région. */
const ECART_DE_REGION = 20;
const TOUT = 'tout';

/* ── Le plan de la carte : x = longitude, y = Mercator, vers le bas ─────────────── */

const ordonnee = (lat: number): number => {
    const bornee = Math.max(-80, Math.min(80, lat));
    return -(180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (bornee * Math.PI) / 360));
};

const cadreDe = (anneau: Anneau): Cadre => {
    let gauche = Infinity;
    let haut = Infinity;
    let droite = -Infinity;
    let bas = -Infinity;
    for (let i = 0; i < anneau.length; i += 2) {
        const y = ordonnee(anneau[i + 1]);
        gauche = Math.min(gauche, anneau[i]);
        droite = Math.max(droite, anneau[i]);
        haut = Math.min(haut, y);
        bas = Math.max(bas, y);
    }
    return [gauche, haut, droite, bas];
};

const aireDe = (anneau: Anneau): number => {
    let somme = 0;
    for (let i = 0; i < anneau.length - 2; i += 2) {
        somme += anneau[i] * anneau[i + 3] - anneau[i + 2] * anneau[i + 1];
    }
    return Math.abs(somme / 2);
};

const tracer = (anneau: Anneau): string => {
    let d = '';
    for (let i = 0; i < anneau.length; i += 2) {
        d += `${i === 0 ? 'M' : 'L'}${anneau[i].toFixed(2)},${ordonnee(anneau[i + 1]).toFixed(2)}`;
    }
    return `${d}Z`;
};

const unir = (a: Cadre, b: Cadre): Cadre => [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
];

const seCroisent = (a: Cadre, b: Cadre): boolean =>
    a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

const elargir = (c: Cadre, part: number, mini: number): Cadre => {
    const mx = Math.max(mini, (c[2] - c[0]) * part);
    const my = Math.max(mini, (c[3] - c[1]) * part);
    return [c[0] - mx, c[1] - my, c[2] + mx, c[3] + my];
};

const centreDe = (c: Cadre): [number, number] => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];

/** La vue qui fait tenir ce cadre dans l'écran, en laissant `haut` pixels libres au-dessus. */
const cadrer = (cadre: Cadre, l: number, h: number, haut: number): Vue => {
    const largeur = cadre[2] - cadre[0];
    const hauteur = cadre[3] - cadre[1];
    const k = Math.min(l / largeur, (h - haut) / hauteur);
    return {
        k,
        tx: (l - largeur * k) / 2 - cadre[0] * k,
        ty: haut + (h - haut - hauteur * k) / 2 - cadre[1] * k,
    };
};

/** Les pays se groupent de proche en proche : deux pays à moins de 20° sont de la même région. */
const grouper = (places: Place[]): Place[][] => {
    const groupes: Place[][] = [];
    const reste = [...places];
    while (reste.length > 0) {
        const groupe = [reste.shift() as Place];
        let grandi = true;
        while (grandi) {
            grandi = false;
            for (let i = reste.length - 1; i >= 0; i -= 1) {
                const [x, y] = centreDe(reste[i].cadre);
                const proche = groupe.some((membre) => {
                    const [mx, my] = centreDe(membre.cadre);
                    return Math.hypot(mx - x, my - y) <= ECART_DE_REGION;
                });
                if (proche) {
                    groupe.push(...reste.splice(i, 1));
                    grandi = true;
                }
            }
        }
        groupes.push(groupe);
    }
    return groupes;
};

/**
 * Le seuil entre deux paquets, dont le plus bas finit à `bas` et le suivant commence à
 * `haut` : le nombre le plus rond qui les sépare (100 entre 38 et 142), sinon le milieu (36
 * entre 34 et 38).
 */
const seuilEntre = (bas: number, haut: number): number => {
    const milieu = (bas + haut) / 2;
    for (let pas = 10 ** Math.floor(Math.log10(Math.max(haut, 10))); pas >= 10; pas /= 10) {
        const ronds: number[] = [];
        for (let n = Math.floor(bas / pas) * pas + pas; n <= haut; n += pas) ronds.push(n);
        if (ronds.length > 0) {
            return ronds.sort((a, b) => Math.abs(a - milieu) - Math.abs(b - milieu))[0];
        }
    }
    return Math.min(haut, Math.ceil(milieu));
};

/**
 * **Les seuils des teintes** — deux au plus, posés aux ruptures naturelles : la coupe qui
 * laisse les paquets les plus serrés (la somme des écarts au carré la plus faible). Des
 * tranches égales rangeraient quatre pays sur cinq dans la plus claire.
 */
const seuilsDe = (poids: number[]): number[] => {
    const tous = [...poids].sort((a, b) => a - b);
    const coupes = tous.flatMap((valeur, i) => (i > 0 && tous[i - 1] < valeur ? [i] : []));
    if (coupes.length === 0) return [];
    const cumul = [0];
    const cumulCarre = [0];
    tous.forEach((valeur, i) => {
        cumul.push(cumul[i] + valeur);
        cumulCarre.push(cumulCarre[i] + valeur * valeur);
    });
    /* La dispersion du paquet `tous[de..a[`. */
    const dispersion = (de: number, a: number) => {
        const somme = cumul[a] - cumul[de];
        return cumulCarre[a] - cumulCarre[de] - (somme * somme) / (a - de);
    };
    let choix: number[] = [];
    let moindre = Infinity;
    const essayer = (bornes: number[]) => {
        const limites = [0, ...bornes, tous.length];
        let total = 0;
        for (let i = 1; i < limites.length; i += 1) total += dispersion(limites[i - 1], limites[i]);
        if (total < moindre) {
            moindre = total;
            choix = bornes;
        }
    };
    if (coupes.length === 1) essayer(coupes);
    else {
        for (let i = 0; i < coupes.length; i += 1) {
            for (let j = i + 1; j < coupes.length; j += 1) essayer([coupes[i], coupes[j]]);
        }
    }
    return choix.map((i) => seuilEntre(tous[i - 1], tous[i]));
};

/** Les trois pas du bleu des états, du plus clair au plus foncé. */
const TEINTES = [
    'color-mix(in srgb, var(--tk-color-st-bleu) 32%, var(--tk-color-surface))',
    'color-mix(in srgb, var(--tk-color-st-bleu) 68%, var(--tk-color-surface))',
    'color-mix(in srgb, var(--tk-color-st-bleu) 82%, var(--tk-color-on-surface))',
] as const;
const TEINTE_DES_VOISINS = 'var(--tk-color-outline-variant)';
/** Le filet entre deux pays, et le halo d'une étiquette : la carte blanche qui porte le tout. */
const FILET = 'var(--tk-color-surface)';

/** Le mouvement d'un recadrage : choisir un pays, changer de région. Pas celui de la main. */
const GLISSE =
    'duration-medium2 ease-emphasized transition-transform motion-reduce:transition-none';

/** La bande que les raccourcis de région occupent en haut : la vue d'ensemble se cale dessous. */
const SOUS_LES_RACCOURCIS = 44;
/** Un pas de zoom des boutons et du clavier. */
const PAS_DE_ZOOM = 1.5;
/** Un pas des flèches du clavier, en pixels. */
const PAS_DE_FLECHE = 56;

const GESTE_SUR_LA_CARTE =
    'bg-surface text-on-surface hover:bg-surface-container-high shadow-elevation-1 rounded-md';

/** La taille d'un élément, suivie. */
const useTaille = (ref: React.RefObject<HTMLDivElement | null>) => {
    const [taille, setTaille] = useState({ l: 0, h: 0 });
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const mesurer = () =>
            setTaille((avant) =>
                avant.l === el.clientWidth && avant.h === el.clientHeight
                    ? avant
                    : { l: el.clientWidth, h: el.clientHeight },
            );
        mesurer();
        const observateur = new ResizeObserver(mesurer);
        observateur.observe(el);
        return () => observateur.disconnect();
    }, [ref]);
    return taille;
};

interface Etiquette {
    place: Place;
    x: number;
    y: number;
    ancre: 'start' | 'middle' | 'end';
}

interface CarteDuReferentielProps {
    pays: PaysDeLaCarte[];
    selection: string | null;
    /** Un pays choisi, ou `null` pour revenir à la vue d'ensemble. */
    onSelect: (id: string | null) => void;
    /** En bandeau (5:2) au lieu de 8:5 : la carte coiffe une liste, à la tablette. */
    bandeau?: boolean;
    className?: string;
}

const CarteDuReferentiel: React.FC<CarteDuReferentielProps> = ({
    pays,
    selection,
    onSelect,
    bandeau = false,
    className,
}) => {
    /* Les contours arrivent après la page : leur module (42 Ko) n'entre pas dans son code. */
    const [contours, setContours] = useState<Contours | null>(null);
    useEffect(() => {
        let vivant = true;
        void import('../lib/contours').then((module) => {
            if (vivant) setContours({ du: module.contoursDuPays, codes: module.codesDesContours });
        });
        return () => {
            vivant = false;
        };
    }, []);

    const modele = useMemo<Modele | null>(() => {
        if (!contours || pays.length === 0) return null;
        /* D'abord le territoire principal de chaque pays : c'est lui qui donne le cadre. */
        const releves = pays.map((p) => {
            const anneaux = (p.code && contours.du(p.code)) || [];
            const principal = [...anneaux].sort((x, y) => aireDe(y) - aireDe(x))[0];
            const y = ordonnee(p.lat);
            const cadre: Cadre = principal
                ? cadreDe(principal)
                : [p.lng - 0.5, y - 0.5, p.lng + 0.5, y + 0.5];
            return { pays: p, anneaux, cadre };
        });
        const ensemble = releves.map((releve) => releve.cadre).reduce(unir);
        const bornes = elargir(ensemble, 0.6, 10);
        /* Un territoire lointain (la Guyane pour la France) ne se trace pas : il poserait une
           tache de la couleur du pays au milieu de l'océan, sans rien autour pour la situer. */
        const places: Place[] = releves.map(({ pays: p, anneaux, cadre }) => ({
            pays: p,
            trace: anneaux
                .filter((anneau) => seCroisent(cadreDe(anneau), bornes))
                .map(tracer)
                .join(''),
            cadre,
        }));
        const regions: Region[] = grouper(places)
            .sort(
                (a, b) =>
                    b.length - a.length ||
                    b.reduce((t, x) => t + x.pays.poids, 0) -
                        a.reduce((t, x) => t + x.pays.poids, 0),
            )
            .map((groupe) => {
                const codes = groupe.map((place) => place.pays.code).filter(Boolean) as string[];
                const region = codes.length === groupe.length ? regionDesPays(codes) : null;
                const tete = [...groupe].sort((a, b) => b.pays.poids - a.pays.poids)[0];
                return {
                    cle: groupe
                        .map((place) => place.pays.id)
                        .sort()
                        .join('|'),
                    titre: region ?? tete.pays.label,
                    places: groupe,
                    cadre: elargir(groupe.map((place) => place.cadre).reduce(unir), 0.14, 1.5),
                };
            });
        const portes = new Set(places.map((place) => place.pays.code).filter(Boolean));
        let voisins = '';
        for (const code of contours.codes()) {
            if (portes.has(code)) continue;
            for (const anneau of contours.du(code) ?? []) {
                if (seCroisent(cadreDe(anneau), bornes)) voisins += tracer(anneau);
            }
        }
        return { places, regions, tout: elargir(ensemble, 0.08, 1.5), bornes, voisins };
    }, [contours, pays]);

    const boite = useRef<HTMLDivElement>(null);
    const { l, h } = useTaille(boite);

    /* ── Ce que la carte cadre ──────────────────────────────────────────────── */
    /** La région qu'on a demandée ; `null` : la plus fournie. */
    const [regionVoulue, setRegionVoulue] = useState<string | null>(null);
    const plusieursRegions = (modele?.regions.length ?? 0) > 1;
    const regionActive =
        regionVoulue === TOUT && plusieursRegions
            ? TOUT
            : (modele?.regions.find((region) => region.cle === regionVoulue)?.cle ??
              modele?.regions[0]?.cle ??
              null);
    const choisie = modele?.places.find((place) => place.pays.id === selection) ?? null;

    /* Choisir un pays d'une autre région y emmène : « Vue d'ensemble » ramène chez lui. */
    useEffect(() => {
        if (!modele || !choisie) return;
        const sienne = modele.regions.find((region) => region.places.includes(choisie));
        if (sienne && regionActive !== TOUT) setRegionVoulue(sienne.cle);
    }, [choisie, modele, regionActive]);

    const haut = plusieursRegions && !choisie ? SOUS_LES_RACCOURCIS : 0;
    const cible = useMemo<Cadre | null>(() => {
        if (!modele) return null;
        if (choisie) return elargir(choisie.cadre, 0.75, 2.5);
        if (regionActive === TOUT) return modele.tout;
        return modele.regions.find((region) => region.cle === regionActive)?.cadre ?? modele.tout;
    }, [choisie, modele, regionActive]);

    const [vue, setVue] = useState<Vue | null>(null);
    /** Un recadrage glisse ; la main, non : la carte la suit sans retard. */
    const [anime, setAnime] = useState(false);
    /** La main a emmené la carte ailleurs : « Vue d'ensemble » propose d'en revenir. */
    const [deplacee, setDeplacee] = useState(false);
    const [recadrage, setRecadrage] = useState(0);
    const dejaCadree = useRef(false);

    useLayoutEffect(() => {
        if (!cible || l === 0 || h === 0) return;
        setAnime(dejaCadree.current);
        dejaCadree.current = true;
        setVue(cadrer(cible, l, h, haut));
        setDeplacee(false);
    }, [cible, l, h, haut, recadrage]);

    /* ── Se déplacer ────────────────────────────────────────────────────────── */
    /** L'échelle et la position restent dans la carte : on ne la perd pas dans l'océan. */
    const borner = useCallback(
        (voulue: Vue): Vue => {
            if (!modele || l === 0 || h === 0) return voulue;
            const ensemble = cadrer(modele.tout, l, h, 0).k;
            const k = Math.max(ensemble * 0.7, Math.min(ensemble * 40, voulue.k));
            /* L'échelle bornée garde le même point sous le centre de l'écran. */
            const ratio = k / voulue.k;
            const tx = l / 2 - (l / 2 - voulue.tx) * ratio;
            const ty = h / 2 - (h / 2 - voulue.ty) * ratio;
            const [gauche, hautDuPlan, droite, bas] = modele.bornes;
            return {
                k,
                tx: Math.max(l / 2 - droite * k, Math.min(l / 2 - gauche * k, tx)),
                ty: Math.max(h / 2 - bas * k, Math.min(h / 2 - hautDuPlan * k, ty)),
            };
        },
        [h, l, modele],
    );

    const emmener = useCallback(
        (suivante: (avant: Vue) => Vue, enGlissant: boolean) => {
            setAnime(enGlissant);
            setDeplacee(true);
            setVue((avant) => (avant ? borner(suivante(avant)) : avant));
        },
        [borner],
    );

    /** Changer d'échelle en gardant sous lui le point de l'écran (`x`, `y`). */
    const zoomer = useCallback(
        (facteur: number, x: number, y: number, enGlissant: boolean) =>
            emmener(
                (avant) => ({
                    k: avant.k * facteur,
                    tx: x - (x - avant.tx) * facteur,
                    ty: y - (y - avant.ty) * facteur,
                }),
                enGlissant,
            ),
        [emmener],
    );

    /** Un glissé vient de finir : le clic qui le suit n'est pas un choix de pays. */
    const aGlisse = useRef(false);
    const [astuce, setAstuce] = useState(false);

    /* La souris : glisser déplace. Les écouteurs du déplacement sont sur la fenêtre, pas en
       capture sur la carte : une capture détournerait le clic qui choisit un pays. */
    const prendre = (event: React.PointerEvent) => {
        if (event.pointerType === 'touch' || event.button !== 0 || !vue) return;
        const depart = { x: event.clientX, y: event.clientY, tx: vue.tx, ty: vue.ty };
        aGlisse.current = false;
        const suivre = (e: PointerEvent) => {
            const dx = e.clientX - depart.x;
            const dy = e.clientY - depart.y;
            if (!aGlisse.current && Math.hypot(dx, dy) < 4) return;
            aGlisse.current = true;
            emmener((avant) => ({ k: avant.k, tx: depart.tx + dx, ty: depart.ty + dy }), false);
        };
        const lacher = () => {
            window.removeEventListener('pointermove', suivre);
            window.removeEventListener('pointerup', lacher);
            window.removeEventListener('pointercancel', lacher);
        };
        window.addEventListener('pointermove', suivre);
        window.addEventListener('pointerup', lacher);
        window.addEventListener('pointercancel', lacher);
    };

    /* La molette et les doigts : des écouteurs posés à la main, parce qu'ils doivent pouvoir
       retenir le geste du navigateur (`preventDefault`), ce que ceux de React ne font pas.
       - Ctrl (ou ⌘) + molette, et le pincement du pavé tactile : l'échelle. La molette seule
         reste à la page, qui défile sous la carte.
       - Deux doigts : déplacer et pincer. Un doigt reste à la page ; s'il glisse de côté sur
         la carte, on dit comment la déplacer. */
    useEffect(() => {
        const el = boite.current;
        if (!el) return;
        const ici = (x: number, y: number): [number, number] => {
            const cadre = el.getBoundingClientRect();
            return [x - cadre.left, y - cadre.top];
        };

        const surMolette = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            const [x, y] = ici(event.clientX, event.clientY);
            const cran = Math.abs(event.deltaY) >= 50;
            zoomer(
                cran ? (event.deltaY < 0 ? 1.25 : 0.8) : Math.exp(-event.deltaY * 0.012),
                x,
                y,
                cran,
            );
        };

        let pince: { ecart: number; x: number; y: number } | null = null;
        let doigt: { x: number; y: number } | null = null;
        let rappel: ReturnType<typeof setTimeout> | null = null;
        const milieu = (a: Touch, b: Touch) => ({
            ecart: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
            ...(([x, y]) => ({ x, y }))(
                ici((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2),
            ),
        });
        const auContact = (event: TouchEvent) => {
            if (event.touches.length === 2) {
                pince = milieu(event.touches[0], event.touches[1]);
                doigt = null;
            } else if (event.touches.length === 1) {
                aGlisse.current = false;
                doigt = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
        };
        const auDeplacement = (event: TouchEvent) => {
            if (event.touches.length === 2 && pince) {
                event.preventDefault();
                const maintenant = milieu(event.touches[0], event.touches[1]);
                const avant = pince;
                pince = maintenant;
                const facteur = avant.ecart > 0 ? maintenant.ecart / avant.ecart : 1;
                aGlisse.current = true;
                emmener(
                    (vueAvant) => ({
                        k: vueAvant.k * facteur,
                        tx: maintenant.x - (avant.x - vueAvant.tx) * facteur,
                        ty: maintenant.y - (avant.y - vueAvant.ty) * facteur,
                    }),
                    false,
                );
                return;
            }
            if (event.touches.length === 1 && doigt) {
                const dx = Math.abs(event.touches[0].clientX - doigt.x);
                const dy = Math.abs(event.touches[0].clientY - doigt.y);
                if (dx > 28 && dx > dy * 2) {
                    doigt = null;
                    setAstuce(true);
                    if (rappel) clearTimeout(rappel);
                    rappel = setTimeout(() => setAstuce(false), 2200);
                }
            }
        };
        const auRetrait = (event: TouchEvent) => {
            if (event.touches.length < 2) pince = null;
            if (event.touches.length === 0) doigt = null;
        };

        el.addEventListener('wheel', surMolette, { passive: false });
        el.addEventListener('touchstart', auContact, { passive: true });
        el.addEventListener('touchmove', auDeplacement, { passive: false });
        el.addEventListener('touchend', auRetrait, { passive: true });
        el.addEventListener('touchcancel', auRetrait, { passive: true });
        return () => {
            if (rappel) clearTimeout(rappel);
            el.removeEventListener('wheel', surMolette);
            el.removeEventListener('touchstart', auContact);
            el.removeEventListener('touchmove', auDeplacement);
            el.removeEventListener('touchend', auRetrait);
            el.removeEventListener('touchcancel', auRetrait);
        };
    }, [emmener, zoomer]);

    const versLEnsemble = () => {
        if (choisie) onSelect(null);
        else setRecadrage((n) => n + 1);
    };

    const auClavier = (event: React.KeyboardEvent) => {
        const fleches: Record<string, [number, number]> = {
            ArrowLeft: [PAS_DE_FLECHE, 0],
            ArrowRight: [-PAS_DE_FLECHE, 0],
            ArrowUp: [0, PAS_DE_FLECHE],
            ArrowDown: [0, -PAS_DE_FLECHE],
        };
        const pas = fleches[event.key];
        if (pas) {
            event.preventDefault();
            emmener(
                (avant) => ({ k: avant.k, tx: avant.tx + pas[0], ty: avant.ty + pas[1] }),
                true,
            );
        } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomer(PAS_DE_ZOOM, l / 2, h / 2, true);
        } else if (event.key === '-') {
            event.preventDefault();
            zoomer(1 / PAS_DE_ZOOM, l / 2, h / 2, true);
        } else if (event.key === '0') {
            event.preventDefault();
            versLEnsemble();
        }
    };

    const choisir = (id: string | null) => {
        if (aGlisse.current) {
            aGlisse.current = false;
            return;
        }
        onSelect(id);
    };

    /* ── Les étiquettes ─────────────────────────────────────────────────────── */
    const retour = Boolean(choisie) || deplacee;
    /** « Vue d'ensemble » en toutes lettres, si les raccourcis lui laissent la place. */
    const retourEcrit = l >= (plusieursRegions ? 480 : 300);
    /**
     * **Les étiquettes ne se chevauchent pas.** Un pays assez grand porte la sienne ; un pays
     * étroit (le Togo, le Bénin) la pose à côté — dessous, dessus, à droite, à gauche, la
     * première place libre. Le pays choisi passe d'abord, puis les plus fournis. Un pays sorti
     * du cadre n'en a pas ; les raccourcis et les boutons gardent leur coin.
     */
    const etiquettes = useMemo<Etiquette[]>(() => {
        if (!modele || !vue || l === 0 || h === 0) return [];
        const { k, tx, ty } = vue;
        const prises: Cadre[] = [[l - 52, h - 96, l, h]];
        if (plusieursRegions) {
            const large = modele.regions.reduce(
                (t, region) => t + region.titre.length * 7.4 + 30,
                68,
            );
            prises.push([0, 0, Math.min(l, large), 44]);
        }
        if (retour) prises.push([l - (retourEcrit ? 172 : 48), 0, l, 44]);
        const libres = (c: Cadre) =>
            c[0] >= 4 &&
            c[1] >= 4 &&
            c[2] <= l - 4 &&
            c[3] <= h - 4 &&
            !prises.some((p) => seCroisent(c, p));
        const posees: Etiquette[] = [];
        /* Les étiquettes posées sous leur pays, centrées : deux voisines s'écartent. */
        const dessous = new Map<Etiquette, Cadre>();
        const ordre = [...modele.places].sort(
            (a, b) =>
                Number(b.pays.id === selection) - Number(a.pays.id === selection) ||
                b.pays.poids - a.pays.poids,
        );
        for (const place of ordre) {
            const x0 = tx + place.cadre[0] * k;
            const y0 = ty + place.cadre[1] * k;
            const x1 = tx + place.cadre[2] * k;
            const y1 = ty + place.cadre[3] * k;
            if (x1 < 0 || x0 > l || y1 < 0 || y0 > h) continue;
            const cx = (x0 + x1) / 2;
            const cy = (y0 + y1) / 2;
            const tl = Math.max(place.pays.label.length * 7.6, place.pays.detail.length * 6.4) + 6;
            const th = 32;
            const cadreDuTexte = (
                x: number,
                y: number,
                ancre: Etiquette['ancre'],
                large = tl,
            ): Cadre => {
                const gauche =
                    ancre === 'middle' ? x - large / 2 : ancre === 'start' ? x : x - large;
                return [gauche, y - 12, gauche + large, y - 12 + th];
            };
            /* Un nom tient dans son pays dès qu'il n'en dépasse que d'un quart : le halo le
               détache du voisin (« Côte d'Ivoire » sur la Côte d'Ivoire). */
            const dedans = x1 - x0 >= tl * 0.75 && y1 - y0 >= th + 10;
            if (!dedans) {
                /* **Deux pays étroits côte à côte** (le Togo, le Bénin) : leurs étiquettes se
                   posent toutes deux dessous, l'une finissant où l'autre commence. */
                const voulu = cadreDuTexte(cx, y1 + 16, 'middle');
                const genantes = [...dessous].filter(([, cadre]) => seCroisent(cadre, voulu));
                if (genantes.length === 1 && !libres(voulu)) {
                    const [voisine, ancien] = genantes[0];
                    const large = ancien[2] - ancien[0];
                    const milieu = (voisine.x + cx) / 2;
                    const aGauche = voisine.x <= cx;
                    const sienne = cadreDuTexte(
                        milieu + (aGauche ? -5 : 5),
                        voisine.y,
                        aGauche ? 'end' : 'start',
                        large,
                    );
                    const mienne = cadreDuTexte(
                        milieu + (aGauche ? 5 : -5),
                        y1 + 16,
                        aGauche ? 'start' : 'end',
                    );
                    const i = prises.indexOf(ancien);
                    prises.splice(i, 1);
                    if (libres(sienne) && libres(mienne)) {
                        prises.push(sienne, mienne);
                        dessous.delete(voisine);
                        voisine.x = milieu + (aGauche ? -5 : 5);
                        voisine.ancre = aGauche ? 'end' : 'start';
                        posees.push({
                            place,
                            x: milieu + (aGauche ? 5 : -5),
                            y: y1 + 16,
                            ancre: aGauche ? 'start' : 'end',
                        });
                        continue;
                    }
                    prises.splice(i, 0, ancien);
                }
            }
            const essais: Array<[number, number, Etiquette['ancre']]> = [
                [cx, y1 + 16, 'middle'],
                [cx, y0 - 22, 'middle'],
                [x1 + 8, cy - 3, 'start'],
                [x0 - 8, cy - 3, 'end'],
            ];
            if (dedans) essais.unshift([cx, cy - 3, 'middle']);
            for (const [x, y, ancre] of essais) {
                const cadre = cadreDuTexte(x, y, ancre);
                if (!libres(cadre)) continue;
                prises.push(cadre);
                const etiquette = { place, x, y, ancre };
                posees.push(etiquette);
                if (!dedans && y === y1 + 16) dessous.set(etiquette, cadre);
                break;
            }
        }
        return posees;
    }, [modele, vue, l, h, plusieursRegions, retour, retourEcrit, selection]);

    /* Un, deux ou trois pas, selon les paquets que forment les pays. */
    const seuils = useMemo(() => seuilsDe(pays.map((p) => p.poids)), [pays]);
    const pas =
        seuils.length === 2
            ? TEINTES
            : seuils.length === 1
              ? [TEINTES[0], TEINTES[2]]
              : [TEINTES[1]];
    const teinteDe = (poids: number): string =>
        pas[seuils.filter((seuil) => poids >= seuil).length];
    const legende: Array<[string, string]> =
        seuils.length === 0
            ? [[pas[0], 'pays du référentiel']]
            : [
                  [pas[0], `moins de ${seuils[0]} actifs`],
                  ...(seuils.length === 2
                      ? ([[pas[1], `${seuils[0]} à ${seuils[1] - 1}`]] as Array<[string, string]>)
                      : []),
                  [pas[pas.length - 1], `${seuils[seuils.length - 1]} et plus`],
              ];

    const nommes = new Set(etiquettes.map((etiquette) => etiquette.place.pays.id));

    return (
        <div
            className={cn('rounded-card bg-surface @container flex flex-col gap-3 p-3', className)}
        >
            <div
                ref={boite}
                data-carte=""
                role="group"
                aria-label="Carte des pays du référentiel"
                onKeyDown={auClavier}
                className={cn(
                    'bg-surface-container relative aspect-[4/3] touch-pan-x touch-pan-y overflow-hidden rounded-md',
                    bandeau ? '@[30rem]:aspect-[5/2]' : '@[30rem]:aspect-[8/5]',
                )}
            >
                {modele && vue && l > 0 && h > 0 && (
                    /* Hors flux : la toile prend la taille du cadre, elle ne la lui donne pas. */
                    <svg
                        width={l}
                        height={h}
                        onPointerDown={prendre}
                        className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
                    >
                        <g
                            className={cn(anime && GLISSE)}
                            style={{
                                transform: `translate(${vue.tx}px, ${vue.ty}px) scale(${vue.k})`,
                                transformOrigin: '0 0',
                            }}
                        >
                            <path
                                d={modele.voisins}
                                style={{ fill: TEINTE_DES_VOISINS }}
                                stroke={FILET}
                                strokeWidth={1}
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            {modele.places.map((place, rang) => {
                                const estChoisi = place.pays.id === selection;
                                return (
                                    <g
                                        key={place.pays.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`${place.pays.label}, ${place.pays.detail}`}
                                        aria-pressed={estChoisi}
                                        /* La bulle ne nomme que le pays dont l'étiquette n'a
                                           pas trouvé de place : les autres sont déjà écrits. */
                                        {...(nommes.has(place.pays.id)
                                            ? { 'data-sans-infobulle': '' }
                                            : {
                                                  'data-infobulle': `${place.pays.label} · ${place.pays.detail}`,
                                              })}
                                        data-pays={place.pays.id}
                                        onClick={() => choisir(estChoisi ? null : place.pays.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                onSelect(estChoisi ? null : place.pays.id);
                                            }
                                        }}
                                        /* Les pays paraissent l'un après l'autre, à l'ouverture. */
                                        style={{ ['--rang' as string]: rang }}
                                        className="group/pays mvt-pays cursor-pointer outline-none"
                                    >
                                        {place.trace ? (
                                            <path
                                                d={place.trace}
                                                style={{ fill: teinteDe(place.pays.poids) }}
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
                                                className={cn(
                                                    'group-hover/pays:stroke-[var(--tk-color-on-surface)] group-focus-visible/pays:stroke-[var(--tk-color-on-surface)] group-focus-visible/pays:[stroke-width:3px]',
                                                    estChoisi
                                                        ? 'stroke-[var(--tk-color-on-surface)] [stroke-width:2px]'
                                                        : 'stroke-[var(--tk-color-surface)] [stroke-width:1.5px]',
                                                )}
                                            />
                                        ) : (
                                            /* Un pays sans contour (un très petit État) : un point. */
                                            <circle
                                                cx={place.pays.lng}
                                                cy={ordonnee(place.pays.lat)}
                                                r={5 / vue.k}
                                                style={{ fill: teinteDe(place.pays.poids) }}
                                                stroke="var(--tk-color-on-surface)"
                                                strokeWidth={estChoisi ? 2 : 1}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                        {etiquettes.map(({ place, x, y, ancre }) => (
                            <g
                                key={place.pays.id}
                                aria-hidden="true"
                                className={cn(anime && GLISSE, 'pointer-events-none')}
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <text
                                    textAnchor={ancre}
                                    className="text-ts-sub font-semibold"
                                    fill="var(--tk-color-on-surface)"
                                    stroke={FILET}
                                    strokeWidth={3}
                                    strokeLinejoin="round"
                                    paintOrder="stroke"
                                >
                                    {place.pays.label}
                                </text>
                                <text
                                    y={15}
                                    textAnchor={ancre}
                                    className="text-[0.75rem] tabular-nums"
                                    fill="var(--tk-color-text-secondary)"
                                    stroke={FILET}
                                    strokeWidth={3}
                                    strokeLinejoin="round"
                                    paintOrder="stroke"
                                >
                                    {place.pays.detail}
                                </text>
                            </g>
                        ))}
                    </svg>
                )}

                {/* Les raccourcis : une région d'un geste. Ils remplacent les cartouches. */}
                {modele && plusieursRegions && (
                    <div className="absolute top-2 left-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
                        {[
                            ...modele.regions.map((region) => [region.cle, region.titre] as const),
                            [TOUT, 'Tout'] as const,
                        ].map(([cle, titre]) => {
                            const active = !choisie && !deplacee && regionActive === cle;
                            return (
                                <Button
                                    key={cle}
                                    variant="text"
                                    size="sm"
                                    aria-pressed={active}
                                    onClick={() => {
                                        if (choisie) onSelect(null);
                                        setRegionVoulue(cle);
                                        setRecadrage((n) => n + 1);
                                    }}
                                    className={cn(
                                        'rounded-md px-2.5',
                                        active
                                            ? 'bg-contrast-fill text-on-contrast-fill hover:bg-contrast-fill'
                                            : GESTE_SUR_LA_CARTE,
                                    )}
                                >
                                    {titre}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Le retour : d'un pays choisi, ou d'où la main a emmené la carte. Sur un
                    cadre étroit il n'en reste que le glyphe, que l'infobulle nomme. */}
                {retour && (
                    /* Le geste porte sa propre position (sa cible tactile) : c'est sa boîte qu'on pose. */
                    <div className="absolute top-2 right-2">
                        {retourEcrit ? (
                            <Button
                                variant="text"
                                size="sm"
                                onClick={versLEnsemble}
                                icon={<Icon glyph={CornersOut} size={18} />}
                                className={cn(GESTE_SUR_LA_CARTE, 'px-3')}
                            >
                                Vue d’ensemble
                            </Button>
                        ) : (
                            <Button
                                variant="text"
                                size="sm"
                                aria-label="Vue d’ensemble"
                                onClick={versLEnsemble}
                                className={cn(GESTE_SUR_LA_CARTE, 'h-9 w-9 p-0')}
                            >
                                <Icon glyph={CornersOut} size={18} />
                            </Button>
                        )}
                    </div>
                )}

                {modele && (
                    <div className="absolute right-2 bottom-2 flex flex-col gap-1.5">
                        <Button
                            variant="text"
                            size="sm"
                            aria-label="Agrandir la carte"
                            onClick={() => zoomer(PAS_DE_ZOOM, l / 2, h / 2, true)}
                            className={cn(GESTE_SUR_LA_CARTE, 'h-9 w-9 p-0')}
                        >
                            <Icon glyph={Plus} size={18} />
                        </Button>
                        <Button
                            variant="text"
                            size="sm"
                            aria-label="Réduire la carte"
                            onClick={() => zoomer(1 / PAS_DE_ZOOM, l / 2, h / 2, true)}
                            className={cn(GESTE_SUR_LA_CARTE, 'h-9 w-9 p-0')}
                        >
                            <Icon glyph={Minus} size={18} />
                        </Button>
                    </div>
                )}

                {astuce && (
                    <p
                        role="status"
                        className="bg-inverse-surface text-inverse-on-surface text-ts-sub leading-ts-sub mvt-contenu pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md px-3 py-1.5 whitespace-nowrap"
                    >
                        Deux doigts pour déplacer la carte
                    </p>
                )}
            </div>
            {/* La légende : ce que dit chaque teinte. La pastille porte la couleur, le texte
                reste à l'encre. */}
            <ul className="text-text-secondary text-ts-sub leading-ts-sub flex flex-wrap gap-x-[18px] gap-y-1.5 px-1 tabular-nums">
                {[...legende, [TEINTE_DES_VOISINS, 'pays voisins']].map(([teinte, mot]) => (
                    <li key={mot} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="h-3 w-3 shrink-0 rounded-[3px]"
                            style={{ backgroundColor: teinte }}
                        />
                        {mot}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CarteDuReferentiel;
