import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Check } from '@phosphor-icons/react';

import Icon from './Icon';
import { cn } from '../../lib/utils';
import { ecouterLActivite, lireLActivite, type Activite } from '../../lib/activites';
import { useDerniereValeur } from '../../hooks/useDerniereValeur';
import { usePresence } from '../../hooks/usePresence';

/**
 * **Un îlot pour ce qui dure** (11/10) : l'activité en cours (`lib/activites`) tient dans une
 * pastille en haut de l'écran, qu'on déplie d'un appui, et qui reste quand on change de page.
 *
 * Repliée : un anneau qui tourne et l'avancée, « Import · 142 / 300 ». Dépliée : le fichier,
 * une jauge, les lignes refusées. Elle se déplie en changeant de taille (un ressort), sans
 * remplacer son contenu : c'est le principe des activités en direct de la Dynamic Island.
 *
 * Elle ne paraît que si l'envoi dure : un import que la base confirme en moins d'une
 * demi-seconde n'a pas besoin d'elle, le toast le dit déjà. Finie, elle le dit deux secondes
 * (une coche), puis s'efface.
 */
const DELAI_AVANT_DE_PARAITRE_MS = 500;
const LARGEUR_REPLIEE_MIN = 172;

const nombre = (n: number) => n.toLocaleString('fr-FR');

const refuseesEnMots = (n: number) =>
    n === 0 ? 'Aucune ligne refusée' : n === 1 ? '1 ligne refusée' : `${nombre(n)} lignes refusées`;

const Ilot: React.FC = () => {
    const activite = useSyncExternalStore(ecouterLActivite, lireLActivite, () => null);
    /** L'activité qui a duré assez pour être montrée. */
    const [montree, setMontree] = useState<number | null>(null);
    const [depliee, setDepliee] = useState(false);
    const court = useRef<HTMLSpanElement>(null);
    const [largeur, setLargeur] = useState(LARGEUR_REPLIEE_MIN);

    const id = activite?.id ?? null;
    const enCours = activite?.etat === 'en cours';
    useEffect(() => {
        if (id === null || !enCours || montree === id) return;
        const delai = window.setTimeout(() => setMontree(id), DELAI_AVANT_DE_PARAITRE_MS);
        return () => window.clearTimeout(delai);
    }, [enCours, id, montree]);

    const visible = activite !== null && montree === activite.id;
    const affichee: Activite | null = useDerniereValeur(visible ? activite : null);
    const { monte, sortant, finDeSortie } = usePresence(visible);
    useEffect(() => {
        if (!visible) setDepliee(false);
    }, [visible]);

    /* La pastille repliée se taille sur ce qu'elle dit : « 142 / 300 » et « 1 250 / 3 000 »
       n'ont pas la même largeur, et une largeur se déplie mieux qu'un « auto ». */
    const dit = affichee
        ? affichee.etat === 'faite'
            ? `${affichee.titre} terminé · ${nombre(affichee.fait)}`
            : `${affichee.titre} · ${nombre(affichee.fait)} / ${nombre(affichee.total)}`
        : '';
    useLayoutEffect(() => {
        if (court.current)
            setLargeur(Math.max(LARGEUR_REPLIEE_MIN, Math.ceil(court.current.scrollWidth)));
    }, [dit, monte]);

    if (!monte || !affichee) return null;

    const faite = affichee.etat === 'faite';
    const part = affichee.total > 0 ? Math.min(1, affichee.fait / affichee.total) : 0;

    return createPortal(
        <div
            className={cn(
                'pointer-events-none fixed inset-x-0 top-2.5 z-[95] flex justify-center',
                sortant ? 'mvt-menu-sortie' : 'mvt-menu-entree origin-top',
            )}
            onAnimationEnd={finDeSortie}
        >
            <button
                type="button"
                aria-expanded={depliee}
                aria-label={`${dit}. ${depliee ? 'Replier' : 'Afficher le détail'}`}
                onClick={() => setDepliee((avant) => !avant)}
                style={{ width: depliee ? undefined : largeur }}
                className={cn(
                    'mvt-ilot bg-inverse-surface text-inverse-on-surface shadow-dialog pointer-events-auto block h-[38px] cursor-pointer overflow-hidden rounded-[19px] p-0 text-left',
                    depliee && 'h-[132px] w-[min(calc(100vw-20px),360px)] rounded-[16px]',
                )}
            >
                <span
                    ref={court}
                    className="text-ts-sub flex h-[38px] w-max items-center gap-[9px] px-3.5 leading-none font-medium whitespace-nowrap tabular-nums"
                >
                    {faite ? (
                        <Icon
                            glyph={Check}
                            size={18}
                            className="mvt-pop -mx-px shrink-0 text-[var(--tk-color-brand)]"
                        />
                    ) : (
                        <span
                            aria-hidden="true"
                            className="mvt-tourne h-4 w-4 shrink-0 rounded-full border-2 border-white/25 border-t-[var(--tk-color-brand)]"
                        />
                    )}
                    <span>{dit}</span>
                </span>
                <span
                    aria-hidden={!depliee}
                    className={cn(
                        'text-ts-sub leading-ts-sub flex flex-col gap-[9px] px-3.5 pt-1 pb-3.5 transition-opacity',
                        depliee ? 'opacity-100 delay-[120ms]' : 'opacity-0',
                    )}
                >
                    <span className="truncate">{affichee.detail ?? affichee.titre}</span>
                    <span className="block h-[5px] overflow-hidden rounded-[3px] bg-white/[0.18]">
                        <span
                            className="mvt-ilot-jauge block h-full rounded-[3px] bg-[var(--tk-color-brand)]"
                            style={{ width: `${part * 100}%` }}
                        />
                    </span>
                    <span className="opacity-70">{refuseesEnMots(affichee.refusees)}</span>
                </span>
            </button>
            <span role="status" className="sr-only">
                {faite ? `${affichee.titre} terminé` : `${affichee.titre} en cours`}
            </span>
        </div>,
        document.body,
    );
};

export default Ilot;
