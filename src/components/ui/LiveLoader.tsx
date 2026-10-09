import React, { useState } from 'react';

import { cn } from '../../lib/utils';

/**
 * **Le chargement LIVE** (24/09) — les quatre signes des valeurs de Neemba, dans leur
 * carré de la charte (`images/imgdownloader-76bd8c9f.png`) : **angles emboîtés** en haut
 * à gauche (vert), **losange dans le losange** en haut à droite (jaune), **triangles en
 * moulin** en bas à droite (bleu), **cercles concentriques** en bas à gauche (orange).
 *
 * Ils s'animent **à tour de rôle, dans le sens des aiguilles d'une montre**, chacun selon
 * sa nature : les angles s'effacent et se retracent du plus petit au plus grand, le losange
 * pivote d'un quart de tour pendant que son cœur bat, le moulin fait un tour, les cercles
 * émettent une onde.
 * Le signe qui parle est plein ; les trois autres attendent en retrait. Cycle de 2,4 s.
 * Sans mouvement (`prefers-reduced-motion`), ils s'allument seulement, tour à tour.
 *
 * `sombre` — les couleurs de la marque, sur le bleu-noir (écran de démarrage).
 * `clair` — les teintes sourdes du produit, lisibles sur la surface.
 *
 * Les animations vivent dans `index.css` (§ « Le chargement LIVE ») ; le SVG ne pose que
 * les formes et le décalage de chaque signe (`--live-retard`).
 */
interface LiveLoaderProps {
    /** Le côté du carré, en px. */
    size?: number;
    tone?: 'sombre' | 'clair';
    /** Ce que lit un lecteur d'écran. */
    label?: string;
    className?: string;
}

const TEINTES = {
    sombre: {
        vert: 'var(--tk-color-mark-live-vert)',
        jaune: 'var(--tk-color-mark-live-jaune)',
        orange: 'var(--tk-color-mark-live-orange)',
        bleu: 'var(--tk-color-mark-live-bleu)',
    },
    clair: {
        vert: 'var(--tk-color-live-vert)',
        jaune: 'var(--tk-color-live-ambre)',
        orange: 'var(--tk-color-live-orange)',
        bleu: 'var(--tk-color-live-bleu)',
    },
} as const;

/** Le cycle, en ms — le même que `--live-cycle` dans `index.css`. */
const CYCLE_MS = 2400;

/**
 * **La phase de l'horloge de la page** (08/10). Le chargement monte un écran par phase —
 * les comptes, les données, le code de l'application — et chacun repartait du début du
 * cycle : l'animation sautait à chaque relais. Un retard négatif cale chaque montage sur la
 * même horloge : le suivant reprend où le précédent s'arrêtait.
 */
const phaseCommune = () => `-${Math.round(performance.now() % CYCLE_MS)}ms`;

/** Le quart de cycle de chaque signe — l'ordre des aiguilles d'une montre. */
const retard = (quart: number) => ({ '--live-retard': `${quart * 0.6}s` }) as React.CSSProperties;

const LiveLoader: React.FC<LiveLoaderProps> = ({
    size = 48,
    tone = 'clair',
    label = 'Chargement',
    className,
}) => {
    const t = TEINTES[tone];
    const [depart] = useState(phaseCommune);
    return (
        <span
            role="status"
            aria-label={label}
            className={cn('live-loader inline-block', className)}
            style={{ '--live-depart': depart } as React.CSSProperties}
        >
            <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
                {/* Angles emboîtés — trois équerres qui se tracent de la plus petite à la
                    plus grande. */}
                <g
                    className="live-signe"
                    style={retard(0)}
                    fill="none"
                    stroke={t.vert}
                    strokeWidth="6"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                >
                    <path
                        className="live-angle"
                        pathLength={1}
                        d="M3 30H19V46"
                        style={{ '--live-pas': '0s' } as React.CSSProperties}
                    />
                    <path
                        className="live-angle"
                        pathLength={1}
                        d="M3 17H32V46"
                        style={{ '--live-pas': '0.08s' } as React.CSSProperties}
                    />
                    <path
                        className="live-angle"
                        pathLength={1}
                        d="M3 4H45V46"
                        style={{ '--live-pas': '0.16s' } as React.CSSProperties}
                    />
                </g>

                {/* Losange dans le losange — le cadre pivote d'un quart de tour, le cœur bat. */}
                <g className="live-signe" style={retard(1)}>
                    <path
                        className="live-tourne"
                        d="M77 4L96 23L77 42L58 23Z"
                        fill="none"
                        stroke={t.jaune}
                        strokeWidth="6"
                    />
                    <path className="live-coeur" d="M77 15L85 23L77 31L69 23Z" fill={t.jaune} />
                </g>

                {/* Triangles en moulin — quatre demi-carrés qui tournent ensemble. */}
                <g className="live-signe" style={retard(2)}>
                    <g className="live-moulin" fill={t.bleu}>
                        <path d="M56 77L77 56V77Z" />
                        <path d="M77 77L98 56V77Z" />
                        <path d="M56 98L77 77V98Z" />
                        <path d="M77 98L98 77V98Z" />
                    </g>
                </g>

                {/* Cercles concentriques — l'anneau émet une onde qui s'éteint. */}
                <g className="live-signe" style={retard(3)} fill="none" stroke={t.orange}>
                    <circle className="live-onde" cx="23" cy="77" r="18" strokeWidth="2" />
                    <circle cx="23" cy="77" r="18" strokeWidth="6" />
                    <circle cx="23" cy="77" r="7" strokeWidth="6" />
                </g>
            </svg>
        </span>
    );
};

export default LiveLoader;
