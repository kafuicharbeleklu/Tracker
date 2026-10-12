import React, { useEffect, useRef, useState } from 'react';

/**
 * **Un nombre qui compte jusqu'à sa valeur** (26/09) — les chiffres clés : la bande de
 * l'accueil, les tuiles de Finances et de la campagne, les grands montants.
 *
 * À l'arrivée il part de 0 et compte jusqu'à sa valeur, 700 ms, en décélérant. Seuls les
 * entiers comptent (`14`, `132 560`) ; une valeur à décimale ou à unité (« 1,7 ans »)
 * s'affiche telle quelle.
 *
 * **Quand la valeur change ensuite, ses chiffres roulent, colonne par colonne** (11/10) :
 * un relevé qui avance, un filtre, une autre dépense. Seules les colonnes qui changent
 * bougent ; on voit ce qui a changé au lieu de relire le nombre. Chaque colonne porte les
 * dix chiffres empilés et se décale de sa hauteur de ligne (`mvt-chiffre`, un ressort).
 *
 * La largeur finale est réservée : rien ne bouge autour pendant le compte. Le lecteur d'écran
 * lit la valeur finale, pas les étapes. « Réduire les animations » : la valeur, tout de suite.
 */
const ENTIER = /^\d{1,3}(?:[\u202f\u00a0 ]\d{3})*$|^\d+$/;

const lire = (valeur: React.ReactNode): { cible: number; separateur: string } | null => {
    if (typeof valeur === 'number') {
        return Number.isInteger(valeur) && valeur >= 0 ? { cible: valeur, separateur: '' } : null;
    }
    if (typeof valeur !== 'string' || !ENTIER.test(valeur.trim())) return null;
    const separateur = valeur.match(/[\u202f\u00a0 ]/)?.[0] ?? '';
    return { cible: Number(valeur.replace(/[\u202f\u00a0 ]/g, '')), separateur };
};

const ecrire = (n: number, separateur: string): string => {
    const entier = String(Math.round(n));
    return separateur ? entier.replace(/\B(?=(\d{3})+(?!\d))/g, separateur) : entier;
};

const mouvementReduit = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** La colonne se taille sur la hauteur de ligne (`1lh`) : sans elle, le nombre reste écrit. */
const colonnesPossibles = () =>
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('height', '1lh');

const DIX = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const ChiffreAnime: React.FC<{ valeur: React.ReactNode }> = ({ valeur }) => {
    const lu = lire(valeur);
    const cible = lu?.cible ?? null;
    const [courant, setCourant] = useState<number>(() =>
        cible === null || mouvementReduit() ? (cible ?? 0) : 0,
    );
    /* Le compte d'arrivée est fini : ce qui change ensuite roule. */
    const [arrive, setArrive] = useState(mouvementReduit);
    const affiche = useRef(courant);
    affiche.current = courant;

    useEffect(() => {
        if (cible === null || arrive) return;
        if (mouvementReduit()) {
            setCourant(cible);
            setArrive(true);
            return;
        }
        const depart = affiche.current;
        if (depart === cible) {
            setArrive(true);
            return;
        }
        const debut = performance.now();
        const duree = 700;
        let image = 0;
        const pas = (instant: number) => {
            /* L'horodatage d'une image peut précéder `debut` : sans borne basse, l'avance
               devenait négative et le chiffre passait sous zéro un instant (« −3 »). */
            const avance = Math.min(1, Math.max(0, (instant - debut) / duree));
            /* Décélération marquée, proche de la courbe « emphasized-decelerate ». */
            const facteur = 1 - Math.pow(1 - avance, 4);
            setCourant(depart + (cible - depart) * facteur);
            if (avance < 1) image = requestAnimationFrame(pas);
            else setArrive(true);
        };
        image = requestAnimationFrame(pas);
        return () => cancelAnimationFrame(image);
    }, [arrive, cible]);

    if (lu === null) return <>{valeur}</>;

    const final = ecrire(lu.cible, lu.separateur);

    if (arrive && !mouvementReduit() && colonnesPossibles()) {
        const signes = [...final];
        return (
            <span className="inline-flex items-baseline tabular-nums">
                <span aria-hidden="true" className="inline-flex select-none">
                    {signes.map((signe, index) => {
                        /* La colonne se nomme depuis la droite : les unités restent les
                           unités quand le nombre gagne un chiffre. */
                        const rang = signes.length - index;
                        return /\d/.test(signe) ? (
                            <span key={rang} className="inline-block h-[1lh] overflow-hidden">
                                <span
                                    className="mvt-chiffre block"
                                    style={{ transform: `translateY(-${Number(signe) * 10}%)` }}
                                >
                                    {DIX.map((chiffre) => (
                                        <span key={chiffre} className="block">
                                            {chiffre}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        ) : (
                            <span key={`s${rang}`} className="whitespace-pre">
                                {signe}
                            </span>
                        );
                    })}
                </span>
                <span className="sr-only">{final}</span>
            </span>
        );
    }

    return (
        <span className="relative inline-block tabular-nums">
            <span className="invisible">{final}</span>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 whitespace-nowrap">
                {ecrire(arrive ? lu.cible : courant, lu.separateur)}
            </span>
            <span className="sr-only">{final}</span>
        </span>
    );
};

export default ChiffreAnime;
