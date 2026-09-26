import React, { useEffect, useRef, useState } from 'react';

/**
 * **Un nombre qui compte jusqu'à sa valeur** (26/09) — les chiffres clés : la bande de
 * l'accueil, les tuiles de Finances et de la campagne, les grands montants.
 *
 * À l'arrivée il part de 0 ; quand la valeur change (un relevé qui avance, un filtre), il va
 * de l'ancienne à la nouvelle — 700 ms, en décélérant. Seuls les entiers comptent (`14`,
 * `132 560`) ; une valeur à décimale ou à unité (« 1,7 ans ») s'affiche telle quelle.
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

const ChiffreAnime: React.FC<{ valeur: React.ReactNode }> = ({ valeur }) => {
    const lu = lire(valeur);
    const cible = lu?.cible ?? null;
    const [courant, setCourant] = useState<number>(() =>
        cible === null || mouvementReduit() ? (cible ?? 0) : 0,
    );
    const affiche = useRef(courant);
    affiche.current = courant;

    useEffect(() => {
        if (cible === null) return;
        if (mouvementReduit()) {
            setCourant(cible);
            return;
        }
        const depart = affiche.current;
        if (depart === cible) return;
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
        };
        image = requestAnimationFrame(pas);
        return () => cancelAnimationFrame(image);
    }, [cible]);

    if (lu === null) return <>{valeur}</>;

    const final = ecrire(lu.cible, lu.separateur);
    return (
        <span className="relative inline-block">
            <span className="invisible">{final}</span>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 whitespace-nowrap">
                {ecrire(courant, lu.separateur)}
            </span>
            <span className="sr-only">{final}</span>
        </span>
    );
};

export default ChiffreAnime;
