import React, { useLayoutEffect, useRef, useState } from 'react';

import { animer, courbeDouce, mouvementReduit } from '../../lib/mouvement';

/**
 * **Dans un libellé qui change, seul le mot qui diffère glisse** (11/10).
 *
 * « Retrouvé, fiche conforme » devient « Retrouvé, fiche corrigée » dès qu'on touche un
 * champ : le bouton changeait de texte d'un coup, et il fallait le relire en entier pour
 * voir ce qu'il allait faire. Ce qui ne change pas reste en place ; le mot qui part monte,
 * celui qui arrive vient du dessous, et la largeur suit.
 *
 * Le découpage se fait aux mots : la tête et la queue communes restent, le milieu glisse.
 * « Valider » devenu « Valider les 3 » garde « Valider » et fait entrer « les 3 ».
 *
 * Pour un libellé de bouton, qui tient sur une ligne. Le lecteur d'écran ne lit que le
 * nouveau libellé. « Réduire les animations » : le texte change, sans glisser.
 */
const MOTS = /\s*\S+/g;

const decouper = (avant: string, apres: string) => {
    const a = avant.match(MOTS) ?? [];
    const b = apres.match(MOTS) ?? [];
    const court = Math.min(a.length, b.length);
    let tete = 0;
    while (tete < court && a[tete] === b[tete]) tete += 1;
    let queue = 0;
    while (queue < court - tete && a[a.length - 1 - queue] === b[b.length - 1 - queue]) queue += 1;
    return {
        tete: b.slice(0, tete).join(''),
        ancien: a.slice(tete, a.length - queue).join(''),
        neuf: b.slice(tete, b.length - queue).join(''),
        queue: b.slice(b.length - queue).join(''),
    };
};

interface Etat {
    texte: string;
    tete: string;
    /** Ce qui s'en va ; `null` au repos. */
    ancien: string | null;
    neuf: string;
    queue: string;
    cle: number;
}

const DUREE_MS = 280;

const LibelleMouvant: React.FC<{ children: string }> = ({ children: texte }) => {
    const [etat, setEtat] = useState<Etat>({
        texte,
        tete: '',
        ancien: null,
        neuf: texte,
        queue: '',
        cle: 0,
    });
    const milieu = useRef<HTMLSpanElement>(null);
    const sortant = useRef<HTMLSpanElement>(null);
    const entrant = useRef<HTMLSpanElement>(null);

    if (texte !== etat.texte) {
        setEtat(
            mouvementReduit()
                ? { texte, tete: '', ancien: null, neuf: texte, queue: '', cle: etat.cle }
                : { texte, ...decouper(etat.texte, texte), cle: etat.cle + 1 },
        );
    }

    /* La largeur va de celle du mot qui part à celle du mot qui arrive ; puis le libellé
       redevient un texte d'un seul tenant. */
    useLayoutEffect(() => {
        if (etat.ancien === null) return;
        const depart = sortant.current?.offsetWidth ?? 0;
        const arrivee = entrant.current?.offsetWidth ?? 0;
        if (milieu.current && Math.abs(depart - arrivee) >= 1) {
            animer(milieu.current, [{ width: `${depart}px` }, { width: `${arrivee}px` }], {
                duration: DUREE_MS,
                easing: courbeDouce(),
            });
        }
        const fin = window.setTimeout(
            () =>
                setEtat((courant) =>
                    courant.cle === etat.cle
                        ? { ...courant, tete: '', ancien: null, neuf: courant.texte, queue: '' }
                        : courant,
                ),
            DUREE_MS + 20,
        );
        return () => window.clearTimeout(fin);
    }, [etat.ancien, etat.cle]);

    if (etat.ancien === null)
        return <span className="inline-flex whitespace-pre">{etat.neuf}</span>;

    return (
        <span className="inline-flex whitespace-pre">
            {etat.tete && <span>{etat.tete}</span>}
            <span ref={milieu} className="relative inline-block overflow-hidden">
                <span
                    key={`a${etat.cle}`}
                    ref={sortant}
                    aria-hidden="true"
                    className="mvt-mot-sortie absolute top-0 left-0"
                >
                    {etat.ancien}
                </span>
                <span key={`n${etat.cle}`} ref={entrant} className="mvt-mot-entree inline-block">
                    {etat.neuf}
                </span>
            </span>
            {etat.queue && <span>{etat.queue}</span>}
        </span>
    );
};

export default LibelleMouvant;
