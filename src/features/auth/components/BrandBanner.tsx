import React from 'react';
import { cn } from '../../../lib/utils';
import { APP_CONFIG } from '../../../config';
import { AUTH_MEASURE } from './authLayout';

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
            /* Au-delà de 600, **le bloc de marque du plein champ** : plus de fond (le
               champ le porte), centré au-dessus de la carte, 28 avant elle. */
            'medium:max-w-[440px] medium:overflow-visible medium:bg-transparent medium:px-0 medium:pt-0 medium:pb-7 medium:text-center',
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
                'medium:hidden pointer-events-none absolute left-0 h-full w-[393px]',
                short ? '-top-4' : 'top-0',
            )}
        >
            <g fill="none" strokeWidth="1.2" className="stroke-[var(--color-login-live-vert)]">
                <path d="M-30 8H150V52" />
                <path d="M-30 24H122V52" />
                <path d="M-30 40H94V52" />
            </g>
        </svg>
        <svg
            aria-hidden="true"
            viewBox="0 0 393 199"
            preserveAspectRatio="xMaxYMax slice"
            className="medium:hidden pointer-events-none absolute right-0 bottom-0 h-full w-[393px]"
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
            <g fill="none" strokeWidth="6" className="stroke-[var(--color-login-live-accent)]">
                {/* Le centre est *dans* le cadre, à 5 et 7 du coin : il faut qu'un demi-anneau
                    se voie, pas une écharde — relevé du commanditaire sur sa capture. */}
                <circle cx="398" cy="206" r="16" />
                <circle cx="398" cy="206" r="32" />
            </g>
        </svg>

        <div
            className={cn(
                'relative',
                AUTH_MEASURE,
                'medium:flex medium:flex-col medium:items-center',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'bg-primary block h-[3px] w-10',
                    short ? 'mb-4' : 'mb-6',
                    'medium:mb-5',
                )}
            />
            <h1 className="font-brand text-ts-page leading-ts-page medium:text-[2.75rem] medium:leading-[3rem] mb-2 font-medium tracking-[-0.02em]">
                {APP_CONFIG.appName}
            </h1>
            <p className="text-ts-control leading-ts-control medium:max-w-none medium:text-[1rem] medium:leading-6 max-w-[290px] text-[var(--tk-color-text-on-inverse-muted)]">
                Pilotez vos actifs avec une expérience unifiée.
            </p>
        </div>
    </header>
);

/**
 * **Le cartouche en plein champ** — la connexion au bureau (direction B, 22/09). Le même
 * vocabulaire que le bandeau, à l'échelle de la fenêtre : les angles emboîtés coupés par
 * le bord gauche en haut, la diagonale olive qui entre par l'angle haut-droit, le
 * triangle bleu tenu au bord droit, un filet bleu qui ferme l'angle bas-gauche, et **un
 * seul accent plein** — les deux arcs orange de l'angle bas-droit, dont on voit le quart
 * d'anneau, pas une écharde. Filets à 30 %, accent à 100 %.
 *
 * **Quatre cadres ancrés aux coins, jamais étirés** : une fenêtre plus large écarte les
 * coins, elle ne déforme pas le dessin. Il n'existe qu'au-delà de 600 ; au téléphone, le
 * bandeau porte son propre cartouche. **Sous 1 200, les cadres se réduisent d'un tiers**
 * (l'accent excepté) : à 768 les angles touchaient le filet jaune et la diagonale
 * passait derrière « Tracker » — ce que le commanditaire avait déjà refusé au bandeau.
 */
export const BrandField: React.FC = () => (
    <div aria-hidden="true" className="medium:block pointer-events-none absolute inset-0 hidden">
        <svg
            width="440"
            height="210"
            className="large:scale-100 absolute top-0 left-0 origin-top-left scale-[0.66]"
        >
            <g fill="none" strokeWidth="1.5" className="stroke-[var(--color-login-live-vert)]">
                <path d="M-40 52H420V200" />
                <path d="M-40 100H350V200" />
                <path d="M-40 148H280V200" />
            </g>
        </svg>
        <svg
            width="440"
            height="700"
            className="large:scale-100 absolute top-0 right-0 origin-top-right scale-[0.66]"
        >
            <g fill="none" strokeWidth="1.5">
                <path
                    className="stroke-[var(--color-login-live-jaune)] opacity-55"
                    d="M40 -20L480 420"
                />
                <path
                    className="stroke-[var(--color-login-live-jaune)]"
                    d="M140 -20L480 320M240 -20L480 220"
                />
                <path
                    className="stroke-[var(--color-login-live-bleu)]"
                    d="M440 470L344 566L440 662Z"
                />
            </g>
        </svg>
        <svg
            width="200"
            height="200"
            className="large:scale-100 absolute bottom-0 left-0 origin-bottom-left scale-[0.66]"
        >
            <path
                fill="none"
                strokeWidth="1.5"
                className="stroke-[var(--color-login-live-bleu)] opacity-60"
                d="M-20 20L160 200"
            />
        </svg>
        <svg width="220" height="220" className="absolute right-0 bottom-0">
            <g fill="none" strokeWidth="10" className="stroke-[var(--color-login-live-accent)]">
                <circle cx="232" cy="234" r="44" />
                <circle cx="232" cy="234" r="88" />
            </g>
        </svg>
    </div>
);

export default BrandBanner;
