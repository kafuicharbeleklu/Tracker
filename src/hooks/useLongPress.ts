import type React from 'react';
import { useCallback, useRef } from 'react';

/**
 * L'appui long — **la seconde entrée** du mode sélection (planche 17.2, règle S2).
 *
 * Elle ne vient jamais seule : le registre exige qu'une entrée soit **écrite**
 * quelque part (le menu de débordement), parce qu'un geste qui ne s'annonce nulle
 * part n'est découvert que par ceux qui le connaissaient déjà. Ce crochet ne porte
 * donc que la moitié tactile du couple.
 *
 * Un appui qui devient long **annule le clic** qui l'aurait suivi : sans cela, le
 * même doigt ouvre la fiche en relâchant.
 */

export const LONG_PRESS_MS = 500;

/** Au-delà, ce n'est plus un appui : c'est un défilement. */
const MOVE_TOLERANCE_PX = 10;

interface LongPressHandlers {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
    onContextMenu: (event: React.SyntheticEvent) => void;
    onClickCapture: (event: React.MouseEvent) => void;
}

export const useLongPress = (
    onLongPress: (() => void) | undefined,
    delayMs: number = LONG_PRESS_MS,
): LongPressHandlers => {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const origin = useRef<{ x: number; y: number } | null>(null);
    const fired = useRef(false);

    const clear = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        origin.current = null;
    }, []);

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            if (!onLongPress || event.button !== 0) return;
            fired.current = false;
            origin.current = { x: event.clientX, y: event.clientY };
            timer.current = setTimeout(() => {
                fired.current = true;
                onLongPress();
            }, delayMs);
        },
        [onLongPress, delayMs],
    );

    const onPointerMove = useCallback(
        (event: React.PointerEvent) => {
            if (!origin.current) return;
            const dx = Math.abs(event.clientX - origin.current.x);
            const dy = Math.abs(event.clientY - origin.current.y);
            if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clear();
        },
        [clear],
    );

    const onClickCapture = useCallback((event: React.MouseEvent) => {
        if (!fired.current) return;
        // L'appui long a déjà agi : le clic de relâchement n'ouvre rien.
        event.preventDefault();
        event.stopPropagation();
        fired.current = false;
    }, []);

    return {
        onPointerDown,
        onPointerMove,
        onPointerUp: clear,
        onPointerLeave: clear,
        onPointerCancel: clear,
        onContextMenu: (event) => {
            if (onLongPress) event.preventDefault();
        },
        onClickCapture,
    };
};

export default useLongPress;
