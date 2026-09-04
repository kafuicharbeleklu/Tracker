import React, { useEffect, useRef, useState } from 'react';

import Button from './Button';
import { cn } from '../../lib/utils';

/**
 * **La zone d'attestation** — `.att` de la planche 06.2, colonne 4.
 *
 * *« Votre attestation. »* Une case de **120 px** sur le creux, l'invite « signez
 * ici » en haut à droite, et **le nom de celui qui signe** au bas : la signature seule
 * ne dit pas qui l'a tracée, et c'est ce nom qui rendra l'attestation relisible deux
 * ans après.
 *
 * Elle valait 140 px, cernée d'un filet, avec l'invite au centre — donc sous le trait
 * qu'on est en train de faire, où elle disparaît à la première ligne.
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

const SignaturePad: React.FC<SignaturePadProps> = ({ signerName, onChange, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [hasInk, setHasInk] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = getComputedStyle(canvas).color;
    }, []);

    const pointOf = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const box = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - box.left) / box.width) * canvas.width,
            y: ((event.clientY - box.top) / box.height) * canvas.height,
        };
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
        context.clearRect(0, 0, canvas.width, canvas.height);
        setHasInk(false);
        onChange(false);
    };

    return (
        <div
            className={cn(
                'bg-surface-container text-on-surface-variant relative h-[120px] overflow-hidden rounded-md',
                className,
            )}
        >
            <canvas
                ref={canvasRef}
                width={720}
                height={240}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className="text-on-surface absolute inset-0 h-full w-full cursor-crosshair touch-none"
            />
            {!hasInk && (
                <span className="text-text-tertiary pointer-events-none absolute top-3 right-3 text-[12px] leading-4">
                    signez ici
                </span>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-2.5 text-center text-[14px] leading-5">
                {signerName}
            </span>
            {hasInk && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="absolute top-2 right-2 h-8 px-2.5 text-[13px]"
                >
                    Effacer
                </Button>
            )}
        </div>
    );
};

export default SignaturePad;
