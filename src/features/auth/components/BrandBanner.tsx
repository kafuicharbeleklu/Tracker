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
 * Plein cadre, avant authentification. Fond bleu-noir inversé, motif cartouche en
 * filigrane (20 %), filet jaune 40 × 3 puis 24 d'air, titre Archivo 500 28 sur 32 en
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
        <svg
            aria-hidden="true"
            viewBox="0 0 393 220"
            preserveAspectRatio="xMidYMid slice"
            /*
               Le filigrane est dessiné pour la largeur d'un téléphone. Étalé sur un
               écran large, il grossit d'un facteur trois et ses traits deviennent des
               bandes. Au-delà du téléphone il garde donc sa taille et se cale à droite,
               où vit le cartouche : la colonne de lecture reste sur un fond net.
            */
            className="medium:left-auto medium:w-[560px] pointer-events-none absolute inset-0 h-full w-full text-white opacity-20"
        >
            <g fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M-70 16H116V212" />
                <path d="M-70 46H86V212" />
                <path d="M-70 76H56V212" />
                <path d="M388-62L458 8L388 78L318 8Z" />
                <path d="M388-32L428 8L388 48L348 8Z" />
                <circle cx="22" cy="254" r="58" />
                <circle cx="22" cy="254" r="88" />
                <circle cx="22" cy="254" r="118" />
                <path d="M300 226V118L408 226Z" />
                <path d="M352 226V174L404 226Z" />
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
