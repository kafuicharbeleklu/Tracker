import React, { useEffect, useRef } from 'react';

import Button from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { Anneau } from '../lib/contours';
import { pointsDeTerre } from '../lib/terres';

/**
 * **Le globe en pointillés des emplacements** (24/09, essai demandé par le commanditaire).
 *
 * Les terres sont une grille de points (2°), dans le bleu du système LIVE ; chaque pays du
 * référentiel est un **nœud** dont la taille et l'éclat suivent son nombre d'actifs. Le
 * globe tourne doucement tant que rien n'est choisi ; choisir un pays — par son nœud, son
 * étiquette ou la liste d'à côté — le fait pivoter vers le centre et s'arrêter. On le fait
 * aussi tourner à la main.
 *
 * **Il choisit, il ne remplace pas la liste** : le canvas est décoratif (`aria-hidden`),
 * les étiquettes des nœuds sont de vrais boutons, et la page garde la liste des pays.
 *
 * Pas de bibliothèque : une projection orthographique en canvas 2D, ~5 400 points. Les
 * couleurs sont lues sur les jetons (`--tk-color-live-*`) au montage — un canvas ne sait
 * pas lire `var()`.
 *
 * **Les pays du référentiel sont remplis** (10/10, à la demande : « afficher la cartographie
 * avec un fond de couleur rempli des pays enregistrés »). Un nœud disait où est un pays, pas
 * ce qu'il couvre : le Togo et le Bénin, à 1,4° l'un de l'autre, étaient deux points sur une
 * trame. Chaque pays porté prend son contour (`lib/contours`, chargé à l'ouverture de la
 * carte), rempli à l'orange de son nœud sous la trame des terres ; le pays choisi passe au
 * jaune, cerné d'encre. Un contour qui passe derrière l'horizon est coupé au bord du globe.
 */
export interface NoeudDuGlobe {
    id: string;
    label: string;
    lat: number;
    lng: number;
    /** Ce qui donne sa taille au nœud : le nombre d'actifs. */
    poids: number;
    /** Ce que dit l'étiquette sous le nom : « 8 actifs ». */
    detail: string;
    /** Le code ISO du pays, quand il est reconnu : il donne son contour à remplir. */
    code?: string | null;
}

interface GlobePointilleProps {
    noeuds: NoeudDuGlobe[];
    selection: string | null;
    onSelect: (id: string) => void;
    className?: string;
}

const RAD = Math.PI / 180;

const GlobePointille: React.FC<GlobePointilleProps> = ({
    noeuds,
    selection,
    onSelect,
    className,
}) => {
    const boite = useRef<HTMLDivElement>(null);
    const toile = useRef<HTMLCanvasElement>(null);
    const etiquettes = useRef(new Map<string, HTMLButtonElement | null>());
    /* L'état de la vue vit hors de React : il change à chaque image. */
    const vue = useRef({
        lng: 0,
        lat: 12,
        cibleLng: null as number | null,
        cibleLat: 12,
        glisse: false,
        zoom: 1,
        cibleZoom: 1,
    });
    const donnees = useRef({ noeuds, selection });
    donnees.current = { noeuds, selection };
    /* Les contours arrivent après le globe : il tourne d'abord, les pays se remplissent
       ensuite. Leur module (41 Ko) n'entre pas dans le code de la page. */
    const contours = useRef<((code: string) => Anneau[] | null) | null>(null);
    useEffect(() => {
        let vivant = true;
        void import('../lib/contours').then((module) => {
            if (vivant) contours.current = module.contoursDuPays;
        });
        return () => {
            vivant = false;
        };
    }, []);

    /* Choisir un pays : la vue vise son centre (latitude bornée, pour garder les pôles). */
    useEffect(() => {
        const choisi = noeuds.find((n) => n.id === selection);
        if (!choisi) {
            vue.current.cibleLng = null;
            vue.current.cibleZoom = 1;
            return;
        }
        /* **Au choix d'un pays, le globe s'approche** (24/09) — d'autant plus que son plus
           proche voisin est près : Togo et Bénin sont à 1,4°, la France et le Sénégal à
           35°. ×2,1 au moins, ×4 au plus. */
        const voisin = noeuds
            .filter((n) => n.id !== choisi.id)
            .reduce(
                (min, n) => Math.min(min, Math.hypot(n.lat - choisi.lat, n.lng - choisi.lng)),
                90,
            );
        vue.current.cibleZoom = Math.max(2.1, Math.min(4, 12 / Math.max(0.5, voisin)));
        vue.current.cibleLng = choisi.lng;
        vue.current.cibleLat = Math.max(-25, Math.min(35, choisi.lat));
    }, [selection, noeuds]);

    useEffect(() => {
        const canvas = toile.current;
        const conteneur = boite.current;
        if (!canvas || !conteneur) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const jeton = (nom: string) =>
            getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || 'gray';
        const couleurs = {
            encre: jeton('--tk-color-on-surface'),
            terre: jeton('--tk-color-st-bleu'),
            noeud: jeton('--tk-color-live-orange'),
            choisi: jeton('--tk-color-primary'),
        };
        const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const terresLarges = pointsDeTerre(2);
        const terresFines = pointsDeTerre(1);

        let largeur = 0;
        let dpr = 1;
        const dimensionner = () => {
            largeur = conteneur.clientWidth;
            dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(largeur * dpr);
            canvas.height = Math.round(largeur * dpr);
            canvas.style.width = `${largeur}px`;
            canvas.style.height = `${largeur}px`;
        };
        dimensionner();
        const observateur = new ResizeObserver(dimensionner);
        observateur.observe(conteneur);

        /* Projection orthographique : [x, y, profondeur] en px CSS, profondeur > 0 = face. */
        const projeter = (lat: number, lng: number, R: number, c: number) => {
            const v = vue.current;
            const phi = lat * RAD;
            const lam = (lng - v.lng) * RAD;
            const phi0 = v.lat * RAD;
            const cosc =
                Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam);
            const x = R * Math.cos(phi) * Math.sin(lam);
            const y =
                R *
                (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam));
            return [c + x, c - y, cosc] as const;
        };

        /**
         * Trace un anneau de pays dans le chemin courant, **coupé à l'horizon** : ce qui
         * passe derrière le globe est remplacé par l'arc du bord entre le point de sortie et
         * le point de retour. Rend `false` si rien de l'anneau n'est sur la face visible.
         */
        const tracerLAnneau = (anneau: Anneau, R: number, c: number): boolean => {
            const n = anneau.length / 2;
            /* Chaque sommet sur la sphère unité, dans le repère de la vue : x vers la droite,
               y vers le haut, z vers l'œil. */
            const sx = new Float32Array(n);
            const sy = new Float32Array(n);
            const sz = new Float32Array(n);
            let devant = 0;
            for (let i = 0; i < n; i += 1) {
                const [x, y, z] = projeter(anneau[i * 2 + 1], anneau[i * 2], 1, 0);
                sx[i] = x;
                sy[i] = -y;
                sz[i] = z;
                if (z >= 0) devant += 1;
            }
            if (devant === 0) return false;
            /* On part d'un sommet caché quand il y en a un : le premier point tracé est alors
               une entrée sur la face visible, et chaque sortie trouve son retour. */
            let depart = 0;
            if (devant < n) while (sz[depart] >= 0) depart += 1;
            let ouvert = false;
            let sortie: number | null = null;
            let premiereEntree: number | null = null;
            /* Le long du bord, par le plus court : un pays ne fait pas le tour du globe. */
            const longerLeBord = (de: number, vers: number) => {
                const ecart = ((vers - de + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                ctx.arc(c, c, R, de, vers, ecart < 0);
            };
            const auBord = (a: number, b: number): [number, number] => {
                const t = sz[a] / (sz[a] - sz[b]);
                const x = sx[a] + t * (sx[b] - sx[a]);
                const y = sy[a] + t * (sy[b] - sy[a]);
                const norme = Math.hypot(x, y) || 1;
                return [x / norme, y / norme];
            };
            for (let k = 0; k < n; k += 1) {
                const a = (depart + k) % n;
                const b = (depart + k + 1) % n;
                if (sz[a] >= 0) {
                    const px = c + R * sx[a];
                    const py = c - R * sy[a];
                    if (ouvert) ctx.lineTo(px, py);
                    else {
                        ctx.moveTo(px, py);
                        ouvert = true;
                    }
                }
                if (sz[a] >= 0 !== sz[b] >= 0) {
                    const [bx, by] = auBord(a, b);
                    const angle = Math.atan2(-by, bx);
                    if (sz[a] >= 0) {
                        ctx.lineTo(c + R * bx, c - R * by);
                        sortie = angle;
                    } else if (sortie !== null) {
                        longerLeBord(sortie, angle);
                        sortie = null;
                    } else {
                        ctx.moveTo(c + R * bx, c - R * by);
                        ouvert = true;
                        premiereEntree = angle;
                    }
                }
            }
            /* La dernière sortie rejoint la première entrée par le bord, pas par une corde. */
            if (sortie !== null && premiereEntree !== null) longerLeBord(sortie, premiereEntree);
            ctx.closePath();
            return true;
        };

        let precedent = performance.now();
        let image = 0;
        const dessiner = (maintenant: number) => {
            const dt = Math.min(64, maintenant - precedent);
            precedent = maintenant;
            const v = vue.current;
            const { noeuds: liste, selection: choisi } = donnees.current;

            /* La vue avance : vers la cible quand un pays est choisi, sinon elle dérive. */
            if (!v.glisse) {
                if (v.cibleLng !== null) {
                    const ecart = ((v.cibleLng - v.lng + 540) % 360) - 180;
                    const k = reduit ? 1 : 1 - Math.pow(0.001, dt / 1000);
                    v.lng += ecart * k;
                    v.lat += (v.cibleLat - v.lat) * k;
                } else if (!reduit) {
                    v.lng -= dt * 0.006;
                }
            }

            const kz = reduit ? 1 : 1 - Math.pow(0.002, dt / 1000);
            v.zoom += (v.cibleZoom - v.zoom) * kz;

            const c = largeur / 2;
            const R = c * 0.92 * v.zoom;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, largeur, largeur);

            /* **Un globe clair, fondu au décor** (24/09, à la demande : « pas un globe
               sombre ») : ni corps plein ni contour. La sphère se devine par un ombrage
               d'encre à peine posé vers le bord, et par une trame de points d'océan très
               pâle ; seules les terres se lisent vraiment. */
            const ombre = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
            ombre.addColorStop(0, 'rgba(10,25,29,0)');
            ombre.addColorStop(1, 'rgba(10,25,29,0.05)');
            ctx.fillStyle = ombre;
            ctx.beginPath();
            ctx.arc(c, c, R, 0, Math.PI * 2);
            ctx.fill();

            /* Les terres, plus pâles vers le bord. */
            ctx.fillStyle = couleurs.terre;
            const rayon = Math.min(2.2, Math.max(0.9, R / (v.zoom > 1.6 ? 480 : 260)));
            /* La grille fine dès que le globe s'approche : à ×2, celle de 2° laissait des
               côtes en escalier. Seuls les points à l'écran se dessinent. */
            const terres = v.zoom > 1.6 ? terresFines : terresLarges;
            ctx.fillStyle = couleurs.encre;
            const pasOcean = v.zoom > 1.6 ? 2 : 4;
            for (let lat = -88; lat <= 88; lat += pasOcean) {
                for (let lng = -180; lng < 180; lng += pasOcean) {
                    const [x, y, z] = projeter(lat, lng, R, c);
                    if (z <= 0 || x < -4 || y < -4 || x > largeur + 4 || y > largeur + 4) continue;
                    ctx.globalAlpha = 0.06 * z;
                    ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
                }
            }
            /* **Les pays du référentiel, remplis** — sous la trame des terres, qui garde ainsi
               sa texture. Le pays choisi se dessine en dernier, par-dessus ses voisins. */
            const lire = contours.current;
            if (lire) {
                const remplis = liste.filter((n) => n.code);
                remplis.sort((a, b) => Number(a.id === choisi) - Number(b.id === choisi));
                for (const n of remplis) {
                    const anneaux = lire(n.code as string);
                    if (!anneaux) continue;
                    const estChoisi = n.id === choisi;
                    ctx.beginPath();
                    let trace = false;
                    for (const anneau of anneaux) trace = tracerLAnneau(anneau, R, c) || trace;
                    if (!trace) continue;
                    ctx.globalAlpha = estChoisi ? 0.55 : 0.3;
                    ctx.fillStyle = estChoisi ? couleurs.choisi : couleurs.noeud;
                    ctx.fill();
                    ctx.globalAlpha = estChoisi ? 0.6 : 0.75;
                    ctx.strokeStyle = estChoisi ? couleurs.encre : couleurs.noeud;
                    ctx.lineWidth = 1;
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            ctx.fillStyle = couleurs.terre;
            for (const [lat, lng] of terres) {
                const [x, y, z] = projeter(lat, lng, R, c);
                if (z <= 0 || x < -4 || y < -4 || x > largeur + 4 || y > largeur + 4) continue;
                ctx.globalAlpha = 0.24 + 0.7 * z;
                ctx.beginPath();
                ctx.arc(x, y, rayon * (0.6 + 0.4 * z), 0, Math.PI * 2);
                ctx.fill();
            }

            /* Les nœuds : taille et éclat selon le poids, le choisi en jaune et cerné. */
            const max = Math.max(1, ...liste.map((n) => n.poids));
            const pulsation = reduit ? 0 : (Math.sin(maintenant / 500) + 1) / 2;
            const places: Array<{
                id: string;
                x: number;
                y: number;
                z: number;
                r: number;
                poids: number;
                choisi: boolean;
            }> = [];
            for (const n of liste) {
                const [x, y, z] = projeter(n.lat, n.lng, R, c);
                const visible = z > 0.08 && x > 0 && y > 0 && x < largeur && y < largeur;
                const r = 4 + 12 * Math.sqrt(n.poids / max);
                if (visible)
                    places.push({ id: n.id, x, y, z, r, poids: n.poids, choisi: n.id === choisi });
                if (!visible) continue;
                const estChoisi = n.id === choisi;
                const teinte = estChoisi ? couleurs.choisi : couleurs.noeud;
                ctx.fillStyle = teinte;
                ctx.globalAlpha = 0.16 * z;
                ctx.beginPath();
                ctx.arc(x, y, r * (1.9 + (estChoisi ? 0.6 * pulsation : 0)), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = z;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(3, r * 0.45), 0, Math.PI * 2);
                ctx.fill();
                if (estChoisi) {
                    ctx.globalAlpha = 0.7 * z;
                    /* Un filet d'encre de 1 : le jaune seul se perd sur le fond clair, et
                       l'anneau de 1,5 pesait trop. */
                    ctx.strokeStyle = couleurs.encre;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;

            /* **Les étiquettes ne se chevauchent pas** (24/09) : le pays choisi d'abord, puis
               par poids ; chacune essaie la droite de son point, la gauche, le dessus, le
               dessous. Sans place libre, elle s'efface — le point reste, et la liste
               d'à côté le nomme. Les nœuds eux-mêmes comptent comme occupés. */
            const pris: Array<[number, number, number, number]> = places.map((p) => [
                p.x - p.r * 0.6,
                p.y - p.r * 0.6,
                p.x + p.r * 0.6,
                p.y + p.r * 0.6,
            ]);
            const chevauche = (a: [number, number, number, number]) =>
                pris.some((b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
            const placees = new Set<string>();
            [...places]
                .sort((a, b) => Number(b.choisi) - Number(a.choisi) || b.poids - a.poids)
                .forEach((p) => {
                    const bouton = etiquettes.current.get(p.id);
                    if (!bouton) return;
                    const l = bouton.offsetWidth;
                    const h = bouton.offsetHeight;
                    const ecart = Math.max(8, p.r * 0.6 + 6);
                    const essais: Array<[number, number]> = [
                        [p.x + ecart, p.y - h / 2],
                        [p.x - ecart - l, p.y - h / 2],
                        [p.x - l / 2, p.y - ecart - h],
                        [p.x - l / 2, p.y + ecart],
                    ];
                    const ok = essais.find(([gx, gy]) => {
                        const boite: [number, number, number, number] = [
                            gx - 2,
                            gy - 2,
                            gx + l + 2,
                            gy + h + 2,
                        ];
                        return (
                            gx >= 0 &&
                            gy >= 0 &&
                            gx + l <= largeur &&
                            gy + h <= largeur &&
                            !chevauche(boite)
                        );
                    });
                    if (!ok) return;
                    pris.push([ok[0] - 2, ok[1] - 2, ok[0] + l + 2, ok[1] + h + 2]);
                    placees.add(p.id);
                    bouton.style.transform = `translate(${ok[0]}px, ${ok[1]}px)`;
                    bouton.style.opacity = String(Math.min(1, p.z * 2));
                });
            for (const [id, bouton] of etiquettes.current) {
                if (!bouton) continue;
                const montre = placees.has(id);
                if (!montre) bouton.style.opacity = '0';
                bouton.style.pointerEvents = montre ? 'auto' : 'none';
            }

            image = requestAnimationFrame(dessiner);
        };
        image = requestAnimationFrame(dessiner);

        /* Tourner à la main. */
        let depart: { x: number; y: number; lng: number; lat: number } | null = null;
        const presser = (e: PointerEvent) => {
            depart = { x: e.clientX, y: e.clientY, lng: vue.current.lng, lat: vue.current.lat };
            vue.current.glisse = true;
            canvas.setPointerCapture(e.pointerId);
        };
        const bouger = (e: PointerEvent) => {
            if (!depart) return;
            const echelle = 180 / Math.max(1, largeur);
            vue.current.lng = depart.lng - (e.clientX - depart.x) * echelle;
            vue.current.lat = Math.max(
                -60,
                Math.min(60, depart.lat + (e.clientY - depart.y) * echelle),
            );
            vue.current.cibleLng = null;
        };
        const lacher = () => {
            depart = null;
            vue.current.glisse = false;
        };
        canvas.addEventListener('pointerdown', presser);
        canvas.addEventListener('pointermove', bouger);
        canvas.addEventListener('pointerup', lacher);
        canvas.addEventListener('pointercancel', lacher);

        return () => {
            cancelAnimationFrame(image);
            observateur.disconnect();
            canvas.removeEventListener('pointerdown', presser);
            canvas.removeEventListener('pointermove', bouger);
            canvas.removeEventListener('pointerup', lacher);
            canvas.removeEventListener('pointercancel', lacher);
        };
    }, []);

    return (
        <div
            ref={boite}
            className={cn('relative aspect-square w-full overflow-hidden select-none', className)}
        >
            <canvas
                ref={toile}
                aria-hidden="true"
                /* Un fondu circulaire : approché, le globe ne se coupe pas aux bords carrés. */
                className="absolute inset-0 cursor-grab [mask-image:radial-gradient(closest-side,black_94%,transparent)] active:cursor-grabbing"
            />
            {noeuds.map((n) => (
                <Button
                    key={n.id}
                    ref={(el: HTMLButtonElement | null) => {
                        etiquettes.current.set(n.id, el);
                    }}
                    variant="text"
                    layout="card"
                    onClick={() => onSelect(n.id)}
                    aria-pressed={n.id === selection}
                    aria-label={`${n.label}, ${n.detail}`}
                    /* Sa place est choisie à chaque image, hors des autres (voir plus haut). */
                    className={cn(
                        'focus-visible:ring-focus-ring absolute top-0 left-0 flex h-auto min-h-0 w-auto min-w-0 flex-col items-start gap-0 rounded-md px-2 py-1 text-left font-normal whitespace-nowrap opacity-0 shadow-[0_2px_8px_rgba(10,25,29,0.25)] focus-visible:ring-1 focus-visible:ring-offset-0',
                        n.id === selection
                            ? 'bg-primary text-on-primary z-10'
                            : 'bg-surface text-on-surface hover:bg-surface-container',
                    )}
                >
                    <span className="text-ts-sub leading-ts-sub font-medium">{n.label}</span>
                    <span
                        className={cn(
                            'text-[0.75rem] leading-4 tabular-nums',
                            n.id === selection ? 'opacity-80' : 'text-on-surface-variant',
                        )}
                    >
                        {n.detail}
                    </span>
                </Button>
            ))}
        </div>
    );
};

export default GlobePointille;
