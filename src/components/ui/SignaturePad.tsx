import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from '@phosphor-icons/react';

import Button from './Button';
import Icon from './Icon';
import { cn } from '../../lib/utils';

/**
 * **La zone d'attestation** — `.att` de la planche 06.2, colonne 4.
 *
 * *« Votre attestation. »* Une case sur le creux, l'invite « signez ici » en haut à
 * droite, et **le nom de celui qui signe** au bas : la signature seule ne dit pas qui
 * l'a tracée, et c'est ce nom qui rendra l'attestation relisible deux ans après.
 *
 * ## Une case où l'on signe, pas une bande (arbitrage du 22/09)
 *
 * La planche la posait à **120 px** sur toute la largeur de la feuille — 353 × 120 au
 * téléphone, trois fois plus large que haute : on y signait comme dans la marge d'un
 * formulaire. Le commanditaire a jugé la case trop basse et trop en longueur, et
 * l'attestation a reçu **son étape** dans la feuille d'acte (`ActSheet`). La case y
 * prend **4:3**, plafonnée à 320 px de haut et à 42 % de l'écran : 353 × 265 au
 * téléphone, la place d'un paraphe comme d'une signature complète.
 *
 * **Le canevas suit la case.** Il était dessiné à 720 × 240 et étiré à la taille de la
 * case : tant que les deux gardaient le même rapport, le trait restait rond. À 4:3 il
 * aurait été écrasé en largeur. Sa définition se règle donc sur la taille affichée,
 * à la densité de l'écran.
 *
 * **Effacer est un glyphe**, la gomme, là où l'invite se tenait avant le premier trait :
 * un mot de plus dans une case qu'on regarde pour signer était un mot de trop.
 *
 * **Le tracé est réel.** Rien n'est validé sans qu'un doigt ait bougé : c'est la
 * différence entre attester et cliquer.
 */
interface SignaturePadProps {
    /** Le nom porté au bas de la case. */
    signerName: string;
    /** Appelé au premier trait, puis à l'effacement. */
    onChange: (signed: boolean) => void;
    className?: string;
}

/**
 * La mesure de la case — partagée avec la signature apposée d'`Attestation`, pour que
 * la preuve posée occupe la place de celle qu'on trace.
 */
export const SIGNATURE_BOX = 'aspect-[4/3] max-h-[min(320px,42dvh)] w-full';

const SignaturePad: React.FC<SignaturePadProps> = ({ signerName, onChange, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [hasInk, setHasInk] = useState(false);
    /* L'appelant passe une fonction neuve à chaque rendu, et le réglage du canevas ne
       doit pas repartir pour autant : il lit les deux par référence. */
    const onChangeRef = useRef(onChange);
    const hasInkRef = useRef(false);
    useEffect(() => {
        onChangeRef.current = onChange;
        hasInkRef.current = hasInk;
    });

    /* Le canevas prend la taille de la case, à la densité de l'écran. Un changement de
       taille — l'appareil qu'on tourne — vide le canevas : le trait repart de zéro, et
       l'attestation le sait. */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const regler = () => {
            const box = canvas.getBoundingClientRect();
            const densite = window.devicePixelRatio || 1;
            const largeur = Math.round(box.width * densite);
            const hauteur = Math.round(box.height * densite);
            if (!largeur || !hauteur) return;
            if (canvas.width === largeur && canvas.height === hauteur) return;
            canvas.width = largeur;
            canvas.height = hauteur;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.scale(densite, densite);
            context.lineWidth = 2;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = getComputedStyle(canvas).color;
            if (hasInkRef.current) {
                hasInkRef.current = false;
                setHasInk(false);
                onChangeRef.current(false);
            }
        };
        regler();
        const observateur = new ResizeObserver(regler);
        observateur.observe(canvas);
        return () => observateur.disconnect();
    }, []);

    /* Les coordonnées en pixels CSS : le contexte est déjà mis à l'échelle de l'écran. */
    const pointOf = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const box = canvasRef.current!.getBoundingClientRect();
        return { x: event.clientX - box.left, y: event.clientY - box.top };
    };

    const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const context = canvasRef.current?.getContext('2d');
        if (!context) return;
        drawing.current = true;
        const { x, y } = pointOf(event);
        context.beginPath();
        context.moveTo(x, y);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const context = canvasRef.current?.getContext('2d');
        if (!context) return;
        const { x, y } = pointOf(event);
        context.lineTo(x, y);
        context.stroke();
        if (!hasInk) {
            setHasInk(true);
            onChange(true);
        }
    };

    const end = () => {
        drawing.current = false;
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.restore();
        setHasInk(false);
        onChange(false);
    };

    return (
        <div
            className={cn(
                'bg-surface-container text-on-surface-variant relative overflow-hidden rounded-md',
                SIGNATURE_BOX,
                className,
            )}
        >
            <canvas
                ref={canvasRef}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className="text-on-surface absolute inset-0 h-full w-full cursor-crosshair touch-none"
            />
            {!hasInk && (
                <span className="text-text-tertiary pointer-events-none absolute top-3 right-3 text-[0.75rem] leading-4">
                    signez ici
                </span>
            )}
            <span className="text-ts-sub leading-ts-sub pointer-events-none absolute inset-x-0 bottom-2.5 text-center">
                {signerName}
            </span>
            {hasInk && (
                <Button
                    variant="text"
                    iconOnly
                    size="sm"
                    onClick={clear}
                    aria-label="Effacer la signature"
                    className="text-on-surface-variant hover:text-on-surface absolute top-1 right-1"
                >
                    <Icon glyph={Eraser} size={20} />
                </Button>
            )}
        </div>
    );
};

export default SignaturePad;
