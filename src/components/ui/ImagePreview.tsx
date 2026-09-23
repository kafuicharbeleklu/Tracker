import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, ImageBroken, X } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';
import { cn } from '../../lib/utils';

/**
 * **L'aperçu de la photo d'un objet** — 23/09, à la demande : *« on retire la photo en
 * fond des cartes, elle est floue ; un bouton aperçu ouvrira une vue avec l'image dans
 * une résolution plus nette »*, puis : *« l'icône œil dans la carte héro, en haut à
 * droite ; une vue plein écran, fidèle à la résolution de l'image, bien positionnée »*.
 *
 * La photo tapissait le héro, étirée en `object-cover` sous un voile à 80 % : agrandie
 * au-delà de sa définition, puis assombrie, elle ne montrait rien de net. Elle se regarde
 * désormais **à part**, dans une visionneuse plein écran :
 *
 * - **à sa taille réelle, jamais agrandie** : une image de 800 px s'affiche sur 800 px
 *   écran — un agrandissement invente des pixels et c'est lui qui rendait la photo floue.
 *   Plus grande que la fenêtre, elle se réduit pour tenir entière (`object-contain`), ce
 *   qui garde la netteté ;
 * - **centrée sur un fond sombre**, qui ne fait concurrence à aucune couleur de la photo ;
 * - sa **définition écrite au pied** (« 1 200 × 800 px ») : on sait ce qu'on regarde, et
 *   pourquoi une petite image reste petite ;
 * - Échap, la croix ou un geste à côté de l'image la referment ; le focus revient au
 *   déclencheur.
 *
 * Le déclencheur est un œil de 40 posé **dans le coin haut droit du héro** (`DetailHero`
 * `corner`), sur la surface sombre.
 */
interface ImagePreviewProps {
    src: string;
    /** Ce que la photo montre — le titre de la vue et le texte de remplacement. */
    subject: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, subject }) => {
    const [ouvert, setOuvert] = useState(false);
    const [etat, setEtat] = useState<'charge' | 'prete' | 'echec'>('charge');
    const [taille, setTaille] = useState<{ w: number; h: number; reduite: boolean } | null>(null);
    const declencheur = useRef<HTMLButtonElement>(null);
    const fermer = useRef<HTMLButtonElement>(null);

    const clore = useCallback(() => {
        setOuvert(false);
        declencheur.current?.focus();
    }, []);

    useEffect(() => {
        if (!ouvert) return;
        const avant = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        fermer.current?.focus();
        const touche = (event: KeyboardEvent) => {
            if (event.key === 'Escape') clore();
        };
        window.addEventListener('keydown', touche);
        return () => {
            document.body.style.overflow = avant;
            window.removeEventListener('keydown', touche);
        };
    }, [ouvert, clore]);

    return (
        <>
            <Button
                ref={declencheur}
                variant="text"
                iconOnly
                aria-label={`Aperçu de la photo de ${subject}`}
                onClick={() => {
                    setEtat('charge');
                    setTaille(null);
                    setOuvert(true);
                }}
                className="text-inverse-on-surface hover:text-inverse-on-surface bg-white/10 hover:bg-white/20"
            >
                <Icon glyph={Eye} size={20} />
            </Button>

            {ouvert &&
                createPortal(
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Photo de ${subject}`}
                        className="bg-scrim/[0.94] fixed inset-0 z-[120] flex flex-col"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) clore();
                        }}
                    >
                        <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-2 text-white">
                            <span className="min-w-0 flex-1 truncate text-[0.9375rem] leading-6 font-medium">
                                {subject}
                            </span>
                            <Button
                                ref={fermer}
                                variant="text"
                                iconOnly
                                aria-label="Fermer l'aperçu"
                                onClick={clore}
                                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Icon glyph={X} size={20} />
                            </Button>
                        </header>

                        <div
                            className="relative flex min-h-0 flex-1 items-center justify-center p-4"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) clore();
                            }}
                        >
                            {etat === 'charge' && (
                                <LoadingSpinner size="md" className="absolute inset-0 m-auto" />
                            )}
                            {etat === 'echec' ? (
                                <p className="flex flex-col items-center gap-3 text-center text-white/80">
                                    <Icon glyph={ImageBroken} size={32} />
                                    <span className="text-[0.9375rem] leading-6 font-medium text-white">
                                        La photo ne se charge pas
                                    </span>
                                    <span className="max-w-[320px] text-[0.8125rem] leading-5">
                                        Son adresse ne répond pas. Elle se remplace en modifiant
                                        l'objet.
                                    </span>
                                </p>
                            ) : (
                                /* **Jamais plus grande que nature** : `max-w`/`max-h` la bornent
                                   à la fenêtre, et sans `w-full` elle garde sa taille
                                   naturelle quand elle est plus petite. */
                                <img
                                    src={src}
                                    alt={`Photo de ${subject}`}
                                    onLoad={(event) => {
                                        const img = event.currentTarget;
                                        setTaille({
                                            w: img.naturalWidth,
                                            h: img.naturalHeight,
                                            reduite: img.clientWidth < img.naturalWidth - 1,
                                        });
                                        setEtat('prete');
                                    }}
                                    onError={() => setEtat('echec')}
                                    className={cn(
                                        'block h-auto max-h-full w-auto max-w-full object-contain',
                                        etat !== 'prete' && 'invisible',
                                    )}
                                />
                            )}
                        </div>

                        <footer className="shrink-0 px-4 pt-1 pb-4 text-center text-[0.75rem] leading-4 text-white/60 tabular-nums">
                            {taille
                                ? `${new Intl.NumberFormat('fr-FR').format(taille.w)} × ${new Intl.NumberFormat('fr-FR').format(taille.h)} px — ${taille.reduite ? 'réduite pour tenir dans l’écran' : 'taille réelle, sans agrandissement'}`
                                : ' '}
                        </footer>
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default ImagePreview;
