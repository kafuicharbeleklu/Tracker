import React from 'react';
import { cn } from '../../../lib/utils';
import { APP_CONFIG } from '../../../config';
import { AUTH_MEASURE } from './AuthShell';

/**
 * **Le bandeau de marque** — rôle nommé au registre §2.22, dessiné en 02.1 et repris
 * *à l'identique* par 02.2 : « c'est lui qui dit qu'on est bien arrivé dans
 * l'application que le lien annonçait. Il ne se personnalise pas — un bandeau qui
 * changerait de texte d'un écran hors session à l'autre ne serait plus une marque,
 * mais un titre. »
 *
 * Plein cadre, avant authentification. Fond bleu-noir inversé, le cartouche LIVE en
 * filigrane, filet jaune 40 × 3 puis 24 d'air, titre Archivo 500 28 sur 32 en
 * chasse −.02em, promesse 15 sur 20 en encre estompée du sombre. La forme courte (les
 * issues de 02.2) garde tout et resserre l'air : 40 en haut, 28 en bas, 16 sous le filet.
 *
 * **La bande traverse la page ; son texte tient dans la mesure.** Au-delà du téléphone,
 * le fond s'élargit avec l'écran et le titre reste aligné sur la colonne du formulaire,
 * au même bord : c'est ce qui fait une page plutôt qu'un appareil posé au centre.
 */
const BrandBanner: React.FC<{ short?: boolean }> = ({ short = false }) => (
    <header
        className={cn(
            'relative w-full overflow-hidden bg-[var(--tk-color-inverse-surface)] px-5 text-white',
            short ? 'pt-10 pb-7' : 'pt-14 pb-9',
        )}
    >
        {/*
           **Le filigrane est le cartouche des cartes LIVE de Neemba.** Le système LIVE a
           quatre familles — angles emboîtés, losange, cercles concentriques, quatre
           triangles — et la charte les pose, au dos de ses cartes sombres, **en grands
           filets coupés par les bords, chacun dans sa teinte éteinte**, avec un seul
           accent en couleur pleine : des arcs orange tenus dans un angle
           (`images/imgdownloader-26235495.webp`, `…-cd7fdb1d.webp`).

           **Quatre temps le 09/09.** Recalé d'abord : les angles passaient derrière
           « Tracker » et la promesse (trois montants à 56, 86 et 116, en pleine colonne de
           lecture). Teinté ensuite : les filets étaient blancs, la charte les veut dans la
           couleur de leur famille. Dessinés entiers, puis — le commanditaire les a vus
           « tronqués » — refusés entiers aussi : quatre glyphes complets en colonne se
           lisaient, mais en semis, sans geste. Le cartouche, enfin, choisi sur une planche
           de quatre propositions : c'est celui-ci.

           **La composition.** Les angles en grand, coupés par la gauche, au-dessus du
           titre ; la diagonale olive qui entre par l'angle haut-droit ; un triangle bleu
           tenu au bord droit — ces deux-là fondus vers le texte par un masque, pour qu'ils
           s'éteignent avant la promesse ; et l'accent : deux arcs orange pleins dans
           l'angle bas-droit, qui répondent au filet jaune en diagonale. Filets à 30 %,
           accent à 100 % (`--color-login-live-*`, mélangés une fois dans `index.css`).

           **Deux cadres, pas un.** Le premier est ancré à gauche et en haut (les angles),
           le second à droite et en bas (le reste et l'accent) ; tous deux font 393 × 199,
           la taille du bandeau long au téléphone, et se rognent par `slice` plutôt que de
           s'étirer. Un écran large étire donc la bande sans étirer le dessin ; la forme
           courte (167) garde l'accent dans son angle, remonte les angles de 16 avec le
           filet jaune, et laisse la diagonale entrer plus haut ; un téléphone plus étroit
           rogne un peu de chaque bord, jamais le milieu.
        */}
        <svg
            aria-hidden="true"
            viewBox="0 0 393 199"
            preserveAspectRatio="xMinYMin slice"
            /* La forme courte a 16 d'air en moins au-dessus du filet jaune : les angles
               remontent d'autant, sinon le filet tombe sur leur troisième ligne. */
            className={cn(
                'pointer-events-none absolute left-0 h-full w-[393px]',
                short ? '-top-4' : 'top-0',
            )}
        >
            <g
                fill="none"
                strokeWidth="1.2"
                className="stroke-[var(--color-login-live-vert)]"
            >
                <path d="M-30 8H150V52" />
                <path d="M-30 24H122V52" />
                <path d="M-30 40H94V52" />
            </g>
        </svg>
        <svg
            aria-hidden="true"
            viewBox="0 0 393 199"
            preserveAspectRatio="xMaxYMax slice"
            className="pointer-events-none absolute right-0 bottom-0 h-full w-[393px]"
        >
            <defs>
                {/* Le fondu vers le texte : opaque à 330, éteint à 180. */}
                <linearGradient
                    id="live-fondu"
                    x1="180"
                    y1="0"
                    x2="330"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="black" />
                    <stop offset="1" stopColor="white" />
                </linearGradient>
                <mask id="live-masque">
                    <rect width="393" height="199" fill="url(#live-fondu)" />
                </mask>
            </defs>
            <g fill="none" strokeWidth="1.2" mask="url(#live-masque)">
                <path
                    className="stroke-[var(--color-login-live-jaune)]"
                    d="M268-12L413 133M310-12L413 91"
                />
                <path
                    className="stroke-[var(--color-login-live-bleu)]"
                    d="M393 78L349 122L393 166Z"
                />
            </g>
            <g
                fill="none"
                strokeWidth="6"
                className="stroke-[var(--color-login-live-accent)]"
            >
                {/* Le centre est *dans* le cadre, à 5 et 7 du coin : il faut qu'un demi-anneau
                    se voie, pas une écharde — relevé du commanditaire sur sa capture. */}
                <circle cx="398" cy="206" r="16" />
                <circle cx="398" cy="206" r="32" />
            </g>
        </svg>

        <div className={cn('relative', AUTH_MEASURE)}>
            <span
                aria-hidden="true"
                className={cn('bg-primary block h-[3px] w-10', short ? 'mb-4' : 'mb-6')}
            />
            <h1 className="font-brand mb-2 text-[28px] leading-8 font-medium tracking-[-0.02em]">
                {APP_CONFIG.appName}
            </h1>
            <p className="max-w-[290px] text-[15px] leading-5 text-[var(--tk-color-text-on-inverse-muted)]">
                Pilotez vos actifs avec une expérience unifiée.
            </p>
        </div>
    </header>
);

export default BrandBanner;
